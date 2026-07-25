import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './shared/config/env';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { requestLogger } from './presentation/middlewares/requestLogger';
import documentRoutes from './presentation/routes/documentRoutes';
import semanticSearchRoutes from './presentation/routes/semanticSearchRoutes';
import chatRoutes from './presentation/routes/chatRoutes';

export const createApp = (): Application => {
  const app = express();

  // 1. Security & Parsing Middlewares
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 2. Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // 3. Logging
  app.use(requestLogger);

  // 4. Routes
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/semantic-search', semanticSearchRoutes);
  app.use('/api/v1/chat', chatRoutes);

  // 5. Error Handling
  app.use(errorHandler);

  return app;
};
