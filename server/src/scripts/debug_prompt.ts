import http from 'http';

function callOllama(prompt: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const u = new URL('http://localhost:11434');
        const postData = JSON.stringify({
            model: 'qwen2.5:14b',
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.0,
                num_predict: 200
            }
        });

        const req = http.request({
            hostname: u.hostname,
            port: u.port || 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.response || '');
                } catch (e) {
                    reject(new Error(`Failed to parse Ollama response: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Ollama call timed out after ${timeoutMs}ms`));
        });

        req.write(postData);
        req.end();
    });
}

const queries = [
    "What is the current population of Cambridge?",
    "What is the current population of Cambridge, England?",
    "What is the population of Cambridge, Massachusetts?",
    "Who is the president of Georgia?",
    "What is the capital of Georgia, the country?",
    "What is the capital of Washington?",
    "Tell me about Java."
];

async function run() {
    for (const query of queries) {
        const prompt = `Task: Ambiguity Detection.
Analyze the user query: "${query}"

Determine if the query contains a proper noun (entity, location, organization, person) that has MULTIPLE well-known, materially different real-world referents, AND the user has not provided enough context to disambiguate.

CRITICAL RULES:
1. If the query already contains disambiguating context (e.g., "Cambridge, Massachusetts", "Georgia, the country", "Apple stock"), it is NOT ambiguous.
2. If it is reasonable to assume a default interpretation (e.g., "Java" -> programming language), it is NOT ambiguous.
3. If the query is ambiguous, you MUST provide selectable options.

Examples of ambiguity requiring clarification:
- "What is the population of Cambridge?" (Cambridge, UK vs Cambridge, Massachusetts)
- "Who is the president of Georgia?" (Country of Georgia vs US State of Georgia)
- "What is the capital of Washington?" (Washington State vs Washington, D.C.)

Examples of unambiguous queries (NO clarification needed):
- "What is the population of Cambridge, Massachusetts?" (Explicitly qualified)
- "What is the capital of Georgia, the country?" (Explicitly qualified)
- "Tell me about Java." (Safe to assume context)
- "What is Apple's stock price?" (Clear it's the company)

Respond strictly in this JSON format:
{
  "isAmbiguous": boolean,
  "reasoning": "brief explanation of why it is or isn't ambiguous",
  "question": "Clarifying question (if ambiguous)",
  "options": [
    { "label": "Short label", "value": "Full clarified query to replace the original", "description": "Brief context" }
  ]
}

Result JSON:`;
        
        console.log(`\nQuery: ${query}`);
        try {
            const res = await callOllama(prompt, 60000);
            console.log(res);
        } catch(e) {
            console.error(e);
        }
    }
}

run();
