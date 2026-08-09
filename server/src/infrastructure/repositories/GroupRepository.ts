import { Group, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IGroupRepository extends IBaseRepository<Group, Prisma.GroupCreateInput, Prisma.GroupUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Group | null>;
}

export class GroupRepository extends TenantAwareRepository<Group, Prisma.GroupCreateInput, Prisma.GroupUpdateInput> implements IGroupRepository {
  constructor(tx: any = prisma) {
    super(tx.group, 'Group');
  }
}
