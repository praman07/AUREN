import { ContextPacker } from '../domain/retrieval/ContextPacker';

describe('ContextPacker', () => {
  describe('estimateTokens', () => {
    it('returns 0 for empty string', () => {
      expect(ContextPacker.estimateTokens('')).toBe(0);
    });

    it('estimates tokens using ~3.5 chars per token', () => {
      const text = 'Hello world, this is a test chunk for token packing.'; // 52 chars
      const expected = Math.ceil(52 / 3.5); // 15 tokens
      expect(ContextPacker.estimateTokens(text)).toBe(expected);
    });
  });

  describe('calculateAvailableBudget', () => {
    it('calculates net available token budget correctly', () => {
      const budget = ContextPacker.calculateAvailableBudget({
        modelContextWindow: 4096,
        reservedOutputTokens: 512,
        safetyMarginTokens: 100,
        systemPromptOverhead: 1000
      });
      // 4096 - 512 - 100 - 1000 = 2484
      expect(budget).toBe(2484);
    });

    it('returns 0 if overhead exceeds context window', () => {
      const budget = ContextPacker.calculateAvailableBudget({
        modelContextWindow: 1000,
        reservedOutputTokens: 512,
        safetyMarginTokens: 100,
        systemPromptOverhead: 500
      });
      expect(budget).toBe(0);
    });
  });

  describe('packChunks', () => {
    const sampleChunks = [
      {
        content: 'Low score chunk content with some text.',
        metadata: { title: 'Doc A', chunkIndex: 0, score: 0.5 }
      },
      {
        content: 'High score priority chunk content with critical info.',
        metadata: { title: 'Doc B', chunkIndex: 1, score: 0.95 }
      },
      {
        content: 'Medium score chunk content with additional context.',
        metadata: { title: 'Doc C', chunkIndex: 2, score: 0.75 }
      }
    ];

    it('packs all chunks when budget is ample', () => {
      const result = ContextPacker.packChunks(sampleChunks, { availableBudgetTokens: 2000 });
      expect(result.packedCount).toBe(3);
      expect(result.droppedCount).toBe(0);
      expect(result.formattedContext).toContain('Doc B');
      expect(result.formattedContext).toContain('Doc C');
      expect(result.formattedContext).toContain('Doc A');
    });

    it('prioritizes highest scoring chunks and drops low scoring chunks when budget is constrained', () => {
      // Calculate token cost of top chunk (Doc B)
      const docBFormatted = ContextPacker.formatChunk(sampleChunks[1], 0);
      const docBTokens = ContextPacker.estimateTokens(docBFormatted);

      // Set budget just enough for Doc B
      const result = ContextPacker.packChunks(sampleChunks, { availableBudgetTokens: docBTokens + 5 });

      expect(result.packedCount).toBe(1);
      expect(result.droppedCount).toBe(2);
      expect(result.packedChunks[0].metadata.title).toBe('Doc B');
      expect(result.droppedChunks.map(c => c.metadata.title)).toEqual(['Doc C', 'Doc A']);
    });
  });
});
