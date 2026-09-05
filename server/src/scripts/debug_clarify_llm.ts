import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

async function testClarifyLLM() {
  console.log('Testing clarifyWithUser LLM call directly...');
  const llm = new ProviderFactory().getChatProvider().getChatModel({ numPredict: 150, temperature: 0.1 });
  const start = Date.now();

  const clarifyWithUserInstructions = `You are a Research Scope Classifier. Decide: ask user for clarification (need_clarification=true), or proceed to research (need_clarification=false)?

Recent Context:
None
Current Query: "What is the population of Springfield?"
Today's Date: ${new Date().toISOString()}

RULES:
1. FULLY QUALIFIED OR SPECIFIC QUERY → need_clarification=false.
2. 2–3 PROMINENT INTERPRETATIONS (e.g. Congo, Georgia, Cambridge, Portland, Victoria, London) → need_clarification=false. Synthesis will answer for all.
3. 4+ EQUALLY PLAUSIBLE INTERPRETATIONS OR COMPLETE AMBIGUITY (e.g. Springfield, Jordan, Mercury laws) → need_clarification=true. Provide 2-4 options in 'options'.
4. Do NOT re-ask if history already answered.

Respond ONLY in valid JSON matching this schema:
{
  "need_clarification": boolean,
  "question": "string",
  "options": [{"label": "string", "description": "string", "value": "string"}]
}`;

  try {
    const res = await llm.invoke([
      new SystemMessage(clarifyWithUserInstructions),
      new HumanMessage("Output JSON assessment.")
    ]);
    const elapsed = Date.now() - start;
    console.log(`LLM call finished in ${elapsed}ms`);
    console.log('Raw output content:', res.content);
  } catch (err) {
    console.error('LLM call failed:', err);
  }
}

testClarifyLLM();
