import { SearXNGSearchProvider } from '../infrastructure/search/WebSearchProvider';

async function testQueries() {
  const p = new SearXNGSearchProvider();
  const queries = [
    'AAPL stock price',
    'Apple Inc stock quote',
    'Apple stock price today',
    'AAPL quote finance',
    'What is Apple current stock price'
  ];

  for (const q of queries) {
    try {
      const res = await p.search(q, 5);
      console.log(`Query: "${q}" -> ${res.length} results`);
      if (res.length > 0) {
        console.log(`  Top 1: ${res[0].title} | ${res[0].url}`);
      }
    } catch (e: any) {
      console.log(`Query: "${q}" -> ERROR: ${e.message}`);
    }
  }
}

testQueries();
