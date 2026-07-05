export interface DocumentChunk {
  content: string;
  metadata?: Record<string, any>;
}

export interface IChunkingProvider {
  chunkText(text: string): Promise<DocumentChunk[]>;
}
