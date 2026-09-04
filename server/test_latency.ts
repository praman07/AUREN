import { KnowledgeGraph, GraphCallbacks } from './src/ai/graph/KnowledgeGraph';

async function measureLatency() {
  console.log("==================================================");
  console.log("⚡ AUREN LATENCY & AMBIGUITY REGRESSION BENCHMARK");
  console.log("==================================================");

  const testQueries = [
    { query: "What is the capital of Congo?", description: "Multi-interpretation entity query (Congo)" },
    { query: "What is the current price of Bitcoin?", description: "Web search dynamic data query" }
  ];

  const modes: ('FAST' | 'DEEP' | 'AUTO')[] = ['FAST', 'DEEP', 'AUTO'];

  for (const q of testQueries) {
    for (const mode of modes) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Testing Query: "${q.query}" (${q.description}) | Mode: ${mode}`);
      console.log(`--------------------------------------------------`);

      const nodeTimings: Record<string, number> = {};
      let totalStart = performance.now();

      const graph = KnowledgeGraph.buildGraph({
        onEvent: (event: { type: string; data?: any }) => {
          if (event.type === 'node_timing') {
            nodeTimings[event.data.nodeName] = event.data.durationMs;
            console.log(`  ⏱️ Node [${event.data.nodeName}]: ${event.data.durationMs.toFixed(0)}ms`);
          } else if (event.type === 'node_execution') {
            console.log(`  ▶ Running Node: ${event.data.nodeName}...`);
          }
        }
      });

      const initialState = {
        messages: [{ role: 'user', content: q.query }],
        userQuery: q.query,
        authContext: { userId: 'benchmark-user', organizationId: 'benchmark-org', role: 'ADMIN', clearanceLevel: 'TOP_SECRET' },
        mode: 'HYBRID' as const,
        isWebAccessEnabled: true,
        executionMode: mode,
        intentCategory: 'CASUAL' as const,
        requiresClarification: false,
        clarificationQuestion: undefined,
        clarificationOptions: undefined,
        researchBrief: undefined,
        webResults: [],
        citations: [],
        internalDocs: [],
        validatedEvidence: [],
        webSearchStatus: 'idle',
        researchIterations: 0,
        userMemories: [],
        historyDocs: []
      };

      const finalState = await graph.invoke(initialState);
      const totalEnd = performance.now();
      const totalMs = totalEnd - totalStart;
      const totalS = totalMs / 1000;

      console.log(`\n📊 BENCHMARK RESULTS FOR: "${q.query}" in ${mode} mode`);
      console.log(`  Total End-to-End Latency: ${totalS.toFixed(2)}s (${totalMs.toFixed(0)}ms)`);
      
      const targetS = (mode === 'FAST' || mode === 'AUTO') ? 10.0 : 90.0;
      const withinTarget = totalS <= targetS;
      console.log(`  Target: <= ${targetS}s | Status: ${withinTarget ? '✅ PASS' : '❌ FAIL'}`);

      console.log(`  Node Timings Breakdown:`);
      for (const [node, duration] of Object.entries(nodeTimings)) {
        console.log(`    - ${node.padEnd(22)}: ${(duration / 1000).toFixed(2)}s (${duration.toFixed(0)}ms)`);
      }

      console.log(`\n  Generated Answer snippet:`);
      console.log(`  "${(finalState.finalAnswer || '').slice(0, 300)}..."`);
      console.log(`  Web results collected: ${finalState.webResults?.length || 0}`);
      console.log(`  Citations collected: ${finalState.citations?.length || 0}`);
    }
  }
}

measureLatency().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

