import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { sanitizeSearchQuery, SearXNGSearchProvider } from '../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';
import { validateAndRankEvidence } from '../infrastructure/search/EvidenceValidator';

async function runHardenedPipelineRegressionSuite() {
  console.log('========================================================================');
  console.log('   AUREN HARDENED RESEARCH PIPELINE - COMPREHENSIVE REGRESSION SUITE   ');
  console.log('========================================================================\n');

  const graph = KnowledgeGraph.buildGraph();
  let passedCount = 0;
  let totalCount = 0;

  // Helper assertion
  function assert(condition: boolean, testName: string, detail: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASSED: [${testName}] ${detail}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAILED: [${testName}] ${detail}`);
    }
  }

  // --------------------------------------------------------------------------
  // SCENARIO 1: Standalone Specific Query Preservation (NVIDIA Earnings)
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 1: Standalone Query Intent & Constraint Preservation ---');
  try {
    const q1 = "What happened to NVIDIA's stock price after its latest earnings report?";
    console.log(`User Query: "${q1}"`);

    const state1: any = await graph.invoke({
      userQuery: q1,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state1.resolvedQuery}"`);
    console.log(`Research Brief Target Metric: "${state1.researchBrief?.targetMetric || 'N/A'}"`);
    console.log(`Search Queries:`, state1.researchBrief?.searchQueries);

    assert(
      state1.resolvedQuery.toLowerCase().includes('nvidia') &&
      (state1.resolvedQuery.toLowerCase().includes('earnings') || state1.resolvedQuery.toLowerCase().includes('report')) &&
      !state1.resolvedQuery.toLowerCase().includes('market capitalization'),
      'Scenario 1 - Intent Preservation',
      'Resolved query preserves NVIDIA earnings/stock price intent without drifting into market cap'
    );
  } catch (err: any) {
    assert(false, 'Scenario 1', `Error executing scenario 1: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: Elliptical Follow-up Query Resolution (Apple -> Tata)
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Elliptical Follow-up Context Resolution ---');
  try {
    const contextMessages = [
      new HumanMessage("What is Apple's current stock price?"),
      new AIMessage("Apple Inc. (AAPL) stock is currently trading around $225.40 USD.")
    ];
    const followUp = "Tata?";
    console.log(`Previous Turn: "${contextMessages[0].content}"`);
    console.log(`Follow-up: "${followUp}"`);

    const state2: any = await graph.invoke({
      userQuery: followUp,
      messages: contextMessages,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state2.resolvedQuery}"`);

    assert(
      state2.resolvedQuery.toLowerCase().includes('tata') &&
      (state2.resolvedQuery.toLowerCase().includes('stock') || state2.resolvedQuery.toLowerCase().includes('price')),
      'Scenario 2 - Elliptical Resolution',
      'Follow-up "Tata?" resolved to Tata stock price in context of preceding Apple stock price question'
    );
  } catch (err: any) {
    assert(false, 'Scenario 2', `Error executing scenario 2: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // SCENARIO 3: Standalone Unrelated Query Non-Inheritance
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Unrelated Standalone Query Non-Inheritance ---');
  try {
    const contextMessages = [
      new HumanMessage("What is Apple's current stock price?"),
      new AIMessage("Apple Inc. (AAPL) stock is currently trading around $225.40 USD.")
    ];
    const newQuery = "What is the capital of France?";
    console.log(`Previous Turn: "${contextMessages[0].content}"`);
    console.log(`New Standalone Query: "${newQuery}"`);

    const state3: any = await graph.invoke({
      userQuery: newQuery,
      messages: contextMessages,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state3.resolvedQuery}"`);

    assert(
      state3.resolvedQuery.toLowerCase().includes('capital of france') &&
      !state3.resolvedQuery.toLowerCase().includes('stock') &&
      !state3.resolvedQuery.toLowerCase().includes('apple'),
      'Scenario 3 - Non-Inheritance',
      'Standalone query "What is the capital of France?" maintained its original intent without inheriting previous stock price context'
    );
  } catch (err: any) {
    assert(false, 'Scenario 3', `Error executing scenario 3: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: Comparative Financial & Temporal Query (Bitcoin MoM)
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Comparative Financial & Temporal Query ---');
  try {
    const q4 = "How did Bitcoin perform this month compared with last month?";
    console.log(`User Query: "${q4}"`);

    const state4: any = await graph.invoke({
      userQuery: q4,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state4.resolvedQuery}"`);
    console.log(`Research Brief Queries:`, state4.researchBrief?.searchQueries);
    console.log(`Target Metric: "${state4.researchBrief?.targetMetric || 'N/A'}"`);
    console.log(`Extracted Evidence Count: ${state4.webResearchState?.extractedEvidence?.length || 0}`);

    assert(
      state4.resolvedQuery.toLowerCase().includes('bitcoin') &&
      (state4.resolvedQuery.toLowerCase().includes('perform') || state4.resolvedQuery.toLowerCase().includes('month')) &&
      !state4.resolvedQuery.toLowerCase().includes('microsoft'),
      'Scenario 4 - Comparative Query Integrity',
      'Comparative Bitcoin query preserves Bitcoin and temporal comparison without drifting into unrelated entities (e.g. Microsoft)'
    );
  } catch (err: any) {
    assert(false, 'Scenario 4', `Error executing scenario 4: ${err.message || err}`);
  }

  console.log('\n========================================================================');
  console.log(`   REGRESSION SUITE COMPLETED: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runHardenedPipelineRegressionSuite().catch(err => {
  console.error('Unhandled error in regression suite:', err);
  process.exit(1);
});
