import { DocumentVersion, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IDocumentVersionRepository extends IBaseRepository<DocumentVersion, Prisma.DocumentVersionCreateInput, Prisma.DocumentVersionUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<DocumentVersion | null>;
}

export class DocumentVersionRepository extends TenantAwareRepository<DocumentVersion, Prisma.DocumentVersionCreateInput, Prisma.DocumentVersionUpdateInput> implements IDocumentVersionRepository {
  constructor(tx: any = prisma) {
    super(tx.documentVersion, 'DocumentVersion');
  }
}
