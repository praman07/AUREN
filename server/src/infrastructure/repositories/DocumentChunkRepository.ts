import { DocumentChunk, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IDocumentChunkRepository extends IBaseRepository<DocumentChunk, Prisma.DocumentChunkCreateInput, Prisma.DocumentChunkUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<DocumentChunk | null>;
}

export class DocumentChunkRepository extends TenantAwareRepository<DocumentChunk, Prisma.DocumentChunkCreateInput, Prisma.DocumentChunkUpdateInput> implements IDocumentChunkRepository {
  constructor(tx: any = prisma) {
    super(tx.documentChunk, 'DocumentChunk');
  }
}
