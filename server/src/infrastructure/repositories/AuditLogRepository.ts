import { AuditLog, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IAuditLogRepository extends IBaseRepository<AuditLog, Prisma.AuditLogCreateInput, Prisma.AuditLogUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<AuditLog | null>;
}

export class AuditLogRepository extends TenantAwareRepository<AuditLog, Prisma.AuditLogCreateInput, Prisma.AuditLogUpdateInput> implements IAuditLogRepository {
  constructor(tx: any = prisma) {
    super(tx.auditLog, 'AuditLog');
  }
}
