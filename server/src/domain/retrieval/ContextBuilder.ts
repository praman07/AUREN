import { RetrievedChunk, ContextWindow } from './types';

export class ContextBuilder {
  public buildContextWindow(chunks: RetrievedChunk[], maxTokens: number = 3000): ContextWindow {
    let currentTokens = 0;
    const selectedChunks: RetrievedChunk[] = [];
    const citations = new Set<string>();

    for (const chunk of chunks) {
      // Rough approximation: 1 token ~= 4 chars
      const chunkTokens = Math.ceil(chunk.content.length / 4);
      
      if (currentTokens + chunkTokens > maxTokens) {
        break; // Stop if we hit the token limit
      }
      
      selectedChunks.push(chunk);
      currentTokens += chunkTokens;
      citations.add(`[Doc ${chunk.documentId}, Pg ${chunk.metadata?.page || 1}]`);
    }

    // Sort selected chunks by Document ID and Page to preserve narrative flow
    selectedChunks.sort((a, b) => {
      if (a.documentId === b.documentId) {
        return (a.metadata?.page || 0) - (b.metadata?.page || 0);
      }
      return a.documentId.localeCompare(b.documentId);
    });

    const text = selectedChunks.map(c => `--- Source: Doc ${c.documentId} ---\n${c.content}\n`).join('\n');

    return {
      text,
      tokens: currentTokens,
      citations: Array.from(citations)
    };
  }
}
