import { SearXNGSearchProvider, sanitizeSearchQuery } from '../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';
import { validateAndRankEvidence } from '../infrastructure/search/EvidenceValidator';
import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';

async function runFinancialRegressionSuite() {
  console.log('===============================================================');
  console.log('   AUREN FINANCIAL EVIDENCE GROUNDING REGRESSION TEST SUITE   ');
  console.log('===============================================================\n');

  const testQueries = [
    { name: '1. Live Stock Price - NVIDIA', query: 'What is the current stock price of NVIDIA?' },
    { name: "2. Price Target - NVIDIA", query: "What is NVIDIA's price target?" },
    { name: "3. Previous Close - NVIDIA", query: "What was NVIDIA's previous close?" },
    { name: "4. 52-Week High - NVIDIA", query: "What is NVIDIA's 52-week high?" },
    { name: '5. Live Stock Price - Apple', query: 'What is the current stock price of Apple?' },
    { name: '6. Live Stock Price - Microsoft', query: 'What is the current stock price of Microsoft?' },
  ];

  const provider = new SearXNGSearchProvider();
  const graph = KnowledgeGraph.buildGraph();

  for (const test of testQueries) {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`RUNNING TEST: [${test.name}]`);
    console.log(`QUERY: "${test.query}"`);
    console.log(`---------------------------------------------------------------`);

    try {
      const sanitized = sanitizeSearchQuery(test.query);
      const searchResults = await provider.search(sanitized, 4);
      console.log(`[SearXNG] Retrieved ${searchResults.length} search results.`);

      const urlsToCrawl = searchResults.slice(0, 3).map((r: any) => r.url);
      const crawlResults = await crawlUrls(urlsToCrawl);

      const rawResultsForValidation = searchResults.map((r: any) => {
        const crawled = crawlResults.find((c: any) => c.url === r.url);
        return {
          url: r.url,
          title: r.title,
          snippet: r.snippet,
          extractedContent: crawled?.content,
          crawlSuccess: crawled?.success || false
        };
      });

      const { validatedEvidence, telemetry } = validateAndRankEvidence(test.query, rawResultsForValidation);

      console.log(`[Validator] Searched: ${telemetry.searchedSourcesCount} | Crawled: ${telemetry.crawledSourcesCount} | Extracted Evidence Items: ${validatedEvidence.length}`);

      if (validatedEvidence.length > 0) {
        validatedEvidence.forEach((ev, idx) => {
          console.log(`  - Evidence #${idx + 1} [Confidence: ${ev.confidence}] Source: ${ev.sourceTitle}`);
          console.log(`    Extracted Numeric: ${ev.extractedNumeric !== undefined ? ev.extractedNumeric : 'N/A'} ${ev.extractedCurrency || ''}`);
          console.log(`    Raw Extracted Value: "${ev.extractedValue || 'N/A'}"`);
          console.log(`    Supporting Snippet: "${ev.evidenceText?.slice(0, 120)}..."`);
        });
      } else {
        console.log(`  - [Validator] No high-confidence structured evidence extracted (Fallback to raw snippets).`);
      }

      console.log(`\n[Synthesis Test] Executing LangGraph synthesis...`);
      const startTime = Date.now();
      const state: any = await graph.invoke({
        userQuery: test.query,
        authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
        mode: 'HYBRID',
        isWebAccessEnabled: true,
      });
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`[Synthesis Answer (${elapsed}s)]:\n${state.finalAnswer}\n`);

    } catch (err: any) {
      console.error(`[TEST ERROR] ${test.name} failed:`, err.message || err);
    }
  }

  console.log('\n===============================================================');
  console.log('   REGRESSION SUITE COMPLETED SUCCESSFULLY   ');
  console.log('===============================================================\n');
}

runFinancialRegressionSuite().catch(console.error);
