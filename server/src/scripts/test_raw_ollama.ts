import http from 'http';

function testOllama(query: string) {
  return new Promise((resolve, reject) => {
    const prompt = `System: You are an ambiguity detector. Determine if the user query refers to an ambiguous location, entity, or person with multiple distinct meanings (e.g. Georgia state vs country, Congo Republic vs DRC, Punjab India vs Pakistan).
DO NOT mark as ambiguous if query context is clear (e.g. "Prime Minister of India", "Bitcoin price").

User Query: "${query}"

Respond strictly with a JSON object:
{
  "isAmbiguous": true or false,
  "question": "Clarifying question or empty string",
  "options": [
    { "label": "Short label", "value": "Refined query text", "description": "Brief context" }
  ]
}`;

    const start = Date.now();
    const postData = JSON.stringify({
      model: 'qwen2.5:14b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 250
      }
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Took: ${Date.now() - start}ms`);
        try {
          const json = JSON.parse(data);
          resolve(json.response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const queries = [
    'What is the current capital of Georgia?',
    'Who is the current President of Congo?',
    'Who is the current Prime Minister of India?',
    'What is Apple stock price today?'
  ];

  for (const q of queries) {
    console.log('\n--- QUERY:', q);
    const resp = await testOllama(q);
    console.log('RESPONSE:\n', resp);
  }
}

main().catch(console.error);
