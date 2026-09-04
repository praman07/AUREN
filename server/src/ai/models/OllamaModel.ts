import { ChatOllama } from '@langchain/ollama';
import { fetch as undiciFetch, Agent } from 'undici';

export interface OllamaModelOptions {
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  numPredict?: number;
  numCtx?: number;
  format?: string;
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

export const DEFAULT_OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 4096;

export interface OllamaModelConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  numCtx: number;
  numPredict?: number;
  format?: string;
}

export const getOllamaModelConfig = (options: OllamaModelOptions = {}): OllamaModelConfig => {
  const baseUrl = options.baseUrl || process.env.LLM_BASE_URL || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
  
  let model = options.modelName || process.env.OLLAMA_MODEL || 'qwen2.5:14b';
  if (options.modelName === 'FAST') {
    model = process.env.OLLAMA_MODEL_FAST || 'qwen3.5:9b-q4_K_M';
  } else if (options.modelName === 'DEEP') {
    model = process.env.OLLAMA_MODEL || 'qwen2.5:14b';
  }

  const temperature = options.temperature ?? 0.1;
  const numCtx = options.numCtx ?? DEFAULT_OLLAMA_NUM_CTX;

  return {
    baseUrl,
    model,
    temperature,
    numCtx,
    ...(options.numPredict !== undefined ? { numPredict: options.numPredict } : {}),
    ...(options.format ? { format: options.format } : {})
  };
};

export const getOllamaChatModel = (options: OllamaModelOptions = {}): ChatOllama => {
  const config = getOllamaModelConfig(options);

  return new ChatOllama({
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.temperature,
    numCtx: config.numCtx,
    ...(config.format ? { format: config.format } : {}),
    ...(config.numPredict !== undefined ? { numPredict: config.numPredict } : {}),
    // @ts-ignore
    fetch: customFetch
  });
};
