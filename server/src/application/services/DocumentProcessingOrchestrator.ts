import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { PipelineState } from '../../domain/state/ProcessingStateMachine';
import { PipelineStatusService } from './PipelineStatusService';
import { QueueManager } from '../../infrastructure/queue/QueueManager';
import { prisma } from '../../infrastructure/database/prisma';

export class DocumentProcessingOrchestrator {
  constructor(
    private readonly statusService: PipelineStatusService,
    private readonly queueManager: QueueManager
  ) {}

  public async handleEvent(eventType: PipelineEventType, payload: PipelineEventPayload): Promise<void> {
    switch (eventType) {
      case PipelineEventType.DOCUMENT_UPLOADED:
        await this.startPipeline(payload);
        break;
      case PipelineEventType.OCR_COMPLETED:
        await this.onOcrCompleted(payload);
        break;
      case PipelineEventType.OCR_FAILED:
        await this.failPipeline(payload, PipelineState.FAILED, 'OCR Failed');
        break;
      case PipelineEventType.CHUNKING_COMPLETED:
        await this.onChunkingCompleted(payload);
        break;
      case PipelineEventType.CHUNKING_FAILED:
        await this.failPipeline(payload, PipelineState.FAILED, 'Chunking Failed');
        break;
      case PipelineEventType.EMBEDDING_COMPLETED:
        await this.onEmbeddingCompleted(payload);
        break;
      case PipelineEventType.EMBEDDING_FAILED:
        await this.failPipeline(payload, PipelineState.PARTIALLY_FAILED, 'Embedding Failed');
        break;
      case PipelineEventType.INDEXING_COMPLETED:
        await this.onIndexingCompleted(payload);
        break;
      case PipelineEventType.INDEXING_FAILED:
        await this.failPipeline(payload, PipelineState.PARTIALLY_FAILED, 'Qdrant Indexing Failed');
        break;
      default:
        console.warn(`Orchestrator ignored unknown event: ${eventType}`);
    }
  }

  private async startPipeline(payload: PipelineEventPayload) {
    const s1 = await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.QUEUED);
    await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.OCR_PENDING, undefined, s1);
    await this.queueManager.ocrQueue.add('extract-text', payload);
  }

  private async onOcrCompleted(payload: PipelineEventPayload) {
    const s1 = await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.OCR_COMPLETED);
    await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.CHUNKING_PENDING, undefined, s1);
    await this.queueManager.chunkingQueue.add('create-chunks', payload);
  }

  private async onChunkingCompleted(payload: PipelineEventPayload) {
    const s1 = await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.CHUNKING_COMPLETED);
    await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.EMBEDDING_PENDING, undefined, s1);
    await this.queueManager.embeddingQueue.add('generate-embeddings', payload);
  }

  private async onEmbeddingCompleted(payload: PipelineEventPayload) {
    const s1 = await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.EMBEDDING_COMPLETED);
    await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.INDEXING_PENDING, undefined, s1);
    await this.queueManager.qdrantIndexingQueue.add('index-vectors', payload);
  }

  private async onIndexingCompleted(payload: PipelineEventPayload) {
    await this.statusService.transitionState(payload.documentId, payload.organizationId, PipelineState.READY);
  }

  private async failPipeline(payload: PipelineEventPayload, failureState: PipelineState, reason: string) {
    console.error(`[DocumentProcessingOrchestrator] Pipeline failed for doc ${payload.documentId}: ${reason}`, payload.error);
    await this.statusService.transitionState(payload.documentId, payload.organizationId, failureState, `${reason}: ${payload.error}`);
  }

  public async resumePipeline(documentId: string, organizationId: string): Promise<void> {
    const currentState = await this.statusService.getCurrentState(documentId);
    
    // Determine where to resume based on the last successful state
    // E.g. If FAILED but we know it finished OCR, jump straight to CHUNKING_PENDING
    // (Requires looking up the last successful processing job in reality)
    console.log(`Resuming pipeline for ${documentId} from state ${currentState}`);
  }

  public async reprocessFailedDocument(documentId: string, organizationId: string): Promise<{ status: string; chunksReset: number }> {
    const docVersion = await prisma.documentVersion.findFirst({
      where: { documentId, deletedAt: null },
      orderBy: { version: 'desc' }
    });

    if (!docVersion) {
      throw new Error(`No active document version found for document ${documentId}`);
    }

    // Reset chunks with FAILED embedding status back to PENDING
    const resetResult = await prisma.documentChunk.updateMany({
      where: {
        versionId: docVersion.id,
        embeddingStatus: 'FAILED'
      },
      data: {
        embeddingStatus: 'PENDING'
      }
    });

    const payload: PipelineEventPayload = {
      documentId,
      versionId: docVersion.id,
      organizationId
    };

    const totalChunks = await prisma.documentChunk.count({ where: { versionId: docVersion.id } });
    const pendingChunks = await prisma.documentChunk.count({ where: { versionId: docVersion.id, embeddingStatus: 'PENDING' } });
    const completedChunks = await prisma.documentChunk.count({ where: { versionId: docVersion.id, embeddingStatus: 'COMPLETED' } });

    if (totalChunks === 0) {
      await this.startPipeline(payload);
      return { status: 'RESTARTED_FROM_OCR', chunksReset: 0 };
    }

    if (pendingChunks > 0) {
      const s1 = await this.statusService.transitionState(documentId, organizationId, PipelineState.EMBEDDING_PENDING);
      await this.queueManager.embeddingQueue.add('generate-embeddings', payload);
      return { status: 'EMBEDDING_RETRIGGERED', chunksReset: resetResult.count };
    }

    if (completedChunks > 0) {
      const s1 = await this.statusService.transitionState(documentId, organizationId, PipelineState.INDEXING_PENDING);
      await this.queueManager.qdrantIndexingQueue.add('index-vectors', payload);
      return { status: 'INDEXING_RETRIGGERED', chunksReset: 0 };
    }

    return { status: 'NO_ACTION_REQUIRED', chunksReset: 0 };
  }

  public async cancelPipeline(documentId: string, organizationId: string): Promise<void> {
    await this.statusService.transitionState(documentId, organizationId, PipelineState.CANCELLED, 'Cancelled by user');
  }
}
