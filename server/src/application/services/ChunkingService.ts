import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';
import { ChunkStrategy } from '../../domain/chunking/ChunkStrategy';

import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';

export class ChunkingService {
  constructor(
    private readonly orchestrator: DocumentProcessingOrchestrator,
    private readonly storageProvider: IStorageProvider
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      // 1. Retrieve normalized raw text and document metadata
      const docVersion = await prisma.documentVersion.findUnique({ 
        where: { id: payload.versionId },
        include: { document: true }
      });
      if (!docVersion) throw new Error('Document version not found');

      const txtBuffer = await this.storageProvider.download(docVersion.s3Key + '.txt');
      const rawText = txtBuffer.toString('utf8');

      // Prepare RBAC metadata
      const rbacMetadata = {
        visibility: docVersion.document.visibility,
        ownerId: docVersion.document.ownerId,
        departmentId: docVersion.document.departmentId,
        allowedRoles: docVersion.document.allowedRoles,
        allowedUsers: docVersion.document.allowedUsers,
        deniedRoles: docVersion.document.deniedRoles,
        deniedUsers: docVersion.document.deniedUsers
      };

      // 2. Detect Sections (Stubbed logic, but using real text)
      const sections = [
        { title: 'Full Document', content: rawText, pageNumbers: '1' }
      ];

      // 3. Generate High-Quality Chunks
      const strategy = new ChunkStrategy({
        maxTokens: 500,
        overlapTokens: 50,
        semanticBoundaries: true
      });

      const chunks = strategy.generateChunks(sections, payload.documentId, payload.versionId, payload.organizationId, rbacMetadata);

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
