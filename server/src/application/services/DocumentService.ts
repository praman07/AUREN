import { Document } from '@prisma/client';
import { IDocumentRepository } from '../../infrastructure/repositories/DocumentRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { CreateDocumentDTO, UpdateDocumentDTO } from '../dtos/DocumentDTOs';
import { NotFoundException } from '../../domain/exceptions/NotFoundException';

export class DocumentService {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getDocuments(organizationId: string, skip = 0, take = 50): Promise<Document[]> {
    return await this.documentRepository.findMany({ organizationId }, skip, take);
  }

  async getDocumentById(id: string, organizationId: string): Promise<Document> {
    const doc = await this.documentRepository.findByTenantAndId(id, organizationId);
    if (!doc) throw new NotFoundException('Document', id);
    return doc;
  }

  async createDocument(organizationId: string, ownerId: string, data: CreateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      // 1. Create the Document
      const doc = await tx.document.create({
        data: {
          title: data.title,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          classification: data.classification || 'UNCLASSIFIED',
          organization: { connect: { id: organizationId } },
          owner: { connect: { id: ownerId } },
        }
      });

      // 2. Log Audit Action
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          organization: { connect: { id: organizationId } },
          actor: { connect: { id: ownerId } },
          resourceId: doc.id,
          metadata: { title: doc.title }
        }
      });

      // 3. Dispatch Domain Event
      await this.eventPublisher.publish('document.created', { documentId: doc.id, organizationId });

      return doc;
    });
  }

  async updateDocument(id: string, organizationId: string, userId: string, data: UpdateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      const doc = await tx.document.update({
        where: { id, organizationId },
        data
      });
      
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          organization: { connect: { id: organizationId } },
          actor: { connect: { id: userId } },
          resourceId: doc.id,
          metadata: data
        }
      });

      return doc;
    });
  }

  async deleteDocument(id: string, organizationId: string, userId: string): Promise<void> {
    await this.unitOfWork.execute(async (tx) => {
      await tx.document.update({
        where: { id, organizationId },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          organization: { connect: { id: organizationId } },
          actor: { connect: { id: userId } },
          resourceId: id
        }
      });

      await this.eventPublisher.publish('document.deleted', { documentId: id, organizationId });
    });
  }

  async restoreDocument(id: string, organizationId: string, userId: string): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      await tx.document.update({
        where: { id, organizationId },
        data: { deletedAt: null }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE', // Technically a restore action
          organization: { connect: { id: organizationId } },
          actor: { connect: { id: userId } },
          resourceId: id,
          metadata: { restored: true }
        }
      });

      return await tx.document.findFirst({ where: { id, organizationId, deletedAt: null } });
    }) as Document;
  }
}
