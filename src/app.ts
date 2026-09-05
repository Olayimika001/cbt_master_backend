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

// Health Check Handler
const handleHealth = async (_req: express.Request, res: express.Response) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'unhealthy';
    logger.error(error, 'Database health check failed');
  }

  const isHealthy = dbStatus === 'healthy';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get('/health', handleHealth);

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

// Server startup
if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`CBT Master Server is running on port ${env.PORT}`);
  });
}


export default app;
export { app };

