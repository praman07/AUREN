import { SearXNGSearchProvider, sanitizeSearchQuery } from '../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';
import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import { validateAndRankEvidence } from '../infrastructure/search/EvidenceValidator';

async function auditNvidiaQuery() {
  console.log('======================================================================');
  console.log('  PIPELINE AUDIT: "What is the current stock price of NVIDIA?"');
  console.log('======================================================================\n');

  const rawQuery = "What is the current stock price of NVIDIA?";
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
    console.log(`       Snippet:   ${r.snippet.slice(0, 150)}...\n`);
  });

  const urlsToCrawl = searchResults.slice(0, 4).map(r => r.url);
  console.log('3. URLS SELECTED FOR CRAWLING:');
  urlsToCrawl.forEach(u => console.log(`   • ${u}`));
  console.log('');

  const crawlResults = await crawlUrls(urlsToCrawl);

  console.log('4. CRAWL4AI EXTRACTION RESULTS:');
  crawlResults.forEach((c, idx) => {
    console.log(`\n   --- [Page ${idx + 1}] ${c.url} ---`);
    console.log(`       Success:         ${c.success}`);
    console.log(`       Extraction Mode: ${c.source}`);
    console.log(`       Extracted Chars: ${c.contentLength}`);

    if (c.success) {
      const priceMatches = c.content.match(/\$\s*\d{2,4}(?:\.\d{2})?/g) || [];
      console.log(`       Dollar Prices Found (${priceMatches.length}): ${priceMatches.slice(0, 10).join(', ')}`);
      console.log('       Content Snippet (first 400 chars):');
      console.log(`       ${c.content.slice(0, 400).replace(/\n/g, ' ')}\n`);
    } else {
      console.log(`       Error: ${c.error}\n`);
    }
  });

  console.log('5. EVIDENCE VALIDATION & EXTRACTION AUDIT:');
  const rawResultsForValidation = searchResults.map(r => {
    const crawled = crawlResults.find(c => c.url === r.url);
    return {
      url: r.url,
      title: r.title,
      snippet: r.snippet,
      extractedContent: crawled?.content,
      crawlSuccess: crawled?.success || false
    };
  });

  const { telemetry, validatedEvidence } = validateAndRankEvidence(rawQuery, rawResultsForValidation);
  console.log('   Validated Evidence Items Count:', validatedEvidence.length);
  validatedEvidence.forEach((ev, idx) => {
    console.log(`   [Evidence ${idx + 1}]`);
    console.log(`       Source Title:       ${ev.sourceTitle}`);
    console.log(`       Source URL:         ${ev.sourceUrl}`);
    console.log(`       Confidence:         ${ev.confidence}`);
    console.log(`       Extracted Value:    ${ev.extractedValue}`);
    console.log(`       Extracted Numeric:  ${ev.extractedNumeric}`);
    console.log(`       Extracted Currency: ${ev.extractedCurrency}`);
    console.log(`       Supporting Text:    "${ev.evidenceText}"\n`);
  });

  console.log('6. FULL GRAPH EXECUTION & OLLAMA SYNTHESIS TRACE:');
  const graph = KnowledgeGraph.buildGraph();
  const state: any = await graph.invoke({
    userQuery: rawQuery,
    authContext: { organizationId: 'test-org-e2e', userId: 'admin', roles: ['admin'] },
    mode: 'HYBRID',
    isWebAccessEnabled: true,
  });

  console.log('   Final Classified Intent: ', state.intentCategory);
  console.log('   Validated Evidence count: ', state.validatedEvidence?.length || 0);
  console.log('   Citations count:          ', state.citations?.length || 0);
  console.log('   Final LLM Answer:\n');
  console.log(state.finalAnswer);
  console.log('\n======================================================================');
}

auditNvidiaQuery().catch(console.error);
