import { User } from '@prisma/client';
import { IUserRepository } from '../../infrastructure/repositories/UserRepository';
import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { ConflictException } from '../../domain/exceptions/ConflictException';

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getUsers(organizationId: string): Promise<User[]> {
    return await this.userRepository.findMany({ organizationId });
  }

  async createUser(organizationId: string, email: string, firstName: string, lastName: string, departmentId?: string, roles?: string[]): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      
      const existing = await this.userRepository.findMany({ email, organizationId });
      if (existing.length > 0) {
        throw new ConflictException('User already exists in this organization');
      }

      // We'll create an INVITED status by ensuring clerkUserId is null
      // And we might link the departmentId if provided.
      const data: any = {
        email,
        firstName,
        lastName,
        organization: { connect: { id: organizationId } }
      };

      if (departmentId) {
        data.department = { connect: { id: departmentId } };
      }

      const user = await this.userRepository.create(data);

      await this.eventPublisher.publish('user.created', { userId: user.id, roles });
      
      return user;
    });
  }

  async deactivateUser(organizationId: string, userId: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      const user = await this.userRepository.findByTenantAndId(userId, organizationId);
      if (!user) throw new Error('User not found');
      
      return await this.userRepository.update(userId, { deletedAt: new Date() });
    });
  }

  async reactivateUser(organizationId: string, userId: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      const user = await this.userRepository.findByTenantAndId(userId, organizationId);
      if (!user) throw new Error('User not found');
      
      return await this.userRepository.update(userId, { deletedAt: null });
    });
  }
}
