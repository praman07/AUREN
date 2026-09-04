import { IChatProvider, ChatOptions, ChatMessage } from '../../interfaces/IChatProvider';
import { ChatOpenAI } from '@langchain/openai';
import { fetch as undiciFetch, Agent } from 'undici';

export { ChatMessage, ChatOptions };

export interface LlamaCppModelConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  numCtx: number;
  numPredict?: number;
}

const customDispatcher = new Agent({
  headersTimeout: 120000, // 120 seconds header timeout for local LLM inference
  bodyTimeout: 120000,
  connectTimeout: 30000
});

const customFetch = (input: any, init?: any) => {
  return undiciFetch(input, {
    ...init,
    dispatcher: customDispatcher
  });
};

export class LlamaCppChatProvider implements IChatProvider {
  /**
   * Resolves model configuration for llama-server.
   */
  public getModelConfig(options: ChatOptions = {}): LlamaCppModelConfig {
    const baseUrl = options.baseUrl || process.env.LLM_BASE_URL || process.env.LLAMACPP_BASE_URL || 'http://127.0.0.1:8080';
    
    let model: string;
    if (options.modelName === 'FAST') {
      model = process.env.LLAMACPP_MODEL_FAST || process.env.OLLAMA_MODEL_FAST || process.env.LLAMACPP_MODEL || process.env.OLLAMA_MODEL || 'default';
    } else if (options.modelName === 'DEEP') {
      model = process.env.LLAMACPP_MODEL || process.env.OLLAMA_MODEL || 'default';
    } else if (options.modelName) {
      model = options.modelName;
    } else {
      model = process.env.LLAMACPP_MODEL || process.env.OLLAMA_MODEL || 'default';
    }

    const temperature = options.temperature ?? 0.1;
    const numCtx = options.numCtx ?? Number(process.env.LLAMACPP_NUM_CTX) || Number(process.env.OLLAMA_NUM_CTX) || 4096;

    return {
      baseUrl,
      model,
      temperature,
      numCtx,
      ...(options.numPredict !== undefined ? { numPredict: options.numPredict } : {})
    };
  }

  /**
   * Returns a configured ChatOpenAI instance targeting llama-server's OpenAI-compatible HTTP API.
   */
  public getChatModel(options: ChatOptions = {}): ChatOpenAI {
    const config = this.getModelConfig(options);

    // Normalize base URL to include /v1 endpoint for llama-server OpenAI compatibility
    const cleanBaseUrl = config.baseUrl.endsWith('/v1')
      ? config.baseUrl
      : `${config.baseUrl.replace(/\/$/, '')}/v1`;

    return new ChatOpenAI({
      apiKey: 'no-key-required',
      configuration: {
        baseURL: cleanBaseUrl,
        fetch: customFetch
      },
      model: config.model,
      temperature: config.temperature,
      ...(config.numPredict !== undefined ? { maxTokens: config.numPredict } : {})
    });
  }

  /**
   * Streams chat completion token-by-token using llama-server HTTP SSE.
   */
  public async *streamChat(
    messages: (ChatMessage | any)[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = this.getChatModel(options);
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const token = typeof chunk.content === 'string' ? chunk.content : String(chunk.content || '');
      yield token;
    }
  }
}
