import { DuckDuckGoSearchProvider } from '../infrastructure/search/WebSearchProvider';

async function testDDGDirectly() {
  const query = "who is pm of india today";
  console.log(`Testing query: "${query}"`);
  
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  console.log(`URL: ${url}`);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Content Type: ${res.headers.get('content-type')}`);
    const html = await res.text();
    console.log(`HTML Length: ${html.length}`);
    console.log(`Contains 'result__a': ${html.includes('result__a')}`);
    console.log(`Contains 'result__snippet': ${html.includes('result__snippet')}`);
    console.log(`Contains 'Forbidden' or 'Anomaly': ${html.includes('Forbidden') || html.includes('anomaly') || html.includes('captcha')}`);
    
    const provider = new DuckDuckGoSearchProvider();
    const results = await provider.search(query, 5);
    console.log(`Direct provider result count: ${results.length}`);
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (err: any) {
    console.error('Fetch Error:', err);
  }
}

testDDGDirectly();
