import { getOllamaChatModel } from '../ai/models/OllamaModel';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

async function testModel(modelName: string) {
  console.log(`--- Testing model: ${modelName} ---`);
  const llm = getOllamaChatModel({ modelName });
  console.log("Invoking stream...");
  try {
    const stream = await llm.stream([
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage("Hello, who are you and what is your model name?")
    ]);
    console.log("Stream received. Reading chunks:");
    let full = '';
    for await (const chunk of stream) {
      console.log("CHUNK:", JSON.stringify(chunk.content));
      full += chunk.content;
    }
    console.log("Full text:", full);
  } catch (err: any) {
    console.error("Error invoking stream:", err);
  }
}

async function main() {
  await testModel('qwen3.5:9b-q4_K_M');
  await testModel('ornith:9b');
  await testModel('gemma4:latest');
  await testModel('qwen2.5:14b');
}

main();
