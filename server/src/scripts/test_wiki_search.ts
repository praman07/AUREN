async function testWikipediaSearch(query: string) {
  console.log(`Searching Wikipedia for: "${query}"`);
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    const data: any = await res.json();
    const searchItems = data.query?.search || [];
    console.log(`Wiki results count: ${searchItems.length}`);
    if (searchItems.length > 0) {
      console.log('Sample:', searchItems[0]);
    }
  } catch (err: any) {
    console.error('Wiki Error:', err);
  }
}

testWikipediaSearch("who is current president of india");
