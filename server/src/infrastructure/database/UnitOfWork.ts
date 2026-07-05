import { prisma } from './prisma';

export class UnitOfWork {
  async execute<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(async (tx) => {
      return await fn(tx);
    });
  }
}
