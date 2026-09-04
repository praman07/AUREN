import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';
import { AIGateway } from '../../infrastructure/gateway/AIGateway';

export class EmbeddingService {
  constructor(
    private readonly orchestrator: DocumentProcessingOrchestrator,
    private readonly aiGateway: AIGateway
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      // 1. Fetch chunks where embeddingStatus = PENDING
      const pendingChunks = await prisma.documentChunk.findMany({
        where: {
          versionId: payload.versionId,
          embeddingStatus: 'PENDING'
        },
        orderBy: { chunkIndex: 'asc' }
      });

      if (pendingChunks.length === 0) {
        // No chunks to process, just complete
        await this.orchestrator.handleEvent(PipelineEventType.EMBEDDING_COMPLETED, payload);
        return;
      }

      // 2. Process in batches to respect rate limits and memory
      const batchSize = 100; // configurable
      
      for (let i = 0; i < pendingChunks.length; i += batchSize) {
        const batch = pendingChunks.slice(i, i + batchSize);
        const texts = batch.map(c => c.text);

        // 3. Generate embeddings via AIGateway (no direct Ollama/OpenAI calls)
        const startTime = Date.now();
        const embeddingResult = await this.aiGateway.embed({
          texts,
          context: {
            organizationId: payload.organizationId,
            documentId: payload.documentId,
            userId: 'system'
          }
        });

        // 4. Validate embedding output structure
        if (!embeddingResult || !Array.isArray(embeddingResult.embeddings) || embeddingResult.embeddings.length !== batch.length) {
          throw new Error(`Embedding provider returned invalid response structure or mismatched batch length. Expected ${batch.length}, got ${embeddingResult?.embeddings?.length ?? 0}`);
        }

        // Validate each chunk's vector
        for (let idx = 0; idx < batch.length; idx++) {
          const vector = embeddingResult.embeddings[idx];
          if (!Array.isArray(vector) || vector.length === 0) {
            throw new Error(`Embedding provider returned empty or non-array vector for chunk ID ${batch[idx].id} at index ${idx}`);
          }
          if (embeddingResult.dimension && vector.length !== embeddingResult.dimension) {
            throw new Error(`Vector dimension mismatch for chunk ID ${batch[idx].id}: expected ${embeddingResult.dimension}, got ${vector.length}`);
          }
        }

        // 5. Update Database with validated vector data
        const updatePromises = batch.map((chunk, index) => {
          return prisma.documentChunk.update({
            where: { id: chunk.id },
            data: {
              embeddingStatus: 'COMPLETED',
              embeddingModel: embeddingResult.model,
              embeddingDim: embeddingResult.dimension || embeddingResult.embeddings[index].length,
              vectorData: embeddingResult.embeddings[index],
              metadata: {
                ...(typeof chunk.metadata === 'object' && chunk.metadata !== null ? chunk.metadata : {}),
                embeddedAt: new Date().toISOString(),
                processingDurationMs: Date.now() - startTime
              }
            }
          });
        });

        await prisma.$transaction(updatePromises);
      }

      // 5. Audit log
      await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          action: 'EMBEDDING_GENERATED' as any,
          resourceId: payload.versionId,
          metadata: {
            chunkCount: pendingChunks.length,
          }
        }
      });

      // 6. Emit EMBEDDING_COMPLETED
      await this.orchestrator.handleEvent(PipelineEventType.EMBEDDING_COMPLETED, payload);

    } catch (error: any) {
      console.error('Embedding Processing Failed:', error);
      
      // Update any pending chunks to FAILED state to prevent silent persistence of invalid states
      try {
        await prisma.documentChunk.updateMany({
          where: {
            versionId: payload.versionId,
            embeddingStatus: 'PENDING'
          },
          data: {
            embeddingStatus: 'FAILED'
          }
        });
      } catch (dbError) {
        console.error('Failed to update chunk status to FAILED:', dbError);
      }

      await this.orchestrator.handleEvent(PipelineEventType.EMBEDDING_FAILED, {
        ...payload,
        error: error.message
      });
      throw error; // Let BullMQ handle retries and circuit breaking
    }
  }
}
