import { IAIGateway } from './IAIGateway';
import { AICapability, InferenceRequest, InferenceResponse, InferenceContext } from './types';
import { ProviderFactory } from '../providers/registry/ProviderFactory';
import { CircuitBreaker } from './CircuitBreaker';
import { ChatOptions } from '../providers/interfaces/IChatProvider';

export class AIGateway implements IAIGateway {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(private readonly providerFactory: ProviderFactory = new ProviderFactory()) {}

  private getCircuitBreaker(providerName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(providerName)) {
      this.circuitBreakers.set(providerName, new CircuitBreaker(5, 60000));
    }
    return this.circuitBreakers.get(providerName)!;
  }

  public getChatModel(options: ChatOptions = {}): any {
    const providerName = process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp';
    const provider = this.providerFactory.getChatProvider(providerName);
    return provider.getChatModel(options);
  }

  public getModelConfig(options: ChatOptions = {}): any {
    const providerName = process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp';
    const provider = this.providerFactory.getChatProvider(providerName);
    return provider.getModelConfig ? provider.getModelConfig(options) : {};
  }

  public async streamChat(messages: any[], options: ChatOptions = {}): Promise<AsyncGenerator<string, void, unknown>> {
    const providerName = process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp';
    const provider = this.providerFactory.getChatProvider(providerName);
    return provider.streamChat(messages, options);
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

    switch (capability) {
      case AICapability.CHAT:
        providerName = process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp';
        provider = this.providerFactory.getChatProvider(providerName);
        context.providerUsed = providerName;
        
        const chatBreaker = this.getCircuitBreaker(providerName);
        return await chatBreaker.execute(async () => {
          const { messages, options } = payload as any;
          const model = provider.getChatModel(options);
          return (await model.invoke(messages)) as unknown as TResponse;
        });

      case AICapability.EMBEDDING:
        providerName = process.env.EMBEDDING_PROVIDER || 'llamacpp';
        provider = this.providerFactory.getEmbeddingProvider(providerName);
        context.providerUsed = providerName;
        
        const breaker = this.getCircuitBreaker(providerName);
        return await breaker.execute(async () => {
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

      case AICapability.VISION:
        providerName = isFallback ? 'llamacpp' : (process.env.VISION_PROVIDER || 'llamacpp');
        provider = this.providerFactory.getVisionProvider(providerName);
        context.providerUsed = providerName;

        const visionBreaker = this.getCircuitBreaker(providerName);
        return await visionBreaker.execute(async () => {
          return (await provider.analyzeImage(payload as any)) as unknown as TResponse;
        });

      default:
        throw new Error(`Capability ${capability} is not implemented in Gateway routing`);
    }
  }

  public async embed(request: { texts: string[], context: any }): Promise<{ model: string, dimension: number, embeddings: number[][] }> {
    const providerName = process.env.EMBEDDING_PROVIDER || 'llamacpp';
    const provider = this.providerFactory.getEmbeddingProvider(providerName);
    const embeddings = await provider.embedBatch(request.texts);
    return {
      model: providerName,
      dimension: provider.getDimensions(),
      embeddings
    };
  }

  public async analyzeImage(input: any): Promise<any> {
    const providerName = process.env.VISION_PROVIDER || 'llamacpp';
    const provider = this.providerFactory.getVisionProvider(providerName);
    return await provider.analyzeImage(input);
  }
}
