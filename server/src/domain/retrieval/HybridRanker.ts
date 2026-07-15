import { RetrievedChunk } from './types';

export class HybridRanker {
  public rankAndMerge(vectorChunks: RetrievedChunk[], keywordChunks: RetrievedChunk[], limit: number): RetrievedChunk[] {
    const merged = new Map<string, RetrievedChunk>();

    // Process Vector Chunks
    for (const chunk of vectorChunks) {
      merged.set(chunk.id, chunk);
    }

    // Process Keyword Chunks
    for (const chunk of keywordChunks) {
      if (merged.has(chunk.id)) {
        const existing = merged.get(chunk.id)!;
        existing.keywordScore = chunk.keywordScore;
      } else {
        merged.set(chunk.id, chunk);
      }
    }

    const scoredChunks = Array.from(merged.values()).map(chunk => {
      // Cross-Encoder/Weighted math simulation
      const alpha = 0.7; // Vector weight
      const beta = 0.3;  // Keyword weight
      
      // Normalize scores (simplified)
      chunk.score = (chunk.vectorScore * alpha) + (chunk.keywordScore * beta);
      
      // Apply Recency Boost if needed based on chunk.metadata.createdAt
      return chunk;
    });

    // Sort descending by calculated hybrid score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, limit);
  }
}
