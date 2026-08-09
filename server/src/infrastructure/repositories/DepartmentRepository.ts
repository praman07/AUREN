import { Department, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IDepartmentRepository extends IBaseRepository<Department, Prisma.DepartmentCreateInput, Prisma.DepartmentUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Department | null>;
}

export class DepartmentRepository extends TenantAwareRepository<Department, Prisma.DepartmentCreateInput, Prisma.DepartmentUpdateInput> implements IDepartmentRepository {
  constructor(tx: any = prisma) {
    super(tx.department, 'Department');
  }
}
