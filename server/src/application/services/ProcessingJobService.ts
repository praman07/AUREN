import { prisma } from '../../infrastructure/database/prisma';
import { ProcessingJobQueryDTO } from '../dtos/ProcessingJobDTOs';

export class ProcessingJobService {
  async getJobs(organizationId: string, filters: ProcessingJobQueryDTO) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.queueName) {
      where.queueName = filters.queueName;
    }
    if (filters.documentId) {
      where.documentId = filters.documentId;
    }

    const [jobs, total] = await Promise.all([
      prisma.processingJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          document: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      }),
      prisma.processingJob.count({ where })
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
