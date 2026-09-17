import { createApp } from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger';
import { WorkerManager } from './infrastructure/queue/WorkerManager';

import { execSync } from 'child_process';
import { prisma } from './infrastructure/database/prisma';

const ensureDatabaseReady = async () => {
  try {
    await prisma.user.findFirst({ select: { id: true } });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (err?.code === 'P2021' || msg.includes('does not exist')) {
      logger.info('⚙️ PostgreSQL schema missing (table public.User not found). Auto-applying Prisma migrations...');
      try {
        execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
        logger.info('🌱 Auto-seeding database with initial users and organization data...');
        execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
        logger.info('✅ Database schema and seed data auto-initialized successfully!');
      } catch (pushErr: any) {
        logger.warn(`⚠️ Prisma auto-migration notice: ${pushErr?.message || pushErr}`);
      }
    } else if (err?.code === 'P1001' || err?.name === 'PrismaClientInitializationError' || msg.includes("Can't reach database server") || msg.includes('ECONNREFUSED')) {
      logger.warn('⚠️ PostgreSQL database server at 127.0.0.1:5432 is offline. EKOS Backend running in resilient fallback mode.');
    } else {
      logger.warn(`Database readiness check notice: ${err?.message || err}`);
    }
  }
};

const startServer = async () => {
  try {
    await ensureDatabaseReady();
    const app = createApp();
    
    const server = app.listen(env.PORT as number, '0.0.0.0', () => {
      logger.info(`🚀 EKOS Backend is running on http://127.0.0.1:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${env.PORT} in use. Automatically clearing orphan listener...`);
        try {
          if (process.platform === 'win32') {
            execSync(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${env.PORT} -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"`);
          } else {
            execSync(`fuser -k ${env.PORT}/tcp || true`);
          }
        } catch {}
        setTimeout(() => {
          server.listen(env.PORT as number, '0.0.0.0');
        }, 1000);
      }
    });

    const { workerManager } = require('./di');
    workerManager.start();

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        // TODO: Close DB connections, Redis, Qdrant here
        process.exit(0);
      });

      // Force close if taking too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.fatal(error, 'Failed to start the server');
    process.exit(1);
  }
};

startServer();
