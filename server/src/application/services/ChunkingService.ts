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
      // Strip null bytes and PostgreSQL-incompatible control characters from extracted text.
      // PDF parsers can leave 0x00 bytes which cause "invalid byte sequence for encoding UTF8" errors.
      const rawText = txtBuffer.toString('utf8')
        .replace(/\0/g, '')                         // remove null bytes (0x00)
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, ' ') // replace other non-printable control chars
        .trim();

      if (!rawText || rawText.length === 0) {
        throw new Error('Chunking failed: document text is empty');
      }

      if (rawText.startsWith('%PDF-')) {
        throw new Error('Chunking failed: raw text contains unparsed PDF binary header (%PDF-)');
      }

      const mimeType = docVersion.document.mimeType;
      const isImage = mimeType?.startsWith('image/') ?? false;

      // Prepare RBAC and Visual Metadata
      const baseMetadata = {
        visibility: docVersion.document.visibility,
        ownerId: docVersion.document.ownerId,
        departmentId: docVersion.document.departmentId,
        allowedRoles: docVersion.document.allowedRoles,
        allowedUsers: docVersion.document.allowedUsers,
        deniedRoles: docVersion.document.deniedRoles,
        deniedUsers: docVersion.document.deniedUsers,
        ...(isImage ? {
          isVisual: true,
          mimeType
        } : {})
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

      const chunks = strategy.generateChunks(sections, payload.documentId, payload.versionId, payload.organizationId, baseMetadata);

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
