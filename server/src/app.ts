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
import userRoutes from './presentation/routes/userRoutes';
import departmentRoutes from './presentation/routes/departmentRoutes';
import roleRoutes from './presentation/routes/roleRoutes';
import auditLogRoutes from './presentation/routes/auditLogRoutes';
import processingJobRoutes from './presentation/routes/processingJobRoutes';
import authRoutes from './presentation/routes/authRoutes';
import { createSuperAdminRoutes } from './presentation/routes/superAdminRoutes';
import organizationRoutes from './presentation/routes/organizationRoutes';
import connectorRoutes from './presentation/routes/connectorRoutes';
import onboardingRoutes from './presentation/routes/onboardingRoutes';

export const createApp = (): Application => {
  const app = express();

  // 1. Security & Parsing Middlewares
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 2. Rate Limiting — tiered to allow frequent polling without hitting caps
  // General API limiter: generous for dev usage (handles 5s polling, etc.)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  // Auth-specific limiter: strict to prevent brute-force attacks
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  });
  app.use('/api', generalLimiter);

  // 3. Logging
  app.use(requestLogger);

  // 4. Routes
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.get('/readiness', (req: Request, res: Response) => {
    res.status(200).json({ status: 'READY', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/onboarding', onboardingRoutes);
  app.use('/api/v1/organization', organizationRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/semantic-search', semanticSearchRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/roles', roleRoutes);
  app.use('/api/v1/audit-logs', auditLogRoutes);
  app.use('/api/v1/jobs', processingJobRoutes);
  app.use('/api/v1/connectors', connectorRoutes);
  app.use('/api/v1/super-admin', createSuperAdminRoutes());

  // 404 handler for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Not Found' });
  });

  // 5. Error Handling
  app.use(errorHandler);

  return app;
};
