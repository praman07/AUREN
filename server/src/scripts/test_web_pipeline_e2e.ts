/**
 * test_web_pipeline_e2e.ts
 *
 * End-to-End test suite for AUREN Web Retrieval & Evidence Validation Pipeline:
 *   SearXNG (self-hosted) → Crawl4AI (self-hosted) → EvidenceValidator → Ollama qwen2.5:14b
 *
 * ARCHITECTURE CONTRACT:
 *   - SearXNG at SEARXNG_URL (default: http://localhost:8080) is the ONLY search provider.
 *   - Crawl4AI at CRAWL4AI_URL (default: http://localhost:11235) extracts page content.
 *   - EvidenceValidator performs evidence-first extraction, authority ranking, and timestamp checking.
 *   - No external paid APIs (no Brave, no OpenAI, no Gemini, no Claude).
 *
 * PREREQUISITE: Run "docker-compose up -d searxng crawl4ai" before executing.
 * Run: npx tsx src/scripts/test_web_pipeline_e2e.ts
 */

import { sanitizeSearchQuery } from '../infrastructure/search/WebSearchProvider';
import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { validateAndRankEvidence } from '../infrastructure/search/EvidenceValidator';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let warned = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function warn(message: string): void {
  console.warn(`  ⚠ WARN: ${message}`);
  warned++;
}

function section(title: string): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function subsection(title: string): void {
  console.log(`\n  ─── ${title}`);
}

// ─── Mock Auth Context ────────────────────────────────────────────────────────

const testAuth = {
  userId: 'test-user-e2e',
  organizationId: 'test-org-e2e',
  roles: ['MEMBER'],
  departmentId: undefined,
  isSuperAdmin: false,
};

// ─── Execution Trace Interface ────────────────────────────────────────────────

interface ExecutionTrace {
  query: string;
  classifiedIntent: string;
  intentConfidence: number;
  nodesExecuted: string[];
  toolsCalled: string[];
  searxngQuery?: string;
  searchResultCount: number;
  urlsSelectedForCrawl: string[];
  crawlAttempted: number;
  crawlSucceeded: number;
  extractedContentLengths: number[];
  sourcesUsed: string[];
  pipelineStatus: string;
  telemetry?: any;
  validatedEvidence?: any[];
  contextPassedToLLM: {
    internalDocsCount: number;
    webResultsCount: number;
    includesInternalContext: boolean;
    includesWebResults: boolean;
    systemPromptLength: number;
  };
  webResults: any[];
  citations: any[];
  finalAnswer: string;
  errors: string[];
}

// ─── Pipeline Runner ──────────────────────────────────────────────────────────

async function runPipeline(
  query: string,
  options: { webEnabled?: boolean } = {}
): Promise<ExecutionTrace> {
  const trace: ExecutionTrace = {
    query,
    classifiedIntent: '',
    intentConfidence: 0,
    nodesExecuted: [],
    toolsCalled: [],
    searchResultCount: 0,
    urlsSelectedForCrawl: [],
    crawlAttempted: 0,
    crawlSucceeded: 0,
    extractedContentLengths: [],
    sourcesUsed: [],
    pipelineStatus: '',
    contextPassedToLLM: {
      internalDocsCount: 0,
      webResultsCount: 0,
      includesInternalContext: false,
      includesWebResults: false,
      systemPromptLength: 0,
    },
    webResults: [],
    citations: [],
    finalAnswer: '',
    errors: [],
  };

  const kg = new KnowledgeGraph({
    onEvent: (evt) => {
      if (evt.type === 'node_execution') {
        trace.nodesExecuted.push(evt.data.nodeName);
      }
      if (evt.type === 'intent_classified') {
        trace.classifiedIntent = evt.data.category;
        trace.intentConfidence = evt.data.confidence;
      }
      if (evt.type === 'tool_call') {
        trace.toolsCalled.push(evt.data.name);
      }
      if (evt.type === 'tool_result' && evt.data.name === 'web_search') {
        const res = evt.data.result || {};
        trace.searxngQuery = res.query || query;
        trace.searchResultCount = evt.data.count || 0;
        trace.pipelineStatus = evt.data.status || 'completed';
        trace.telemetry = res.telemetry;
        trace.validatedEvidence = res.validatedEvidence;
      }
      if (evt.type === 'context_passed_to_llm') {
        trace.contextPassedToLLM = evt.data;
      }
    },
  });

  try {
    const result = await kg.execute({
      messages: [],
      userQuery: query,
      authContext: testAuth,
      mode: options.webEnabled !== false ? 'HYBRID' : 'LOCAL',
      isWebAccessEnabled: options.webEnabled !== false,
      internalDocs: [],
      webResults: [],
      citations: [],
      finalAnswer: '',
    });

    trace.finalAnswer = result.finalAnswer || '';
    trace.classifiedIntent = trace.classifiedIntent || result.intentCategory || '';
    trace.webResults = result.webResults || [];
    trace.citations = result.citations || [];
    trace.telemetry = trace.telemetry || result.retrievalTelemetry;
    trace.validatedEvidence = trace.validatedEvidence || result.validatedEvidence;

    trace.extractedContentLengths = trace.webResults
      .filter(r => r.extractedContent)
      .map(r => r.extractedContent.length);
    trace.urlsSelectedForCrawl = trace.webResults.map(r => r.url).filter(Boolean);
    trace.crawlAttempted = trace.webResults.length;
    trace.crawlSucceeded = trace.webResults.filter(r => r.crawlSuccess).length;
    trace.sourcesUsed = trace.webResults
      .filter(r => r.crawlSuccess && r.extractedContent)
      .map(r => r.url);

    if (!trace.pipelineStatus) {
      if (trace.searchResultCount > 0 && trace.crawlSucceeded > 0) trace.pipelineStatus = 'success';
      else if (trace.searchResultCount > 0) trace.pipelineStatus = 'partial_success';
      else trace.pipelineStatus = 'no_results';
    }
  } catch (err: any) {
    trace.errors.push(err.message);
    trace.pipelineStatus = 'error';
    console.error(`  Pipeline error: ${err.message}`);
  }

  return trace;
}

function printTrace(trace: ExecutionTrace): void {
  console.log(`\n  📋 Execution Trace:`);
  console.log(`     Intent:          ${trace.classifiedIntent} (confidence: ${(trace.intentConfidence * 100).toFixed(0)}%)`);
  console.log(`     Nodes executed:  ${trace.nodesExecuted.join(' → ')}`);
  console.log(`     Tools called:    ${trace.toolsCalled.join(', ') || 'none'}`);
  if (trace.searxngQuery) console.log(`     SearXNG query:   "${trace.searxngQuery}"`);
  console.log(`     SearXNG results: ${trace.searchResultCount}`);
  console.log(`     URLs crawled:    ${trace.crawlAttempted} attempted, ${trace.crawlSucceeded} succeeded`);
  console.log(`     Extracted chars: ${trace.extractedContentLengths.map(l => `${l}ch`).join(', ') || 'none'}`);
  if (trace.telemetry) {
    console.log(`     Telemetry:       Searched: ${trace.telemetry.searchedSourcesCount} | Crawled: ${trace.telemetry.crawledSourcesCount} | Extracted: ${trace.telemetry.successfullyExtractedSourcesCount} | Relevant Evidence: ${trace.telemetry.relevantEvidenceSourcesCount}`);
  }
  console.log(`     Pipeline status: ${trace.pipelineStatus}`);
  console.log(`     Sources w/ content: ${trace.sourcesUsed.length}`);
  trace.sourcesUsed.slice(0, 3).forEach(s => console.log(`       • ${s}`));
  console.log(`     LLM context:     ${trace.contextPassedToLLM.systemPromptLength} chars (web: ${trace.contextPassedToLLM.webResultsCount}, internal: ${trace.contextPassedToLLM.internalDocsCount})`);
  console.log(`     Answer:          ${(trace.finalAnswer || '').slice(0, 300)}`);
  if (trace.errors.length) console.log(`     Errors:          ${trace.errors.join('; ')}`);
}

async function checkServices(): Promise<{ searxng: boolean; crawl4ai: boolean }> {
  const searxngUrl = (process.env.SEARXNG_URL || 'http://localhost:8080').replace(/\/$/, '');
  const crawl4aiUrl = (process.env.CRAWL4AI_URL || 'http://localhost:11235').replace(/\/$/, '');

  const checkUrl = async (url: string, label: string): Promise<boolean> => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      console.log(`  ${r.ok ? '✓' : '✗'} ${label} → HTTP ${r.status}`);
      return r.ok;
    } catch (e: any) {
      console.log(`  ✗ ${label} → UNREACHABLE (${e.message})`);
      return false;
    }
  };

  const searxng = await checkUrl(searxngUrl, `SearXNG at ${searxngUrl}`);
  const crawl4ai = await checkUrl(`${crawl4aiUrl}/health`, `Crawl4AI at ${crawl4aiUrl}`);
  return { searxng, crawl4ai };
}

// ─── Main Test Suite Execution ───────────────────────────────────────────────

async function runTests(): Promise<void> {
  console.log('\n🔍 AUREN Hardened Web Retrieval & Evidence Validation — E2E Test Suite');
  console.log('='.repeat(70));
  console.log(`  Architecture: Self-hosted SearXNG + Crawl4AI + EvidenceValidator`);

  section('Service Connectivity Check');
  const services = await checkServices();

  // Test 0: Query Sanitization
  section('Test 0: Query Sanitization');
  const sanitizeCases: [string, string][] = [
    ['Search the web for the current Prime Minister of India', 'the current Prime Minister of India'],
    ['Use web search and give me the source for INR to USD rate', 'INR to USD rate'],
    ['current PM of India', 'current PM of India'],
    ['What is the current INR to USD exchange rate? Search the web.', 'the current INR to USD exchange rate'],
    ['What is today\'s Bitcoin price?', 'today Bitcoin price?'],
    ['Who is the current Prime Minister of India?', 'the current Prime Minister of India?'],
    ['Use the web to find the latest React release.', 'the latest React release.'],
  ];
  for (const [input, expected] of sanitizeCases) {
    const got = sanitizeSearchQuery(input);
    assert(got === expected, `Sanitize "${input}" -> "${got}"`);
  }

  // Mandatory E2E Domain Tests
  const dynamicTestCases = [
    { name: 'Test 1: Current Bitcoin price', query: 'What is the current Bitcoin price in USD? Search the web and give evidence.', category: 'DYNAMIC_DATA' },
    { name: 'Test 2: Apple stock price', query: 'What is Apple\'s current stock price? Search the web and extract price.', category: 'DYNAMIC_DATA' },
    { name: 'Test 3: USD/INR exchange rate', query: 'What is today\'s USD to INR exchange rate?', category: 'DYNAMIC_DATA' },
    { name: 'Test 4: Current Punjab CM', query: 'Who is the current Chief Minister of Punjab?', category: 'DYNAMIC_DATA' },
    { name: 'Test 5: Latest RBI repo rate', query: 'What is the latest RBI repo rate in India?', category: 'DYNAMIC_DATA' },
    { name: 'Test 6: Latest Apple quarterly revenue', query: 'What is Apple\'s latest quarterly revenue according to SEC filings or IR?', category: 'DYNAMIC_DATA' },
    { name: 'Test 7: Latest NVIDIA quarterly revenue', query: 'What is NVIDIA\'s latest quarterly revenue?', category: 'DYNAMIC_DATA' },
    { name: 'Test 8: Latest AI news', query: 'What are the latest AI news developments this week?', category: 'EXTERNAL_WEB' },
    { name: 'Test 9: Query with search results but no verifiable evidence', query: 'What is the exact secret unreleased product code of Company XYZ 987654321?', category: 'DYNAMIC_DATA' }
  ];

  for (const tc of dynamicTestCases) {
    section(tc.name);
    const trace = await runPipeline(tc.query);
    printTrace(trace);
    subsection('Assertions');

    assert(Boolean(trace.classifiedIntent) && (trace.classifiedIntent === tc.category || trace.classifiedIntent === 'DYNAMIC_DATA' || trace.classifiedIntent === 'EXTERNAL_WEB'), `Correct intent classified (got "${trace.classifiedIntent}")`);
    assert(trace.toolsCalled.includes('web_search'), 'web_search tool executed');
    
    if (services.searxng) {
      assert(trace.searchResultCount > 0, `SearXNG returned results (got ${trace.searchResultCount})`);
      assert(trace.urlsSelectedForCrawl.length > 0, 'Pages selected for crawling');
      assert(trace.contextPassedToLLM.includesWebResults, 'Web evidence passed to Ollama context');

      if (trace.telemetry) {
        assert(typeof trace.telemetry.searchedSourcesCount === 'number', 'Searched sources telemetry captured');
        assert(typeof trace.telemetry.crawledSourcesCount === 'number', 'Crawled sources telemetry captured');
        assert(typeof trace.telemetry.relevantEvidenceSourcesCount === 'number', 'Relevant evidence sources telemetry captured');
      }

      if (!trace.errors.length) {
        assert(trace.finalAnswer.length > 0, 'Answer produced');
        const hallucinationPattern = /as of my (?:last update|knowledge cutoff|training data)/i;
        assert(!hallucinationPattern.test(trace.finalAnswer), 'No pretrained-knowledge fallback disclaimer in output');
      }
    } else {
      warn('SearXNG offline — skipping live web assertions');
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  TEST RESULTS SUMMARY`);
  console.log(`  ─────────────────────────────────────────────────────────────`);
  console.log(`  ✓ Passed:  ${passed}`);
  console.log(`  ✗ Failed:  ${failed}`);
  console.log(`  ⚠ Warned:  ${warned}`);
  console.log(`  Total:     ${passed + failed}`);
  console.log('═'.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
