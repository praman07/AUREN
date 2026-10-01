import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { AURENGraphState, IntentCategory, SourceCitation } from './GraphState';
import { AIGateway } from '../../infrastructure/gateway/AIGateway';

const aiGateway = new AIGateway();
import { createInternalKnowledgeTool, createWebSearchTool, dateTimeTool, createUserMemoryTool } from '../tools/aiTools';
import { ContextPacker } from '../../domain/retrieval/ContextPacker';
import { z } from 'zod';

const ClarifyWithUserSchema = z.object({
  need_clarification: z.boolean().describe("Whether the user needs to be asked a clarifying question."),
  question: z.string().describe("A question to ask the user to clarify the report scope"),
  options: z.array(z.object({
    label: z.string().describe("The short label for the option (e.g. 'Georgia (Country)')"),
    description: z.string().describe("A short description of the option (e.g. 'The country in the Caucasus region')").optional(),
    value: z.string().describe("The exact distinct string value to use if this option is selected.")
  })).describe("A list of explicit options the user can choose from to clarify the ambiguity. Provide at least 2 options if clarification is needed, otherwise empty.")
});

const ResearchQuestionSchema = z.object({
  research_brief: z.string().describe("A research question that will be used to guide the research.")
});

export interface GraphCallbacks {
  onEvent?: (event: { type: string; data?: any }) => void;
}

const GraphAnnotation = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  userQuery: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  rawUserQuery: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  resolvedQuery: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  authContext: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => ({ organizationId: '', userId: '', roles: [] }),
  }),
  mode: Annotation<'LOCAL' | 'HYBRID'>({
    reducer: (x, y) => y ?? x,
    default: () => 'LOCAL',
  }),
  isWebAccessEnabled: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  executionMode: Annotation<'FAST' | 'DEEP' | 'AUTO'>({
    reducer: (x, y) => y ?? x,
    default: () => 'AUTO',
  }),
  intentCategory: Annotation<IntentCategory>({
    reducer: (x, y) => y ?? x,
    default: () => 'CASUAL',
  }),
  intentConfidence: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 1.0,
  }),
  internalDocs: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  catalogDocs: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  webResults: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  userMemories: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  historyDocs: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  systemTimeInfo: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  activeTool: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  citations: Annotation<SourceCitation[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  finalAnswer: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  isAmbiguous: Annotation<boolean | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  clarificationQuestion: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  clarificationOptions: Annotation<any[] | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  isClarificationContinuation: Annotation<boolean | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  researchStrategy: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  researchBrief: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  validatedEvidence: Annotation<any[] | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  retrievalTelemetry: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  webSearchStatus: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  fastRoutingTarget: Annotation<'web' | 'rag' | 'none' | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  useKnowledgeBase: Annotation<boolean | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  internalKnowledgeStatus: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  resolvedKnowledgeDocumentIds: Annotation<string[] | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});

export function isClarificationResponse(userQuery: string, messages: any[]): { isClarification: boolean; originalUserQuery?: string } {
  if (!messages || messages.length === 0) return { isClarification: false };

  const isLastMsgCurrentQuery = String(messages[messages.length - 1].content || '') === userQuery;
  const history = isLastMsgCurrentQuery ? messages.slice(0, -1) : messages;

  if (history.length === 0) return { isClarification: false };

  // Look for the immediately preceding AI/Assistant message in history
  let lastAiMsgIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    const role = (m as any).role || (m._getType ? m._getType() : '');
    if (role === 'assistant' || role === 'ai' || m instanceof AIMessage) {
      lastAiMsgIndex = i;
      break;
    }
  }

  if (lastAiMsgIndex !== -1) {
    // ONLY treat as clarification if the immediately previous AI turn explicitly emitted a clarification request
    const lastAiMsg = history[lastAiMsgIndex] as any;
    const aiMsgContent = String(lastAiMsg.content || '');

    const isExplicitClarification = lastAiMsg.isAmbiguous === true ||
      lastAiMsg.metadata?.isAmbiguous === true ||
      (Array.isArray(lastAiMsg.metadata?.clarificationOptions) && lastAiMsg.metadata.clarificationOptions.length > 0) ||
      /\b(please select one of the options|select an option below|please clarify whether|which of the following options|choose one of the following)\b/i.test(aiMsgContent);

    if (isExplicitClarification) {
      let originalUserQuery = '';
      for (let j = lastAiMsgIndex - 1; j >= 0; j--) {
        const m = history[j];
        const role = (m as any).role || (m._getType ? m._getType() : '');
        if (role === 'user' || role === 'human' || m instanceof HumanMessage) {
          originalUserQuery = String(m.content || '');
          break;
        }
      }

      if (originalUserQuery) {
        return { isClarification: true, originalUserQuery };
      }
    }
  }

  return { isClarification: false };
}

export function isEllipticalFollowUp(userQuery: string, messages: any[]): boolean {
  if (!messages || messages.length === 0) return false;

  const q = userQuery.trim();
  if (!q) return false;

  // 1. Conversational Fragment Prefixes ("what about...", "how about...", "and...", "what of...", "same for...", "likewise for...", "what regarding...")
  const fragmentPrefixPattern = /^(what about|how about|and|what of|same for|likewise for|what regarding)\b/i;
  if (fragmentPrefixPattern.test(q)) return true;

  // 2. Possessive fragments at end (e.g., "Microsoft's?", "Apple's?", "What is Microsoft's?")
  const isPossessiveFragment = /['’]s\??$/i.test(q) && !/\b(stock price|market cap|revenue|earnings|ceo|president|capital|population)\b/i.test(q);
  if (isPossessiveFragment) return true;

  // 3. Question Starter detection
  const questionStarterPattern = /^(what|who|where|when|why|how|which|tell me|explain|describe|summarize|compare|list|search|find|show|give me)\b/i;
  const hasQuestionStarter = questionStarterPattern.test(q);

  // 4. Anaphoric Pronoun detection (e.g. "it", "its", "they", "them", "their", "he", "she", "his", "her", "him")
  const pronounRegex = /\b(it|its|they|them|their|he|she|his|her|him|former|latter|previous|above|same|likewise)\b/i;
  const pronounMatch = q.match(pronounRegex);

  if (pronounMatch && pronounMatch.index !== undefined) {
    const textBeforePronoun = q.slice(0, pronounMatch.index);
    // Check if there is an explicit named entity (capitalized word not at sentence start, excluding common acronyms) before the pronoun
    const commonAcronyms = new Set(['CEO', 'CFO', 'CTO', 'COO', 'CIO', 'API', 'USA', 'UK', 'EU', 'AI', 'RAG', 'URL', 'ID']);
    const tokensBefore = textBeforePronoun.slice(1).split(/\s+/).map(t => t.replace(/[^\w]/g, '')).filter(Boolean);
    const hasNamedEntityBeforePronoun = tokensBefore.some(t => /^[A-Z][a-zA-Z0-9'-]+$/.test(t) && !commonAcronyms.has(t));

    // If anaphoric pronoun is NOT preceded by an explicit named entity -> UNGROUNDED PRONOUN -> ELLIPTICAL!
    if (!hasNamedEntityBeforePronoun) {
      return true;
    }
  }

  // 5. Short entity / fragment queries (<= 4 words) without a question starter (e.g. "Tata?", "Microsoft?", "Paris?", "Tata Motors") -> ELLIPTICAL!
  const words = q.toLowerCase().replace(/[^\w\s\']/g, '').split(/\s+/).filter(Boolean);
  if (words.length <= 4 && !hasQuestionStarter) {
    return true;
  }

  // 6. Explicit question with a Question Starter and no ungrounded pronoun -> STANDALONE!
  if (hasQuestionStarter) {
    return false;
  }

  return false;
}

export async function classifyQueryComplexity(state: AURENGraphState): Promise<{ complexity: 'FAST' | 'DEEP'; llmCallsCount: number }> {
  const query = state.userQuery?.trim() ?? '';
  const intent = state.intentCategory;

  // Rule 1: Fast-track intents
  if (
    intent === 'CASUAL' ||
    intent === 'SYSTEM_UTILITY' ||
    intent === 'MEMORY_SAVE' ||
    intent === 'MEMORY_READ' ||
    intent === 'MEMORY_DELETE' ||
    intent === 'CONVERSATION_HISTORY'
  ) {
    console.log(`[Complexity Classifier] ⚡ Simple intent (${intent}) detected, using FAST mode.`);
    return { complexity: 'FAST', llmCallsCount: 0 };
  }

  // Rule 2: Heuristic keyword-based patterns for complex analysis
  const queryLower = query.toLowerCase();
  const complexityKeywords = [
    'compare', 'comparison', 'versus', ' vs ', 'difference between', 'swot',
    'pros and cons', 'pros & cons', 'analyze', 'analysis', 'write code',
    'implement', 'debug', 'architect', 'detailed report', 'deep dive',
    'comprehensive', 'evaluate', 'investigate', 'research',
    'logic', 'puzzle', 'solve', 'riddle', 'explain step-by-step', 'step by step'
  ];

  if (complexityKeywords.some(keyword => queryLower.includes(keyword))) {
    console.log(`[Complexity Classifier] 🔍 Complexity keyword pattern matched, using DEEP mode.`);
    return { complexity: 'DEEP', llmCallsCount: 0 };
  }

  // Rule 2.5: Heuristic patterns for obvious simple queries to bypass LLM check
  const queryClean = queryLower.replace(/[?.!]/g, '').trim();

  // Obvious casual / greeting
  const casualWords = new Set([
    'hi', 'hello', 'hey', 'yo', 'thanks', 'thank you', 'how are you',
    'good morning', 'good night', 'ok', 'okay', 'sure', 'yes', 'no',
    'bye', 'goodbye', 'what\'s up', 'sup', 'yoo', 'yoyoy', 'hello man'
  ]);
  const isObviousCasual = casualWords.has(queryClean) || queryClean.length <= 8;

  // Math expression
  const isMath = /^[0-9+\-*/\s().]+$/.test(queryClean) && queryClean.length < 20 && /[0-9]/.test(queryClean);

  // Common simple prefixes for questions that do not have complexity keywords
  const simplePrefixes = [
    'what is the capital of', 'what is the population of', 'where is',
    'who wrote', 'when was', 'how old is', 'who is the president of',
    'what does', 'explain the difference'
  ];
  const isSimplePrefix = simplePrefixes.some(prefix => queryClean.startsWith(prefix));

  if (isObviousCasual || isMath || isSimplePrefix) {
    console.log(`[Complexity Classifier] ⚡ Simple heuristic matched, using FAST mode.`);
    return { complexity: 'FAST', llmCallsCount: 0 };
  }

  // Rule 3: Ollama-based complexity classification fallback
  console.log(`[Complexity Classifier] 🤖 Running LLM fallback classifier for query: "${query}"`);
  try {
    const llm = aiGateway.getChatModel({
      modelName: 'FAST', // Use fast model
      numPredict: 1024,
      temperature: 0.0
    });

    const systemPrompt = `You are an AI Query Complexity Classifier.
Your task is to classify whether a user query requires SIMPLE (FAST) or COMPLEX (DEEP) execution.

Guidelines:
- SIMPLE (FAST): Single-fact lookups, direct questions, simple calculations, quick summaries, date/time inquiries, and greetings.
  Examples:
  - "Who is the CEO of Apple?"
  - "What is the capital of France?"
  - "What is current stock price of TSLA?"
  - "Tell me a joke."
- COMPLEX (DEEP): Multi-step calculations, comparative analysis, request for pros/cons, software engineering/coding, deep planning, synthesis of multiple distinct entities, logic puzzles, or open-ended detailed investigations.
  Examples:
  - "Compare the Q3 financial results of Apple and Microsoft."
  - "What is the impact of rising interest rates on real estate?"
  - "Explain how to implement a state machine in TypeScript."
  - "Perform a SWOT analysis for Coca Cola."

Respond strictly in valid JSON:
{"complexity": "SIMPLE" | "COMPLEX", "reason": "brief explanation"}`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`User Query: "${query}"`)
    ]);

    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.complexity === 'COMPLEX' || parsed.complexity === 'SIMPLE') {
        const resolvedComplexity = parsed.complexity === 'COMPLEX' ? 'DEEP' : 'FAST';
        console.log(`[Complexity Classifier] LLM response: ${resolvedComplexity} (${parsed.reason || ''})`);
        return {
          complexity: resolvedComplexity,
          llmCallsCount: 1
        };
      }
    }
  } catch (err: any) {
    console.warn(`[Complexity Classifier] LLM complexity check failed, defaulting to FAST mode: ${err.message}`);
  }

  return { complexity: 'FAST', llmCallsCount: 1 };
}

export async function classifySearchNecessity(state: AURENGraphState): Promise<{ needsSearchOrRag: 'WEB' | 'RAG' | 'NONE'; llmCallsCount: number }> {
  const query = state.userQuery?.trim() ?? '';
  const queryLower = query.toLowerCase();
  const queryClean = queryLower.replace(/[?.!]/g, '').trim();

  // 1. Simple heuristic checks to bypass LLM classification for obvious cases
  // Math expressions (e.g. "2 + 2", "15 * 4", "(10 + 5) / 2")
  if (/^[0-9+\-*/\s().]+$/.test(queryClean) && queryClean.length < 20 && /[0-9]/.test(queryClean)) {
    console.log(`[Search Necessity Classifier] ⚡ Math heuristic matched, using NONE.`);
    return { needsSearchOrRag: 'NONE', llmCallsCount: 0 };
  }

  // Obvious casual queries
  const casualWords = new Set([
    'hi', 'hello', 'hey', 'yo', 'thanks', 'thank you', 'how are you',
    'good morning', 'good night', 'ok', 'okay', 'sure', 'yes', 'no',
    'bye', 'goodbye', 'what\'s up', 'sup', 'yoo', 'yoyoy', 'hello man'
  ]);
  if (casualWords.has(queryClean) || queryClean.length <= 8) {
    console.log(`[Search Necessity Classifier] ⚡ Casual greeting heuristic matched, using NONE.`);
    return { needsSearchOrRag: 'NONE', llmCallsCount: 0 };
  }

  // Common conceptual prefixes and queries that definitely do not need search/RAG
  const generalQuestionPrefixes = [
    'what is', 'what are', 'explain', 'how to', 'how do i', 'how does',
    'why does', 'why is', 'who is', 'who was', 'where is', 'where was',
    'tell me about', 'tell me what', 'give me a summary of', 'what does',
    'difference between', 'how can i', 'solve the', 'write a', 'implement',
    'make a', 'how do you', 'what is the capital of', 'translate'
  ];

  const temporalKeywords = [
    'current', 'today', 'weather', 'latest', 'recent', 'news', 'stock', 'price',
    'now', 'live', 'status', 'score', 'match', 'game today',
    'market', 'revenue', 'financials', 'earnings',
    'this week', 'this month', 'this year', '2026', '2025', '2024'
  ];

  const ragKeywords = [
    'document', 'file', 'upload', 'pdf', 'handbook', 'policy', 'internal',
    'company', 'guideline', 'procedures', 'rules'
  ];

  const codeKeywords = [
    'const ', 'let ', 'var ', 'function ', 'import ', 'export ', 'class ',
    'def ', 'public class', 'struct ', 'fn ', 'package ', '<html>', 'css'
  ];

  const startsWithQuestion = generalQuestionPrefixes.some(prefix => queryClean.startsWith(prefix));
  const hasTemporal = temporalKeywords.some(kw => queryClean.includes(kw));
  const hasRag = ragKeywords.some(kw => queryClean.includes(kw));
  const hasCodeBrackets = queryClean.includes('{') && queryClean.includes('}');
  const hasCodeKeywords = codeKeywords.some(kw => queryClean.includes(kw));

  // If it's a code snippet, use NONE directly
  if (hasCodeBrackets || hasCodeKeywords) {
    console.log(`[Search Necessity Classifier] ⚡ Code heuristic matched, using NONE.`);
    return { needsSearchOrRag: 'NONE', llmCallsCount: 0 };
  }

  // General questions without temporal/RAG triggers
  if (startsWithQuestion && !hasTemporal && !hasRag) {
    console.log(`[Search Necessity Classifier] ⚡ General question heuristic matched, using NONE.`);
    return { needsSearchOrRag: 'NONE', llmCallsCount: 0 };
  }

  // 2. LLM fallback classifier for general query search/RAG necessity
  console.log(`[Search Necessity Classifier] 🤖 Running LLM fallback classifier for query: "${query}"`);
  try {
    const llm = aiGateway.getChatModel({
      modelName: 'FAST', // Use fast model
      numPredict: 1024,
      temperature: 0.0
    });

    const systemPrompt = `You are an AI Query Routing Classifier.
Determine if answering the user query genuinely requires:
1. "WEB": External real-time web search (e.g. current stock prices, today's weather, latest news, current president, or temporal information about recent/live/current events).
2. "RAG": Internal company documents, policies, handbook, or repository code search.
3. "NONE": General knowledge, coding/programming concepts, history, science, math, static facts, language learning, general discussions, or greetings.

Respond strictly in JSON format:
{"needs": "WEB" | "RAG" | "NONE", "reason": "brief explanation"}`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`User Query: "${query}"`)
    ]);

    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.needs === 'WEB' || parsed.needs === 'RAG' || parsed.needs === 'NONE') {
        console.log(`[Search Necessity Classifier] LLM response: ${parsed.needs} (${parsed.reason || ''})`);
        return {
          needsSearchOrRag: parsed.needs,
          llmCallsCount: 1
        };
      }
    }
  } catch (err: any) {
    console.warn(`[Search Necessity Classifier] LLM classification check failed: ${err.message}`);
  }

  // Objective 7: Fix Vague Query -> Web Search Routing
  // AUREN must NOT interpret uncertainty as permission to search the web.
  // Fallback to RAG if internal knowledge intent, otherwise NONE (general LLM reasoning).
  const fallback = (state.intentCategory === 'INTERNAL_KNOWLEDGE' || state.intentCategory === 'MIXED' || state.intentCategory === 'CASUAL') ? 'RAG' : 'NONE';
  console.log(`[Search Necessity Classifier] Uncertainty fallback resolved to: ${fallback} (web search prevented on vague query)`);
  return { needsSearchOrRag: fallback as 'RAG' | 'NONE' | 'WEB', llmCallsCount: 1 };
}

export class KnowledgeGraph {
  private app: any;

  constructor(callbacks?: GraphCallbacks) {
    this.app = KnowledgeGraph.buildGraph(callbacks);
  }

  public async execute(initialState: Partial<AURENGraphState>): Promise<AURENGraphState> {
    return await this.app.invoke(initialState);
  }

  public static buildGraph(callbacks?: GraphCallbacks) {
    const workflow = new StateGraph(GraphAnnotation);

    // ----------------------------------------------------
    // 0. CONTEXTUALIZE QUERY NODE (Elliptical Query Resolution)
    // ----------------------------------------------------
    workflow.addNode('contextualizeQuery', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'contextualizeQuery' } });

      const rawQuery = state.userQuery;
      const messages = state.messages || [];

      // CHECK FOR CLARIFICATION RESPONSE CONTINUATION FIRST
      const clarificationCheck = isClarificationResponse(rawQuery, messages);
      if (clarificationCheck.isClarification && clarificationCheck.originalUserQuery) {
        const originalQuery = clarificationCheck.originalUserQuery;
        console.log(`[KnowledgeGraph] 🎯 Clarification response detected: Original="${originalQuery}" | Selected="${rawQuery}"`);

        const llm = aiGateway.getChatModel({
          modelName: state.executionMode,
          numPredict: 120,
          temperature: 0.0
        });
        const contextualizeSchema = z.object({
          resolved_query: z.string().describe(
            "The resolved standalone research query combining the original user query and the selected clarification choice."
          ),
          reason: z.string().describe("Brief explanation of how the clarification option was merged.")
        });
        const structuredModel = llm.withStructuredOutput(contextualizeSchema);

        const systemPrompt = `You are a Context-Aware Query Resolver for an enterprise AI research pipeline.

The user previously asked: "${originalQuery}"
The system requested clarification, and the user selected / responded with: "${rawQuery}"

YOUR TASK:
Combine the original user query and the selected clarification choice into a single, complete, unambiguous research query.

STRICT RULES:
1. PRESERVE ALL original query details (entities, requested metrics, events, timeframes, comparisons, qualifiers).
2. MERGE the clarification choice to resolve the ambiguity.
3. DO NOT change the requested metric or topic into something unrelated.

Examples:
- Original: "What happened to Apple after its earnings report?" | Choice: "Most Recent"
  -> Resolved: "What happened to Apple after its most recent earnings report?"
- Original: "What happened after the latest earnings report?" | Choice: "Apple Inc. (AAPL)"
  -> Resolved: "What happened to Apple Inc. (AAPL) after its latest earnings report?"`;

        let resolvedQuery = `${originalQuery} (${rawQuery})`;
        let reason = "Deterministic clarification merge";
        const llmStart = performance.now();

        try {
          const response: any = await structuredModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage("Output JSON matching the schema.")
          ]);

          if (response && response.resolved_query && response.resolved_query.trim()) {
            resolvedQuery = response.resolved_query.trim();
            reason = response.reason || "LLM clarification merge";
          }
        } catch (err: any) {
          console.warn(`[KnowledgeGraph] ⚠ Clarification merge LLM failed, using fallback: ${err.message}`);
        }

        console.log(`[KnowledgeGraph] 🔄 Clarification continuation query resolved: "${rawQuery}" -> "${resolvedQuery}"`);

        const llmDurationMs = performance.now() - llmStart;
        const durationMs = performance.now() - nodeStart;

        callbacks?.onEvent?.({
          type: 'query_contextualized',
          data: { rawQuery, resolvedQuery, requiresContextualization: true, reason }
        });

        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'contextualizeQuery', durationMs, llmDurationMs, llmCallsCount: 1 }
        });

        return {
          rawUserQuery: rawQuery,
          resolvedQuery: resolvedQuery,
          userQuery: resolvedQuery,
          isClarificationContinuation: true
        };
      }

      if (!isEllipticalFollowUp(rawQuery, messages)) {
        console.log(`[KnowledgeGraph] ⚡ Fast-pathing contextualizeQuery for standalone query: "${rawQuery}" (0ms overhead)`);
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'query_contextualized',
          data: { rawQuery, resolvedQuery: rawQuery, requiresContextualization: false, reason: "Fast-path standalone query" }
        });
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'contextualizeQuery', durationMs, llmCallsCount: 0 }
        });
        return {
          rawUserQuery: rawQuery,
          resolvedQuery: rawQuery,
          userQuery: rawQuery
        };
      }

      // Elliptical follow-up detected! Resolve context using LLM with structured output.
      const llm = aiGateway.getChatModel({
        modelName: state.executionMode,
        numPredict: 120,
        temperature: 0.0
      });
      const contextualizeSchema = z.object({
        requires_contextualization: z.boolean().describe(
          "Set to true ONLY if the current user query is incomplete or contains an unresolved pronoun/reference (e.g., 'Tata?', 'How old is he?', 'What about Microsoft?') that CANNOT be understood without previous conversation history. Set to false if the query is independently understandable."
        ),
        resolved_query: z.string().describe(
          "If requires_contextualization is true, output the resolved standalone query preserving ALL explicit semantic intent, metrics, events, and constraints from the current query while resolving missing references. If requires_contextualization is false, output the exact original user query."
        ),
        reason: z.string().describe(
          "Brief explanation of why contextualization was or was not required and how intent was preserved."
        )
      });

      const structuredModel = llm.withStructuredOutput(contextualizeSchema);

      const recentMessages = messages.slice(-4);
      const historyStr = recentMessages.map(m => `[${(m as any).role || (m._getType ? m._getType() : 'user')}]: ${m.content}`).join('\n');

      const systemPrompt = `You are a Context-Aware Query Resolver for an enterprise AI research pipeline.

YOUR TASK:
Determine if the CURRENT USER QUERY requires information from PREVIOUS CONVERSATION HISTORY to be fully understood. If so, resolve missing references while STRICTLY PRESERVING the current query's explicit semantic intent.

CORE RULES:

1. STANDALONE QUERY (HIGHEST AUTHORITY):
   If the current user query is ALREADY independently understandable and complete on its own:
   - Set \`requires_contextualization\`: false
   - Set \`resolved_query\`: exact original user query
   - NEVER reinterpret, rewrite, update, or "improve" a standalone query.
   - NEVER replace the user's requested topic, metric, event, or question with a topic/metric from previous conversation history.

2. ELLIPTICAL FOLLOW-UP / UNRESOLVED REFERENCE:
   Set \`requires_contextualization\`: true ONLY when the current query is missing critical context, such as:
   - An entity substitution fragment (e.g., Previous: "What is Apple's stock price?" | Current: "Tata?") -> Resolve missing predicate from previous turn -> "What is Tata's current stock price?"
   - An unresolved anaphoric pronoun (e.g., Previous: "Tell me about Elon Musk." | Current: "How old is he?") -> Resolve pronoun "he" -> "How old is Elon Musk?"
   - A contextual fragment (e.g., Previous: "Who is the CEO of Google?" | Current: "What about Microsoft?") -> Resolve predicate -> "Who is the CEO of Microsoft?"

3. INTENT PRESERVATION MANDATE:
   When contextualizing an elliptical query, you MUST preserve ALL explicit semantic components present in the current user query:
   - Entity / Subject
   - Action / Question type
   - Financial metrics or specific data requests
   - Temporal constraints, events, or periods (e.g., "after latest earnings report", "in 2023", "Q4 results")
   - Comparisons, conditions, or qualifiers

   NEVER perform any of the following unauthorized changes:
   - DO NOT change the requested metric (e.g., DO NOT change "earnings report" or "stock price impact" into "market capitalization").
   - DO NOT turn an event/historical question into a current-snapshot question.
   - DO NOT collapse a specific question into a generic company overview.
   - DO NOT replace an explicit question in the current turn with an intent from previous turns.

4. SAFE TRANSFORMATION PRINCIPLE:
   Only rewrite the query if CURRENT QUERY + PREVIOUS CONTEXT is materially more complete than CURRENT QUERY alone.
   If in doubt, set \`requires_contextualization\`: false and return the original user query.

Conversation History:
${historyStr}

Current User Query: "${rawQuery}"`;

      let resolvedQuery = rawQuery;
      let requiresContextualization = false;
      let reason = "Fallback to raw query";
      const llmStart = performance.now();
      let llmCallsCount = 1;

      try {
        const response: any = await structuredModel.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage("Output JSON matching the schema.")
        ]);

        if (response) {
          requiresContextualization = Boolean(response.requires_contextualization);
          reason = response.reason || "No reason provided";

          if (requiresContextualization && response.resolved_query && response.resolved_query.trim()) {
            const candidate = response.resolved_query.trim();

            // FAIL-SAFE POST-VALIDATION:
            // Check if candidate query stripped key explicit non-stop words from rawQuery
            const stopWords = new Set([
              'what', 'who', 'where', 'when', 'why', 'how', 'which', 'is', 'are', 'was', 'were',
              'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
              'about', 'its', 'it', 'his', 'her', 'their', 'this', 'that', 'after'
            ]);
            const rawKeyTerms = rawQuery
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length > 2 && !stopWords.has(w));

            const candidateLower = candidate.toLowerCase();
            const missingKeyTerms = rawKeyTerms.filter(term => !candidateLower.includes(term));

            // If rawQuery had explicit key terms (>= 3 key terms) and candidate removed more than half of them, fail safe to rawQuery!
            if (rawKeyTerms.length >= 3 && missingKeyTerms.length > Math.floor(rawKeyTerms.length / 2)) {
              console.warn(`[KnowledgeGraph] ⚠ Contextualizer stripped explicit key terms [${missingKeyTerms.join(', ')}]. Fail-safe reverting to raw query.`);
              resolvedQuery = rawQuery;
              requiresContextualization = false;
            } else {
              resolvedQuery = candidate;
              console.log(`[KnowledgeGraph] 🔄 Contextualized elliptical query: "${rawQuery}" -> "${resolvedQuery}" (Reason: ${reason})`);
            }
          } else {
            resolvedQuery = rawQuery;
            console.log(`[KnowledgeGraph] ℹ Standalone query validated by LLM: "${rawQuery}" (Reason: ${reason})`);
          }
        }
      } catch (err: any) {
        console.warn(`[KnowledgeGraph] ⚠ contextualizeQuery failed, using raw query: ${err.message}`);
      }

      const llmDurationMs = performance.now() - llmStart;
      const durationMs = performance.now() - nodeStart;

      callbacks?.onEvent?.({
        type: 'query_contextualized',
        data: { rawQuery, resolvedQuery, requiresContextualization, reason }
      });

      callbacks?.onEvent?.({
        type: 'node_timing',
        data: { nodeName: 'contextualizeQuery', durationMs, llmDurationMs, llmCallsCount }
      });

      return {
        rawUserQuery: rawQuery,
        resolvedQuery: resolvedQuery,
        userQuery: resolvedQuery
      };
    });

    // ----------------------------------------------------
    // 1. CLASSIFY INTENT NODE
    // ----------------------------------------------------
    workflow.addNode('classifyIntent', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'graph_started', data: { query: state.userQuery } });
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'classifyIntent' } });

      const queryLower = state.userQuery.toLowerCase().trim();

      // Rule 0: First-Class Identity / Self-Query / System Model Query Intent
      const identityPattern = /\b(who\s+am\s+i|what'?s\s+my\s+name|what\s+is\s+my\s+name|who\s+am\s+i\s+logged\s+in\s+as|who\s+is\s+my\s+account|what\s+account\s+am\s+i\s+using|tell\s+me\s+about\s+myself|who\s+i\s+am|my\s+profile|my\s+identity|who\s+am\s+i\s+in\s+this\s+system)\b/i;
      const systemModelIdentityPattern = /\b(what|which)\s+(model|ai|llm|runtime|version|provider|architecture)\s+(are\s+you|is\s+this|do\s+you\s+use|powers\s+you|running|are\s+you\s+using)\b|\b(what\s+model\s+are\s+you|which\s+model\s+are\s+you|what\s+model\s+do\s+you\s+use|what\s+runtime\s+are\s+you\s+using)\b/i;

      // Rule 0.5: Document Catalog / Inventory Browse Intent
      const isContentQuery = /\b(what does|what is in|explain|details of|content of|summarize|read|describe|quote|section|paragraph|chapter)\b/i.test(queryLower);
      const catalogPattern = /\b(show|list|get|browse|display|view)\s+(me\s+)?(all\s+|everything\s+|every\s+|our\s+|the\s+)?.*(document|documents|doc|docs|files|file|knowledge|knowledge\s*base|catalog|inventory)\b/i;
      const catalogQueryPattern = /\b(what|which)\s+(documents|files|docs)\s+(do\s+we\s+have|are\s+in|exist|available|uploaded)\b/i;
      const catalogNounPattern = /\b(catalog|inventory|index|list)\s+(of|for)?\s+.*(document|documents|files|docs|knowledge)\b/i;
      const catalogNounPattern2 = /\b(document|documents|file|files|knowledge|org|organization)\s+(catalog|inventory)\b/i;

      // Rule 1: Explicit User Memory Management
      const memorySavePattern = /\b(remember that|remember my|remember this|save this|save memory|note that|store that)\b/i;
      const memoryDeletePattern = /\b(forget that|forget my|forget this|delete memory|remove memory|erase memory|clear memory)\b/i;
      const memoryReadPattern = /\b(what language am i|what language do i|do you remember|my preference|what did i ask you to remember|what are my preferences)\b/i;

      let intent: IntentCategory = 'CASUAL';
      let confidence = 0.95;

      if (identityPattern.test(queryLower) || systemModelIdentityPattern.test(queryLower)) {
        intent = 'IDENTITY';
        confidence = 1.0;
      } else if (!isContentQuery && (catalogPattern.test(queryLower) || catalogQueryPattern.test(queryLower) || catalogNounPattern.test(queryLower) || catalogNounPattern2.test(queryLower))) {
        intent = 'DOC_CATALOG_BROWSE';
        confidence = 0.99;
      } else if (memorySavePattern.test(queryLower)) {
        intent = 'MEMORY_SAVE';
        confidence = 0.99;
      } else if (memoryDeletePattern.test(queryLower)) {
        intent = 'MEMORY_DELETE';
        confidence = 0.99;
      } else if (memoryReadPattern.test(queryLower)) {
        intent = 'MEMORY_READ';
        confidence = 0.95;
      }
      // Rule 2: Conversation History Recall
      else if (/\b(what was my previous|previous question|first question|what did i ask earlier|previous query|repeat my last)\b/i.test(queryLower)) {
        intent = 'CONVERSATION_HISTORY';
        confidence = 0.98;
      }
      // Rule 3: System Utilities
      else if (/\b(today's date|current time|clock|what time is it|what day is it)\b/i.test(queryLower) && queryLower.length < 35) {
        intent = 'SYSTEM_UTILITY';
        confidence = 0.98;
      } else {
        // Keyword indicators for Web and Internal - Refined to prevent false positives in FAST mode
        const webPattern = /\b(breaking news|latest news|news today|current weather|weather today|weather in|temperature in|forecast for)\b/i;
        const internalKeywordPattern = /\b(uploaded|pdf|docx?|xlsx?|pptx?|file|files|document|documents|doc|docs|documentation|handbook|sop|knowledge base|indexed|leave policy|resume|resumes|cv|cvs)\b/i;
        const domainQueryPattern = /\b(our|my project|the project|project|architecture|policy|policies|requirements?|approval|workflow|deployment|security|infrastructure|system|team|repository|module|spec|standard|guideline|contract|onboarding|procedure|roadmap|feature|feature spec)\b/i;

        const isGenericCsConcept = /\b(recursion|http|https|database|sql|rest api|graphql|html|css|javascript|typescript|python|java|c\+\+|git|docker|kubernetes|binary tree|algorithm|data structure|object oriented|polymorphism|inheritance|closure|promise|async|await)\b/i.test(queryLower);
        const isGenericCodeRequest = /\b(write|create|implement|build|generate)\s+(a|an|some)?\s+.*(function|script|code|program|class|algorithm|component)\b/i.test(queryLower);

        const isRateOrPrice = /\b(current price|live price|today's price|today price|exchange rate|stock price|repo rate|current rate|live rate|today's rate|latest rate)\b/i.test(queryLower);
        const isCurrentOrTemporal = /\b(today|now|current|currently|latest|recent|recently|live|this week|this month|right now|as of today|2026|2025)\b/i.test(queryLower);
        const isExplicitWebSearch = /\b(search the web|search web|use web|google|look up|check online|find online)\b/i.test(queryLower);

        // A dynamic data query MUST have temporal/live context or specify live rates/prices
        const isDynamicDataQuery = isRateOrPrice || (
          isCurrentOrTemporal && /\b(price|cost|worth|conversion|inr|usd|eur|gbp|bitcoin|btc|stock|market cap|shares|valuing|trading at|ceo|president|prime minister|pm|governor|cm|chief minister|weather|temperature|forecast|version|release|latest version|current version)\b/i.test(queryLower)
        ) || /\b(who is the current|what is the current|latest version of|current version of|latest release of)\b/i.test(queryLower);

        const hasInternalKeyword = internalKeywordPattern.test(queryLower);
        const isExplicitDomainQuery = domainQueryPattern.test(queryLower);
        const isDomainOrEntityQuery = isExplicitDomainQuery || (!isGenericCsConcept && !isGenericCodeRequest && /\b(what is|what are|tell me about|explain|describe|details of|overview of|who is responsible for|how to handle)\b/i.test(queryLower));

        // Explicit internal keywords or domain patterns take precedence; otherwise dynamic queries stay dynamic
        const hasInternal = hasInternalKeyword || (isExplicitDomainQuery) || (!isDynamicDataQuery && isDomainOrEntityQuery);
        const hasWeb = webPattern.test(queryLower) || isExplicitWebSearch || (isDynamicDataQuery && !hasInternalKeyword && !isExplicitDomainQuery);

        if (hasInternal && (hasWeb || (isDynamicDataQuery && (hasInternalKeyword || isExplicitDomainQuery)))) {
          intent = 'MIXED';
          confidence = 0.96;
        } else if (isDynamicDataQuery || (hasWeb && !hasInternal)) {
          intent = 'DYNAMIC_DATA';
          confidence = 0.98;
        } else if (hasInternal) {
          intent = 'INTERNAL_KNOWLEDGE';
          confidence = 0.97;
        } else if (hasWeb) {
          intent = 'EXTERNAL_WEB';
          confidence = 0.97;
        } else if (
          (queryLower.length <= 15 && /^(hi|hello|hey|yo|yoyoy|hello\s+man|thanks|thank\s+you|how are you|good\s+morning|good\s+night|ok|okay|sure|yes|no|bye|goodbye|what's up|sup)$/i.test(queryLower))
          || /^(hi|hello|hey|yo|yoyoy|hello\s+man|thanks|thank\s+you|how are you|who are you|what is your name|tell me a joke|how's it going)$/i.test(queryLower)
        ) {
          intent = 'CASUAL';
          confidence = 1.0;
        } else {
          // Default general informational and research queries to CASUAL to route directly
          intent = 'CASUAL';
          confidence = 0.95;
        }
      }

      callbacks?.onEvent?.({
        type: 'intent_detected',
        data: { intent, confidence }
      });

      const durationMs = performance.now() - nodeStart;
      callbacks?.onEvent?.({
        type: 'node_timing',
        data: { nodeName: 'classifyIntent', durationMs, llmCallsCount: 0 }
      });

      return {
        intentCategory: intent,
        intentConfidence: confidence
      };
    });

    // ----------------------------------------------------
    // 1.2. ROUTE QUERY NODE (Complexity Routing)
    // ----------------------------------------------------
    workflow.addNode('routeQuery', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'routeQuery' } });

      let resolvedMode: 'FAST' | 'DEEP' = 'FAST';
      let llmCallsCount = 0;
      let fastRoutingTarget: 'web' | 'rag' | 'none' | undefined = undefined;

      // IDENTITY Intent: Bypass RAG and Web Search completely!
      if (state.intentCategory === 'IDENTITY') {
        console.log(`[KnowledgeGraph] 🔒 IDENTITY Intent detected — bypassing RAG vector retrieval & web search for authoritative session identity response.`);
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'routeQuery', durationMs, llmCallsCount: 0 }
        });
        return {
          executionMode: 'FAST',
          fastRoutingTarget: 'none',
          useKnowledgeBase: false
        };
      }

      // DOC_CATALOG_BROWSE Intent: Bypass RAG vector retrieval & Web search!
      if (state.intentCategory === 'DOC_CATALOG_BROWSE') {
        console.log(`[KnowledgeGraph] 📚 DOC_CATALOG_BROWSE Intent detected — routing directly to retrieveDocumentCatalog node.`);
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'routeQuery', durationMs, llmCallsCount: 0 }
        });
        return {
          executionMode: 'FAST',
          fastRoutingTarget: 'none',
          useKnowledgeBase: false
        };
      }

      if (state.executionMode === 'AUTO') {
        const res = await classifyQueryComplexity(state);
        resolvedMode = res.complexity;
        llmCallsCount = res.llmCallsCount;
      } else {
        resolvedMode = state.executionMode === 'FAST' ? 'FAST' : 'DEEP';
      }

      if (resolvedMode === 'FAST') {
        // Fast deterministic target resolution based on already classified intentCategory:
        if (state.intentCategory === 'INTERNAL_KNOWLEDGE' || state.intentCategory === 'MIXED') {
          fastRoutingTarget = 'rag';
        } else if (state.intentCategory === 'EXTERNAL_WEB' || state.intentCategory === 'DYNAMIC_DATA') {
          fastRoutingTarget = 'web';
        } else {
          fastRoutingTarget = 'none';
        }
        console.log(`[KnowledgeGraph] ⚡ FAST mode deterministic routing resolved: Target="${fastRoutingTarget}" based on IntentCategory="${state.intentCategory}" (0ms overhead)`);
      }

      // ── Knowledge-Aware Catalog Pre-Routing ──────────────────────────
      // Check if normalized query terms match an existing AUTHORIZED workspace document/entity.
      // Explicit web search commands ("search the web", "look up online", "google", etc.) MUST win.
      const isExplicitWebCommand = /\b(search the web|search web|use web|google|look up online|check online|find online|what does the internet say|on the web|web search)\b/i.test(state.userQuery || '');
      
      let knowledgeAwareMatchFound = false;
      let matchedDocTitle = '';
      const resolvedKnowledgeDocumentIds: string[] = [];

      if (!isExplicitWebCommand && state.authContext?.organizationId) {
        try {
          const { prisma } = require('../../infrastructure/database/prisma');
          const { DocumentAccessPolicy } = require('../../domain/security/DocumentAccessPolicy');

          // Helper: Normalize strings for document identity matching (case, extension, separator insensitive)
          const normalizeForIdentity = (str: string): string => {
            if (!str) return '';
            return str
              .toLowerCase()
              .replace(/\.[a-z0-9]+$/i, '')       // Strip extensions (.png, .pdf, .md, .ts, .json)
              .replace(/[_.\-\/\\:]/g, ' ')        // Replace separators with spaces
              .replace(/\s+/g, ' ')
              .trim();
          };

          const normQuery = normalizeForIdentity(state.userQuery || '');
          const queryWords = normQuery.split(' ').filter(w => w.length > 2);

          if (normQuery.length >= 3 && queryWords.length > 0) {
            // Fetch authorized catalog metadata for this tenant
            const candidateDocs = await prisma.document.findMany({
              where: {
                organizationId: state.authContext.organizationId,
                deletedAt: null
              },
              select: {
                id: true,
                title: true,
                scope: true,
                visibility: true,
                ownerId: true,
                departmentId: true,
                allowedUsers: true,
                allowedRoles: true,
                allowedDepartments: true,
                deniedUsers: true,
                deniedRoles: true,
                deniedDepartments: true,
                externalId: true,
                sourceUrl: true,
                organizationId: true
              },
              take: 250
            });

            const subjectUser = {
              id: state.authContext.userId,
              organizationId: state.authContext.organizationId,
              roles: state.authContext.roles || [],
              departments: state.authContext.departmentId ? [state.authContext.departmentId] : [],
              isSuperAdmin: !!state.authContext.isSuperAdmin
            };

            const authorizedDocs = candidateDocs.filter((doc: any) => DocumentAccessPolicy.canAccess(subjectUser, doc));

            for (const doc of authorizedDocs) {
              const rawTitle = doc.title || doc.externalId || '';
              const normTitle = normalizeForIdentity(rawTitle);
              const cleanTitle = normTitle.replace(/\b\d{6,}\b/g, '').replace(/\s+/g, ' ').trim();

              if (normTitle.length >= 3) {
                // Exact string match or significant token sequence match
                if (normQuery.includes(normTitle) || normQuery.includes(cleanTitle) || (cleanTitle.length >= 3 && cleanTitle === normQuery)) {
                  knowledgeAwareMatchFound = true;
                  matchedDocTitle = doc.title;
                  resolvedKnowledgeDocumentIds.push(doc.id);
                } else {
                  const titleWords = (cleanTitle || normTitle).split(' ').filter(w => w.length > 2);
                  if (titleWords.length > 0) {
                    const matchedWords = titleWords.filter(w => queryWords.includes(w));
                    if (matchedWords.length >= Math.min(2, titleWords.length) && matchedWords.join(' ').length >= 4) {
                      knowledgeAwareMatchFound = true;
                      matchedDocTitle = doc.title;
                      resolvedKnowledgeDocumentIds.push(doc.id);
                    }
                  }
                }
              }
            }
          }
        } catch (catErr: any) {
          console.warn(`[KnowledgeGraph] ⚠ Knowledge-Aware catalog lookup warning: ${catErr.message}`);
        }
      }

      if (knowledgeAwareMatchFound && resolvedKnowledgeDocumentIds.length > 0) {
        const uniqueDocIds = Array.from(new Set(resolvedKnowledgeDocumentIds));
        console.log(`[KnowledgeGraph] 🔍 Knowledge-Aware Pre-Routing: Matched authorized document "${matchedDocTitle}" (IDs: ${uniqueDocIds.join(', ')}) for query "${state.userQuery}" — routing to RAG`);
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'routeQuery', durationMs, llmCallsCount: 0 }
        });
        return {
          executionMode: resolvedMode,
          intentCategory: 'INTERNAL_KNOWLEDGE',
          fastRoutingTarget: 'rag',
          useKnowledgeBase: true,
          resolvedKnowledgeDocumentIds: uniqueDocIds
        };
      }

      // ── Auto-KB detection: smart document/filename recognition ──────────────────────────
      // If the user's query contains a filename or document reference, automatically
      // enable KB search without requiring the manual toggle to be on.
      const q = (state.userQuery || '').toLowerCase();
      const docFilePattern = /\.(pdf|docx?|xlsx?|pptx?|csv|txt|md|json|xml)\b/i;
      // Refined to require explicit document keywords to avoid triggering on generic words
      const docPhrasePattern = /\b(the (document|file|pdf|report|policy|contract|manual|resume|cv|sheet|spreadsheet)|analyze (the|this|my) (document|file|pdf|report|policy|contract|manual|resume|cv|sheet|spreadsheet)|summarize (the|this|my) (document|file|pdf|report|policy|contract|manual|resume|cv|sheet|spreadsheet)|what does (the|this|my|our) (document|file|pdf|report|policy|contract|manual|resume|cv|sheet|spreadsheet) (say|contain|mention|cover)|from (the|this|my) (document|file|report))\b/i;
      const autoKB = !state.useKnowledgeBase && (docFilePattern.test(state.userQuery || '') || docPhrasePattern.test(q));
      if (autoKB) {
        console.log(`[KnowledgeGraph] 🔍 Auto-KB: detected document/file reference in query — enabling KB retrieval automatically`);
      }
      const effectiveUseKB = state.useKnowledgeBase || autoKB;

      // If Knowledge Base mode is ON (manually or auto-detected), always run RAG first
      if (effectiveUseKB) {
        console.log(`[KnowledgeGraph] 📚 Knowledge Base mode ON (manual=${state.useKnowledgeBase}, auto=${autoKB}): forcing RAG retrieval for query: "${state.userQuery}"`);
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'routeQuery', durationMs, llmCallsCount: 0 }
        });
        return {
          executionMode: resolvedMode,
          fastRoutingTarget: 'rag',
          // propagate effectiveUseKB so synthesizeAnswer uses KB-mode prompting
          useKnowledgeBase: true,
        };
      }


      console.log(`[KnowledgeGraph] 🧭 Query Routed: Mode="${resolvedMode}" (requested="${state.executionMode}"), fastRoutingTarget="${fastRoutingTarget}"`);
      
      callbacks?.onEvent?.({
        type: 'execution_mode_resolved',
        data: { resolvedMode, originalMode: state.executionMode }
      });

      const durationMs = performance.now() - nodeStart;
      callbacks?.onEvent?.({
        type: 'node_timing',
        data: { nodeName: 'routeQuery', durationMs, llmCallsCount }
      });

      return {
        executionMode: resolvedMode,
        fastRoutingTarget
      };
    });

    // ----------------------------------------------------
    // 1.5. CLARIFY WITH USER NODE
    // ----------------------------------------------------
    // ----------------------------------------------------
    // 1.5. CLARIFY WITH USER NODE
    // ----------------------------------------------------
    workflow.addNode('clarifyWithUser', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'clarifyWithUser' } });

      // Heuristic clarification bypass for highly specific or long queries or clear internal/document queries
      const q = state.userQuery?.trim() ?? '';
      const isSpecificLongQuery = q.length > 100 || 
        /\b(compare|comparison|versus|\bvs\b|difference between|pros and cons|revenue|growth|stock price|financial|quarter|fiscal|year|growth comparison|puzzle|riddle|solve|code)\b/i.test(q);

      const isClearQuery = isSpecificLongQuery ||
        state.intentCategory === 'INTERNAL_KNOWLEDGE' ||
        state.intentCategory === 'DOC_CATALOG_BROWSE' ||
        state.intentCategory === 'CASUAL' ||
        state.intentCategory === 'IDENTITY' ||
        state.intentCategory === 'MIXED' ||
        state.useKnowledgeBase;

      if (isClearQuery) {
        console.log(`[KnowledgeGraph] ⚡ Bypassing clarification assessment for clear query: "${q.slice(0, 40)}..." (0ms overhead)`);
        callbacks?.onEvent?.({
          type: 'scope_assessment',
          data: {
            needClarification: false,
            question: "",
            optionsCount: 0,
            decision: 'RESEARCH_STARTED (Clear query bypass)'
          }
        });
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'clarifyWithUser', durationMs: 0.1, llmDurationMs: 0, llmCallsCount: 0 }
        });
        return {
          isAmbiguous: false,
          clarificationQuestion: "",
          clarificationOptions: [],
          researchStrategy: 'DEEP_RESEARCH'
        };
      }

      if (state.executionMode === 'FAST') {
        console.log(`[KnowledgeGraph] ⚡ Bypassing clarification assessment in FAST mode`);
        callbacks?.onEvent?.({
          type: 'scope_assessment',
          data: {
            needClarification: false,
            question: "",
            optionsCount: 0,
            decision: 'RESEARCH_STARTED (FAST mode)'
          }
        });
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'clarifyWithUser', durationMs: 0.1, llmDurationMs: 0, llmCallsCount: 0 }
        });
        return {
          isAmbiguous: false,
          clarificationQuestion: "",
          clarificationOptions: [],
          researchStrategy: 'SIMPLE_FACT'
        };
      }

      if (state.isClarificationContinuation) {
        console.log(`[KnowledgeGraph] ⚡ Fast-pathing clarifyWithUser for clarification continuation query: "${state.userQuery}" (0ms overhead)`);
        callbacks?.onEvent?.({
          type: 'scope_assessment',
          data: {
            needClarification: false,
            question: "",
            optionsCount: 0,
            decision: 'RESEARCH_STARTED (Clarification continuation)'
          }
        });
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'clarifyWithUser', durationMs: 0.1, llmDurationMs: 0, llmCallsCount: 0 }
        });
        return {
          isAmbiguous: false,
          clarificationQuestion: "",
          clarificationOptions: [],
          researchStrategy: 'DEEP_RESEARCH'
        };
      }

      const llm = aiGateway.getChatModel({ numPredict: 150, temperature: 0.1 });

      // Prune history to last 2 messages to minimize prompt prefill latency
      const recentMessages = (state.messages || []).slice(-2);
      const historyStr = recentMessages.length > 0
        ? recentMessages.map(m => `[${(m as any).role || (m._getType ? m._getType() : 'user')}]: ${m.content}`).join('\n')
        : 'None';

      const clarifyWithUserInstructions = `You are a Research Scope Classifier. Decide: ask user for clarification (need_clarification=true), or proceed to research (need_clarification=false)?

Recent Context:
${historyStr}
Current Query: "${state.userQuery}"
Today's Date: ${new Date().toISOString()}

RULES:
1. FULLY QUALIFIED OR SPECIFIC QUERY → need_clarification=false.
2. 2–3 PROMINENT INTERPRETATIONS (e.g. Congo, Georgia, Cambridge, Portland, Victoria, London) → need_clarification=false. Synthesis will answer for all.
3. 4+ EQUALLY PLAUSIBLE INTERPRETATIONS OR COMPLETE AMBIGUITY (e.g. Springfield, Jordan, Mercury laws) → need_clarification=true. Provide 2-4 options in 'options'.
4. Do NOT re-ask if history already answered.

Respond ONLY in valid JSON matching this schema:
{
  "need_clarification": boolean,
  "question": "string",
  "options": [{"label": "string", "description": "string", "value": "string"}]
}`;

      let response: z.infer<typeof ClarifyWithUserSchema> = {
        need_clarification: false,
        question: "",
        options: []
      };

      const llmStart = performance.now();
      let timeoutId: NodeJS.Timeout | undefined = undefined;
      const abortController = new AbortController();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('clarifyWithUser timed out after 90000ms'));
        }, 90000);
      });

      try {
        const invokePromise = llm.invoke([
          new SystemMessage(clarifyWithUserInstructions),
          new HumanMessage("Output JSON assessment.")
        ], { signal: abortController.signal });

        const rawResponse = await Promise.race([invokePromise, timeoutPromise]);
        const content = typeof rawResponse.content === 'string' ? rawResponse.content : JSON.stringify(rawResponse.content);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          response = {
            need_clarification: Boolean(parsed.need_clarification),
            question: parsed.question || "",
            options: Array.isArray(parsed.options) ? parsed.options : []
          };
        }
      } catch (err: any) {
        console.warn(`[KnowledgeGraph] ⚠ clarifyWithUser timed out or failed, defaulting to false: ${err.message || err}`);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
      const llmDurationMs = performance.now() - llmStart;

      callbacks?.onEvent?.({
        type: 'scope_assessment',
        data: {
          needClarification: response.need_clarification,
          question: response.question,
          optionsCount: (response.options || []).length,
          decision: response.need_clarification ? 'CLARIFICATION_REQUIRED' : 'RESEARCH_STARTED',
        }
      });

      if (response.need_clarification) {
        // Emit clarification_required — ChatController will close the SSE stream on this event
        callbacks?.onEvent?.({
          type: 'clarification_required',
          data: {
            question: response.question || "Please select one of the options below to clarify your request:",
            options: response.options || []
          }
        });
      }

      const durationMs = performance.now() - nodeStart;
      callbacks?.onEvent?.({
        type: 'node_timing',
        data: { nodeName: 'clarifyWithUser', durationMs, llmDurationMs, llmCallsCount: 1 }
      });

      return {
        isAmbiguous: response.need_clarification,
        clarificationQuestion: response.question,
        clarificationOptions: response.options || [],
        // we'll default to DEEP_RESEARCH for the next steps
        researchStrategy: 'DEEP_RESEARCH'
      };
    });

    // ----------------------------------------------------
    // 1.6. WRITE RESEARCH BRIEF NODE
    // ----------------------------------------------------
    workflow.addNode('writeResearchBrief', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'writeResearchBrief' } });

      const messages = state.messages || [];
      const isStandaloneQuery = messages.length === 0 || !/\b(it|its|they|them|their|that|this|he|she|his|her|former|latter|previous|above)\b/i.test(state.userQuery);

      const isClearInternalOrDocQuery = state.intentCategory === 'INTERNAL_KNOWLEDGE' || 
        state.intentCategory === 'DOC_CATALOG_BROWSE' || 
        state.intentCategory === 'CASUAL' || 
        state.intentCategory === 'IDENTITY' || 
        state.intentCategory === 'MIXED' ||
        state.useKnowledgeBase;

      let researchBrief = state.userQuery;
      let llmDurationMs = 0;
      let llmCallsCount = 0;

      if (!isStandaloneQuery && !isClearInternalOrDocQuery) {
        llmCallsCount = 1;
        const llm = aiGateway.getChatModel({
          modelName: state.executionMode,
          numPredict: 60
        });
        const transformMessagesPrompt = `You are a web search query formulation assistant for SearXNG.
Your task is to transform the conversation history and user follow-up query into a single, highly specific search query.

CRITICAL MANDATES:
1. STRICTLY PRESERVE all entity names, stock tickers, crypto symbols, or proper nouns.
2. STRICTLY PRESERVE all requested metrics, tasks, temporal timeframes (e.g., "this month", "last month", "Q3", "today"), and comparative qualifiers (e.g., "compared with", "versus", "return", "gain").
3. DO NOT simplify or reduce specific questions into generic entity lookups (e.g., do NOT reduce "How did Bitcoin perform this month compared with last month?" into "Bitcoin").

History:
${messages.slice(-2).map(m => `[${(m as any).role || (m._getType ? m._getType() : 'user')}]: ${m.content}`).join('\n')}
Follow-up: "${state.userQuery}"

Output strictly valid JSON matching the schema: {"research_brief": "string"}`;

        const structuredModel = llm.withStructuredOutput(ResearchQuestionSchema);
        const llmStart = performance.now();
        try {
          const response: z.infer<typeof ResearchQuestionSchema> = await structuredModel.invoke([
            new SystemMessage(transformMessagesPrompt),
            new HumanMessage("Output research brief JSON.")
          ]) as any;
          
          if (response && response.research_brief && response.research_brief.trim()) {
            const candidate = response.research_brief.trim();
            const keyTerms = state.userQuery.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
            const candidateLower = candidate.toLowerCase();
            const essentialTerms = keyTerms.filter(t => 
              !['what', 'when', 'where', 'which', 'who', 'how', 'does', 'that', 'this', 'with', 'from', 'have', 'been'].includes(t)
            );
            const missingTerms = essentialTerms.filter(t => !candidateLower.includes(t));
            
            if (essentialTerms.length > 2 && missingTerms.length > Math.floor(essentialTerms.length / 2)) {
              console.warn(`[KnowledgeGraph] ⚠ writeResearchBrief candidate dropped essential terms [${missingTerms.join(', ')}]. Reverting to resolved query.`);
              researchBrief = state.userQuery;
            } else {
              researchBrief = candidate;
            }
          }
        } catch (err: any) {
          console.warn(`[KnowledgeGraph] ⚠ writeResearchBrief JSON parse failed, using original query. Error: ${err.message}`);
        }
        llmDurationMs = performance.now() - llmStart;
      } else {
        researchBrief = state.userQuery;
        console.log(`[KnowledgeGraph] ⚡ Preserving standalone research query: "${state.userQuery}" (0ms overhead)`);
      }

      callbacks?.onEvent?.({ type: 'research_brief_generated', data: { brief: researchBrief } });

      const durationMs = performance.now() - nodeStart;
      callbacks?.onEvent?.({
        type: 'node_timing',
        data: { nodeName: 'writeResearchBrief', durationMs, llmDurationMs, llmCallsCount }
      });

      return {
        researchBrief: researchBrief
      };
    });


    // ----------------------------------------------------
    // 2. RETRIEVE INTERNAL KNOWLEDGE NODE
    // ----------------------------------------------------
    workflow.addNode('retrieveInternal', async (state: AURENGraphState) => {
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'retrieveInternal' } });
      callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'internal_knowledge', query: state.userQuery } });

      try {
        const tool = createInternalKnowledgeTool(state.authContext, undefined, state.resolvedKnowledgeDocumentIds);
        const rawResult = await tool.invoke({ query: state.userQuery });
        const parsed = JSON.parse(rawResult);

        const docs = parsed.documents || [];
        const citations: SourceCitation[] = docs.map((d: any) => ({
          type: 'internal' as const,
          title: (d.metadata?.documentName && d.metadata?.documentName !== 'Full Document')
            ? d.metadata.documentName
            : (d.metadata?.title && d.metadata?.title !== 'Full Document')
              ? d.metadata.title
              : `Org Document (${d.metadata?.documentId?.slice(0, 8) || 'Doc'})`,
          documentId: d.metadata?.documentId,
          documentVersionId: d.metadata?.documentVersionId,
          chunkId: d.metadata?.chunkId,
          isVisual: !!d.metadata?.isVisual,
          mimeType: d.metadata?.mimeType || undefined,
          snippet: (d.content || d.pageContent || '').slice(0, 150),
        }));

        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'internal_knowledge', count: docs.length, status: 'completed' }
        });

        return {
          internalDocs: docs,
          citations,
          activeTool: { name: 'internal_knowledge', status: 'completed', resultCount: docs.length },
          internalKnowledgeStatus: 'completed'
        };
      } catch (err: any) {
        // Ollama offline, Qdrant unreachable, or any other infrastructure failure
        console.error(`[KnowledgeGraph] retrieveInternal failed — returning 0 docs for graceful fallback: ${err.message}`);
        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'internal_knowledge', count: 0, status: 'error', error: err.message }
        });
        return {
          internalDocs: [],
          citations: [],
          activeTool: { name: 'internal_knowledge', status: 'error', resultCount: 0 },
          internalKnowledgeStatus: 'error'
        };
      }
    });


    // ----------------------------------------------------
    // 2.5. RETRIEVE DOCUMENT CATALOG NODE (Metadata Inventory)
    // ----------------------------------------------------
    workflow.addNode('retrieveDocumentCatalog', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'retrieveDocumentCatalog' } });
      callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'document_catalog', query: state.userQuery } });

      try {
        const { prisma } = require('../../infrastructure/database/prisma');
        const { DocumentAccessPolicy } = require('../../domain/security/DocumentAccessPolicy');

        const orgId = state.authContext.organizationId;
        if (!orgId) {
          return {
            catalogDocs: [],
            citations: [],
            activeTool: { name: 'document_catalog', status: 'completed', resultCount: 0 }
          };
        }

        const rawDocs = await prisma.document.findMany({
          where: {
            organizationId: orgId,
            deletedAt: null
          },
          select: {
            id: true,
            title: true,
            scope: true,
            visibility: true,
            departmentId: true,
            ownerId: true,
            createdAt: true,
            allowedUsers: true,
            allowedRoles: true,
            deniedUsers: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        });

        const subjectUser = {
          id: state.authContext.userId,
          organizationId: state.authContext.organizationId,
          roles: state.authContext.roles || [],
          departments: state.authContext.departmentId ? [state.authContext.departmentId] : [],
          isSuperAdmin: state.authContext.isSuperAdmin || false
        };

        const authorizedDocs = rawDocs.filter((doc: any) => DocumentAccessPolicy.canAccess(subjectUser, doc));

        console.log(`[KnowledgeGraph] 📚 Document catalog retrieved: ${authorizedDocs.length}/${rawDocs.length} authorized documents for user ${state.authContext.userId}`);

        const citations: SourceCitation[] = authorizedDocs.map((d: any) => ({
          type: 'internal' as const,
          title: d.title || 'Document',
          documentId: d.id,
          snippet: `Document Catalog Entry: ${d.title} (Scope: ${d.scope}, Visibility: ${d.visibility})`
        }));

        const catalogDocs = authorizedDocs.map((d: any) => ({
          id: d.id,
          title: d.title,
          scope: d.scope,
          visibility: d.visibility,
          departmentId: d.departmentId,
          ownerId: d.ownerId,
          createdAt: d.createdAt
        }));

        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'document_catalog', count: authorizedDocs.length, status: 'completed' }
        });

        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'retrieveDocumentCatalog', durationMs, llmCallsCount: 0 }
        });

        return {
          catalogDocs,
          citations,
          activeTool: { name: 'document_catalog', status: 'completed', resultCount: authorizedDocs.length }
        };
      } catch (err: any) {
        console.error(`[KnowledgeGraph] ✗ retrieveDocumentCatalog node failed:`, err.message || err);
        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'document_catalog', count: 0, status: 'error', error: err.message }
        });
        return {
          catalogDocs: [],
          citations: [],
          activeTool: { name: 'document_catalog', status: 'error', resultCount: 0 }
        };
      }
    });


    // ----------------------------------------------------
    // 3. DEEP RESEARCH WEB SEARCH NODE (Local Deep Researcher)
    // ----------------------------------------------------
    workflow.addNode('webSearch', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'webSearch' } });
      callbacks?.onEvent?.({ type: 'research_started', data: { query: state.userQuery, strategy: state.researchStrategy || 'DEEP_RESEARCH' } });

      if (!state.isWebAccessEnabled) {
        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'web_search', count: 0, status: 'blocked_by_policy' }
        });
        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: { nodeName: 'webSearch', durationMs, blocked: true }
        });

        const isDynamicIntent = state.intentCategory === 'DYNAMIC_DATA';
        let finalAnswer = state.finalAnswer;
        if (isDynamicIntent) {
          finalAnswer = 'Unable to verify current live data: web search returned no results. Please try again or rephrase your query.';
        }

        return {
          activeTool: { name: 'web_search', status: 'blocked', resultCount: 0 },
          webSearchStatus: 'blocked_by_policy',
          webResults: [],
          citations: [],
          validatedEvidence: [],
          finalAnswer
        };
      }

      try {
        const { LocalResearchAgent } = require('../research/LocalResearchAgent');
        const researchAgent = new LocalResearchAgent();
        const tool = createWebSearchTool({
          isWebAccessEnabled: state.isWebAccessEnabled,
          executionMode: state.executionMode as 'FAST' | 'DEEP' | undefined
        });

        let currentQuery = state.researchBrief || state.userQuery;
        let aggregatedResults: any[] = [];
        let aggregatedCitations: SourceCitation[] = [];
        let aggregatedEvidence: any[] = [];
        let lastTelemetry: any = null;
        let lastStatus = 'completed';

        // SIMPLE_FACT strategy or FAST executionMode limits search loop to 1 iteration for speed & precision
        const MAX_RESEARCH_ITERATIONS = (state.executionMode === 'FAST' || state.researchStrategy === 'SIMPLE_FACT') ? 1 : 3;
        let iteration = 1;
        let isSufficient = false;

        while (iteration <= MAX_RESEARCH_ITERATIONS && !isSufficient) {
          const iterStart = performance.now();
          callbacks?.onEvent?.({
            type: 'research_iteration',
            data: { iteration, maxIterations: MAX_RESEARCH_ITERATIONS, currentQuery }
          });

          // 1. SearXNG Search Phase
          const searchStart = performance.now();
          callbacks?.onEvent?.({ type: 'searching_web_started', data: { query: currentQuery, iteration } });
          callbacks?.onEvent?.({ type: 'searching_web', data: { query: currentQuery, iteration } });
          callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'web_search', query: currentQuery, iteration } });

          let rawResult: string = '';
          try {
            // Timeout protection: maximum 25s per iteration search tool call
            const searchTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Web search tool execution timed out after 25000ms on iteration ${iteration}`)), 25000)
            );
            rawResult = await Promise.race([tool.invoke({ query: currentQuery }), searchTimeout]);
            callbacks?.onEvent?.({ type: 'searching_web_completed', data: { query: currentQuery, iteration } });
          } catch (err: any) {
            console.error(`[KnowledgeGraph] ✗ Search execution failed on iteration ${iteration}:`, err.message || err);
            callbacks?.onEvent?.({ type: 'searching_web_completed', data: { query: currentQuery, iteration, error: err.message } });
            callbacks?.onEvent?.({ type: 'research_failed', data: { iteration, reason: err.message || 'Search execution failed' } });
            lastStatus = 'error';
            break; // Exit research loop safely to route to synthesis/fallback
          }
          const searchDurationMs = performance.now() - searchStart;

          let parsed: any = {};
          try {
            parsed = JSON.parse(rawResult);
          } catch (err: any) {
            console.error(`[KnowledgeGraph] ✗ Failed to parse web search result JSON:`, err.message);
            parsed = { results: [], status: 'error' };
          }

          const results = parsed.results || [];
          const citations: SourceCitation[] = results.map((r: any) => ({
            type: 'web' as const,
            title: r.title || 'Web Result',
            url: r.url,
            snippet: r.snippet,
          }));

          lastTelemetry = parsed.telemetry;
          lastStatus = parsed.status || 'completed';

          // 2. Crawl4AI Crawling Phase
          callbacks?.onEvent?.({ type: 'crawling_started', data: { count: results.length, iteration } });
          callbacks?.onEvent?.({ type: 'crawling_sources', data: { count: results.length, iteration } });

          const extractedCount = parsed.validatedEvidence ? parsed.validatedEvidence.length : 0;
          callbacks?.onEvent?.({
            type: 'evidence_extracted',
            data: {
              extractedCount,
              iteration
            }
          });
          callbacks?.onEvent?.({ type: 'crawling_completed', data: { count: results.length, extractedCount, iteration } });

          // Deduplicate web results and evidence by URL
          for (const res of results) {
            if (!aggregatedResults.some(r => r.url === res.url)) {
              aggregatedResults.push(res);
            }
          }
          for (const cite of citations) {
            if (!aggregatedCitations.some(c => c.url === cite.url)) {
              aggregatedCitations.push(cite);
            }
          }
          if (parsed.validatedEvidence && Array.isArray(parsed.validatedEvidence)) {
            for (const ev of parsed.validatedEvidence) {
              if (!aggregatedEvidence.some(e => e.sourceUrl === ev.sourceUrl)) {
                aggregatedEvidence.push(ev);
              }
            }
          }

          // 3. Evidence Evaluation Phase
          const evalStart = performance.now();
          callbacks?.onEvent?.({ type: 'evaluating_evidence_started', data: { iteration, evidenceCount: aggregatedEvidence.length } });
          callbacks?.onEvent?.({ type: 'evaluating_evidence', data: { iteration, evidenceCount: aggregatedEvidence.length } });

          // Evaluate evidence sufficiency using LocalResearchAgent with timeout protection
          let evalResult: any = { isSufficient: false };
          if (state.executionMode === 'FAST') {
            evalResult = { isSufficient: true, gap: undefined };
          } else {
            try {
              evalResult = await researchAgent.evaluateSufficiency(
                state.userQuery,
                aggregatedEvidence,
                iteration,
                MAX_RESEARCH_ITERATIONS
              );
            } catch (err: any) {
              console.warn(`[KnowledgeGraph] ⚠ Evidence evaluation failed on iteration ${iteration}:`, err.message || err);
              evalResult = { isSufficient: aggregatedEvidence.length > 0 };
            }
          }
          const evalDurationMs = performance.now() - evalStart;

          callbacks?.onEvent?.({
            type: 'evaluating_evidence_completed',
            data: {
              iteration,
              isSufficient: evalResult.isSufficient,
              decision: evalResult.isSufficient ? 'SUFFICIENT' : 'RESEARCH_GAP_FOUND',
              gap: evalResult.gap,
              durationMs: evalDurationMs
            }
          });

          // Structured execution log
          console.log(`[LocalDeepResearcher] Iteration ${iteration}/${MAX_RESEARCH_ITERATIONS} Summary:`);
          console.log(`  • Query: "${currentQuery}"`);
          console.log(`  • Search & Extraction Tool Duration: ${searchDurationMs.toFixed(0)}ms`);
          console.log(`  • Evidence Evaluation LLM Duration: ${evalDurationMs.toFixed(0)}ms`);
          console.log(`  • Search Results: ${results.length} (Total Aggregated: ${aggregatedResults.length})`);
          console.log(`  • Extracted Evidence: ${parsed.validatedEvidence?.length || 0} (Total Aggregated: ${aggregatedEvidence.length})`);
          console.log(`  • Agent Decision: ${evalResult.isSufficient ? 'SUFFICIENT (stop)' : `INSUFFICIENT (${evalResult.gap || 'gap detected'})`}`);

          callbacks?.onEvent?.({
            type: 'iteration_timing',
            data: {
              iteration,
              searchToolDurationMs: searchDurationMs,
              evidenceEvaluationDurationMs: evalDurationMs,
              totalIterationDurationMs: performance.now() - iterStart
            }
          });

          if (evalResult.isSufficient) {
            isSufficient = true;
            break;
          }

          if (iteration < MAX_RESEARCH_ITERATIONS && evalResult.gap) {
            const refineStart = performance.now();
            let refinedQuery = currentQuery;
            try {
              refinedQuery = await researchAgent.generateTargetedQuery(state.userQuery, evalResult.gap);
            } catch (err: any) {
              console.warn(`[KnowledgeGraph] ⚠ Query refinement failed, reusing current query:`, err.message || err);
            }
            const refineDurationMs = performance.now() - refineStart;

            callbacks?.onEvent?.({
              type: 'search_query_generated',
              data: { gap: evalResult.gap, refinedQuery, iteration: iteration + 1, durationMs: refineDurationMs }
            });
            currentQuery = refinedQuery;
          }

          iteration++;
        }

        const finalIterationsCount = iteration > MAX_RESEARCH_ITERATIONS ? MAX_RESEARCH_ITERATIONS : iteration;

        const durationMs = performance.now() - nodeStart;
        callbacks?.onEvent?.({
          type: 'node_timing',
          data: {
            nodeName: 'webSearch',
            durationMs,
            iterationsCompleted: finalIterationsCount,
            totalSources: aggregatedResults.length,
            totalEvidence: aggregatedEvidence.length,
            isSufficient
          }
        });

        callbacks?.onEvent?.({
          type: 'research_complete',
          data: {
            iterationsCompleted: finalIterationsCount,
            totalSources: aggregatedResults.length,
            totalEvidence: aggregatedEvidence.length,
            isSufficient
          }
        });

        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'web_search', count: aggregatedResults.length, status: lastStatus, result: { results: aggregatedResults } }
        });

        const isDynamicIntent = state.intentCategory === 'DYNAMIC_DATA';
        const hasWebEvidence = aggregatedResults.length > 0;
        const hasValidatedEvidence = aggregatedEvidence.length > 0;

        let finalAnswer = state.finalAnswer;
        if (isDynamicIntent && !hasWebEvidence && !hasValidatedEvidence) {
          finalAnswer = 'Unable to verify current live data: web search returned no results. Please try again or rephrase your query.';
        }

        return {
          webResults: aggregatedResults.length > 0 ? aggregatedResults : (state.webResults || []),
          citations: aggregatedCitations.length > 0 ? aggregatedCitations : (state.citations || []),
          retrievalTelemetry: lastTelemetry ? {
            ...lastTelemetry,
            searchedSourcesCount: aggregatedResults.length,
            relevantEvidenceSourcesCount: aggregatedEvidence.length,
            relevantEvidenceSources: aggregatedEvidence
          } : undefined,
          validatedEvidence: aggregatedEvidence.length > 0 ? aggregatedEvidence : (state.validatedEvidence || []),
          webSearchStatus: lastStatus,
          researchIterations: finalIterationsCount,
          activeTool: { name: 'web_search', status: 'completed', resultCount: aggregatedResults.length },
          finalAnswer
        };
      } catch (err: any) {
        console.error(`[KnowledgeGraph] ✗ webSearch node failed entirely — returning empty results for graceful fallback:`, err.message || err);
        callbacks?.onEvent?.({
          type: 'tool_result',
          data: { name: 'web_search', count: 0, status: 'error', error: err.message }
        });
        const isDynamicIntent = state.intentCategory === 'DYNAMIC_DATA';
        let finalAnswer = state.finalAnswer;
        if (isDynamicIntent) {
          finalAnswer = 'Unable to verify current live data: web search returned no results. Please try again or rephrase your query.';
        }
        return {
          webResults: [],
          citations: [],
          validatedEvidence: [],
          webSearchStatus: 'error',
          activeTool: { name: 'web_search', status: 'error', resultCount: 0 },
          finalAnswer
        };
      }
    });

    // ----------------------------------------------------
    // 4. RETRIEVE CONVERSATION HISTORY NODE
    // ----------------------------------------------------
    workflow.addNode('retrieveHistory', async (state: AURENGraphState) => {
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'retrieveHistory' } });
      callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'conversation_history' } });

      const historyDocs = (state.messages || []).map((m: any) => ({
        role: m._getType ? m._getType() : (m.role || 'user'),
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }));

      callbacks?.onEvent?.({
        type: 'tool_result',
        data: { name: 'conversation_history', count: historyDocs.length, status: 'completed' }
      });

      return {
        historyDocs,
        activeTool: { name: 'conversation_history', status: 'completed', resultCount: historyDocs.length }
      };
    });

    // ----------------------------------------------------
    // 5. SYSTEM TOOL NODE
    // ----------------------------------------------------
    workflow.addNode('systemTool', async () => {
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'systemTool' } });
      callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'date_time' } });
      const res = await dateTimeTool.invoke({});
      callbacks?.onEvent?.({ type: 'tool_result', data: { name: 'date_time', status: 'completed' } });
      return { systemTimeInfo: res };
    });

    // ----------------------------------------------------
    // 6. MANAGE USER MEMORY NODE
    // ----------------------------------------------------
    workflow.addNode('manageMemory', async (state: AURENGraphState) => {
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'manageMemory' } });
      const intent = state.intentCategory;
      callbacks?.onEvent?.({ type: 'tool_call', data: { name: 'user_memory', intent, query: state.userQuery } });

      const tool = createUserMemoryTool(state.authContext);

      let key = '';
      let value = '';
      let action: 'save' | 'read' | 'delete' = 'read';

      if (intent === 'MEMORY_SAVE') {
        action = 'save';
        const matchPreference = state.userQuery.match(/\b(?:remember|save|note|store)(?:\s+that|\s+this:?|\s+my)?\s+(.+)/i);
        const contentToSave = matchPreference ? matchPreference[1].trim().replace(/\.$/, '') : state.userQuery;

        if (/language|prefer/i.test(contentToSave)) {
          key = 'preferred_language';
          value = contentToSave.replace(/.*(?:language is|prefer)\s*/i, '').trim() || contentToSave;
        } else if (/interview|job|career/i.test(contentToSave)) {
          key = 'career_focus';
          value = contentToSave;
        } else {
          const sanitizedKey = contentToSave.split(' ').slice(0, 3).join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
          key = sanitizedKey || 'user_preference';
          value = contentToSave;
        }
      } else if (intent === 'MEMORY_DELETE') {
        action = 'delete';
        const deleteMatch = state.userQuery.match(/\b(?:forget|delete|remove|erase|clear)(?:\s+that|\s+my|\s+this)?\s+(.+)/i);
        key = deleteMatch ? deleteMatch[1].trim().replace(/\.$/, '') : state.userQuery;
      } else {
        action = 'read';
        key = state.userQuery;
      }

      const rawResult = await tool.invoke({ action, key, value });
      const parsed = JSON.parse(rawResult);

      // Reload fresh user memories directly from PostgreSQL
      const { prisma } = require('../../infrastructure/database/prisma');
      const memories = await prisma.userMemory.findMany({
        where: { userId: state.authContext.userId, organizationId: state.authContext.organizationId },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });
      const updatedUserMemories = memories.map((m: any) => ({ key: m.key, value: m.value }));

      callbacks?.onEvent?.({
        type: 'tool_result',
        data: { name: 'user_memory', status: parsed.status, action, result: parsed, count: memories.length }
      });

      return {
        userMemories: updatedUserMemories,
        activeTool: { name: 'user_memory', status: 'completed', resultCount: memories.length }
      };
    });

    // ----------------------------------------------------
    // 7. SYNTHESIZE ANSWER NODE
    // ----------------------------------------------------
    workflow.addNode('synthesizeAnswer', async (state: AURENGraphState) => {
      const nodeStart = performance.now();
      callbacks?.onEvent?.({ type: 'node_execution', data: { nodeName: 'synthesizeAnswer' } });
      callbacks?.onEvent?.({ type: 'synthesis_started' });



      callbacks?.onEvent?.({ type: 'llm_started' });

      const isInternalRAG = state.intentCategory === 'INTERNAL_KNOWLEDGE' || state.useKnowledgeBase;
      const hasInternalDocs = Array.isArray(state.internalDocs) && state.internalDocs.length > 0;
      const hasWebResults = Array.isArray(state.webResults) && state.webResults.length > 0;

      if (isInternalRAG && !hasInternalDocs && !hasWebResults && state.intentCategory !== 'IDENTITY' && state.intentCategory !== 'DOC_CATALOG_BROWSE') {
        const refusalMessage = state.internalKnowledgeStatus === 'error'
          ? 'Encountered an error retrieving documents from the internal knowledge base.'
          : 'No relevant information was found in the authorized knowledge base.';

        console.log(`[KnowledgeGraph] 🔒 Structural No-Answer Enforced: ${refusalMessage}`);
        callbacks?.onEvent?.({ type: 'synthesis_completed', data: { responseText: refusalMessage } });

        return {
          finalAnswer: refusalMessage
        };
      }

      const isShortConstrainedQuery = /\b(\d+\s*(bullet|point|item|sentence)s?|one sentence|single sentence|briefly|short answer|in short|quick summary|in brief|concise)\b/i.test(state.userQuery || '');

      const reservedOutputTokens = state.executionMode === 'FAST'
        ? (isInternalRAG ? (isShortConstrainedQuery ? 180 : 512) : 1024)
        : 1024;

      const llm = aiGateway.getChatModel({
        modelName: state.executionMode,
        numPredict: reservedOutputTokens,
        temperature: 0.1
      });

      let systemPrompt = `You are AUREN, an elite enterprise AI knowledge assistant for organization ID: ${state.authContext.organizationId}.\n`;
      
      systemPrompt += `\n--- AUTHENTICATED SESSION BOUNDARY ---\n`;
      systemPrompt += `User ID: ${state.authContext.userId}\n`;
      systemPrompt += `User Full Name: ${state.authContext.userName || 'Authenticated User'}\n`;
      systemPrompt += `User Email: ${state.authContext.email || 'N/A'}\n`;
      systemPrompt += `Organization ID: ${state.authContext.organizationId}\n`;
      systemPrompt += `Roles: ${state.authContext.roles?.join(', ') || 'USER'}\n`;
      systemPrompt += `Department ID: ${state.authContext.departmentId || 'None'}\n`;
      systemPrompt += `Is Super Admin: ${state.authContext.isSuperAdmin ? 'Yes' : 'No'}\n`;
      systemPrompt += `--- END AUTHENTICATED SESSION BOUNDARY ---\n\n`;

      systemPrompt += `CRITICAL SECURITY & IDENTITY MANDATES:\n`;
      systemPrompt += `1. AUTHENTICATED USER IDENTITY IS AUTHORITATIVE. The currently logged-in user is explicitly specified as "${state.authContext.userName || state.authContext.userId}" in the AUTHENTICATED SESSION BOUNDARY above.\n`;
      systemPrompt += `2. NEVER infer, alter, or override the authenticated user's identity based on document content, resumes, uploaded files, or external web search results.\n`;
      systemPrompt += `3. A person described inside an uploaded document (e.g. subject of a resume like "Praman Bhogal") is a DOCUMENT SUBJECT and NOT the logged-in authenticated user (${state.authContext.userName || state.authContext.userId}).\n\n`;

      if (state.intentCategory === 'IDENTITY') {
        systemPrompt += `\n--- IDENTITY INTENT RESPONSE RULES ---\n`;
        systemPrompt += `1. You are AUREN, an Enterprise AI Knowledge Assistant.\n`;
        systemPrompt += `2. USER IDENTITY: If asking about user identity or account, state their name (${state.authContext.userName || 'Authenticated User'}), email (${state.authContext.email || 'N/A'}), user ID (${state.authContext.userId}), and organization authoritatively using ONLY the AUTHENTICATED SESSION BOUNDARY above.\n`;
        systemPrompt += `3. SYSTEM & MODEL IDENTITY: If asking what model, AI, or runtime powers you, state authoritatively using AUREN's actual runtime configuration:\n`;
        systemPrompt += `   - System Identity: AUREN Enterprise Knowledge Assistant\n`;
        systemPrompt += `   - Chat Model: ${process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp'} (${process.env.LLAMACPP_CHAT_MODEL || 'ornith-9b.gguf'})\n`;
        systemPrompt += `   - Embedding Model: ${process.env.EMBEDDING_PROVIDER || 'llamacpp'} (${process.env.LLAMACPP_EMBEDDING_MODEL || 'nomic-embed-text.gguf'})\n`;
        systemPrompt += `   - Vision Model: ${process.env.VISION_PROVIDER || 'llamacpp'} (${process.env.LLAMACPP_VISION_MODEL || 'qwen2.5-vl-7b-instruct-q4_k_m.gguf'})\n`;
        systemPrompt += `4. You MUST NOT state that you are ChatGPT, OpenAI, or a raw unconfigured model without identifying as AUREN.\n`;
        systemPrompt += `5. DO NOT mention document retrieval, RAG, or external web search.\n\n`;
      }

      if (state.intentCategory === 'DOC_CATALOG_BROWSE') {
        systemPrompt += `\n--- DOCUMENT CATALOG BROWSE RESPONSE RULES ---\n`;
        systemPrompt += `1. The user is requesting a listing, inventory, overview, or catalogue of accessible organization documents.\n`;
        systemPrompt += `2. You MUST present a clear, well-structured inventory of the documents listed in the AUTHORIZED DOCUMENT CATALOG below.\n`;
        systemPrompt += `3. Include the Document Title/Filename, Scope (PERSONAL vs ORGANIZATION), and Visibility/Department where available.\n`;
        systemPrompt += `4. If 0 documents are present in the catalog, state clearly that no authorized documents were found in the organization's repository.\n`;
        systemPrompt += `5. DO NOT invent or speculate about document contents not listed in the catalog.\n\n`;
      }
      
      if (state.fastRoutingTarget === 'none' && state.intentCategory !== 'IDENTITY' && state.intentCategory !== 'DOC_CATALOG_BROWSE') {
        systemPrompt += `\n--- STRICT DIRECT ANSWER RULE ---\n`;
        systemPrompt += `1. You are answering this query directly from your pre-trained model knowledge without performing any search or RAG.\n`;
        systemPrompt += `2. DO NOT mention web search, search results, search tools, RAG, internal documents, or unavailability of search tools. Answer the user query directly and naturally as if you are a standard chat assistant.\n\n`;
      }
      
      if (state.intentCategory !== 'CASUAL') {
        systemPrompt += `\n--- AMBIGUITY & MULTI-INTERPRETATION ANSWER RULES ---\n`;
        systemPrompt += `1. CLARIFICATION STRICTLY FORBIDDEN: The scope decision layer has already determined clarification is NOT required. You are FORBIDDEN from asking the user to specify which entity they meant. Never say "Which one did you mean?", "Could you clarify?", "Which [entity] are you referring to?", "Please specify", or any similar phrase — not even at the end of your answer.\n`;
        systemPrompt += `2. MULTI-INTERPRETATION ANSWERS: If the query is ambiguous across 2–3 prominent entities, you MUST answer for ALL of them in a single structured response. Use this format:\n`;
        systemPrompt += `   a) Open with one sentence noting the name refers to N distinct entities.\n`;
        systemPrompt += `   b) Use a bold heading for each interpretation followed immediately by its answer.\n`;
        systemPrompt += `   c) EXAMPLE — for "What is the capital of Congo?":\n`;
        systemPrompt += `      "Congo refers to two distinct countries:\n\n**Republic of the Congo** — The capital is Brazzaville.\n\n**Democratic Republic of the Congo (DRC)** — The capital is Kinshasa."\n`;
        systemPrompt += `3. Your answer is complete when all interpretations are covered. Do NOT append a follow-up clarification question.\n\n`;

        systemPrompt += `\n--- RESPONSE LENGTH & DETAIL DIRECTIVES ---\n`;
        systemPrompt += `Tailor the length and structure of your response directly to the nature of the user query and available evidence:\n`;
        systemPrompt += `- Simple factual question: Provide a concise, direct answer.\n`;
        systemPrompt += `- List or Inventory request (e.g. "List all...", "Show me everything...", document catalog): Provide a complete, structured, and useful list of all matching items from available evidence.\n`;
        systemPrompt += `- Explanation request: Provide a clear, thorough, and detailed explanation.\n`;
        systemPrompt += `- Comparison request: Provide a clear, structured comparison covering all compared entities.\n`;
        systemPrompt += `- Multi-part question: Address and answer every sub-question or component explicitly.\n`;
        systemPrompt += `- Summary request: Provide a comprehensive summary covering key points within available evidence.\n`;
        systemPrompt += `- Never intentionally make an answer shorter just because brevity is preferred.\n`;
        systemPrompt += `- Never invent or speculate information to make an answer longer.\n`;
        systemPrompt += `- If evidence is insufficient, clearly state what is supported and what is unavailable.\n\n`;
      }

      systemPrompt += `CRITICAL GROUNDING & SYNTHESIS RULES:\n`;

      // ── KB MODE OVERRIDE: when useKnowledgeBase=true AND internal docs exist, always use KB instructions ──
      const hasInternalDocsForPrompt = state.internalDocs && state.internalDocs.length > 0;

      if (state.useKnowledgeBase && hasInternalDocsForPrompt) {
        // KB mode is on and we found relevant documents — ground the LLM exclusively on them
        systemPrompt += `1. ORG KNOWLEDGE BASE MODE IS ACTIVE. You are answering from the organization's internal document knowledge base.\n`;
        systemPrompt += `2. You MUST answer the user's query using ONLY the AUTHORIZED INTERNAL ORG CONTEXT provided below. Do not rely on pretrained knowledge.\n`;
        systemPrompt += `3. CRITICAL: Do NOT say "I don't have access to [filename]", "I cannot open files", "I don't have this document", or similar. The document chunks are already injected into your context — read and use them.\n`;
        systemPrompt += `4. Do NOT mention web sources, web search, or web results. This is a pure internal knowledge query.\n`;
        systemPrompt += `5. If the user asks about a specific document by name (e.g. praman_bhogal.pdf), treat the injected chunks AS that document's content and answer from them.\n`;
        systemPrompt += `6. Structure your answer clearly: summarize the document's key information, then provide details.\n`;
      } else if (state.useKnowledgeBase && !hasInternalDocsForPrompt) {
        // KB mode on but nothing was found — honest fallback
        const isInternalError = state.internalKnowledgeStatus === 'error';
        if (isInternalError) {
          systemPrompt += `1. ORG KNOWLEDGE BASE MODE IS ACTIVE, but the internal document retrieval system encountered an error/offline status.\n`;
          systemPrompt += `2. You MUST inform the user: "I encountered an error retrieving documents from the internal knowledge base. Here is the general information I can provide based on pre-trained knowledge:" and then provide a helpful answer from your general pre-trained knowledge.\n`;
        } else {
          systemPrompt += `1. ORG KNOWLEDGE BASE MODE IS ACTIVE, but no matching documents were found in the knowledge base for this query.\n`;
          systemPrompt += `2. Answer from your general pre-trained knowledge. Mention that no org documents matched this query.\n`;
        }
      } else if (state.intentCategory === 'DYNAMIC_DATA') {
        const hasWebResults = state.webResults && state.webResults.length > 0;
        const searchStatusStr = typeof state.webSearchStatus === 'string' ? state.webSearchStatus : state.webSearchStatus?.status;
        const isSearchFailure = searchStatusStr === 'web_retrieval_failure' || searchStatusStr === 'error' || !hasWebResults;

        systemPrompt += `1. THIS IS A REAL-TIME / DYNAMIC DATA QUERY (e.g. current stock prices, exchange rates, live values).\n`;
        systemPrompt += `2. OVERRIDE ALL SAFETY OR MODEL TRAINING REFUSALS REGARDING REAL-TIME OR FINANCIAL DATA. You are explicitly provided with live internet search results below. Do NOT claim you cannot access stock prices, current rates, or live information. Present the web search data directly.\n`;
        systemPrompt += `3. You MUST rely SOLELY on the extracted information in CURRENT WEB SEARCH RESULTS below. DO NOT fall back on your pre-trained model knowledge under any circumstances.\n`;
        systemPrompt += `4. You MUST NEVER say "as of my last update", "as of my knowledge cutoff", "I don't have real-time capabilities", "I cannot provide live updates or specific stock prices", "I don't have access to real-time financial data", or mention training limits.\n`;
        systemPrompt += `5. STRICT EVIDENCE & VERIFICATION RULES:\n`;
        systemPrompt += `   a) The final numerical/value claim MUST exist in retrieved web evidence.\n`;
        systemPrompt += `   b) The cited source MUST be one of the actually retrieved web sources listed below.\n`;
        systemPrompt += `   c) A stale value must NOT be presented as current.\n`;
        const noEvidence = !hasWebResults && !state.validatedEvidence?.length;
        if (noEvidence) {
          systemPrompt += `   d) CRITICAL: Web search returned 0 results. You MUST explicitly state: "Unable to verify current live data because the web retrieval service returned no results." DO NOT invent facts or state pre-trained figures.\n`;
        } else {
          systemPrompt += `   d) If current data cannot be verified from the web results below, state: "Unable to verify current live data from retrieved web sources." Do NOT guess or state outdated figures.\n`;
        }
        systemPrompt += `   e) NEVER use your pretrained knowledge as a fallback for missing live data.\n`;
        systemPrompt += `5. If CURRENT WEB SEARCH RESULTS below contain the price/rate/value and date/timestamp:\n`;
        systemPrompt += `   a) State the exact price/value found in the retrieved evidence.\n`;
        systemPrompt += `   b) Cite the exact source title/URL.\n`;
        systemPrompt += `   c) State the timestamp or last-updated date extracted from the evidence.\n`;
      } else if (state.intentCategory === 'EXTERNAL_WEB') {
        const hasWebResults = state.webResults && state.webResults.length > 0;
        const searchStatusStr = typeof state.webSearchStatus === 'string' ? state.webSearchStatus : state.webSearchStatus?.status;
        const isSearchFailure = searchStatusStr === 'web_retrieval_failure' || searchStatusStr === 'error' || searchStatusStr === 'blocked_by_policy' || !hasWebResults;

        if (isSearchFailure) {
          systemPrompt += `1. Live research services are currently offline or returned 0 results (status: ${searchStatusStr || 'none'}).\n`;
          systemPrompt += `2. You MUST gracefully fall back to your general pre-trained knowledge to answer the user's query as best as you can.\n`;
          systemPrompt += `3. Avoid saying you cannot access real-time tools or that search is unavailable. Simply provide a helpful answer using your pre-trained knowledge.\n`;
        } else {
          systemPrompt += `1. You MUST synthesize your response ENTIRELY from the provided CURRENT WEB SEARCH RESULTS.\n`;
          systemPrompt += `2. You MUST NOT use your pre-trained knowledge cutoff or obsolete training data when CURRENT WEB SEARCH RESULTS are provided.\n`;
          systemPrompt += `3. If CURRENT WEB SEARCH RESULTS status is 'blocked_by_policy' or 0 results were found, explicitly state that web search yielded no results under current organizational policy instead of speculating.\n`;
        }
      } else if (state.intentCategory === 'INTERNAL_KNOWLEDGE') {
        const isInternalError = state.internalKnowledgeStatus === 'error';
        if (isInternalError || !hasInternalDocsForPrompt) {
          systemPrompt += `1. Authorized internal document context is unavailable or returned 0 results.\n`;
          systemPrompt += `2. You MUST state: "No relevant information was found in the authorized knowledge base." Do NOT use pre-trained knowledge or web search.\n`;
        } else {
          systemPrompt += `1. You MUST answer the user query ONLY using the AUTHORIZED INTERNAL CONTEXT document chunks provided below.\n`;
          systemPrompt += `2. ABSOLUTE PROHIBITION: Do NOT use your pre-trained general knowledge or web search to supplement, fill gaps, or infer anything not explicitly present in the retrieved document chunks. Pre-trained knowledge is entirely forbidden.\n`;
          systemPrompt += `3. Do NOT say you lack access to files — the document chunks are already injected into your context below. Read them directly.\n`;
          systemPrompt += `4. If the retrieved document chunks do NOT contain information that answers the user's question, you MUST explicitly state: "No relevant information was found in the authorized knowledge base." Do NOT invent, infer, or approximate an answer, and do NOT mention general knowledge.\n`;
          systemPrompt += `5. When the chunks DO contain relevant information, quote or closely paraphrase the specific chunk content.\n`;
        }
      } else if (state.intentCategory === 'MIXED') {
        const hasWebResults = state.webResults && state.webResults.length > 0;
        const searchStatusStr = typeof state.webSearchStatus === 'string' ? state.webSearchStatus : state.webSearchStatus?.status;
        const isSearchFailure = searchStatusStr === 'web_retrieval_failure' || searchStatusStr === 'error' || searchStatusStr === 'blocked_by_policy' || !hasWebResults;
        const isInternalError = state.internalKnowledgeStatus === 'error';

        if (isSearchFailure && (isInternalError || !hasInternalDocsForPrompt)) {
          systemPrompt += `1. Live search and internal document retrieval are currently unavailable.\n`;
          systemPrompt += `2. You MUST gracefully fall back to your general pre-trained knowledge to answer the query as best as you can.\n`;
        } else if (isSearchFailure) {
          systemPrompt += `1. Live search is currently unavailable, but authorized internal context is provided.\n`;
          systemPrompt += `2. You MUST combine the provided AUTHORIZED INTERNAL CONTEXT and your pre-trained knowledge to answer the query.\n`;
        } else if (isInternalError || !hasInternalDocsForPrompt) {
          systemPrompt += `1. Internal document context is currently unavailable, but live search results are provided.\n`;
          systemPrompt += `2. You MUST combine the provided CURRENT WEB SEARCH RESULTS and your pre-trained knowledge to answer the query.\n`;
        } else {
          systemPrompt += `1. You MUST combine the provided AUTHORIZED INTERNAL CONTEXT and CURRENT WEB SEARCH RESULTS to provide a comprehensive answer.\n`;
        }
      } else if (state.intentCategory === 'MEMORY_SAVE') {
        systemPrompt += `1. You have explicitly persisted a long-term user memory into the PostgreSQL database.\n`;
        systemPrompt += `2. Confirm to the user that their preference/fact was successfully stored in their long-term memory.\n`;
      } else if (state.intentCategory === 'MEMORY_DELETE') {
        systemPrompt += `1. You have explicitly deleted the requested user memory from the PostgreSQL database.\n`;
        systemPrompt += `2. Confirm to the user that their memory record was removed.\n`;
      } else if (state.intentCategory === 'MEMORY_READ') {
        systemPrompt += `1. Answer the user's preference or identity question directly using the listed USER LONG-TERM MEMORY.\n`;
      } else if (state.intentCategory === 'CONVERSATION_HISTORY') {
        systemPrompt += `1. Answer the user's question regarding past messages using the provided message thread history.\n`;
      } else if (state.intentCategory === 'CASUAL') {
        systemPrompt += `1. You are AUREN, a friendly, concise, natural AI assistant.\n`;
        systemPrompt += `2. CASUAL CONVERSATION & GREETING RULES:\n`;
        systemPrompt += `   - Respond as a warm, human-like, helpful chat partner.\n`;
        systemPrompt += `   - For greetings (e.g. "hi", "hello", "hey", "yoyoy", "hello man", "what's up"), respond warmly and naturally in 1–2 short sentences (e.g. "Hello! How can I help you today?").\n`;
        systemPrompt += `   - For casual statements, anecdotes, or chat (e.g. "Helios had three brothers...", "I love coding"), acknowledge the user's input warmly and conversationally in 1–2 short sentences.\n`;
        systemPrompt += `   - ABSOLUTELY FORBIDDEN: Do NOT provide dictionary definitions, term breakdowns, etymologies, song track listings, cultural analysis, or bulleted entity breakdowns for greetings or casual statements unless the user explicitly asked for a definition (e.g., "What is the definition of X?").\n`;
        systemPrompt += `   - ABSOLUTELY FORBIDDEN: Never output boilerplate disclaimers such as "Without more context, it's difficult to determine...", "If you have a particular product or brand in mind...", "The term X is used in...", or "If you have a specific question, please provide more details".\n`;
      }

      if (state.systemTimeInfo) {
        systemPrompt += `\nCURRENT SYSTEM TIME INFO: ${state.systemTimeInfo}\n`;
      } else {
        systemPrompt += `\nCURRENT SYSTEM TIME INFO: ${new Date().toISOString()} (UTC)\n`;
      }

      if (state.userMemories && state.userMemories.length > 0) {
        systemPrompt += `\n--- USER LONG-TERM MEMORY & PREFERENCES ---\n`;
        state.userMemories.slice(-5).forEach((mem) => {
          systemPrompt += `- ${mem.key}: ${mem.value}\n`;
        });
      }

      if (state.historyDocs && state.historyDocs.length > 0) {
        systemPrompt += `\n--- RECENT CONVERSATION HISTORY ---\n`;
        state.historyDocs.slice(-4).forEach((msg, i) => {
          systemPrompt += `[Message ${i + 1} (${msg.role})]: ${msg.content}\n`;
        });
      }

      let nonDocExtras = '';
      if (state.retrievalTelemetry) {
        const t = state.retrievalTelemetry;
        nonDocExtras += `\n--- RETRIEVAL TELEMETRY ---\n`;
        nonDocExtras += `Searched: ${t.searchedSourcesCount} sources | Crawled: ${t.crawledSourcesCount} pages | Extracted: ${t.successfullyExtractedSourcesCount} pages | Relevant Evidence: ${t.relevantEvidenceSourcesCount} sources\n`;
      }

      if (state.validatedEvidence && state.validatedEvidence.length > 0) {
        nonDocExtras += `\n--- VALIDATED STRUCTURED EVIDENCE ---\n`;
        nonDocExtras += `CRITICAL INSTRUCTIONS FOR EVIDENCE BELOW:\n`;
        nonDocExtras += `- Any value in an "EXACT DATA" block MUST be reproduced character-for-character in your answer.\n`;
        nonDocExtras += `- Do NOT round, re-derive, re-calculate, or reformat numbers from EXACT DATA blocks.\n`;
        nonDocExtras += `- Do NOT mix values from different sources.\n\n`;
        state.validatedEvidence.slice(0, 4).forEach((ev: any, i: number) => {
          nonDocExtras += `[Evidence ${i + 1} (${ev.sourceType.toUpperCase()} - ${ev.confidence} confidence)]\n`;
          nonDocExtras += `Source: ${ev.sourceTitle} (${ev.sourceUrl})\n`;
          if (ev.extractedNumeric !== undefined && (ev.confidence === 'high' || ev.confidence === 'medium')) {
            const currency = ev.extractedCurrency ? `${ev.extractedCurrency} ` : '';
            nonDocExtras += `EXACT DATA: ${currency}${ev.extractedNumeric} — REPRODUCE THIS EXACT NUMBER, do not alter it.\n`;
            nonDocExtras += `Raw Extracted Text: "${ev.extractedValue}" (verbatim from source)\n`;
          } else if (ev.extractedValue) {
            nonDocExtras += `Extracted Context (Secondary / Unverified Metric): ${ev.extractedValue}\n`;
          }
          if (ev.extractedDate) nonDocExtras += `Extracted Date: ${ev.extractedDate}\n`;
          if (ev.extractedTimestamp) nonDocExtras += `Extracted Timestamp: ${ev.extractedTimestamp}\n`;
          nonDocExtras += `Supporting Text: "${ev.evidenceText?.slice(0, 150) || ''}"\n\n`;
        });
      } else if (state.intentCategory === 'DYNAMIC_DATA') {
        nonDocExtras += `\n--- VALIDATED STRUCTURED EVIDENCE ---\n`;
        nonDocExtras += `NONE: No direct supporting evidence matching the dynamic data claim was extracted from web sources.\n\n`;
      }

      // Always include raw web results alongside validatedEvidence to guarantee grounding fallback
      if (state.webResults && state.webResults.length > 0) {
        nonDocExtras += `\n--- CURRENT WEB SEARCH RESULTS ---\n`;
        state.webResults.slice(0, 4).forEach((web, i) => {
          const contentSnippet = web.extractedContent 
            ? web.extractedContent.slice(0, 300).trim()
            : web.snippet || '';
          nonDocExtras += `[Source ${i + 1}: ${web.title || 'Web Result'}]\nURL: ${web.url}\n`;
          if (web.timestamp) nonDocExtras += `Published: ${web.timestamp}\n`;
          nonDocExtras += `Snippet: ${contentSnippet}\n\n`;
        });
      }

      let packedChunksCount = 0;
      let droppedChunksCount = 0;

      if (state.intentCategory !== 'IDENTITY' && state.internalDocs && state.internalDocs.length > 0) {
        // Fix 1: Calculate total prompt overhead accounting for base instructions, user query, history, memories, AND web/telemetry extras
        const promptOverheadTokens = ContextPacker.estimateTokens(systemPrompt + nonDocExtras + state.userQuery);

        // Fix 2: Single source of truth for model context window (accounting for llama-server --parallel 2 slot allocation)
        const modelConfig = aiGateway.getModelConfig({ modelName: state.executionMode });
        const parallelSlots = Number(process.env.LLAMACPP_PARALLEL_SLOTS) || 2;
        const totalServerCtx = modelConfig.numCtx;
        const slotContextWindow = Math.floor(totalServerCtx / parallelSlots);

        const availableBudgetTokens = ContextPacker.calculateAvailableBudget({
          modelContextWindow: slotContextWindow,
          reservedOutputTokens,
          safetyMarginTokens: 100,
          systemPromptOverhead: promptOverheadTokens
        });

        const packingResult = ContextPacker.packChunks(state.internalDocs, { availableBudgetTokens });
        packedChunksCount = packingResult.packedCount;
        droppedChunksCount = packingResult.droppedCount;

        callbacks?.onEvent?.({
          type: 'context_packed',
          data: {
            packedCount: packingResult.packedCount,
            droppedCount: packingResult.droppedCount,
            totalTokensUsed: packingResult.totalTokensUsed,
            availableBudgetTokens: packingResult.availableBudgetTokens,
            totalCandidateChunks: state.internalDocs.length
          }
        });

        if (packingResult.packedCount > 0) {
          systemPrompt += `\n--- AUTHORIZED INTERNAL ORG CONTEXT ---\n`;
          systemPrompt += `The following ${packingResult.packedCount} chunk(s) (packed within a ${availableBudgetTokens} token context budget; ${packingResult.droppedCount} chunk(s) dropped) were retrieved from your organization's document knowledge base. Answer using ONLY this content.\n\n`;
          systemPrompt += packingResult.formattedContext;
        }
      }

      if ((state.intentCategory === 'INTERNAL_KNOWLEDGE' || state.useKnowledgeBase) && state.intentCategory !== 'MIXED' && packedChunksCount === 0 && (state.internalDocs?.length || 0) > 0) {
        const noInfoMsg = "I couldn't find relevant information in the authorized organization knowledge.";
        callbacks?.onEvent?.({ type: 'token', data: noInfoMsg });
        callbacks?.onEvent?.({ type: 'sources', data: state.citations });
        callbacks?.onEvent?.({ type: 'synthesis_completed', data: { answerLength: noInfoMsg.length } });
        callbacks?.onEvent?.({ type: 'completed' });
        return { finalAnswer: noInfoMsg };
      }

      if (state.catalogDocs && state.catalogDocs.length > 0) {
        systemPrompt += `\n--- AUTHORIZED DOCUMENT CATALOG ---\n`;
        systemPrompt += `The user has authorization to view the following ${state.catalogDocs.length} document(s) in this organization:\n\n`;
        state.catalogDocs.forEach((doc: any, i: number) => {
          systemPrompt += `${i + 1}. **${doc.title || doc.filename}** (Scope: ${doc.scope || 'ORGANIZATION'}, Visibility: ${doc.visibility || 'N/A'}, Department: ${doc.departmentId || 'None'})\n`;
        });
        systemPrompt += `\n`;
      } else if (state.intentCategory === 'DOC_CATALOG_BROWSE') {
        systemPrompt += `\n--- AUTHORIZED DOCUMENT CATALOG ---\n`;
        systemPrompt += `No authorized documents were found in the organization repository for this user.\n\n`;
      }

      systemPrompt += nonDocExtras;

      callbacks?.onEvent?.({
        type: 'context_passed_to_llm',
        data: {
          internalDocsCount: state.internalDocs?.length || 0,
          catalogDocsCount: state.catalogDocs?.length || 0,
          packedChunksCount,
          droppedChunksCount,
          webResultsCount: state.webResults?.length || 0,
          userMemoriesCount: state.userMemories?.length || 0,
          historyDocsCount: state.historyDocs?.length || 0,
          includesInternalContext: systemPrompt.includes('--- AUTHORIZED INTERNAL ORG CONTEXT ---'),
          includesCatalog: systemPrompt.includes('--- AUTHORIZED DOCUMENT CATALOG ---'),
          includesWebResults: systemPrompt.includes('--- CURRENT WEB SEARCH RESULTS ---'),
          includesUserMemory: systemPrompt.includes('--- USER LONG-TERM MEMORY & PREFERENCES ---'),
          includesHistory: systemPrompt.includes('--- RECENT CONVERSATION HISTORY ---'),
          systemPromptLength: systemPrompt.length
        }
      });

      // Strip conversation history when the synthesis is grounded in retrieved evidence:
      // - Dynamic/web intents: history contaminates with stale pretrained knowledge from prior turns.
      // - RAG/INTERNAL_KNOWLEDGE with docs: history contaminates with prior generic answers (e.g. JS closures)
      //   and causes the LLM to answer from general knowledge instead of the injected document chunks.
      const isDynamicSynthesis =
        state.intentCategory === 'DYNAMIC_DATA' || state.intentCategory === 'EXTERNAL_WEB';
      const isRAGSynthesis =
        state.intentCategory === 'INTERNAL_KNOWLEDGE' && hasInternalDocsForPrompt;
      const isIdentitySynthesis =
        state.intentCategory === 'IDENTITY';
      const hasLiveEvidence =
        (state.validatedEvidence && state.validatedEvidence.length > 0) ||
        (state.webResults && state.webResults.length > 0);

      const messagesForLLM = ((isDynamicSynthesis && hasLiveEvidence) || isRAGSynthesis || isIdentitySynthesis)
        ? []   // No history — answer ONLY from injected evidence/authoritative prompt, no contamination from prior turns
        : state.messages;

      const llmStreamStart = performance.now();
      let ttftMs: number | null = null;
      let tokenCount = 0;

      const stream = await llm.stream([
        new SystemMessage(systemPrompt),
        ...messagesForLLM,
        new HumanMessage(state.userQuery),
      ]);

      let fullText = '';
      for await (const chunk of stream) {
        if (ttftMs === null) {
          ttftMs = performance.now() - llmStreamStart;
        }
        tokenCount++;
        const token = typeof chunk.content === 'string' ? chunk.content : String(chunk.content || '');
        fullText += token;
        callbacks?.onEvent?.({ type: 'token', data: token });
      }
      const streamDurationMs = performance.now() - llmStreamStart;
      const synthDurationMs = performance.now() - nodeStart;

      callbacks?.onEvent?.({
        type: 'node_timing',
        data: {
          nodeName: 'synthesizeAnswer',
          durationMs: synthDurationMs,
          llmDurationMs: streamDurationMs,
          ttftMs,
          tokenCount,
          tokensPerSecond: tokenCount / (streamDurationMs / 1000),
          llmCallsCount: 1
        }
      });

      callbacks?.onEvent?.({ type: 'sources', data: state.citations });
      callbacks?.onEvent?.({ type: 'synthesis_completed', data: { answerLength: fullText.length } });
      callbacks?.onEvent?.({ type: 'completed' });

      return { finalAnswer: fullText };
    });



    // ----------------------------------------------------
    // GRAPH EDGES & CONDITIONAL ROUTING
    // ----------------------------------------------------
    (workflow as any).addEdge(START, 'contextualizeQuery');
    (workflow as any).addEdge('contextualizeQuery', 'classifyIntent');
    (workflow as any).addEdge('classifyIntent', 'routeQuery');

    (workflow as any).addConditionalEdges('routeQuery', (state: AURENGraphState) => {
      // Always route memory/history/utility actions to their respective nodes
      switch (state.intentCategory) {
        case 'IDENTITY':
          return 'synthesizeAnswer';
        case 'DOC_CATALOG_BROWSE':
          return 'retrieveDocumentCatalog';
        case 'MEMORY_SAVE':
        case 'MEMORY_READ':
        case 'MEMORY_DELETE':
          return 'manageMemory';
        case 'CONVERSATION_HISTORY':
          return 'retrieveHistory';
        case 'SYSTEM_UTILITY':
          return 'systemTool';
      }

      // KB mode: always go straight to RAG regardless of execution mode or intent
      if (state.useKnowledgeBase) {
        console.log(`[KnowledgeGraph] 📚 KB mode active — routing directly to retrieveInternal (executionMode=${state.executionMode})`);
        return 'retrieveInternal';
      }

      // If in FAST execution mode, respect the classified search necessity (fastRoutingTarget)
      if (state.executionMode === 'FAST') {
        if (state.fastRoutingTarget === 'none') {
          console.log(`[KnowledgeGraph] 🧭 FAST mode: routing query directly to synthesizeAnswer (target=none)`);
          return 'synthesizeAnswer';
        }
        if (state.fastRoutingTarget === 'web') {
          console.log(`[KnowledgeGraph] 🧭 FAST mode: routing query to webSearch (target=web)`);
          return 'webSearch';
        }
        if (state.fastRoutingTarget === 'rag') {
          console.log(`[KnowledgeGraph] 🧭 FAST mode: routing query to retrieveInternal (target=rag)`);
          return 'retrieveInternal';
        }
      }

      // Default/Fallback behavior (DEEP mode or fallback for FAST mode if target not set)
      switch (state.intentCategory) {
        case 'EXTERNAL_WEB':
        case 'DYNAMIC_DATA':
        case 'MIXED':
        case 'INTERNAL_KNOWLEDGE':
          // FAST mode fallback
          if (state.executionMode === 'FAST') {
            if (state.intentCategory === 'INTERNAL_KNOWLEDGE' || state.intentCategory === 'MIXED') {
              return 'retrieveInternal';
            }
            return 'webSearch';
          }
          // DEEP mode: These all go through clarifyWithUser first
          return 'clarifyWithUser';
        case 'CASUAL':
        default: {
          // Skip clarifyWithUser only for trivially short greetings/responses.
          const q = state.userQuery?.trim() ?? '';
          const isTrivialGreeting = q.length <= 12 || /^(hi|hello|hey|yo|thanks|thank\s+you|how are you|good\s+morning|good\s+night|ok|okay|sure|yes|no|bye|goodbye)$/i.test(q);
          return (isTrivialGreeting || state.executionMode === 'FAST') ? 'synthesizeAnswer' : 'clarifyWithUser';
        }
      }
    });

    (workflow as any).addConditionalEdges('clarifyWithUser', (state: AURENGraphState) => {
      if (state.isAmbiguous) {
        return END;  // clarification_required event emitted; SSE stream closes in ChatController
      }
      // If clarification is NOT needed, go to writeResearchBrief
      return 'writeResearchBrief';
    });

    (workflow as any).addConditionalEdges('writeResearchBrief', (state: AURENGraphState) => {
      // KB mode overrides even DEEP research path
      if (state.useKnowledgeBase) {
        console.log(`[KnowledgeGraph] 📚 KB mode active in writeResearchBrief — routing to retrieveInternal`);
        return 'retrieveInternal';
      }
      switch (state.intentCategory) {
        case 'INTERNAL_KNOWLEDGE':
          return 'retrieveInternal';
        case 'MIXED':
          return 'retrieveInternal';   // MIXED: retrieve internal first, then webSearch
        default:
          return 'webSearch';          // EXTERNAL_WEB, DYNAMIC_DATA, general research
      }
    });

    (workflow as any).addConditionalEdges('retrieveInternal', (state: AURENGraphState) => {
      const hasInternalDocs = state.internalDocs && state.internalDocs.length > 0;

      // Knowledge Base mode: if RAG returned results, synthesize. If empty, try web as fallback.
      if (state.useKnowledgeBase) {
        if (hasInternalDocs) {
          console.log(`[KnowledgeGraph] 📚 KB mode: found ${state.internalDocs.length} doc(s), routing to synthesizeAnswer`);
          return 'synthesizeAnswer';
        } else {
          console.log(`[KnowledgeGraph] 📚 KB mode: no relevant docs found, falling back to webSearch`);
          return 'webSearch';
        }
      }

      if (state.intentCategory === 'MIXED') {
        return 'webSearch';
      }
      return 'synthesizeAnswer';
    });

    // webSearch is conditional: zero evidence for dynamic intents blocks synthesis
    (workflow as any).addConditionalEdges('webSearch', (state: AURENGraphState) => {
      const isDynamicIntent = state.intentCategory === 'DYNAMIC_DATA';
      const hasWebEvidence = state.webResults && state.webResults.length > 0;
      const hasValidatedEvidence = state.validatedEvidence && state.validatedEvidence.length > 0;

      if (isDynamicIntent && !hasWebEvidence && !hasValidatedEvidence) {
        // Emit terminal event — ChatController will close the SSE stream on retrieval_failure
        callbacks?.onEvent?.({
          type: 'retrieval_failure',
          data: {
            message: 'Unable to verify current live data: web search returned no results. Please try again or rephrase your query.',
            intent: state.intentCategory
          }
        });
        return END;
      }
      return 'synthesizeAnswer';
    });


    (workflow as any).addEdge('retrieveDocumentCatalog', 'synthesizeAnswer');
    (workflow as any).addEdge('manageMemory', 'synthesizeAnswer');
    (workflow as any).addEdge('retrieveHistory', 'synthesizeAnswer');
    (workflow as any).addEdge('systemTool', 'synthesizeAnswer');
    (workflow as any).addEdge('synthesizeAnswer', END);


    return workflow.compile();
  }
}
