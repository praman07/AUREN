import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';

export class SessionService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}
}
