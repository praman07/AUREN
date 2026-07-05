import Redis from 'ioredis';
import { env } from '../../shared/config/env';

// Assume env.REDIS_URL or default to local
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});
