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
          scope: true,
          ownerId: true,
          allowedRoles: true,
          deniedRoles: true,
          allowedUsers: true,
          deniedUsers: true,
          allowedDepartments: true,
          deniedDepartments: true,
          title: true,       // needed for citation title in Qdrant payload
          mimeType: true,    // needed for visual source classification
          sourceType: true,  // needed for source provider classification (e.g. GITHUB vs UPLOAD)
          sourceUrl: true,   // canonical external URL (e.g. GitHub URL)
          externalId: true,  // external resource identifier (e.g. github://repo/path)
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Zero-Trust verification
      if (document.organizationId !== payload.organizationId) {
        throw new Error('Zero-Trust Violation: Job organizationId does not match authoritative document organizationId');
      }

      const totalChunksCount = await prisma.documentChunk.count({
        where: { versionId: payload.versionId }
      });

      const failedChunksCount = await prisma.documentChunk.count({
        where: { versionId: payload.versionId, embeddingStatus: 'FAILED' }
      });

      const chunks = await prisma.documentChunk.findMany({
        where: {
          versionId: payload.versionId,
          embeddingStatus: 'COMPLETED',
          indexingStatus: { not: 'COMPLETED' }
        },
        orderBy: { chunkIndex: 'asc' }
      });

      if (chunks.length === 0) {
        if (totalChunksCount === 0 || failedChunksCount > 0) {
          throw new Error(`Cannot index document version ${payload.versionId}: 0 valid completed embeddings found (${failedChunksCount}/${totalChunksCount} chunks in FAILED status)`);
        }

        const alreadyIndexedCount = await prisma.documentChunk.count({
          where: { versionId: payload.versionId, indexingStatus: 'COMPLETED' }
        });

        if (alreadyIndexedCount > 0 && alreadyIndexedCount === totalChunksCount) {
          // All chunks were already indexed in Qdrant successfully
          await this.orchestrator.handleEvent(PipelineEventType.INDEXING_COMPLETED, payload);
          return;
        }

        throw new Error(`Cannot index document version ${payload.versionId}: 0 valid chunks ready for vector indexing`);
      }

      // 2. Validate embedding dimensions
      const dimension = chunks[0].embeddingDim;
      if (!dimension) {
        throw new Error('Chunks are missing embedding dimensions');
      }

      const vectorStoreProvider = this.providerFactory.getVectorStoreProvider();
      
      // 3. Ensure Collection Exists with correct dimension
      const collectionName = `org_${document.organizationId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
      
      // Abstract provider handles the "if exists with wrong dim -> throw" logic
      await vectorStoreProvider.ensureCollection(collectionName, dimension);

      // 4. Batch indexing
      const batchSize = 100;
      const startTime = Date.now();

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const crypto = require('crypto');
        // Build Qdrant points
        const points = batch.map(chunk => {
          const chunkMeta = typeof chunk.metadata === 'object' && chunk.metadata !== null ? (chunk.metadata as any) : {};
          const isVisual = !!(document.mimeType?.startsWith('image/') || chunkMeta.isVisual);
          const mimeType = document.mimeType || chunkMeta.mimeType || null;

          return {
            id: chunk.id, // Qdrant point ID uses Chunk ID
            vector: chunk.vectorData,
            payload: {
              // Zero Trust Metadata (Authoritative)
              organizationId: document.organizationId,
              departmentId: document.departmentId,
              visibility: document.visibility,
              scope: document.scope,
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
              documentName: document.title || null,   // human-readable document title
              isVisual,
              mimeType,
              sourceProvider: document.sourceType || 'UPLOAD',
              sourceUrl: document.sourceUrl || null,
              externalId: document.externalId || null,
              pageNumbers: chunk.pageNumbers,
              sectionTitle: chunk.sectionTitle,
              chunkIndex: chunk.chunkIndex,
              text: chunk.text, // Store text in Qdrant for retrieval
              createdAt: chunk.createdAt.toISOString(),
              updatedAt: chunk.updatedAt.toISOString()
            }
          };
        });

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

      // Fix 2: Purge stale previous version vectors from Qdrant AFTER new version is successfully indexed
      try {
        const previousVersions = await prisma.documentVersion.findMany({
          where: {
            documentId: payload.documentId,
            id: { not: payload.versionId }
          },
          select: { id: true }
        });

        if (previousVersions.length > 0) {
          const prevVersionIds = previousVersions.map((v) => v.id);
          const qdrant = vectorStoreProvider as any;
          if (qdrant && typeof qdrant.client?.delete === 'function') {
            for (const prevVerId of prevVersionIds) {
              await qdrant.client.delete(collectionName, {
                wait: true,
                filter: {
                  must: [
                    { key: 'documentId', match: { value: payload.documentId } },
                    { key: 'documentVersionId', match: { value: prevVerId } }
                  ]
                }
              });
            }
            console.log(`[QdrantIndexingService] Purged ${prevVersionIds.length} stale previous version(s) for document ${payload.documentId} from ${collectionName}`);
          }
        }
      } catch (purgeErr: any) {
        console.warn(`[QdrantIndexingService] Warning purging previous version vectors for doc ${payload.documentId}:`, purgeErr?.message || purgeErr);
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

      // 5b. Generate Automatic Document Intelligence Overview
      try {
        const fullSampleText = chunks.slice(0, 5).map(c => c.text).join('\n');
        const wordCount = fullSampleText.split(/\s+/).length;
        const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        let docType = 'Technical Document';
        const lowerTitle = (document.title || '').toLowerCase();
        const lowerText = fullSampleText.toLowerCase();

        if (lowerTitle.endsWith('.pdf') || (document.mimeType || '').includes('pdf')) docType = 'PDF Document';
        else if (lowerTitle.includes('handbook') || lowerTitle.includes('policy')) docType = 'Policy & Guidelines';
        else if (lowerTitle.includes('architecture') || lowerTitle.includes('design')) docType = 'Engineering Architecture';
        else if (lowerTitle.includes('resume') || lowerTitle.includes('cv')) docType = 'Personal Resume';
        else if (lowerTitle.includes('notes') || lowerTitle.includes('secret')) docType = 'Personal Notes';
        else if (lowerTitle.endsWith('.ts') || lowerTitle.endsWith('.js') || lowerTitle.endsWith('.py')) docType = 'Source Code';

        const sentences = fullSampleText.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
        const executiveSummary = sentences.slice(0, 3).join(' ') || `${document.title} containing enterprise indexed knowledge.`;

        const topicCandidates = ['Architecture', 'Security', 'Policy', 'Engineering', 'API', 'Deployment', 'Finance', 'Strategy', 'Guidelines', 'RBAC'];
        const matchedTopics = topicCandidates.filter(t => lowerText.includes(t.toLowerCase()));
        if (matchedTopics.length === 0) matchedTopics.push('Enterprise Knowledge');

        const techCandidates = ['Node.js', 'TypeScript', 'PostgreSQL', 'Qdrant', 'Docker', 'Redis', 'REST', 'JWT', 'React', 'Python'];
        const matchedTech = techCandidates.filter(t => lowerText.includes(t.toLowerCase()));

        const summaryData = {
          title: document.title,
          documentType: docType,
          executiveSummary,
          keyTopics: matchedTopics,
          readingTimeMinutes,
          entities: matchedTopics,
          technologies: matchedTech,
          keywords: matchedTopics,
          generatedAt: new Date().toISOString()
        };

        await prisma.document.update({
          where: { id: payload.documentId },
          data: { summary: summaryData as any }
        });
      } catch (sumErr: any) {
        console.warn(`[QdrantIndexingService] Warning generating summary for doc ${payload.documentId}:`, sumErr?.message || sumErr);
      }

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
