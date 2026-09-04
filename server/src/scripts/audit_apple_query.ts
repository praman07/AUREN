import { SearXNGSearchProvider, sanitizeSearchQuery } from '../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';
import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';

async function auditAppleQuery() {
  console.log('======================================================================');
  console.log('  PIPELINE AUDIT: "Apple current stock price"');
  console.log('======================================================================\n');

  const rawQuery = "What is Apple's current stock price? Search the web, extract the actual latest price, and give me the source and timestamp.";
  const sanitized = sanitizeSearchQuery(rawQuery);

  console.log('1. EXACT SEARCH QUERY SENT TO SEARXNG:');
  console.log(`   Raw:       "${rawQuery}"`);
  console.log(`   Sanitized: "${sanitized}"\n`);

  const provider = new SearXNGSearchProvider();
  const searchResults = await provider.search(sanitized, 8);

  console.log('2. ALL RETURNED URLS & SEARXNG METADATA:');
  searchResults.forEach((r, idx) => {
    console.log(`   [${idx + 1}] Title:     ${r.title}`);
    console.log(`       URL:       ${r.url}`);
    console.log(`       Source:    ${r.source}`);
    console.log(`       Timestamp: ${r.timestamp || 'NOT_PROVIDED'}`);
    console.log(`       Snippet:   ${r.snippet.slice(0, 120)}...\n`);
  });

  const urlsToCrawl = searchResults.slice(0, 4).map(r => r.url);
  console.log('3. URLS SELECTED FOR CRAWLING:');
  urlsToCrawl.forEach(u => console.log(`   • ${u}`));
  console.log('');

  const crawlResults = await crawlUrls(urlsToCrawl);

  console.log('4, 5, 6, 7. EXTRACTION, HTTP STATUS, STOCK PRICE & TIMESTAMP AUDIT:');
  crawlResults.forEach((c, idx) => {
    console.log(`\n   --- [Page ${idx + 1}] ${c.url} ---`);
    console.log(`       Success:         ${c.success}`);
    console.log(`       Extraction Mode: ${c.source}`);
    console.log(`       Extracted Chars: ${c.contentLength}`);

    if (c.success) {
      const priceMatches = c.content.match(/\$\s*\d{2,4}(?:\.\d{2})?/g) || [];
      console.log(`       Dollar Prices Found (${priceMatches.length}): ${priceMatches.slice(0, 10).join(', ')}`);

      const yearMatches = c.content.match(/\b(201\d|202[0-9])\b/g) || [];
      const uniqueYears = [...new Set(yearMatches)];
      console.log(`       Years Mentioned: ${uniqueYears.join(', ')}`);

      console.log('       Content Snippet (first 400 chars):');
      console.log(`       ${c.content.slice(0, 400).replace(/\n/g, ' ')}\n`);
    } else {
      console.log(`       Error: ${c.error}\n`);
    }
  });

  console.log('8 & 9. FULL GRAPH EXECUTION & OLLAMA EVIDENTIAL TRACE:');
  const graph = KnowledgeGraph.buildGraph();
  const state: any = await graph.invoke({
    userQuery: rawQuery,
    authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
    mode: 'HYBRID',
    isWebAccessEnabled: true,
  });

  console.log('   Final Classified Intent: ', state.intentCategory);
  console.log('   Citations count:          ', state.citations?.length || 0);
  console.log('   Final LLM Answer:\n');
  console.log(state.finalAnswer);
  console.log('\n======================================================================');
}

auditAppleQuery().catch(console.error);
