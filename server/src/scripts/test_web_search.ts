import { MultiSourceWebSearchProvider } from '../infrastructure/search/WebSearchProvider';

async function testWebSearch() {
  const provider = new MultiSourceWebSearchProvider();
  const query = 'use web and tell me about who is pm of india';
  console.log('Testing query:', query);
  const results = await provider.search(query, 5);
  console.log('Got results:', results.length);
  results.forEach((r, i) => {
    console.log(`[${i + 1}] Title: ${r.title}`);
    console.log(`    URL: ${r.url}`);
    console.log(`    Source: ${r.source}`);
    console.log(`    Snippet: ${r.snippet.substring(0, 100)}...`);
  });
}

testWebSearch();
