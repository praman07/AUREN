import { UnitOfWork } from '../../infrastructure/database/UnitOfWork';
import { IEventPublisher } from '../interfaces/IEventPublisher';
import { prisma } from '../../infrastructure/database/prisma';
import { AuditLogQueryDTO } from '../dtos/AuditLogDTOs';
import { AuditAction } from '@prisma/client';

export class AuditLogService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async getLogs(organizationId: string, filters: AuditLogQueryDTO) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.action) {
      where.action = filters.action as AuditAction;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
