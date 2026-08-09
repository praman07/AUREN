import { IAIGateway } from './IAIGateway';
import { AICapability, InferenceRequest, InferenceResponse, InferenceContext } from './types';
import { ProviderFactory } from '../providers/registry/ProviderFactory';
import { CircuitBreaker } from './CircuitBreaker';

export class AIGateway implements IAIGateway {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(private readonly providerFactory: ProviderFactory) {}

  private getCircuitBreaker(providerName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(providerName)) {
      this.circuitBreakers.set(providerName, new CircuitBreaker(5, 60000));
    }
    return this.circuitBreakers.get(providerName)!;
  }

  public async execute<TRequest, TResponse>(request: InferenceRequest<TRequest>): Promise<InferenceResponse<TResponse>> {
    const startTime = Date.now();
    const fullContext: InferenceContext = {
      ...request.context,
      timestamp: new Date()
    };

    try {
      const result = await this.routeRequest<TRequest, TResponse>(request.capability, request.payload, fullContext, false);
      
      fullContext.latencyMs = Date.now() - startTime;
      // Telemetry would be logged here
      
      return {
        result,
        context: fullContext
      };
    } catch (error) {
      if (request.fallbackAllowed) {
        console.warn(`Primary provider failed, attempting fallback for capability: ${request.capability}`);
        const fallbackResult = await this.routeRequest<TRequest, TResponse>(request.capability, request.payload, fullContext, true);
        
        fullContext.latencyMs = Date.now() - startTime;
        return {
          result: fallbackResult,
          context: fullContext
        };
      }
      throw error;
    }
  }

  private async routeRequest<TRequest, TResponse>(
    capability: AICapability, 
    payload: TRequest, 
    context: InferenceContext, 
    isFallback: boolean
  ): Promise<TResponse> {
    
    let provider: any;
    let providerName = '';

    // Resolve concrete provider through Factory
    switch (capability) {
      case AICapability.EMBEDDING:
        // Normally env vars dictate this, here we mock a fallback logic
        providerName = isFallback ? 'ollama' : (process.env.EMBEDDING_PROVIDER || 'local');
        provider = this.providerFactory.getEmbeddingProvider(providerName);
        context.providerUsed = providerName;
        
        const breaker = this.getCircuitBreaker(providerName);
        return await breaker.execute(async () => {
          // Using exact payload signature depending on capability (this is abstract)
          const text = payload as unknown as string;
          return (await provider.embedText(text)) as unknown as TResponse;
        });
        
      case AICapability.OCR:
        providerName = isFallback ? 'local' : (process.env.OCR_PROVIDER || 'local');
        provider = this.providerFactory.getOCRProvider(providerName);
        context.providerUsed = providerName;
        
        const ocrBreaker = this.getCircuitBreaker(providerName);
        return await ocrBreaker.execute(async () => {
          const { buffer, mimeType } = payload as any;
          return (await provider.extractText(buffer, mimeType)) as unknown as TResponse;
        });

      default:
        throw new Error(`Capability ${capability} is not implemented in Gateway routing`);
    }
  }

  public async streamChat(request: { messages: any[], context: any }): Promise<AsyncGenerator<string, void, unknown>> {
    const providerName = process.env.CHAT_PROVIDER || 'ollama';
    const provider = this.providerFactory.getChatProvider(providerName);
    return provider.streamChat(request.messages);
  }

  public async embed(request: { texts: string[], context: any }): Promise<{ model: string, dimension: number, embeddings: number[][] }> {
    const providerName = process.env.EMBEDDING_PROVIDER || 'ollama';
    const provider = this.providerFactory.getEmbeddingProvider(providerName);
    const embeddings = await provider.embedBatch(request.texts);
    return {
      model: providerName,
      dimension: provider.getDimensions(),
      embeddings
    };
  }
}

