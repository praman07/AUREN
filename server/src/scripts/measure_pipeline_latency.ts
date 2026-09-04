/**
 * measure_pipeline_latency.ts
 *
 * Benchmark script to empirically measure runtime latency of each stage
 * in the AUREN research pipeline:
 *  - classifyIntent
 *  - clarifyWithUser
 *  - writeResearchBrief
 *  - webSearch (SearXNG + Crawl4AI + EvidenceValidator + evaluateSufficiency)
 *  - synthesizeAnswer (Ollama LLM generation, TTFT, TPS)
 */

import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';

const testAuth = {
  userId: 'perf-test-user',
  organizationId: 'perf-test-org',
  roles: ['MEMBER'],
  departmentId: undefined,
  isSuperAdmin: false,
};

interface NodeTimingData {
  nodeName: string;
  durationMs: number;
  llmDurationMs?: number;
  llmCallsCount?: number;
  ttftMs?: number;
  tokenCount?: number;
  tokensPerSecond?: number;
  [key: string]: any;
}

interface TestRunResult {
  query: string;
  totalLatencyMs: number;
  classifiedIntent: string;
  researchStrategy?: string;
  nodeTimings: NodeTimingData[];
  iterationTimings: any[];
  webSearchSubStepTiming?: any;
  finalAnswerPreview: string;
}

async function benchmarkQuery(query: string): Promise<TestRunResult> {
  const nodeTimings: NodeTimingData[] = [];
  const iterationTimings: any[] = [];
  let classifiedIntent = '';
  let researchStrategy = '';
  let webSearchSubStepTiming: any = undefined;

  const startMs = performance.now();

  const kg = new KnowledgeGraph({
    onEvent: (evt) => {
      if (evt.type === 'intent_classified') {
        classifiedIntent = evt.data.category;
      }
      if (evt.type === 'research_started') {
        researchStrategy = evt.data.strategy;
      }
      if (evt.type === 'node_timing') {
        nodeTimings.push(evt.data);
      }
      if (evt.type === 'iteration_timing') {
        iterationTimings.push(evt.data);
      }
      if (evt.type === 'tool_result' && evt.data.name === 'web_search') {
        if (evt.data.result?.telemetry?.subStepTimingMs) {
          webSearchSubStepTiming = evt.data.result.telemetry.subStepTimingMs;
        }
      }
    },
  });

  const result = await kg.execute({
    messages: [],
    userQuery: query,
    authContext: testAuth,
    mode: 'HYBRID',
    isWebAccessEnabled: true,
    internalDocs: [],
    webResults: [],
    citations: [],
    finalAnswer: '',
  });

  const totalLatencyMs = performance.now() - startMs;

  return {
    query,
    totalLatencyMs,
    classifiedIntent: result.intentCategory || classifiedIntent,
    researchStrategy: result.researchStrategy || researchStrategy,
    nodeTimings,
    iterationTimings,
    webSearchSubStepTiming,
    finalAnswerPreview: (result.finalAnswer || '').slice(0, 150).replace(/\n/g, ' ') + '...',
  };
}

async function main() {
  console.log('================================================================================');
  console.log('               AUREN RESEARCH PIPELINE LATENCY BENCHMARK TRACE                  ');
  console.log('================================================================================\n');

  const queries = [
    "What is the capital of Congo?",
    "What is Apple's current stock price?",
    "What is the latest RBI repo rate in India?",
  ];

  const results: TestRunResult[] = [];

  for (const q of queries) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`RUNNING BENCHMARK QUERY: "${q}"`);
    console.log(`--------------------------------------------------------------------------------`);

    try {
      const res = await benchmarkQuery(q);
      results.push(res);

      console.log(`\n  • Total Latency:          ${(res.totalLatencyMs / 1000).toFixed(2)}s (${res.totalLatencyMs.toFixed(0)}ms)`);
      console.log(`  • Classified Intent:       ${res.classifiedIntent}`);
      console.log(`  • Research Strategy:       ${res.researchStrategy || 'DEFAULT'}`);
      console.log(`  • Node Execution Breakdown:`);
      for (const node of res.nodeTimings) {
        let details = `duration: ${node.durationMs.toFixed(0)}ms`;
        if (node.llmDurationMs) details += ` | LLM duration: ${node.llmDurationMs.toFixed(0)}ms (${node.llmCallsCount || 1} calls)`;
        if (node.ttftMs) details += ` | TTFT: ${node.ttftMs.toFixed(0)}ms`;
        if (node.tokensPerSecond) details += ` | speed: ${node.tokensPerSecond.toFixed(1)} tokens/sec (${node.tokenCount} tokens)`;
        console.log(`      - ${node.nodeName.padEnd(20)} -> ${details}`);
      }

      if (res.webSearchSubStepTiming) {
        console.log(`  • webSearch Sub-step Timing:`);
        console.log(`      - SearXNG Search:       ${res.webSearchSubStepTiming.searxngDurationMs.toFixed(0)}ms`);
        console.log(`      - Crawl4AI Extraction:  ${res.webSearchSubStepTiming.crawl4aiDurationMs.toFixed(0)}ms`);
        console.log(`      - Evidence Validation:  ${res.webSearchSubStepTiming.evidenceValidationDurationMs.toFixed(0)}ms`);
      }

      if (res.iterationTimings.length > 0) {
        console.log(`  • Iteration Breakdown:`);
        for (const iter of res.iterationTimings) {
          console.log(`      - Iteration ${iter.iteration}: total=${iter.totalIterationDurationMs.toFixed(0)}ms (searchTool=${iter.searchToolDurationMs.toFixed(0)}ms, evalLLM=${iter.evidenceEvaluationDurationMs.toFixed(0)}ms)`);
        }
      }

      console.log(`  • Answer Preview: "${res.finalAnswerPreview}"`);
    } catch (err: any) {
      console.error(`  ✗ Error running benchmark for "${q}":`, err.message || err);
    }
  }

  console.log('\n================================================================================');
  console.log('                           BENCHMARK SUMMARY TABLE                              ');
  console.log('================================================================================\n');

  console.log('| Query | Classified Intent | Total Latency | Node Timings Breakdown | Main Bottleneck |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    const timingStr = r.nodeTimings.map(n => `${n.nodeName}:${(n.durationMs/1000).toFixed(1)}s`).join(', ');
    const slowestNode = [...r.nodeTimings].sort((a, b) => b.durationMs - a.durationMs)[0];
    const bottleneck = slowestNode ? `${slowestNode.nodeName} (${(slowestNode.durationMs/1000).toFixed(1)}s)` : 'N/A';
    console.log(`| ${r.query} | ${r.classifiedIntent} | ${(r.totalLatencyMs/1000).toFixed(2)}s | ${timingStr} | ${bottleneck} |`);
  }
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});
