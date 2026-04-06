import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, prisma } from './config';
import { logger } from './config/logger';
import { initSentry, Sentry } from './config/sentry';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { startWorkers } from './workers';

// Route imports
import authRoutes from './routes/auth';
import cropRoutes from './routes/crops';
import mandiRoutes from './routes/mandis';
import priceRoutes from './routes/prices';
import weatherRoutes from './routes/weather';
import newsRoutes from './routes/news';
import scannerRoutes from './routes/scanner';
import supplyChainRoutes from './routes/supplyChain';
import userRoutes from './routes/user';
import priceHistoryRoutes from './routes/priceHistory';
import alertRoutes from './routes/alerts';
import calendarRoutes from './routes/calendar';
import listingRoutes from './routes/listings';
import schemeRoutes from './routes/schemes';
import inventoryRoutes from './routes/inventory';
import communityRoutes from './routes/community';
import roleRoutes from './routes/roles';
import uploadRoutes from './routes/upload';
import providerRoutes from './routes/providers';
import serviceRoutes from './routes/services';

const app = express();

// Initialize Sentry (must be before routes)
initSentry();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Please try again later.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check (detailed: DB + Redis status)
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
    if (redis) {
      await redis.ping();
      redisStatus = 'connected';
    }
  } catch {
    redisStatus = 'error';
  }

  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    },
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/mandis', mandiRoutes);
app.use('/api/prices/history', priceHistoryRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/supply-chain', supplyChainRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/rbac', roleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);

// Sentry error handler (must be before custom error handler)
Sentry.setupExpressErrorHandler(app);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Start background workers (notifications, audit logging)
    startWorkers();

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'KisanConnect API started');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  Sentry.captureException(err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  Sentry.captureException(reason);
  process.exit(1);
});

main();
