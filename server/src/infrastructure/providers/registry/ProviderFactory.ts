import { ProviderRegistry } from './ProviderRegistry';
import { CapabilityResolver } from './CapabilityResolver';

import { LocalOCRProvider } from '../adapters/ocr/LocalOCRProvider';
import { LlamaCppEmbeddingProvider } from '../adapters/embedding/LlamaCppEmbeddingProvider';
import { QdrantVectorStoreProvider } from '../adapters/vector/QdrantVectorStoreProvider';
import { LlamaCppChatProvider } from '../adapters/chat/LlamaCppChatProvider';
import { LlamaCppVisionProvider } from '../adapters/vision/LlamaCppVisionProvider';
import { IChatProvider } from '../interfaces/IChatProvider';
import { IEmbeddingProvider } from '../interfaces/IEmbeddingProvider';
import { IVisionProvider } from '../interfaces/IVisionProvider';

export class ProviderFactory {
  private registry: ProviderRegistry;

  constructor() {
    this.registry = new ProviderRegistry();
    this.registerDefaults();
  }

  private registerDefaults() {
    const localOcr = new LocalOCRProvider();
    const llamacppEmbedding = new LlamaCppEmbeddingProvider();
    const qdrantVector = new QdrantVectorStoreProvider();
    const llamacppChat = new LlamaCppChatProvider();
    const llamacppVision = new LlamaCppVisionProvider();

    this.registry.registerOCR('local', () => localOcr);
    this.registry.registerEmbedding('llamacpp', () => new LlamaCppEmbeddingProvider());
    this.registry.registerVectorStore('qdrant', () => qdrantVector);
    this.registry.registerChat('llamacpp', () => llamacppChat);
    this.registry.registerVision('llamacpp', () => llamacppVision);
  }

  getOCRProvider(name: string = process.env.OCR_PROVIDER || 'local') {
    const provider = this.registry.ocrProviders.get(name);
    if (!provider) throw new Error(`OCR Provider '${name}' not registered`);
    return provider();
  }

  getEmbeddingProvider(name: string = process.env.EMBEDDING_PROVIDER || 'llamacpp'): IEmbeddingProvider {
    const provider = this.registry.embeddingProviders.get(name);
    if (!provider) throw new Error(`Embedding Provider '${name}' not registered`);
    return provider();
  }

  getVectorStoreProvider(name: string = process.env.VECTOR_STORE_PROVIDER || 'qdrant') {
    const provider = this.registry.vectorStoreProviders.get(name);
    if (!provider) throw new Error(`Vector Store Provider '${name}' not registered`);
    return provider();
  }

  getChatProvider(name: string = process.env.LLM_PROVIDER || process.env.CHAT_PROVIDER || 'llamacpp'): IChatProvider {
    const provider = this.registry.chatProviders.get(name);
    if (!provider) throw new Error(`Chat Provider '${name}' not registered`);
    return provider();
  }

  getVisionProvider(name: string = process.env.VISION_PROVIDER || 'llamacpp'): IVisionProvider {
    const provider = this.registry.visionProviders.get(name);
    if (!provider) throw new Error(`Vision Provider '${name}' not registered`);
    return provider();
  }
}
