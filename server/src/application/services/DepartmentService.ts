import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';

import { IDepartmentRepository } from '../../infrastructure/repositories/DepartmentRepository';
import { ConflictException } from '../../domain/exceptions/ConflictException';
import { Department } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';

export class DepartmentService {
  constructor(
    private readonly departmentRepository: IDepartmentRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getDepartments(organizationId: string): Promise<any[]> {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return departments.map((dept: any) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      manager: 'Unassigned', // Placeholder
      memberCount: dept._count.users,
      documentCount: 0, // Placeholder
      storageUsedGB: 0, // Placeholder
      aiTokensUsed: 0, // Placeholder
      securityLevel: 'INTERNAL', // Placeholder
      status: dept.deletedAt ? 'ARCHIVED' : 'ACTIVE',
      createdAt: dept.createdAt
    }));
  }

  async createDepartment(organizationId: string, name: string, description?: string): Promise<Department> {
    return await this.unitOfWork.execute(async (tx) => {
      const existing = await this.departmentRepository.findMany({ name, organizationId });
      if (existing.length > 0) {
        throw new ConflictException('Department already exists in this organization');
      }

      return await this.departmentRepository.create({
        name,
        description,
        organization: { connect: { id: organizationId } }
      } as any);
    });
  }

  async updateDepartment(organizationId: string, departmentId: string, data: { name?: string; description?: string }): Promise<Department> {
    return await this.unitOfWork.execute(async (tx) => {
      const dept = await this.departmentRepository.findByTenantAndId(departmentId, organizationId);
      if (!dept) throw new Error('Department not found');

      if (data.name && data.name !== dept.name) {
        const existing = await this.departmentRepository.findMany({ name: data.name, organizationId });
        if (existing.length > 0) {
          throw new ConflictException('Department name already taken');
        }
      }

      return await this.departmentRepository.update(departmentId, data as any);
    });
  }

  async archiveDepartment(organizationId: string, departmentId: string): Promise<void> {
    return await this.unitOfWork.execute(async (tx) => {
      const dept = await this.departmentRepository.findByTenantAndId(departmentId, organizationId);
      if (!dept) throw new Error('Department not found');
      
      await this.departmentRepository.softDelete(departmentId);
    });
  }

  async restoreDepartment(organizationId: string, departmentId: string): Promise<void> {
    return await this.unitOfWork.execute(async (tx) => {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId, deletedAt: { not: null } }
      });
      if (!dept) throw new Error('Department not found or not archived');
      
      await this.departmentRepository.restore(departmentId);
    });
  }
}
