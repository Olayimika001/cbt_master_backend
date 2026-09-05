import express, { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler } from './middleware/index.js';

import { authRouter } from './modules/auth/routes.js';
import { usersRouter, profileRouter } from './modules/users/routes.js';
import { coursesRouter } from './modules/courses/routes.js';
import { attemptsRouter, cbtRouter } from './modules/attempts/routes.js';
import { notificationsRouter } from './modules/notifications/routes.js';
import { bookmarksRouter } from './modules/bookmarks/routes.js';
import { analyticsRouter } from './modules/analytics/routes.js';
import { paymentsRouter } from './modules/payments/routes.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logging
app.use(pinoHttp({ logger }));

// Health Check Handler (Liveness & Readiness)
const handleHealth = async (_req: express.Request, res: express.Response) => {
  let dbStatus = 'healthy';
  try {
    // 2-second timeout probe to avoid hanging orchestrator checks
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health probe timeout')), 2000)),
    ]);
  } catch (error: any) {
    dbStatus = 'unhealthy';
    logger.warn({ err: error.message }, 'Database health check probe failed or timed out');
  }

  const isHealthy = dbStatus === 'healthy';
  // Return HTTP 200 so orchestrators (Railway/Render) do not kill the container on initial cold starts
  res.status(200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Root health check endpoint (mounted before rate limiting)
app.get('/health', handleHealth);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
});
app.use(limiter);

// ============================================================================
// /api/v1 Unified API Router
// ============================================================================
const apiV1 = Router();

apiV1.get('/health', handleHealth);
apiV1.use('/auth', authRouter);
apiV1.use('/courses', coursesRouter);
apiV1.use('/cbt', cbtRouter);
apiV1.use('/attempts', attemptsRouter);
apiV1.use('/users', usersRouter);
apiV1.use('/profile', profileRouter);
apiV1.use('/notifications', notificationsRouter);
apiV1.use('/bookmarks', bookmarksRouter);
apiV1.use('/', analyticsRouter); // /analytics and /leaderboard
apiV1.use('/payments', paymentsRouter);

app.use('/api/v1', apiV1);

// Backward compatibility: also mount root routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/profile', profileRouter);
app.use('/courses', coursesRouter);
app.use('/cbt', cbtRouter);
app.use('/attempts', attemptsRouter);
app.use('/notifications', notificationsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/', analyticsRouter);
app.use('/payments', paymentsRouter);

// Global Error Handler
app.use(errorHandler);

// Server startup & process lifecycle management
if (env.NODE_ENV !== 'test') {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`CBT Master Server is running on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received: closing HTTP server gracefully`);
    server.close(async () => {
      logger.info('HTTP server closed, disconnecting Prisma client');
      try {
        await prisma.$disconnect();
      } catch (err) {
        logger.error({ err }, 'Error disconnecting Prisma client during shutdown');
      }
      process.exit(0);
    });

    // Force exit after 10s if connections refuse to drain
    setTimeout(() => {
      logger.error('Forced shutdown: connections did not drain within 10s');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception');
    process.exit(1);
  });
}


export default app;
export { app };

