import { BaseRepository } from './BaseRepository';

export abstract class TenantAwareRepository<T, CreateDTO, UpdateDTO> extends BaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(delegate: any, modelName: string) {
    super(delegate, modelName);
  }

  async findByTenantAndId(id: string, organizationId: string): Promise<T | null> {
    try {
      return await this.delegate.findFirst({ where: { id, organizationId, deletedAt: null } });
    } catch (error) { this.handlePrismaError(error, id); }
  }
}
