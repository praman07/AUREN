export interface IBaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: any, skip?: number, take?: number): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
}
