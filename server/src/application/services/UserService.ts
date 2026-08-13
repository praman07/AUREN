import { User } from '@prisma/client';
import { IUserRepository } from '../../infrastructure/repositories/UserRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { ConflictException } from '../../domain/exceptions/ConflictException';
import { NotFoundException } from '../../domain/exceptions/NotFoundException';
import { PasswordService } from '../../shared/security/password';
import { prisma } from '../../infrastructure/database/prisma';

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
  roles?: string[];
  password?: string;
  isSuperAdmin?: boolean;
}

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getUsers(organizationId: string): Promise<User[]> {
    return await this.userRepository.findMany({ organizationId });
  }

  async createUser(organizationId: string, input: CreateUserInput, actorId?: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      const existing = await this.userRepository.findMany({ email: input.email.toLowerCase().trim(), organizationId });
      if (existing.length > 0) {
        throw new ConflictException('User already exists in this organization');
      }

      // Validate role IDs belong to this organization (prevents cross-tenant role assignment)
      const roleIds = input.roles || [];
      if (roleIds.length > 0) {
        const roles = await tx.role.findMany({ where: { id: { in: roleIds }, organizationId }, select: { id: true } });
        if (roles.length !== roleIds.length) {
          throw new ConflictException('One or more roles do not exist in this organization');
        }
      }

      // Validate department belongs to this organization
      if (input.departmentId) {
        const dept = await tx.department.findFirst({ where: { id: input.departmentId, organizationId }, select: { id: true } });
        if (!dept) {
          throw new ConflictException('Department does not exist in this organization');
        }
      }

      const data: any = {
        email: input.email.toLowerCase().trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        isSuperAdmin: input.isSuperAdmin || false,
        organization: { connect: { id: organizationId } },
      };

      if (input.password) {
        data.passwordHash = PasswordService.hash(input.password);
      }
      if (input.departmentId) {
        data.department = { connect: { id: input.departmentId } };
      }
      if (roleIds.length > 0) {
        data.userRoles = { create: roleIds.map((roleId) => ({ roleId })) };
      }

      const user = await this.userRepository.create(data);

      if (actorId) {
        await tx.auditLog.create({
          data: {
            action: 'PERMISSION_GRANT',
            organization: { connect: { id: organizationId } },
            actor: { connect: { id: actorId } },
            resourceId: user.id,
            metadata: { event: 'USER_CREATED', roles: roleIds, departmentId: input.departmentId }
          }
        });
      }

      await this.eventPublisher.publish('user.created', { userId: user.id, roles: roleIds });

      return user;
    });
  }

  async deactivateUser(organizationId: string, userId: string, actorId?: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      const user = await this.userRepository.findByTenantAndId(userId, organizationId);
      if (!user) throw new NotFoundException('User', userId);

      const updated = await this.userRepository.update(userId, { deletedAt: new Date() });

      // Revoke all sessions so a suspended user cannot keep their token
      await tx.session.deleteMany({ where: { userId } });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            organization: { connect: { id: organizationId } },
            actor: { connect: { id: actorId } },
            resourceId: userId,
            metadata: { event: 'USER_DEACTIVATED' }
          }
        });
      }

      return updated;
    });
  }

  async reactivateUser(organizationId: string, userId: string, actorId?: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      const user = await this.userRepository.findByTenantAndId(userId, organizationId);
      if (!user) throw new NotFoundException('User', userId);

      const updated = await this.userRepository.update(userId, { deletedAt: null });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            action: 'UPDATE',
            organization: { connect: { id: organizationId } },
            actor: { connect: { id: actorId } },
            resourceId: userId,
            metadata: { event: 'USER_REACTIVATED' }
          }
        });
      }

      return updated;
    });
  }
}
