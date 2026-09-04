import { createApp } from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger';
import { WorkerManager } from './infrastructure/queue/WorkerManager';

const startServer = async () => {
  try {
    const app = createApp();
    
    const server = app.listen(env.PORT as number, '0.0.0.0', () => {
      logger.info(`🚀 EKOS Backend is running on http://127.0.0.1:${env.PORT} in ${env.NODE_ENV} mode`);
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
