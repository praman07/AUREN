import { Queue } from 'bullmq';
import { IJobQueue } from './IJobQueue';
import { redisConnection } from './redis';

export class BullMQJobQueue<T> implements IJobQueue<T> {
  private queue: Queue;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, { connection: redisConnection });
  }

  async add(name: string, payload: T, options?: any): Promise<void> {
    await this.queue.add(name, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s, 16s...
      },
      ...options
    });
  }
}
