/**
 * AI Tool Definitions for AUREN LangGraph Pipeline
 *
 * Web Search Pipeline:
 *   1. SearXNG → retrieve ranked results
 *   2. Crawl4AI / direct fetch → extract full page content
 *   3. Return grounded documents to synthesis LLM
 *
 * Internal Knowledge Tool uses existing Qdrant RAG (unchanged).
 * User Memory Tool uses PostgreSQL (unchanged).
 *
 * Environment vars (web pipeline):
 *   SEARXNG_URL          — SearXNG instance URL
 *   CRAWL4AI_URL         — Crawl4AI REST service URL (optional, falls back to direct fetch)
 *   WEB_SEARCH_RESULTS   — # of search results to retrieve (default: 8)
 *   WEB_MAX_CRAWL_URLS   — # of top URLs to crawl (default: 4)
 *   WEB_MAX_CONTENT_CHARS— max chars per page after extraction (default: 6000)
 *   WEB_CRAWL_TIMEOUT_MS — crawl timeout per URL in ms (default: 12000)
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { OrganizationRetriever, UserAuthContext } from '../retrievers/OrganizationRetriever';
import { SearXNGSearchProvider, sanitizeSearchQuery } from '../../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../../infrastructure/search/Crawl4AIProvider';

import { validateAndRankEvidence, evaluateSnippetSufficiency } from '../../infrastructure/search/EvidenceValidator';

function getMaxCrawlUrls(): number {
  return parseInt(process.env.WEB_MAX_CRAWL_URLS || '') || 4;
}

/**
 * Scores a search result's semantic relevance against the query before crawling.
 * Ranks results that contain target entities, metric terms, and temporal/comparison terms higher,
 * while penalizing search results for unrelated competing entities.
 */
function scoreSearchResultRelevance(query: string, result: { title: string; snippet: string; url: string }): number {
  const qLower = query.toLowerCase();
  const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  let score = 0;

  // Extract primary entity terms (proper nouns or key nouns > 2 chars)
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'who', 'how', 'does', 'did', 'that', 'this',
    'with', 'from', 'have', 'been', 'compare', 'compared', 'this', 'last', 'month',
    'year', 'week', 'stock', 'price', 'rate', 'performance', 'search', 'find'
  ]);
  const entityTerms = query.match(/\b[A-Za-z0-9]{3,}\b/g)?.filter(w => !stopWords.has(w.toLowerCase())) || [];

  // Entity Matching
  for (const term of entityTerms) {
    const termLower = term.toLowerCase();
    if (text.includes(termLower)) {
      score += 10;
      if ((result.title || '').toLowerCase().includes(termLower)) score += 5;
    }
  }

  // Detect competing stock/crypto entities when a specific entity is requested
  const commonEntities = [
    'microsoft', 'msft', 'apple', 'aapl', 'google', 'googl', 'amazon', 'amzn',
    'tesla', 'tsla', 'meta', 'nvidia', 'nvda', 'bitcoin', 'btc', 'ethereum', 'eth', 'tata'
  ];
  const requestedEntitiesInQuery = commonEntities.filter(e => qLower.includes(e));
  if (requestedEntitiesInQuery.length > 0) {
    // If text contains a different common entity that was NOT in the query, penalize it
    const competingEntities = commonEntities.filter(e => !requestedEntitiesInQuery.includes(e) && text.includes(e));
    if (competingEntities.length > 0 && !requestedEntitiesInQuery.some(e => text.includes(e))) {
      score -= 20;
    }
  }

  // Task & Metric terms matching
  if (qLower.includes('perform') || qLower.includes('compared') || qLower.includes('comparison')) {
    if (/performance|return|gain|rose|fell|dropped|surged|chart|analysis|compared|vs\b|versus/i.test(text)) score += 8;
  }
  if (qLower.includes('price') || qLower.includes('stock')) {
    if (/stock price|share price|quote|trading at|market|chart/i.test(text)) score += 8;
  }
  if (qLower.includes('month')) {
    if (/month|monthly|july|august|september|october|november|december|january|february|march|april|may|june/i.test(text)) score += 6;
  }

  return score;
}

// ─── Internal Knowledge Tool ───────────────────────────────────────────────

export const createInternalKnowledgeTool = (
  authContext: UserAuthContext,
  overrideScope?: 'PERSONAL' | 'ORGANIZATION'
) => {
  const retriever = new OrganizationRetriever({ authContext, topK: 10, overrideScope });

  return new DynamicStructuredTool({
    name: 'internal_knowledge',
    description: 'Searches personal documents, company policies, architecture rules, and authorized organizational knowledge for the authenticated user.',
    schema: z.object({
      query: z.string().describe('The specific query or keywords to search authorized knowledge documents for.'),
    }),
    func: async ({ query }) => {
      const docs = await retriever.getRelevantDocuments(query);
      if (!docs.length) {
        return JSON.stringify({ status: 'no_results', documents: [] });
      }
      return JSON.stringify({
        status: 'success',
        documents: docs.map(d => ({
          content: d.pageContent,
          metadata: d.metadata
        }))
      });
    }
  });
};

// ─── Web Search Tool (SearXNG + Crawl4AI pipeline) ────────────────────────────

export const createWebSearchTool = (options: { isWebAccessEnabled: boolean, executionMode?: 'FAST' | 'DEEP' }) => {
  const searchProvider = new SearXNGSearchProvider();

  return new DynamicStructuredTool({
    name: 'web_search',
    description: 'Searches the live public internet for current events, real-time news, exchange rates, office holders, external regulations, or any factual information requiring up-to-date web data.',
    schema: z.object({
      query: z.string().describe('The exact search terms to query. Do NOT rewrite or paraphrase abbreviations. Pass the query as-is with only obvious search-instruction prefixes removed.'),
    }),
    func: async ({ query }) => {
      if (!options.isWebAccessEnabled) {
        return JSON.stringify({
          status: 'blocked_by_policy',
          message: 'Web access is disabled for this organization by security policy.',
          results: [],
          crawlStats: { attempted: 0, succeeded: 0 }
        });
      }

      try {
        // ── Step 1: SearXNG search (self-hosted, no external fallback) ──────
        const step1Start = performance.now();
        const maxResults = parseInt(process.env.WEB_SEARCH_RESULTS || '') || 8;
        const sanitizedQuery = sanitizeSearchQuery(query);
        console.log(`[web_search] Step 1 — SearXNG search: "${query}" (sanitized: "${sanitizedQuery}", max ${maxResults})`);

        let searchResults;
        try {
          searchResults = await searchProvider.search(sanitizedQuery, maxResults);
        } catch (searchErr: any) {
          // SearXNG service is unreachable — hard failure, never hallucinate
          console.error(`[web_search] ✗ SearXNG service error: ${searchErr.message}`);
          return JSON.stringify({
            status: 'web_retrieval_failure',
            message: `Web search service (SearXNG) is unavailable: ${searchErr.message}. Please ensure Docker is running with "docker-compose up -d searxng". Cannot provide web-based information without the search service.`,
            results: [],
            crawlStats: { attempted: 0, succeeded: 0 }
          });
        }
        const searxngDurationMs = performance.now() - step1Start;

        if (searchResults.length === 0) {
          console.log(`[web_search] ⚠ SearXNG returned 0 results for "${query}" (took ${searxngDurationMs.toFixed(0)}ms)`);
          return JSON.stringify({
            status: 'no_results',
            message: `Web search returned no results for: "${query}". The information may not be publicly indexed, or the query may be too specific.`,
            results: [],
            crawlStats: { attempted: 0, succeeded: 0 }
          });
        }

        console.log(`[web_search] Step 1 ✓ — ${searchResults.length} results from SearXNG (${searxngDurationMs.toFixed(0)}ms)`);

        // ── Pre-Crawl Semantic Relevance Ranking ──────────────────────────
        searchResults = searchResults
          .map(r => ({
            ...r,
            relevanceScore: scoreSearchResultRelevance(query, r)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore);

        // ── Pre-Crawl Snippet Sufficiency Check ──────────────────────────
        let urlsToCrawl: string[] = [];
        let crawlResults: any[] = [];
        let crawlSucceeded = 0;
        let crawl4aiDurationMs = 0;
        let mergedResults;

        const maxCrawl = options.executionMode === 'FAST' ? 2 : getMaxCrawlUrls();
        const sufficiencyResult = evaluateSnippetSufficiency(query, searchResults);

        if (sufficiencyResult.isSufficient) {
          console.log(`[web_search] ⚡ Snippets are SUFFICIENT. Skipping Crawl4AI completely (0 pages crawled!).`);
          // Build mergedResults using snippets only, marked as crawlSuccess
          mergedResults = searchResults.map((sr, idx) => ({
            rank: idx + 1,
            title: sr.title,
            url: sr.url,
            snippet: sr.snippet,
            source: sr.source,
            timestamp: sr.timestamp,
            extractedContent: sr.snippet,
            crawlSuccess: true,
            crawlSource: 'snippet',
            extractedLength: sr.snippet?.length ?? 0
          }));
        } else {
          // ── Step 2: Crawl top N URLs with Crawl4AI ─────────────────────────
          const step2Start = performance.now();
          const topResults = searchResults.slice(0, maxCrawl);
          urlsToCrawl = topResults.map(r => r.url);
          const snippetsMap: Record<string, string> = {};
          topResults.forEach(r => { if (r.snippet) snippetsMap[r.url] = r.snippet; });

          console.log(`[web_search] Step 2 — Crawl4AI extracting top ${urlsToCrawl.length} relevant URLs: ${urlsToCrawl.join(', ')}`);

          crawlResults = await crawlUrls(urlsToCrawl, {
            snippets: snippetsMap,
            timeoutMs: options.executionMode === 'FAST' ? 5000 : undefined,
            maxContent: options.executionMode === 'FAST' ? 3000 : undefined
          });
          const crawlMap = new Map(crawlResults.map(r => [r.url, r]));
          crawlSucceeded = crawlResults.filter(r => r.success).length;
          crawl4aiDurationMs = performance.now() - step2Start;

          console.log(`[web_search] Step 2 ✓ — ${crawlSucceeded}/${urlsToCrawl.length} URLs extracted successfully (${crawl4aiDurationMs.toFixed(0)}ms)`);

          // ── Step 3: Merge search results + extracted content ────────────────
          mergedResults = searchResults.map((sr, idx) => {
            const crawled = crawlMap.get(sr.url);

            // Only use extractedContent if it meaningfully exceeds the snippet
            let extractedContent: string | undefined;
            let sourceUsed = crawled?.source || 'uncrawled';
            if (crawled?.success && crawled.content && crawled.content.length > (sr.snippet?.length ?? 0) * 1.5) {
              extractedContent = crawled.content;
            } else if (sr.snippet) {
              extractedContent = sr.snippet;
              sourceUsed = 'snippet';
            }

            return {
              rank: idx + 1,
              title: crawled?.title || sr.title,
              url: sr.url,
              snippet: sr.snippet,
              source: sr.source,
              timestamp: sr.timestamp,
              extractedContent,
              crawlSuccess: crawled?.success ?? false,
              crawlSource: sourceUsed,
              extractedLength: extractedContent?.length ?? 0,
            };
          });
        }

        const successfullyExtracted = mergedResults.filter(r => r.crawlSuccess && r.extractedContent);

        if (successfullyExtracted.length === 0 && crawlSucceeded === 0) {
          // Crawl4AI unavailable — return snippets, clearly labeled
          console.log(`[web_search] ⚠ Crawl4AI unavailable — returning search snippets only`);
          return JSON.stringify({
            status: 'partial_success',
            message: 'Web search completed (SearXNG ✓) but page extraction failed (Crawl4AI may be offline). Results contain search snippets only — not full page content. Ensure "docker-compose up -d crawl4ai" is running for full extraction.',
            results: searchResults.slice(0, maxCrawl).map((r, i) => ({
              rank: i + 1,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              source: r.source,
              timestamp: r.timestamp,
              extractedContent: undefined,
              crawlSuccess: false,
              extractedLength: 0,
            })),
            crawlStats: { attempted: urlsToCrawl.length, succeeded: 0 },
            subStepTimingMs: { searxngDurationMs, crawl4aiDurationMs, evidenceValidationDurationMs: 0 }
          });
        }

        const step4Start = performance.now();
        const { telemetry, validatedEvidence } = validateAndRankEvidence(query, mergedResults);
        const evidenceValidationDurationMs = performance.now() - step4Start;

        const extracted = successfullyExtracted.length;
        const snippetOnly = mergedResults.length - extracted;
        console.log(`[web_search] ✓ Pipeline complete — ${extracted} pages with full content, ${snippetOnly} with snippets only, ${validatedEvidence.length} validated evidence items (SearXNG: ${searxngDurationMs.toFixed(0)}ms, Crawl4AI: ${crawl4aiDurationMs.toFixed(0)}ms, EvidenceValidation: ${evidenceValidationDurationMs.toFixed(0)}ms)`);

        return JSON.stringify({
          status: 'success',
          results: mergedResults,
          telemetry: {
            ...telemetry,
            subStepTimingMs: {
              searxngDurationMs,
              crawl4aiDurationMs,
              evidenceValidationDurationMs
            }
          },
          validatedEvidence,
          crawlStats: {
            attempted: urlsToCrawl.length,
            succeeded: crawlSucceeded,
            extractedPagesCount: extracted,
            relevantEvidenceCount: validatedEvidence.length
          }
        });

      } catch (err: any) {
        console.error(`[web_search] Pipeline error: ${err.message}`);
        return JSON.stringify({
          status: 'error',
          message: err.message || 'Web search pipeline failed',
          results: [],
          crawlStats: { attempted: 0, succeeded: 0 }
        });
      }
    }
  });
};

// ─── Date/Time Tool (unchanged) ───────────────────────────────────────────────

export const dateTimeTool = new DynamicStructuredTool({
  name: 'date_time',
  description: 'Returns the current server date, UTC timestamp, and local time string.',
  schema: z.object({}),
  func: async () => {
    const now = new Date();
    return JSON.stringify({
      iso: now.toISOString(),
      date: now.toDateString(),
      time: now.toTimeString(),
      formatted: now.toLocaleString('en-US', { timeZoneName: 'short' }),
    });
  }
});

// ─── User Memory Tool (unchanged) ─────────────────────────────────────────────

export const createUserMemoryTool = (authContext: UserAuthContext) => {
  const { prisma } = require('../../infrastructure/database/prisma');

  return new DynamicStructuredTool({
    name: 'user_memory',
    description: 'Reads, saves/updates, or deletes long-term personal memory facts/preferences for the authenticated user.',
    schema: z.object({
      action: z.enum(['read', 'save', 'delete']).describe('Action to perform: read existing memories, save a key-value memory, or delete a memory key.'),
      key: z.string().optional().describe('Key or label for the memory item (e.g. preferred_language, career_goal).'),
      value: z.string().optional().describe('Value or text content to store for the key (required for save).'),
    }),
    func: async ({ action, key, value }) => {
      try {
        if (action === 'read') {
          const memories = await prisma.userMemory.findMany({
            where: { userId: authContext.userId, organizationId: authContext.organizationId },
            take: 20,
            orderBy: { updatedAt: 'desc' },
          });
          return JSON.stringify({
            status: 'success',
            memories: memories.map((m: any) => ({ key: m.key, value: m.value, updatedAt: m.updatedAt }))
          });
        } else if (action === 'save') {
          if (!key || !value) {
            return JSON.stringify({ status: 'error', message: 'Both key and value are required to save user memory.' });
          }
          const memory = await prisma.userMemory.upsert({
            where: { userId_key: { userId: authContext.userId, key } },
            update: { value, organizationId: authContext.organizationId },
            create: { userId: authContext.userId, organizationId: authContext.organizationId, key, value }
          });
          return JSON.stringify({ status: 'success', action: 'save', key: memory.key, value: memory.value, message: `Memory '${key}' saved successfully.` });
        } else if (action === 'delete') {
          const isDeleteAll = !key || key.trim().toLowerCase() === 'all' || key.trim().toLowerCase() === '*';

          let existingMemories: any[] = [];
          if (isDeleteAll) {
            existingMemories = await prisma.userMemory.findMany({
              where: { userId: authContext.userId, organizationId: authContext.organizationId }
            });
          } else {
            const rawKey = key.trim().toLowerCase();
            const terms = rawKey.split(/[\s_]+/).filter((t: string) => t.length > 1);
            const allUserMemories = await prisma.userMemory.findMany({
              where: { userId: authContext.userId, organizationId: authContext.organizationId }
            });
            existingMemories = allUserMemories.filter((m: any) => {
              const memKey = m.key.toLowerCase();
              const memVal = m.value.toLowerCase();
              if (memKey.includes(rawKey) || rawKey.includes(memKey)) return true;
              if (memVal.includes(rawKey) || rawKey.includes(memVal)) return true;
              return terms.some((t: string) => memKey.includes(t) || memVal.includes(t));
            });
          }

          if (existingMemories.length === 0) {
            return JSON.stringify({ status: 'success', action: 'delete', count: 0, message: `No memory found matching '${key}'.` });
          }

          const deleteResult = await prisma.userMemory.deleteMany({
            where: {
              id: { in: existingMemories.map((m: any) => m.id) },
              userId: authContext.userId,
              organizationId: authContext.organizationId,
            }
          });

          return JSON.stringify({
            status: 'success',
            action: 'delete',
            count: deleteResult.count,
            deletedKeys: existingMemories.map((m: any) => m.key),
            message: `Successfully deleted ${deleteResult.count} memory item(s) matching '${key}'.`
          });
        }
        return JSON.stringify({ status: 'error', message: 'Invalid memory action.' });
      } catch (err: any) {
        return JSON.stringify({ status: 'error', message: err.message });
      }
    }
  });
};
