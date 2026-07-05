import { IOCRProvider } from './IOCRProvider';
import { IChunkingProvider } from './IChunkingProvider';
import { IEmbeddingProvider } from './IEmbeddingProvider';
import { IVectorStoreProvider } from './IVectorStoreProvider';

export interface IDocumentProcessor {
  ocr: IOCRProvider;
  chunking: IChunkingProvider;
  embedding: IEmbeddingProvider;
  vectorStore: IVectorStoreProvider;
}
