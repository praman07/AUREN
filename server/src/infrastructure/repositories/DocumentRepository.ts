import { Document, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IDocumentRepository extends IBaseRepository<Document, Prisma.DocumentCreateInput, Prisma.DocumentUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Document | null>;
}

export class DocumentRepository extends TenantAwareRepository<Document, Prisma.DocumentCreateInput, Prisma.DocumentUpdateInput> implements IDocumentRepository {
  constructor(tx: any = prisma) {
    super(tx.document, 'Document');
  }

  async findMany(filters: any = {}, skip?: number, take?: number, organizationId?: string): Promise<any[]> {
    try {
      const where = { ...filters, deletedAt: null };
      if (organizationId) where.organizationId = organizationId;
      return await this.delegate.findMany({ 
        where, 
        skip, 
        take,
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          jobs: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) { this.handlePrismaError(error); }
  }

  async findByTenantAndId(id: string, organizationId: string): Promise<any | null> {
    try {
      return await this.delegate.findFirst({ 
        where: { id, organizationId, deletedAt: null },
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          jobs: { orderBy: { createdAt: 'desc' } },
          versions: { orderBy: { version: 'desc' } }
        }
      });
    } catch (error) { this.handlePrismaError(error, id); }
  }
}
