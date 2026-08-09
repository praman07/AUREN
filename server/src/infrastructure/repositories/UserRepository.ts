import { User, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IUserRepository extends IBaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<User | null>;
}

export class UserRepository extends TenantAwareRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> implements IUserRepository {
  constructor(tx: any = prisma) {
    super(tx.user, 'User');
  }
}
