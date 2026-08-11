import { v4 as uuidv4 } from 'uuid';
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
    sizeBytes: number
  ) {
    const documentId = uuidv4();
    const versionId = uuidv4();
    
    // 1. Generate Storage Path
    const storagePath = `uploads/${organizationId}/${documentId}/${versionId}/${filename}`;

    // 2. Upload to Storage Provider (S3, Local, Azure)
    const fileUri = await this.storageProvider.upload(fileBuffer, storagePath);

    try {
      // 3. Database Transaction
      await this.unitOfWork.execute(async (tx) => {
        const doc = await tx.document.create({
          data: {
            id: documentId,
            title: filename,
            mimeType,
            sizeBytes,
            classification: 'UNCLASSIFIED', // Default
            organization: { connect: { id: organizationId } },
            owner: { connect: { id: userId } }
          }
        });

        // Create Version
        await tx.documentVersion.create({
          data: {
            id: versionId,
            version: 1,
            s3Key: storagePath,
            hash: 'mock-hash',
            document: { connect: { id: documentId } }
          }
        });

        // Create Audit Log
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            organization: { connect: { id: organizationId } },
            actor: { connect: { id: userId } },
            resourceId: documentId,
            metadata: { filename, versionId, fileUri }
          }
        });
      });

      // 4. Dispatch Domain Events (Async)
      await this.eventPublisher.publish('document.uploaded', { documentId, versionId, organizationId });
      await this.eventPublisher.publish('document.processing.requested', { documentId, versionId, organizationId });

      return {
        documentId,
        versionId,
        status: 'UPLOADED'
      };

    } catch (error) {
      // Compensating Action: Rollback storage if DB fails
      await this.storageProvider.delete(storagePath);
      throw error;
    }
  }
}
