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
    return await this.documentRepository.findMany({}, skip, take, organizationId);
  }

  async getDocumentById(id: string, organizationId: string): Promise<Document> {
    const doc = await this.documentRepository.findByTenantAndId(id, organizationId);
    if (!doc) throw new NotFoundException('Document', id);
    return doc;
  }

  async createDocument(organizationId: string, ownerId: string, data: CreateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      // 1. Create the Document
      const doc = await this.documentRepository.create({
        title: data.title,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        classification: data.classification || 'UNCLASSIFIED',
        organization: { connect: { id: organizationId } },
        owner: { connect: { id: ownerId } },
      }, tx);

      // 2. Log Audit Action
      await this.auditLogRepository.create({
        action: 'CREATE',
        organization: { connect: { id: organizationId } },
        actor: { connect: { id: ownerId } },
        resourceId: doc.id,
        metadata: { title: doc.title }
      }, tx);

      // 3. Dispatch Domain Event
      await this.eventPublisher.publish('document.created', { documentId: doc.id, organizationId });

      return doc;
    });
  }

  async updateDocument(id: string, organizationId: string, userId: string, data: UpdateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      const doc = await this.documentRepository.update(id, data, organizationId, tx);
      
      await this.auditLogRepository.create({
        action: 'UPDATE',
        organization: { connect: { id: organizationId } },
        actor: { connect: { id: userId } },
        resourceId: doc.id,
        metadata: data
      }, tx);

      return doc;
    });
  }

  async deleteDocument(id: string, organizationId: string, userId: string): Promise<void> {
    await this.unitOfWork.execute(async (tx) => {
      await this.documentRepository.softDelete(id, organizationId, tx);

      await this.auditLogRepository.create({
        action: 'DELETE',
        organization: { connect: { id: organizationId } },
        actor: { connect: { id: userId } },
        resourceId: id
      }, tx);

      await this.eventPublisher.publish('document.deleted', { documentId: id, organizationId });
    });
  }

  async restoreDocument(id: string, organizationId: string, userId: string): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      await this.documentRepository.restore(id, organizationId, tx);

      await this.auditLogRepository.create({
        action: 'UPDATE', // Technically a restore action
        organization: { connect: { id: organizationId } },
        actor: { connect: { id: userId } },
        resourceId: id,
        metadata: { restored: true }
      }, tx);

      return await this.documentRepository.findByTenantAndId(id, organizationId);
    }) as Document;
  }
}
