import { Role, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IRoleRepository extends IBaseRepository<Role, Prisma.RoleCreateInput, Prisma.RoleUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Role | null>;
}

export class RoleRepository extends TenantAwareRepository<Role, Prisma.RoleCreateInput, Prisma.RoleUpdateInput> implements IRoleRepository {
  constructor(tx: any = prisma) {
    super(tx.role, 'Role');
  }
}
