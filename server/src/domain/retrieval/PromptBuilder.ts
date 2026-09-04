import { ContextWindow, PromptContext } from './types';

export class PromptBuilder {
  public build(userQuery: string, contextWindow: ContextWindow, systemInstructions: string = 'You are EKOS Enterprise Knowledge Assistant.'): PromptContext {
    const strictGroundingInstructions = `${systemInstructions}

CRITICAL OPERATIONAL RULES:
1. You are a strict Enterprise Grounded Assistant.
2. Rely ONLY on the facts directly stated in the CONTEXT below. Do NOT assume, extrapolate, or use pretrained background knowledge for internal organizational questions.
3. If the CONTEXT is empty or does not contain enough information to answer the user's question, state clearly: "I could not find any relevant information in the authorized company documents to answer this question." Do NOT attempt to fabricate an answer.
4. Cite specific source titles or document IDs when providing facts.

CONTEXT:
${contextWindow.text || '(No internal documents found matching your authorization and query)'}

USER QUESTION:
${userQuery}`;

    return {
      systemInstruction: systemInstructions,
      contextBlock: contextWindow.text,
      userQuery,
      fullPrompt: strictGroundingInstructions
    };
  }
}

