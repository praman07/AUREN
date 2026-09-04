import { DuckDuckGoSearchProvider } from '../infrastructure/search/WebSearchProvider';

async function testQuery(query: string) {
  console.log(`\n========================================`);
  console.log(`Testing query: "${query}"`);
  const provider = new DuckDuckGoSearchProvider();
  const results = await provider.search(query, 5);
  console.log(`Result count: ${results.length}`);
  if (results.length > 0) {
    console.log(`First result title: "${results[0].title}"`);
    console.log(`First result snippet: "${results[0].snippet.slice(0, 100)}..."`);
  } else {
    console.log('Zero results returned!');
  }
}

async function runAll() {
  await testQuery('who is pm of india today');
  await testQuery('who is PM of India today');
  await testQuery('who is current president of india');
}

runAll();
