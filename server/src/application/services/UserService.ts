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

  async createUser(organizationId: string, email: string, firstName: string, lastName: string): Promise<User> {
    return await this.unitOfWork.execute(async (tx) => {
      
      const existing = await this.userRepository.findMany({ email, organizationId });
      if (existing.length > 0) {
        throw new ConflictException('User already exists in this organization');
      }

      const user = await this.userRepository.create({
        email,
        firstName,
        lastName,
        organization: { connect: { id: organizationId } }
      });

      await this.eventPublisher.publish('user.created', { userId: user.id });
      
      return user;
    });
  }
}
