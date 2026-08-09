import { Permission, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IPermissionRepository extends IBaseRepository<Permission, Prisma.PermissionCreateInput, Prisma.PermissionUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Permission | null>;
}

export class PermissionRepository extends TenantAwareRepository<Permission, Prisma.PermissionCreateInput, Prisma.PermissionUpdateInput> implements IPermissionRepository {
  constructor(tx: any = prisma) {
    super(tx.permission, 'Permission');
  }
}
