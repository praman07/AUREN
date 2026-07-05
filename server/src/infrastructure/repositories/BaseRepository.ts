import { BaseException } from '../../domain/exceptions/BaseException';
import { NotFoundException } from '../../domain/exceptions/NotFoundException';
import { ConflictException } from '../../domain/exceptions/ConflictException';
import { IBaseRepository } from './interfaces/IBaseRepository';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> implements IBaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(
    protected readonly delegate: any,
    protected readonly modelName: string
  ) {}

  protected handlePrismaError(error: any, resourceId?: string): never {
    if (error.code === 'P2025') throw new NotFoundException(this.modelName, resourceId || 'unknown');
    if (error.code === 'P2002') throw new ConflictException('Unique constraint failed on ' + this.modelName);
    throw new BaseException('Database error in ' + this.modelName + ': ' + error.message, 500);
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.delegate.findFirst({ where: { id, deletedAt: null } });
    } catch (error) { this.handlePrismaError(error, id); }
  }

  async findMany(filters: any = {}, skip?: number, take?: number): Promise<T[]> {
    try {
      return await this.delegate.findMany({ where: { ...filters, deletedAt: null }, skip, take });
    } catch (error) { this.handlePrismaError(error); }
  }

  async create(data: CreateDTO): Promise<T> {
    try {
      return await this.delegate.create({ data });
    } catch (error) { this.handlePrismaError(error); }
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    try {
      const exists = await this.delegate.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw new NotFoundException(this.modelName, id);
      return await this.delegate.update({ where: { id }, data });
    } catch (error) { 
      if (error instanceof BaseException) throw error;
      this.handlePrismaError(error, id); 
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const exists = await this.delegate.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw new NotFoundException(this.modelName, id);
      await this.delegate.update({ where: { id }, data: { deletedAt: new Date() } });
    } catch (error) {
      if (error instanceof BaseException) throw error;
      this.handlePrismaError(error, id); 
    }
  }

  async restore(id: string): Promise<void> {
    try {
      const exists = await this.delegate.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!exists) throw new NotFoundException(this.modelName, id);
      await this.delegate.update({ where: { id }, data: { deletedAt: null } });
    } catch (error) { 
      if (error instanceof BaseException) throw error;
      this.handlePrismaError(error, id); 
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.delegate.count({ where: { id, deletedAt: null } });
      return count > 0;
    } catch (error) { this.handlePrismaError(error, id); }
  }

  async count(filters: any = {}): Promise<number> {
    try {
      return await this.delegate.count({ where: { ...filters, deletedAt: null } });
    } catch (error) { this.handlePrismaError(error); }
  }
}
