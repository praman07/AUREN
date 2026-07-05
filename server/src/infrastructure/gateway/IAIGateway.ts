import { AICapability, InferenceRequest, InferenceResponse } from './types';

export interface IAIGateway {
  execute<TRequest, TResponse>(request: InferenceRequest<TRequest>): Promise<InferenceResponse<TResponse>>;
  executeStream?<TRequest, TChunk>(request: InferenceRequest<TRequest>): AsyncGenerator<TChunk, void, unknown>;
}
