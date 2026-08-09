import { Organization, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { IBaseRepository } from './interfaces/IBaseRepository';
import { prisma } from '../database/prisma';

export interface IOrganizationRepository extends IBaseRepository<Organization, Prisma.OrganizationCreateInput, Prisma.OrganizationUpdateInput> {

}

export class OrganizationRepository extends BaseRepository<Organization, Prisma.OrganizationCreateInput, Prisma.OrganizationUpdateInput> implements IOrganizationRepository {
  constructor(tx: any = prisma) {
    super(tx.organization, 'Organization');
  }
}
