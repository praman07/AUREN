import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { parseResearchDimensions, validateAndRankEvidence } from '../infrastructure/search/EvidenceValidator';
import { LocalResearchAgent } from '../ai/research/LocalResearchAgent';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';

async function runGenericIntentAndMultiEntityRegressionSuite() {
  console.log('========================================================================');
  console.log('   AUREN GENERIC INTENT & MULTI-ENTITY REGRESSION SUITE   ');
  console.log('========================================================================\n');

  const graph = KnowledgeGraph.buildGraph();
  let passedCount = 0;
  let totalCount = 0;

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
  // TEST 1: Single-Entity Query ("How much did the S&P 500 change this month?")
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: Single-Entity Query Intent & Dimensions ---');
  try {
    const q1 = "How much did the S&P 500 change this month?";
    console.log(`User Query: "${q1}"`);

    const dims1 = parseResearchDimensions(q1);
    console.log(`Parsed Dimensions:`, JSON.stringify(dims1));

    assert(
      dims1.entities.some((e: string) => /s&p\s*500/i.test(e)) && dims1.timeframe === 'monthly',
      'Test 1 - Dimension Parser',
      'Extracted "S&P 500" entity and "monthly" timeframe'
    );

    const state1: any = await graph.invoke({
      userQuery: q1,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state1.resolvedQuery}"`);
    console.log(`Research Brief Target Metric: "${state1.researchBrief?.targetMetric || 'N/A'}"`);
    console.log(`Extracted Evidence Count: ${state1.webResearchState?.extractedEvidence?.length || 0}`);

    assert(
      state1.resolvedQuery.toLowerCase().includes('s&p 500') &&
      (state1.resolvedQuery.toLowerCase().includes('change') || state1.resolvedQuery.toLowerCase().includes('month')),
      'Test 1 - Pipeline Intent Preservation',
      'Resolved query preserves S&P 500 monthly change intent without generic lookup reduction'
    );
  } catch (err: any) {
    assert(false, 'Test 1', `Error executing Test 1: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Entity Query ("How did Tesla perform compared with Ford this year?")
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Multi-Entity Comparative Query ---');
  try {
    const q2 = "How did Tesla perform compared with Ford this year?";
    console.log(`User Query: "${q2}"`);

    const dims2 = parseResearchDimensions(q2);
    console.log(`Parsed Dimensions:`, JSON.stringify(dims2));

    assert(
      dims2.entities.length >= 2 &&
      dims2.entities.some((e: string) => /tesla/i.test(e)) &&
      dims2.entities.some((e: string) => /ford/i.test(e)) &&
      dims2.isMultiEntity,
      'Test 2 - Multi-Entity Dimension Parser',
      'Correctly identified both "Tesla" and "Ford" as comparative entities for this year'
    );

    // Validate LocalResearchAgent multi-entity sufficiency check
    const mockSingleEntityEvidence: any = [
      {
        sourceUrl: 'https://example.com/tesla',
        sourceTitle: 'Tesla Annual Performance',
        evidenceText: 'Tesla stock gained 15% this year following EV market expansion.',
        sourceType: 'reputable_news',
        confidence: 'medium',
        isFresh: true,
        matchedEntity: 'Tesla',
        matchedTimeframe: 'yearly',
        matchedMetric: 'performance',
      }
    ];

    const agent = new LocalResearchAgent();
    const sufficiencyEval = await agent.evaluateSufficiency(q2, mockSingleEntityEvidence, 1, 3);

    console.log(`Sufficiency Output (Single Entity Present):`, JSON.stringify(sufficiencyEval));

    assert(
      !sufficiencyEval.isSufficient &&
      (sufficiencyEval.gap || '').toLowerCase().includes('ford'),
      'Test 2 - Multi-Entity Sufficiency Validation',
      'Sufficiency evaluator correctly flagged missing Ford evidence in multi-entity comparison'
    );
  } catch (err: any) {
    assert(false, 'Test 2', `Error executing Test 2: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Consecutive Standalone Query Context Separation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Consecutive Standalone Query Separation ---');
  try {
    const previousTurn = [
      new HumanMessage("What was Tesla's Q3 revenue?"),
      new AIMessage("Tesla reported Q3 revenue of $25.18 billion USD.")
    ];
    const newStandaloneQuery = "How did Ethereum perform this week compared with last week?";

    console.log(`Previous Turn Context: "${previousTurn[0].content}"`);
    console.log(`New Standalone Query: "${newStandaloneQuery}"`);

    const state3: any = await graph.invoke({
      userQuery: newStandaloneQuery,
      messages: previousTurn,
      authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
      mode: 'HYBRID',
      isWebAccessEnabled: true,
    });

    console.log(`Resolved Query: "${state3.resolvedQuery}"`);

    assert(
      state3.resolvedQuery.toLowerCase().includes('ethereum') &&
      !state3.resolvedQuery.toLowerCase().includes('tesla') &&
      !state3.resolvedQuery.toLowerCase().includes('revenue'),
      'Test 3 - Context Separation',
      'Ethereum weekly comparison query did NOT inherit Tesla revenue context'
    );
  } catch (err: any) {
    assert(false, 'Test 3', `Error executing Test 3: ${err.message || err}`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Crawl & Network Fallback Handling
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Crawl & Network Fallback Handling ---');
  try {
    const unaccessibleUrl = "http://localhost:59999/non-existent-page-test-fallback";
    const sampleSnippet = "Ethereum price increased 5% this week compared to last week according to market reports in 2026.";
    const snippetsMap = { [unaccessibleUrl]: sampleSnippet };

    console.log(`Crawling invalid URL with snippet fallback provided: ${unaccessibleUrl}`);
    const crawlRes = await crawlUrls([unaccessibleUrl], { snippets: snippetsMap });

    console.log(`Crawl Result:`, JSON.stringify(crawlRes));

    assert(
      crawlRes.length === 1 &&
      crawlRes[0].success &&
      crawlRes[0].source === 'snippet' &&
      crawlRes[0].content === sampleSnippet,
      'Test 4 - Crawl Snippet Fallback',
      'Crawling unavailable URL gracefully fell back to snippet source with full content preservation'
    );

    // Verify evidence validator can extract structured evidence from snippet fallback page
    const samplePage = {
      title: "Ethereum Weekly Analysis",
      url: unaccessibleUrl,
      snippet: sampleSnippet,
      source: "crypto-news.com",
      extractedContent: sampleSnippet,
      crawlSuccess: false,
    };
    const validated = validateAndRankEvidence("How did Ethereum perform this week compared with last week?", [samplePage]);
    console.log(`Validated Evidence from Fallback Snippet:`, JSON.stringify(validated.validatedEvidence));

    assert(
      validated.validatedEvidence.length > 0 && validated.validatedEvidence[0].matchedEntity === 'Ethereum',
      'Test 4 - Evidence Extraction from Snippet Fallback',
      'EvidenceValidator successfully extracted bound evidence from snippet fallback page'
    );
  } catch (err: any) {
    assert(false, 'Test 4', `Error executing Test 4: ${err.message || err}`);
  }

  console.log('\n========================================================================');
  console.log(`   REGRESSION SUITE COMPLETED: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runGenericIntentAndMultiEntityRegressionSuite().catch(err => {
  console.error('Unhandled error in regression suite:', err);
  process.exit(1);
});
