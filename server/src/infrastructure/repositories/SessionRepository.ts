import { Session, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface ISessionRepository extends IBaseRepository<Session, Prisma.SessionCreateInput, Prisma.SessionUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Session | null>;
}

export class SessionRepository extends TenantAwareRepository<Session, Prisma.SessionCreateInput, Prisma.SessionUpdateInput> implements ISessionRepository {
  constructor(tx: any = prisma) {
    super(tx.session, 'Session');
  }
}
