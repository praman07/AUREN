import { ContextWindow, PromptContext } from './types';

export class PromptBuilder {
  public build(userQuery: string, contextWindow: ContextWindow, systemInstructions: string = 'You are a helpful enterprise AI.'): PromptContext {
    const fullPrompt = `${systemInstructions}

CONTEXT:
${contextWindow.text}

USER QUESTION:
${userQuery}`;

    return {
      systemInstruction: systemInstructions,
      contextBlock: contextWindow.text,
      userQuery,
      fullPrompt
    };
  }
}
