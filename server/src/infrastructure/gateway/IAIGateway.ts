import { AICapability, InferenceRequest, InferenceResponse } from './types';
import { ChatOptions } from '../providers/interfaces/IChatProvider';

export interface IAIGateway {
  execute<TRequest, TResponse>(request: InferenceRequest<TRequest>): Promise<InferenceResponse<TResponse>>;
  executeStream?<TRequest, TChunk>(request: InferenceRequest<TRequest>): AsyncGenerator<TChunk, void, unknown>;
  getChatModel(options?: ChatOptions): any;
  streamChat(messages: any[], options?: ChatOptions): Promise<AsyncGenerator<string, void, unknown>> | AsyncGenerator<string, void, unknown>;
  getModelConfig?(options?: ChatOptions): any;
}
