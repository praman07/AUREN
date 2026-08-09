import { ProviderRegistry } from './ProviderRegistry';
import { CapabilityResolver } from './CapabilityResolver';

import { LocalOCRProvider } from '../adapters/ocr/LocalOCRProvider';
import { OllamaEmbeddingProvider } from '../adapters/embedding/OllamaEmbeddingProvider';
import { QdrantVectorStoreProvider } from '../adapters/vector/QdrantVectorStoreProvider';
import { OllamaChatProvider } from '../adapters/chat/OllamaChatProvider';

export class ProviderFactory {
  private registry: ProviderRegistry;

  constructor() {
    this.registry = new ProviderRegistry();
    this.registerDefaults();
  }

  private registerDefaults() {
    const localOcr = new LocalOCRProvider();
    const ollamaEmbedding = new OllamaEmbeddingProvider();
    const qdrantVector = new QdrantVectorStoreProvider();
    const ollamaChat = new OllamaChatProvider();

    this.registry.registerOCR('local', () => localOcr);
    this.registry.registerEmbedding('ollama', () => ollamaEmbedding);
    this.registry.registerVectorStore('qdrant', () => qdrantVector);
    this.registry.registerChat('ollama', () => ollamaChat);
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

  getChatProvider(name: string = process.env.CHAT_PROVIDER || 'ollama') {
    const provider = this.registry.chatProviders.get(name);
    if (!provider) throw new Error(`Chat Provider '${name}' not registered`);
    return provider();
  }
}
