import { IOCRProvider } from '../interfaces/IOCRProvider';
import { IEmbeddingProvider } from '../interfaces/IEmbeddingProvider';
import { IVectorStoreProvider } from '../interfaces/IVectorStoreProvider';
import { IChatProvider } from '../interfaces/IChatProvider';

export class ProviderRegistry {
  public readonly ocrProviders = new Map<string, () => IOCRProvider>();
  public readonly embeddingProviders = new Map<string, () => IEmbeddingProvider>();
  public readonly vectorStoreProviders = new Map<string, () => IVectorStoreProvider>();
  public readonly chatProviders = new Map<string, () => IChatProvider>();

  registerOCR(name: string, constructor: () => IOCRProvider) {
    this.ocrProviders.set(name, constructor);
  }

  registerEmbedding(name: string, constructor: () => IEmbeddingProvider) {
    this.embeddingProviders.set(name, constructor);
  }

  registerVectorStore(name: string, constructor: () => IVectorStoreProvider) {
    this.vectorStoreProviders.set(name, constructor);
  }

  registerChat(name: string, constructor: () => IChatProvider) {
    this.chatProviders.set(name, constructor);
  }
}
