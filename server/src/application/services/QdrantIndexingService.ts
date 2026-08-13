import { PipelineEventType, PipelineEventPayload } from '../../domain/events/PipelineEvents';
import { prisma } from '../../infrastructure/database/prisma';
import { DocumentProcessingOrchestrator } from './DocumentProcessingOrchestrator';
import { ProviderFactory } from '../../infrastructure/providers/registry/ProviderFactory';

export class QdrantIndexingService {
  constructor(
    private readonly orchestrator: DocumentProcessingOrchestrator,
    private readonly providerFactory: ProviderFactory
  ) {}

  public async processDocument(payload: PipelineEventPayload): Promise<void> {
    try {
      // 1. Fetch chunks where embeddingStatus = COMPLETED and indexingStatus != COMPLETED
      const document = await prisma.document.findUnique({
        where: { id: payload.documentId },
        select: { 
          organizationId: true,
          departmentId: true,
          visibility: true,
          ownerId: true,
          allowedRoles: true,
          deniedRoles: true,
          allowedUsers: true,
          deniedUsers: true,
          allowedDepartments: true,
          deniedDepartments: true
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Zero-Trust verification
      if (document.organizationId !== payload.organizationId) {
        throw new Error('Zero-Trust Violation: Job organizationId does not match authoritative document organizationId');
      }

      const chunks = await prisma.documentChunk.findMany({
        where: {
          versionId: payload.versionId,
          embeddingStatus: 'COMPLETED',
          indexingStatus: { not: 'COMPLETED' }
        },
        orderBy: { chunkIndex: 'asc' }
      });

      if (chunks.length === 0) {
        // No chunks to process, just complete
        await this.orchestrator.handleEvent(PipelineEventType.INDEXING_COMPLETED, payload);
        return;
      }

      // 2. Validate embedding dimensions
      const dimension = chunks[0].embeddingDim;
      if (!dimension) {
        throw new Error('Chunks are missing embedding dimensions');
      }

      const vectorStoreProvider = this.providerFactory.getVectorStoreProvider();
      
      // 3. Ensure Collection Exists with correct dimension
      const collectionName = `org_${document.organizationId}_docs`;
      
      // Abstract provider handles the "if exists with wrong dim -> throw" logic
      await vectorStoreProvider.ensureCollection(collectionName, dimension);

      // 4. Batch indexing
      const batchSize = 100;
      const startTime = Date.now();

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const crypto = require('crypto');
        // Build Qdrant points
        const points = batch.map(chunk => ({
          id: chunk.id, // Qdrant point ID uses Chunk ID
          vector: chunk.vectorData,
          payload: {
            // Zero Trust Metadata (Authoritative)
            organizationId: document.organizationId,
            departmentId: document.departmentId,
            visibility: document.visibility,
            ownerId: document.ownerId,
            documentId: chunk.documentId,
            documentVersionId: chunk.versionId,
            chunkId: chunk.id,

            // Zero-Trust Policy Metadata (must be indexed with every point)
            allowedRoles: document.allowedRoles,
            deniedRoles: document.deniedRoles,
            allowedUsers: document.allowedUsers,
            deniedUsers: document.deniedUsers,
            allowedDepartments: document.allowedDepartments,
            deniedDepartments: document.deniedDepartments,
            
            // Context Metadata
            pageNumbers: chunk.pageNumbers,
            sectionTitle: chunk.sectionTitle,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text, // Store text in Qdrant for retrieval
            createdAt: chunk.createdAt.toISOString(),
            updatedAt: chunk.updatedAt.toISOString()
          }
        }));

        // Upsert batch
        await vectorStoreProvider.upsert(collectionName, points);

        // Update database state AFTER successful Qdrant acknowledgement
        const updatePromises = batch.map(chunk => {
          return prisma.documentChunk.update({
            where: { id: chunk.id },
            data: {
              indexingStatus: 'COMPLETED',
              indexedAt: new Date(),
              qdrantPointId: chunk.id
            }
          });
        });

        await prisma.$transaction(updatePromises);
      }

      // 5. Audit log
      await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          action: 'INDEXING_COMPLETED' as any,
          resourceId: payload.versionId,
          metadata: {
            chunkCount: chunks.length,
            collection: collectionName,
            provider: 'QdrantVectorStoreProvider',
            durationMs: Date.now() - startTime
          }
        }
      });

      // 6. Emit INDEXING_COMPLETED
      await this.orchestrator.handleEvent(PipelineEventType.INDEXING_COMPLETED, payload);

    } catch (error: any) {
      console.error('Qdrant Indexing Failed:', error);
      
      // Audit log failure safely
      await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          action: 'INDEXING_FAILED' as any,
          resourceId: payload.versionId,
          metadata: {
            error: error.message
          }
        }
      });

      await this.orchestrator.handleEvent(PipelineEventType.INDEXING_FAILED, {
        ...payload,
        error: error.message
      });
      
      throw error; // Rethrow to BullMQ for exponential backoff
    }
  }
}
