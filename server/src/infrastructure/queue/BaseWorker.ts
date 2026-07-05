import { Worker, Job } from 'bullmq';
import { redisConnection } from './redis';
import { prisma } from '../database/prisma';

export abstract class BaseWorker<T> {
  protected worker: Worker;

  constructor(protected readonly queueName: string) {
    this.worker = new Worker(queueName, this.processJob.bind(this), { connection: redisConnection });
    
    this.worker.on('completed', this.onCompleted.bind(this));
    this.worker.on('failed', this.onFailed.bind(this));
  }

  // Wrapped execution to track job in PostgreSQL
  private async processJob(job: Job<T>): Promise<any> {
    // 1. Sync state to Postgres: PROCESSING
    const payload = job.data as any;
    if (payload.documentId && payload.organizationId) {
      await this.syncJobState(job.id || '', payload.organizationId, payload.documentId, 'PROCESSING');
    }

    // 2. Execute concrete business logic
    return await this.handle(job.data);
  }

  protected abstract handle(data: T): Promise<any>;

  private async onCompleted(job: Job) {
    const payload = job.data as any;
    if (payload.documentId && payload.organizationId) {
      await this.syncJobState(job.id || '', payload.organizationId, payload.documentId, 'COMPLETED');
    }
  }

  private async onFailed(job: Job | undefined, error: Error) {
    if (job) {
      const payload = job.data as any;
      if (payload.documentId && payload.organizationId) {
        await this.syncJobState(job.id || '', payload.organizationId, payload.documentId, 'FAILED', error.message);
      }
    }
  }

  private async syncJobState(jobId: string, organizationId: string, documentId: string, status: string, error?: string) {
    try {
      const existing = await prisma.processingJob.findFirst({ where: { id: jobId } });
      
      if (existing) {
        await prisma.processingJob.update({
          where: { id: jobId },
          data: {
            status,
            error,
            ...(status === 'PROCESSING' ? { startedAt: new Date() } : {}),
            ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
            ...(status === 'FAILED' ? { failedAt: new Date() } : {}),
          }
        });
      } else {
        await prisma.processingJob.create({
          data: {
            id: jobId, // Use BullMQ Job ID
            organizationId,
            documentId,
            queueName: this.queueName,
            status,
            error,
            ...(status === 'PROCESSING' ? { startedAt: new Date() } : {}),
          }
        });
      }
    } catch (e) {
      console.error('Failed to sync job state to database', e);
    }
  }
}
