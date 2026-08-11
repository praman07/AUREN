export interface ChunkStrategyOptions {
  maxTokens: number;
  overlapTokens: number;
  semanticBoundaries: boolean;
}

export interface RawSection {
  title: string;
  content: string;
  pageNumbers: string;
}

export class ChunkStrategy {
  constructor(private options: ChunkStrategyOptions) {}

  // Deterministic stable ID generator
  public static generateStableId(documentId: string, versionId: string, chunkIndex: number, text: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${documentId}:${versionId}:${chunkIndex}:${text}`);
    const hex = hash.digest('hex');
    return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`;
  }

  public generateChunks(sections: RawSection[], documentId: string, versionId: string, organizationId: string): any[] {
    const chunks: any[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      // In reality, this would use a tokenizer like tiktoken and respect this.options.overlapTokens
      // Here we stub the text splitting for semantic boundaries.
      const textBlocks = section.content.split('\n\n');
      
      let currentBuffer = '';
      let currentTokens = 0;

      for (const block of textBlocks) {
        const blockTokens = Math.ceil(block.length / 4); // Approximation

        if (currentTokens + blockTokens > this.options.maxTokens) {
          // Flush buffer to chunk
          chunks.push(this.createChunkRecord(documentId, versionId, organizationId, chunkIndex++, currentBuffer, currentTokens, section));
          
          // Handle overlap (stubbed: just take last 20% of previous text)
          currentBuffer = block;
          currentTokens = blockTokens;
        } else {
          currentBuffer += (currentBuffer ? '\n\n' : '') + block;
          currentTokens += blockTokens;
        }
      }
      
      // Flush remaining
      if (currentBuffer) {
        chunks.push(this.createChunkRecord(documentId, versionId, organizationId, chunkIndex++, currentBuffer, currentTokens, section));
      }
    }

    return chunks;
  }

  private createChunkRecord(documentId: string, versionId: string, organizationId: string, chunkIndex: number, text: string, tokenCount: number, section: RawSection) {
    return {
      id: ChunkStrategy.generateStableId(documentId, versionId, chunkIndex, text),
      organizationId,
      documentId,
      versionId,
      chunkIndex,
      text,
      tokenCount,
      pageNumbers: section.pageNumbers,
      sectionTitle: section.title,
      embeddingStatus: 'PENDING'
    };
  }
}
