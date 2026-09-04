import { DuckDuckGoSearchProvider } from '../infrastructure/search/WebSearchProvider';

async function debugPresidentQuery() {
  const query = "who is current president of india";
  console.log(`Debugging query: "${query}"`);
  
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });
  
  const html = await res.text();
  console.log(`HTML Length: ${html.length}`);
  console.log(`HTML Snippet (first 1000 chars):\n${html.slice(0, 1000)}`);
  console.log(`Contains 'No results': ${html.includes('No results')}`);
  console.log(`Contains 'anomaly': ${html.includes('anomaly')}`);
  console.log(`Contains 'Forbidden': ${html.includes('Forbidden')}`);
  
  const snippetRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  const titleRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  const titles: { url: string; title: string }[] = [];
  let match;
  while ((match = titleRegex.exec(html)) !== null) {
    titles.push({ url: match[1], title: match[2].replace(/<[^>]+>/g, '').trim() });
  }

  let snippets: string[] = [];
  let snippetMatch;
  while ((snippetMatch = snippetRegex.exec(html)) !== null) {
    snippets.push(snippetMatch[2].replace(/<[^>]+>/g, '').trim());
  }

  console.log(`Titles found by regex: ${titles.length}`);
  console.log(`Snippets found by regex: ${snippets.length}`);
  
  if (titles.length > 0 && snippets.length === 0) {
    console.log('Sample title[0]:', titles[0]);
    // Let's see what snippet HTML looks like around title 0
    const firstTitleIndex = html.indexOf('result__a');
    console.log('HTML snippet around first title:', html.slice(firstTitleIndex, firstTitleIndex + 500));
  }
}

debugPresidentQuery();
