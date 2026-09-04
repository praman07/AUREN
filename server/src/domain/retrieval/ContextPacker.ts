import { Document } from '@langchain/core/documents';

export interface ContextBudgetOptions {
  modelContextWindow?: number;   // e.g. 4096
  reservedOutputTokens?: number; // e.g. 1024 or 1536
  safetyMarginTokens?: number;   // e.g. 100
  systemPromptOverhead?: number; // estimated tokens of base instructions + prompt elements
}

export interface PackOptions {
  availableBudgetTokens: number;
}

export interface PackingResult {
  packedChunks: any[];
  droppedChunks: any[];
  totalTokensUsed: number;
  availableBudgetTokens: number;
  packedCount: number;
  droppedCount: number;
  formattedContext: string;
}

export class ContextPacker {
  /**
   * Fast token estimator optimized for BPE tokenization (e.g. Qwen / LLaMA).
   * Average ~3.5 characters per token for English text and structured markdown.
   */
  public static estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Calculates the token budget available specifically for internal document context.
   */
  public static calculateAvailableBudget(options: ContextBudgetOptions): number {
    const contextWindow = options.modelContextWindow ?? 4096;
    const outputReservation = options.reservedOutputTokens ?? 1024;
    const safetyMargin = options.safetyMarginTokens ?? 100;
    const systemOverhead = options.systemPromptOverhead ?? 0;

    const available = contextWindow - outputReservation - safetyMargin - systemOverhead;
    return Math.max(0, available);
  }

  /**
   * Formats a single document chunk as it will appear in the system prompt.
   */
  public static formatChunk(doc: any, index: number): string {
    const docTitle = doc.metadata?.title || doc.metadata?.documentName || 'Org Document';
    const chunkIdx = doc.metadata?.chunkIndex != null ? ` (chunk ${doc.metadata.chunkIndex})` : '';
    const docText = doc.pageContent || doc.content || '';
    return `[Doc ${index + 1}: ${docTitle}${chunkIdx}]\n${docText}\n\n`;
  }

  /**
   * Greedily packs authorized document chunks into the context window budget.
   * Chunks are sorted by score descending to prioritize high-value content.
   */
  public static packChunks(chunks: any[], options: PackOptions): PackingResult {
    if (!chunks || chunks.length === 0) {
      return {
        packedChunks: [],
        droppedChunks: [],
        totalTokensUsed: 0,
        availableBudgetTokens: options.availableBudgetTokens,
        packedCount: 0,
        droppedCount: 0,
        formattedContext: ''
      };
    }

    // Preserve authorized ranking order (sort by score descending if scores present)
    const sortedCandidates = [...chunks].sort((a, b) => {
      const scoreA = a.metadata?.score ?? 0;
      const scoreB = b.metadata?.score ?? 0;
      return scoreB - scoreA;
    });

    const packedChunks: Document[] = [];
    const droppedChunks: Document[] = [];
    let currentTokensUsed = 0;
    let formattedContext = '';

    for (let i = 0; i < sortedCandidates.length; i++) {
      const chunk = sortedCandidates[i];
      const chunkFormatted = ContextPacker.formatChunk(chunk, packedChunks.length);
      const chunkTokens = ContextPacker.estimateTokens(chunkFormatted);

      if (currentTokensUsed + chunkTokens <= options.availableBudgetTokens) {
        packedChunks.push(chunk);
        currentTokensUsed += chunkTokens;
        formattedContext += chunkFormatted;
      } else {
        droppedChunks.push(chunk);
      }
    }

    return {
      packedChunks,
      droppedChunks,
      totalTokensUsed: currentTokensUsed,
      availableBudgetTokens: options.availableBudgetTokens,
      packedCount: packedChunks.length,
      droppedCount: droppedChunks.length,
      formattedContext
    };
  }
}
