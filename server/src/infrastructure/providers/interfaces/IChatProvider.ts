export interface ChatOptions {
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  numPredict?: number;
  numCtx?: number;
  format?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IChatProvider {
  getChatModel(options?: ChatOptions): any;
  streamChat(messages: (ChatMessage | any)[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;
  getModelConfig?(options?: ChatOptions): any;
}
