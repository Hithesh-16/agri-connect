import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, prisma } from './config';
import { initSentry, Sentry } from './config/sentry';
import { errorHandler, notFoundHandler } from './errors/error-handler';
import { requestLogger } from './middleware/requestLogger';
import { RATE_LIMIT } from './constants';
import v1Router from './api/routes/v1';

const app = express();

// Sentry (must be before routes)
initSentry();

// Security
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'not configured';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  try {
    const { getRedis } = await import('./config/redis');
    const redis = getRedis();
    if (redis) { await redis.ping(); redisStatus = 'connected'; }
  } catch {
    redisStatus = 'error';
  }

  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: { status: healthy ? 'ok' : 'degraded', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0', services: { database: dbStatus, redis: redisStatus } },
  });
});

// Versioned API routes
app.use('/api/v1', v1Router);

// Backward compatibility — /api/* maps to v1
app.use('/api', v1Router);

// Error handling (must be last)
Sentry.setupExpressErrorHandler(app);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
