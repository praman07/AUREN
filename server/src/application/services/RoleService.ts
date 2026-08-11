import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { prisma } from '../../infrastructure/database/prisma';
import { BaseException } from '../../domain/exceptions/BaseException';

export class RoleService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getRoles(organizationId: string): Promise<any[]> {
    // Return all roles with their permissions
    let roles = await prisma.role.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        permissions: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (roles.length === 0) {
      // Seed default roles if none exist
      roles = await this.seedDefaultRoles(organizationId);
    }

    return roles;
  }

  async togglePermission(organizationId: string, roleId: string, action: string, enabled: boolean): Promise<any> {
    return await this.unitOfWork.execute(async (tx) => {
      const role = await prisma.role.findFirst({
        where: { id: roleId, organizationId, deletedAt: null }
      });

      if (!role) {
        throw new BaseException('Role not found', 404);
      }

      // Do not allow modification of SYSTEM roles directly if we want to enforce it.
      // But the mock data labels "Super Admin" as isCustom: false. Let's rely on isSystem.
      if (role.isSystem) {
        throw new BaseException('Cannot modify permissions for system roles', 403);
      }

      if (enabled) {
        // Add permission
        await prisma.permission.upsert({
          where: {
            roleId_action_resource: {
              roleId,
              action,
              resource: 'System'
            }
          },
          update: {},
          create: {
            roleId,
            action,
            resource: 'System'
          }
        });
      } else {
        // Remove permission
        await prisma.permission.deleteMany({
          where: {
            roleId,
            action,
            resource: 'System'
          }
        });
      }

      const updatedRole = await prisma.role.findFirst({
        where: { id: roleId },
        include: { permissions: true }
      });

      return updatedRole;
    });
  }

  private async seedDefaultRoles(organizationId: string): Promise<any[]> {
    return await this.unitOfWork.execute(async (tx) => {
      const defaultRoles = [
        { name: 'Super Admin', isSystem: true, isCustom: false },
        { name: 'Organization Admin', isSystem: false, isCustom: false },
        { name: 'Department Admin', isSystem: false, isCustom: false },
        { name: 'Employee', isSystem: false, isCustom: false },
        { name: 'Guest', isSystem: false, isCustom: false }
      ];

      const createdRoles = [];
      for (const r of defaultRoles) {
        const role = await prisma.role.create({
          data: {
            organizationId,
            name: r.name,
            isSystem: r.isSystem,
            description: `Default ${r.name} role`
          },
          include: { permissions: true }
        });
        
        // Give Super Admin all mock permissions as a start
        if (role.name === 'Super Admin') {
          const allPerms = [
            'DOC_READ', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_DELETE', 'DOC_UPLOAD', 'DOC_DOWNLOAD', 'DOC_SHARE',
            'USER_INVITE', 'DEPT_MANAGE', 'ORG_MANAGE', 'ANALYTICS_VIEW', 'AUDIT_LOGS', 'AI_MANAGE', 'PERM_MANAGE'
          ];
          for (const perm of allPerms) {
            await prisma.permission.create({
              data: {
                roleId: role.id,
                action: perm,
                resource: 'System'
              }
            });
          }
        }
        
        createdRoles.push(await prisma.role.findUnique({ where: { id: role.id }, include: { permissions: true }}));
      }

      return createdRoles;
    });
  }
}
