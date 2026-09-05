/**
 * LocalResearchAgent.ts
 *
 * Implements the local-deep-researcher iterative loop for AUREN.
 * Uses local Ollama model to:
 * 1. Evaluate whether extracted web evidence is sufficient for user query.
 * 2. Identify missing research gaps if evidence is incomplete.
 * 3. Generate refined/targeted search queries to fill research gaps in subsequent iterations.
 */

import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';
import { StructuredEvidence, parseResearchDimensions } from '../../infrastructure/search/EvidenceValidator';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export interface EvaluationResult {
  isSufficient: boolean;
  gap?: string;
  refinedQuery?: string;
}

export class LocalResearchAgent {
  private llm = new ProviderFactory().getChatProvider().getChatModel({ temperature: 0.1 });

  /**
   * Evaluates current extracted evidence against user query to decide if research is sufficient
   * or if another search iteration is required.
   */
  public async evaluateSufficiency(
    query: string,
    evidenceList: StructuredEvidence[],
    iteration: number,
    maxIterations: number,
    currentDateStr: string = '2026-08-15'
  ): Promise<EvaluationResult> {
    const dimensions = parseResearchDimensions(query);

    // If no evidence extracted at all, iteration must continue if under limit
    if (!evidenceList || evidenceList.length === 0) {
      if (iteration >= maxIterations) {
        return { isSufficient: false, gap: 'No web evidence could be extracted.' };
      }
      return {
        isSufficient: false,
        gap: 'No evidence extracted yet.',
        refinedQuery: query
      };
    }

    // Multi-entity Check: If query specifies multiple entities, MUST have evidence for ALL entities
    if (dimensions.isMultiEntity) {
      const missingEntities: string[] = [];
      for (const entity of dimensions.entities) {
        const hasEntityEvidence = evidenceList.some(e => {
          const text = `${e.matchedEntity || ''} ${e.sourceTitle} ${e.extractedValue || ''} ${e.evidenceText}`.toLowerCase();
          return text.includes(entity.toLowerCase());
        });
        if (!hasEntityEvidence) {
          missingEntities.push(entity);
        }
      }

      if (missingEntities.length > 0 && iteration < maxIterations) {
        const missingStr = missingEntities.join(', ');
        console.log(`[LocalResearchAgent] ❌ Multi-entity check failed: Missing evidence for [${missingStr}] (Iteration ${iteration}/${maxIterations})`);
        return {
          isSufficient: false,
          gap: `Missing research data for required comparative entity: ${missingStr}`,
          refinedQuery: `${missingStr} ${dimensions.metric} ${dimensions.timeframe} stock price return performance`
        };
      }
    }

    // Temporal Metric Check: For weekly/monthly/yearly queries, check if we have matching timeframe metrics
    if (['weekly', 'monthly', 'yearly', 'event'].includes(dimensions.timeframe) && iteration < maxIterations) {
      const hasTimeframeMetric = evidenceList.some(e => {
        const text = `${e.extractedValue || ''} ${e.evidenceText}`.toLowerCase();
        if (dimensions.timeframe === 'weekly') {
          return text.includes('week') || text.includes('7 days') || text.includes('wow') || text.includes('%');
        }
        if (dimensions.timeframe === 'monthly') {
          return text.includes('month') || text.includes('mom') || text.includes('mtd') || text.includes('%');
        }
        if (dimensions.timeframe === 'yearly') {
          return text.includes('year') || text.includes('yoy') || text.includes('ytd') || text.includes('annual') || text.includes('%');
        }
        if (dimensions.timeframe === 'event') {
          return text.includes('earnings') || text.includes('report') || text.includes('after') || text.includes('following') || text.includes('post');
        }
        return false;
      });

      if (!hasTimeframeMetric) {
        console.log(`[LocalResearchAgent] ❌ Timeframe metric check failed: Missing ${dimensions.timeframe} metrics for [${dimensions.entities.join(', ')}] (Iteration ${iteration}/${maxIterations})`);
        return {
          isSufficient: false,
          gap: `Extracted data lacks requested ${dimensions.timeframe} metrics for ${dimensions.entities.join(', ')}`,
          refinedQuery: `${dimensions.entities.join(' ')} ${dimensions.timeframe} ${dimensions.metric} stock price return performance`
        };
      }
    }

    // Fast-path ONLY if max iterations reached
    if (iteration >= maxIterations) {
      const hasValidExtracted = evidenceList.some(e => Boolean(e.extractedValue) || e.confidence !== 'low');
      return { isSufficient: hasValidExtracted };
    }

    const isComparativeOrEvent = dimensions.metric === 'performance_comparison' || dimensions.metric === 'event_impact' || dimensions.isMultiEntity;

    // Fast-path: Only fast-path if we have high/medium confidence evidence with a non-empty extractedValue matching the query intent
    const hasSolidEvidence = evidenceList.some(e => (e.confidence === 'high' || e.confidence === 'medium') && Boolean(e.extractedValue));
    
    if (hasSolidEvidence && !isComparativeOrEvent) {
      console.log(`[LocalResearchAgent] ⚡ Fast-pathing sufficiency evaluation for standard query: solid evidence extracted (0ms overhead)`);
      return { isSufficient: true };
    }

    const hasComparativeEvidence = evidenceList.some(e => 
      (e.confidence === 'high' || e.confidence === 'medium') && 
      Boolean(e.extractedValue) &&
      /performance|return|gain|rose|fell|dropped|surged|compared|vs\b|versus|after|following|earnings|report|%/i.test(`${e.extractedValue || ''} ${e.evidenceText || ''}`)
    );

    if (hasComparativeEvidence && isComparativeOrEvent) {
      console.log(`[LocalResearchAgent] ⚡ Fast-pathing sufficiency evaluation for comparative query: explicit comparative metrics extracted (0ms overhead)`);
      return { isSufficient: true };
    }

    try {
      // Prune evidence to compact values to prevent prompt prefill latency
      const formattedEvidence = evidenceList.slice(0, 3).map((e, idx) => 
        `Source ${idx + 1} (${e.sourceTitle}): Value: ${e.extractedValue || e.evidenceText?.slice(0, 100) || 'N/A'}`
      ).join('\n');

      const systemPrompt = `Research Evaluation Agent. Today: ${currentDateStr}. Query: "${query}"

Retrieved Evidence:
${formattedEvidence}

Is this evidence sufficient to answer the query? Respond strictly in valid JSON: {"isSufficient": boolean, "gap": "missing info", "refinedQuery": "search query"}`;

      const fastLlm = new ProviderFactory().getChatProvider().getChatModel({ numPredict: 80, temperature: 0.1 });

      let timeoutId: NodeJS.Timeout | undefined = undefined;
      const abortController = new AbortController();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('LocalResearchAgent.evaluateSufficiency timed out after 4000ms'));
        }, 4000);
      });

      try {
        const invokePromise = fastLlm.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage("Output JSON evaluation.")
        ], { signal: abortController.signal });

        const response = await Promise.race([invokePromise, timeoutPromise]);
        
        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            isSufficient: Boolean(parsed.isSufficient),
            gap: parsed.gap || undefined,
            refinedQuery: parsed.refinedQuery || undefined
          };
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (err: any) {
      console.warn('[LocalResearchAgent] ⚠ Evaluation error or timeout, falling back:', err.message || err);
    }

    return { isSufficient: evidenceList.length > 0 };
  }

  /**
   * Generates a targeted search query based on an identified research gap.
   */
  public async generateTargetedQuery(
    originalQuery: string,
    gap: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a search query optimizer. Given a user query and a missing research gap, generate a concise, targeted search query for SearXNG.
Do NOT use quotes or operators. Output ONLY the raw search query keywords, nothing else.`;

      // 15-second timeout for query refinement with local Ollama
      let timeoutId: NodeJS.Timeout | undefined = undefined;
      const abortController = new AbortController();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('LocalResearchAgent.generateTargetedQuery timed out after 15000ms'));
        }, 15000);
      });

      try {
        const invokePromise = this.llm.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(`Original Query: "${originalQuery}"\nMissing Information Gap: "${gap}"\nSearch Query:`)
        ], { signal: abortController.signal });

        const response = await Promise.race([invokePromise, timeoutPromise]);
        
        const queryStr = (typeof response.content === 'string' ? response.content : '').trim().replace(/^["']|["']$/g, '');
        return queryStr || originalQuery;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    } catch (err: any) {
      console.warn('[LocalResearchAgent] ⚠ Query refinement error or timeout, using original query:', err.message || err);
      return originalQuery;
    }
  }
}
