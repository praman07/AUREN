import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';

export class SentenceTransformerEmbeddingProvider implements IEmbeddingProvider {
  async embedText(text: string): Promise<number[]> { return []; }
  async embedBatch(texts: string[]): Promise<number[][]> { return []; }
  getDimensions(): number { return 384; }
}
