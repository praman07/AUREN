import { IChatProvider, ChatOptions, ChatMessage } from '../../interfaces/IChatProvider';
import { getOllamaChatModel, getOllamaModelConfig } from '../../../../ai/models/OllamaModel';

export { ChatMessage, ChatOptions };

export class OllamaChatProvider implements IChatProvider {
  /**
   * Returns a configured ChatOllama instance for the given options.
   */
  public getChatModel(options: ChatOptions = {}) {
    return getOllamaChatModel({
      baseUrl: options.baseUrl || process.env.LLM_BASE_URL || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_URL,
      modelName: options.modelName,
      temperature: options.temperature,
      numPredict: options.numPredict,
      numCtx: options.numCtx,
      format: options.format
    });
  }

  /**
   * Returns model configuration (including numCtx and resolved model name) for budget calculations.
   */
  public getModelConfig(options: ChatOptions = {}) {
    return getOllamaModelConfig({
      baseUrl: options.baseUrl || process.env.LLM_BASE_URL || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_URL,
      modelName: options.modelName,
      temperature: options.temperature,
      numPredict: options.numPredict,
      numCtx: options.numCtx,
      format: options.format
    });
  }

  /**
   * Streams chat completion token-by-token.
   */
  public async *streamChat(messages: (ChatMessage | any)[], options: ChatOptions = {}): AsyncGenerator<string, void, unknown> {
    const model = this.getChatModel(options);
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const token = typeof chunk.content === 'string' ? chunk.content : String(chunk.content || '');
      yield token;
    }
  }
}
