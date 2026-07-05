import { IOCRProvider } from '../interfaces/IOCRProvider';
import { IEmbeddingProvider } from '../interfaces/IEmbeddingProvider';
import { IVectorStoreProvider } from '../interfaces/IVectorStoreProvider';

export class ProviderRegistry {
  public readonly ocrProviders = new Map<string, () => IOCRProvider>();
  public readonly embeddingProviders = new Map<string, () => IEmbeddingProvider>();
  public readonly vectorStoreProviders = new Map<string, () => IVectorStoreProvider>();

  registerOCR(name: string, constructor: () => IOCRProvider) {
    this.ocrProviders.set(name, constructor);
  }

  registerEmbedding(name: string, constructor: () => IEmbeddingProvider) {
    this.embeddingProviders.set(name, constructor);
  }

  registerVectorStore(name: string, constructor: () => IVectorStoreProvider) {
    this.vectorStoreProviders.set(name, constructor);
  }
}
