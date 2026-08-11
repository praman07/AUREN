import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { env } from './shared/config/env';

async function check() {
  console.log('Checking Infrastructure...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Postgres connection successful');
  } catch (e: any) {
    console.error('❌ Postgres FAIL:', e.message);
  }

  try {
    const redis = new Redis((env as any).REDIS_URL || 'redis://localhost:6379');
    await new Promise((resolve, reject) => {
      redis.on('ready', () => {
        console.log(`- Redis URL: ${(env as any).REDIS_URL || 'redis://localhost:6379'}`);
        console.log('✅ Redis connection successful');
        redis.quit();
        resolve(true);
      });
      redis.on('error', (err) => {
        console.error('❌ Redis FAIL:', err.message);
        redis.quit();
        resolve(false);
      });
    });
  } catch (e: any) {
    console.error('❌ Redis FAIL:', e.message);
  }
}

check().then(() => process.exit(0));
