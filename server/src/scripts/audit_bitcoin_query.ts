import { SearXNGSearchProvider, sanitizeSearchQuery } from '../infrastructure/search/WebSearchProvider';
import { crawlUrls } from '../infrastructure/search/Crawl4AIProvider';
import { KnowledgeGraph } from '../ai/graph/KnowledgeGraph';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function auditBitcoinQuery() {
  const query = "How did Bitcoin perform this month compared with last month?";
  console.log('======================================================================');
  console.log(`  PIPELINE AUDIT: "${query}"`);
  console.log('======================================================================\n');

  const sanitized = sanitizeSearchQuery(query);
  console.log('1. EXACT SEARCH QUERY SENT TO SEARXNG:');
  console.log(`   Raw:       "${query}"`);
  console.log(`   Sanitized: "${sanitized}"\n`);

  const provider = new SearXNGSearchProvider();
  const searchResults = await provider.search(sanitized, 8);

  console.log('2. ALL RETURNED URLS & SEARXNG METADATA:');
  searchResults.forEach((r, idx) => {
    console.log(`   [${idx + 1}] Title:     ${r.title}`);
    console.log(`       URL:       ${r.url}`);
    console.log(`       Source:    ${r.source}`);
    console.log(`       Snippet:   ${r.snippet.slice(0, 150)}...\n`);
  });

  const urlsToCrawl = searchResults.slice(0, 4).map(r => r.url);
  console.log('3. URLS SELECTED FOR CRAWLING:');
  urlsToCrawl.forEach(u => console.log(`   • ${u}`));
  console.log('');

  const crawlResults = await crawlUrls(urlsToCrawl);
  console.log('4. CRAWL4AI RESULTS:');
  crawlResults.forEach((c, idx) => {
    console.log(`   [${idx + 1}] URL: ${c.url}`);
    console.log(`       Success: ${c.success}, Length: ${c.contentLength}`);
    if (c.success) {
      console.log(`       Content snippet: ${c.content.slice(0, 250).replace(/\n/g, ' ')}\n`);
    } else {
      console.log(`       Error: ${c.error}\n`);
    }
  });

  console.log('5. FULL KNOWLEDGE GRAPH EXECUTION:');
  const graph = KnowledgeGraph.buildGraph();
  const state: any = await graph.invoke({
    userQuery: query,
    rawUserQuery: query,
    messages: [],
    authContext: { organizationId: 'audit-org', userId: 'audit-admin', roles: ['ADMIN'] },
    mode: 'HYBRID',
    isWebAccessEnabled: true,
  });

  console.log('   Resolved Query:  ', state.resolvedQuery);
  console.log('   Intent Category: ', state.intentCategory);
  console.log('   Research Brief:  ', state.researchBrief);
  console.log('   Citations count: ', state.citations?.length || 0);
  console.log('\n6. FINAL ANSWER:\n');
  console.log(state.finalAnswer);
  console.log('\n======================================================================');
}

auditBitcoinQuery().catch(console.error);
