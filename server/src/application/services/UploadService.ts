import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';
import { IDocumentRepository } from '../../infrastructure/repositories/DocumentRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { BaseException } from '../../domain/exceptions/BaseException';

// A mock repository for DocumentVersion since we haven't explicitly generated it yet, but it's part of the UoW slice.
import { DocumentVersionRepository } from '../../infrastructure/repositories/DocumentVersionRepository';

export class UploadService {
  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly documentRepository: IDocumentRepository,
    private readonly documentVersionRepository: any, 
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async processUpload(
    organizationId: string, 
    userId: string, 
    fileBuffer: Buffer, 
    filename: string, 
    mimeType: string, 
    sizeBytes: number,
    scope?: string
  ) {
    // 1. Calculate SHA-256 hash from the uploaded file buffer
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Check for an existing exact content match (same hash + organizationId + non-deleted Document)
    const existingVersion = await this.unitOfWork.execute(async (tx) => {
      return await tx.documentVersion.findFirst({
        where: {
          hash: fileHash,
          deletedAt: null,
          document: {
            organizationId,
            deletedAt: null
          }
        },
        select: {
          id: true,
          documentId: true
        }
      });
    });

    // 3. If exact content already exists in this organization, return immediately
    if (existingVersion) {
      console.log(`[UploadService] Exact file hash ${fileHash} already exists for document ${existingVersion.documentId}. Skipping ingestion.`);
      return {
        documentId: existingVersion.documentId,
        versionId: existingVersion.id,
        status: 'EXISTS'
      };
    }

    // 4. Check for an existing Document with the same filename/title within the organization
    const existingDocument = await this.unitOfWork.execute(async (tx) => {
      return await tx.document.findFirst({
        where: {
          organizationId,
          title: filename,
          deletedAt: null
        },
        include: {
          versions: {
            where: { deletedAt: null },
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      });
    });

    const isNewVersion = !!existingDocument;
    const targetDocumentId = existingDocument ? existingDocument.id : uuidv4();
    const targetVersionId = uuidv4();
    const nextVersionNumber = isNewVersion 
      ? ((existingDocument.versions && existingDocument.versions[0]?.version) || 1) + 1 
      : 1;

    // 5. Generate Storage Path & upload file to storage
    const storagePath = `uploads/${organizationId}/${targetDocumentId}/${targetVersionId}/${filename}`;
    const fileUri = await this.storageProvider.upload(fileBuffer, storagePath);

    try {
      // 6. Database Transaction
      await this.unitOfWork.execute(async (tx) => {
        if (!isNewVersion) {
          const docScope = scope === 'PERSONAL' ? 'PERSONAL' : 'ORGANIZATION';
          const docVisibility = docScope === 'PERSONAL' ? 'PRIVATE' : 'ORG_WIDE';
          // Create new Document
          await tx.document.create({
            data: {
              id: targetDocumentId,
              title: filename,
              mimeType,
              sizeBytes,
              classification: 'UNCLASSIFIED', // Default
              scope: docScope as any,
              visibility: docVisibility as any,
              organization: { connect: { id: organizationId } },
              owner: { connect: { id: userId } }
            }
          });
        } else {
          // Update existing Document metadata
          await tx.document.update({
            where: { id: targetDocumentId },
            data: {
              mimeType,
              sizeBytes,
              updatedAt: new Date()
            }
          });
        }

        // Create new DocumentVersion
        await tx.documentVersion.create({
          data: {
            id: targetVersionId,
            version: nextVersionNumber,
            s3Key: storagePath,
            hash: fileHash,
            document: { connect: { id: targetDocumentId } }
          }
        });

        // Create Audit Log
        await tx.auditLog.create({
          data: {
            action: isNewVersion ? 'UPDATE' : 'CREATE',
            organization: { connect: { id: organizationId } },
            actor: { connect: { id: userId } },
            resourceId: targetDocumentId,
            metadata: { filename, versionId: targetVersionId, versionNumber: nextVersionNumber, fileUri }
          }
        });
      });

      // 7. Dispatch Domain Events (Async) - trigger event for orchestrator for target version
      await this.eventPublisher.publish('document.uploaded', { 
        documentId: targetDocumentId, 
        versionId: targetVersionId, 
        organizationId 
      });

      return {
        documentId: targetDocumentId,
        versionId: targetVersionId,
        status: 'UPLOADED'
      };

    } catch (error) {
      // Compensating Action: Rollback storage if DB transaction fails
      await this.storageProvider.delete(storagePath);
      throw error;
    }
  }
}
