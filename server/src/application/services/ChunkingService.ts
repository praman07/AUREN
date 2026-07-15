import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';
import { ChunkStrategy } from '../../domain/chunking/ChunkStrategy';

export class ChunkingService {
  constructor(
    private readonly orchestrator: DocumentProcessingOrchestrator
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      // 1. Retrieve normalized raw text
      const docVersion = await prisma.documentVersion.findUnique({ where: { id: payload.versionId } });
      if (!docVersion) throw new Error('Document version not found');

      // Mock raw text retrieval (in reality, fetched from S3 using metadata.rawTextPath)
      const rawText = "Section 1\n\nThis is some extracted text.\n\nSection 2\n\nMore text here.";

      // 2. Detect Sections (Stubbed logic)
      const sections = [
        { title: 'Section 1', content: 'This is some extracted text.', pageNumbers: '1' },
        { title: 'Section 2', content: 'More text here.', pageNumbers: '1' }
      ];

      // 3. Generate High-Quality Chunks
      const strategy = new ChunkStrategy({
        maxTokens: 500,
        overlapTokens: 50,
        semanticBoundaries: true
      });

      const chunks = strategy.generateChunks(sections, payload.documentId, payload.versionId, payload.organizationId);

      // 4. Persist Chunks in a Transaction to ensure consistency
      // Delete existing pending chunks for this version (idempotency)
      await prisma.$transaction(async (tx) => {
        await tx.documentChunk.deleteMany({ where: { versionId: payload.versionId } });
        await tx.documentChunk.createMany({ data: chunks });
      });

      // 5. Emit CHUNKING_COMPLETED
      await this.orchestrator.handleEvent(PipelineEventType.CHUNKING_COMPLETED, payload);

    } catch (error: any) {
      console.error('Chunking Processing Failed:', error);
      await this.orchestrator.handleEvent(PipelineEventType.CHUNKING_FAILED, {
        ...payload,
        error: error.message
      });
      throw error;
    }
  }
}
