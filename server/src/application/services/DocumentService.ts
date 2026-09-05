import { Document } from '@prisma/client';
import { IDocumentRepository } from '../../infrastructure/repositories/DocumentRepository';
import { IAuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { CreateDocumentDTO, UpdateDocumentDTO } from '../dtos/DocumentDTOs';
import { NotFoundException } from '../../domain/exceptions/NotFoundException';
import { ForbiddenException } from '../../domain/exceptions/ForbiddenException';
import { DocumentAccessPolicy, AccessSubject } from '../../domain/security/DocumentAccessPolicy';
import { IStorageProvider } from '../../infrastructure/storage/IStorageProvider';
import { LocalStorageProvider } from '../../infrastructure/storage/LocalStorageProvider';
import { prisma } from '../../infrastructure/database/prisma';
import { QdrantVectorStoreProvider } from '../../infrastructure/providers/adapters/vector/QdrantVectorStoreProvider';

export class DocumentService {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher,
    private readonly storageProvider?: IStorageProvider
  ) {}

  async getDocuments(requester: AccessSubject, skip = 0, take = 50): Promise<Document[]> {
    const docs = await this.documentRepository.findMany({ organizationId: requester.organizationId, deletedAt: null }, skip, take * 4);
    // Server-side permission filter (never trust the client to hide unauthorized documents)
    return docs.filter((doc) => DocumentAccessPolicy.canAccess(requester, doc)).slice(0, take);
  }

  async getDocumentById(id: string, requester: AccessSubject): Promise<any> {
    const doc = await this.documentRepository.findByTenantAndId(id, requester.organizationId);
    if (!doc) throw new NotFoundException('Document', id);
    if (!DocumentAccessPolicy.canAccess(requester, doc)) {
      throw new ForbiddenException('You do not have access to this document');
    }
    return doc;
  }

  async createDocument(requester: AccessSubject, data: CreateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      const docScope = data.scope || (data.visibility === 'PRIVATE' ? 'PERSONAL' : 'ORGANIZATION');
      const doc = await tx.document.create({
        data: {
          title: data.title,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          classification: data.classification || 'UNCLASSIFIED',
          visibility: data.visibility || (docScope === 'PERSONAL' ? 'PRIVATE' : 'ORG_WIDE'),
          scope: docScope,
          departmentId: data.departmentId ?? (requester.departments[0] || null),
          allowedRoles: data.allowedRoles ?? [],
          allowedUsers: data.allowedUsers ?? [],
          allowedDepartments: data.allowedDepartments ?? [],
          deniedRoles: data.deniedRoles ?? [],
          deniedUsers: data.deniedUsers ?? [],
          deniedDepartments: data.deniedDepartments ?? [],
          organization: { connect: { id: requester.organizationId } },
          owner: { connect: { id: requester.id } },
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          organization: { connect: { id: requester.organizationId } },
          actor: { connect: { id: requester.id } },
          resourceId: doc.id,
          metadata: { title: doc.title }
        }
      });

      await this.eventPublisher.publish('document.created', { documentId: doc.id, organizationId: requester.organizationId });

      return doc;
    });
  }

  async updateDocument(id: string, requester: AccessSubject, data: UpdateDocumentDTO): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      const existing = await tx.document.findFirst({ where: { id, organizationId: requester.organizationId, deletedAt: null } });
      if (!existing) throw new NotFoundException('Document', id);
      if (!this.isOwnerOrAdmin(requester, existing)) {
        throw new ForbiddenException('You are not the owner of this document');
      }

      const doc = await tx.document.update({
        where: { id, organizationId: requester.organizationId },
        data
      });

      // Sync updated metadata/scope payload to Qdrant vector store
      try {
        const collectionName = `org_${doc.organizationId.replace(/[^a-zA-Z0-9]/g, '_')}_docs`;
        const qdrantProvider = new QdrantVectorStoreProvider();
        await qdrantProvider.updatePayloadForDocument(collectionName, doc.id, {
          scope: doc.scope,
          visibility: doc.visibility,
          classification: doc.classification,
          allowedRoles: doc.allowedRoles,
          deniedRoles: doc.deniedRoles,
          allowedUsers: doc.allowedUsers,
          deniedUsers: doc.deniedUsers,
          allowedDepartments: doc.allowedDepartments,
          deniedDepartments: doc.deniedDepartments,
        });
      } catch (qErr) {
        console.warn(`[DocumentService] Qdrant payload sync warning for document ${doc.id}:`, qErr);
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          organization: { connect: { id: requester.organizationId } },
          actor: { connect: { id: requester.id } },
          resourceId: doc.id,
          metadata: data
        }
      });

      return doc;
    });
  }

  async deleteDocument(id: string, requester: AccessSubject): Promise<void> {
    await this.unitOfWork.execute(async (tx) => {
      const existing = await tx.document.findFirst({ where: { id, organizationId: requester.organizationId } });
      if (!existing) throw new NotFoundException('Document', id);
      if (!this.isOwnerOrAdmin(requester, existing)) {
        throw new ForbiddenException('You are not the owner of this document');
      }

      await tx.document.update({
        where: { id, organizationId: requester.organizationId },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          organization: { connect: { id: requester.organizationId } },
          actor: { connect: { id: requester.id } },
          resourceId: id
        }
      });

      await this.eventPublisher.publish('document.deleted', { documentId: id, organizationId: requester.organizationId });
    });
  }

  async deleteAllDocuments(requester: AccessSubject): Promise<void> {
    await this.unitOfWork.execute(async (tx) => {
      const docs = await tx.document.findMany({
        where: { organizationId: requester.organizationId }
      });

      for (const doc of docs) {
        await tx.document.update({
          where: { id: doc.id },
          data: { deletedAt: new Date() }
        });
        await this.eventPublisher.publish('document.deleted', { documentId: doc.id, organizationId: requester.organizationId });
      }

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          organization: { connect: { id: requester.organizationId } },
          actor: { connect: { id: requester.id } },
          resourceId: requester.organizationId,
          metadata: { deleteAll: true, count: docs.length }
        }
      });
    });
  }

  async restoreDocument(id: string, requester: AccessSubject): Promise<Document> {
    return await this.unitOfWork.execute(async (tx) => {
      const existing = await tx.document.findFirst({ where: { id, organizationId: requester.organizationId } });
      if (!existing) throw new NotFoundException('Document', id);
      if (!this.isOwnerOrAdmin(requester, existing)) {
        throw new ForbiddenException('You are not the owner of this document');
      }

      await tx.document.update({
        where: { id, organizationId: requester.organizationId },
        data: { deletedAt: null }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          organization: { connect: { id: requester.organizationId } },
          actor: { connect: { id: requester.id } },
          resourceId: id,
          metadata: { restored: true }
        }
      });

      return await tx.document.findFirst({ where: { id, organizationId: requester.organizationId, deletedAt: null } });
    }) as Document;
  }

  async getDocumentFile(id: string, versionId: string, requester: AccessSubject): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const doc = await this.documentRepository.findByTenantAndId(id, requester.organizationId);
    if (!doc) throw new NotFoundException('Document', id);
    if (!DocumentAccessPolicy.canAccess(requester, doc)) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const docVersion = await prisma.documentVersion.findFirst({
      where: { id: versionId, documentId: id, deletedAt: null }
    });
    if (!docVersion) throw new NotFoundException('DocumentVersion', versionId);

    const provider = this.storageProvider || new LocalStorageProvider();
    const buffer = await provider.download(docVersion.s3Key);

    return {
      buffer,
      mimeType: doc.mimeType || 'application/octet-stream',
      filename: doc.title || 'file'
    };
  }

  private isOwnerOrAdmin(requester: AccessSubject, doc: Document): boolean {
    return requester.isSuperAdmin || doc.ownerId === requester.id;
  }
}