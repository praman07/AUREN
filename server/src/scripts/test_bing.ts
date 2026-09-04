import fetch from 'node-fetch';

async function testBing() {
  const query = 'current Prime Minister of India';
  const bingUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  try {
    const res = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    console.log('Bing status:', res.status);
    const html = await res.text();
    console.log('Bing HTML len:', html.length);
    const bAlgoRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
    const blocks = Array.from(html.matchAll(bAlgoRegex));
    console.log('b_algo blocks found:', blocks.length);
    blocks.slice(0, 5).forEach((b, i) => {
      const blockHtml = b[1];
      const aMatch = blockHtml.match(/<h2[^>]*>\s*<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
      const pMatch = blockHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || blockHtml.match(/<div class="b_caption"[^>]*>([\s\S]*?)<\/div>/i);
      const url = aMatch ? aMatch[1] : '';
      const title = aMatch ? aMatch[2].replace(/<[^>]+>/g, '').trim() : 'No title';
      const snippet = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim() : title;
      console.log(`[Result ${i}] ${title}`);
      console.log(`  URL: ${url}`);
      console.log(`  Snippet: ${snippet.substring(0, 120)}`);
    });


  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
testBing();
