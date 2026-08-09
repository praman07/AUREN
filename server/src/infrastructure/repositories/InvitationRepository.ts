import { Invitation, Prisma } from '@prisma/client';
import { TenantAwareRepository } from './TenantAwareRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IInvitationRepository extends IBaseRepository<Invitation, Prisma.InvitationCreateInput, Prisma.InvitationUpdateInput> {
  findByTenantAndId(id: string, organizationId: string): Promise<Invitation | null>;
}

export class InvitationRepository extends TenantAwareRepository<Invitation, Prisma.InvitationCreateInput, Prisma.InvitationUpdateInput> implements IInvitationRepository {
  constructor(tx: any = prisma) {
    super(tx.invitation, 'Invitation');
  }
}
