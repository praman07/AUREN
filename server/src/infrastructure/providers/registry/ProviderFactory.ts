import { ProviderRegistry } from './ProviderRegistry';
import { CapabilityResolver } from './CapabilityResolver';

import { LocalOCRProvider } from '../adapters/ocr/LocalOCRProvider';
import { OllamaEmbeddingProvider } from '../adapters/embedding/OllamaEmbeddingProvider';
import { QdrantVectorStoreProvider } from '../adapters/vector/QdrantVectorStoreProvider';

export class ProviderFactory {
  private registry: ProviderRegistry;

  constructor() {
    this.registry = new ProviderRegistry();
    this.registerDefaults();
  }

  private registerDefaults() {
    this.registry.registerOCR('local', () => new LocalOCRProvider());
    this.registry.registerEmbedding('ollama', () => new OllamaEmbeddingProvider());
    this.registry.registerVectorStore('qdrant', () => new QdrantVectorStoreProvider());
  }

  getOCRProvider(name: string = process.env.OCR_PROVIDER || 'local') {
    const provider = this.registry.ocrProviders.get(name);
    if (!provider) throw new Error(`OCR Provider '${name}' not registered`);
    return provider();
  }

  getEmbeddingProvider(name: string = process.env.EMBEDDING_PROVIDER || 'ollama') {
    const provider = this.registry.embeddingProviders.get(name);
    if (!provider) throw new Error(`Embedding Provider '${name}' not registered`);
    return provider();
  }

  getVectorStoreProvider(name: string = process.env.VECTOR_STORE_PROVIDER || 'qdrant') {
    const provider = this.registry.vectorStoreProviders.get(name);
    if (!provider) throw new Error(`Vector Store Provider '${name}' not registered`);
    return provider();
  }
}
