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
}
