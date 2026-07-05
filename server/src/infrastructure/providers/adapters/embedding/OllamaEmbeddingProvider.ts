import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  async embedText(text: string): Promise<number[]> { return []; }
  async embedBatch(texts: string[]): Promise<number[][]> { return []; }
  getDimensions(): number { return 4096; }
}
