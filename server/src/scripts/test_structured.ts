import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

async function testDirectOllama() {
  const model = 'qwen3.5:9b-q4_K_M';
  console.log(`Querying Ollama at ${baseUrl} using model ${model}...`);
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Say hello!' }
        ],
        stream: false
      })
    });
    const data = await response.json() as any;
    console.log("Direct Ollama response:", JSON.stringify(data));
  } catch (err: any) {
    console.error("Direct Ollama failed:", err.message);
  }
}

testDirectOllama();
