import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, prisma } from './config';
import { logger } from './config/logger';
import { initSentry, Sentry } from './config/sentry';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { startWorkers } from './workers';
import { initializeSocket } from './services/socketService';
import { API_ROUTES, RATE_LIMIT } from './constants';

// Route imports
import authRoutes from './api/routes/auth';
import cropRoutes from './api/routes/crops';
import mandiRoutes from './api/routes/mandis';
import priceRoutes from './api/routes/prices';
import weatherRoutes from './api/routes/weather';
import newsRoutes from './api/routes/news';
import scannerRoutes from './api/routes/scanner';
import supplyChainRoutes from './api/routes/supply-chain';
import userRoutes from './api/routes/user';
import priceHistoryRoutes from './api/routes/price-history';
import alertRoutes from './api/routes/alerts';
import calendarRoutes from './api/routes/calendar';
import listingRoutes from './api/routes/listings';
import schemeRoutes from './api/routes/schemes';
import inventoryRoutes from './api/routes/inventory';
import communityRoutes from './api/routes/community';
import roleRoutes from './api/routes/roles';
import uploadRoutes from './api/routes/upload';
import providerRoutes from './api/routes/providers';
import serviceRoutes from './api/routes/services';
import bookingRoutes from './api/routes/bookings';
import availabilityRoutes from './api/routes/availability';
import chatRoutes from './api/routes/chat';
import notificationRoutes from './api/routes/notifications';
import deviceRoutes from './api/routes/devices';
import paymentRoutes from './api/routes/payments';
import teamRoutes from './api/routes/teams';
import jobRoutes from './api/routes/jobs';
import attendanceRoutes from './api/routes/attendance';

const app = express();
const httpServer = createServer(app);

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
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_AUTH,
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
app.get(API_ROUTES.HEALTH, async (_req, res) => {
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
app.use(API_ROUTES.AUTH, authLimiter, authRoutes);
app.use(API_ROUTES.CROPS, cropRoutes);
app.use(API_ROUTES.MANDIS, mandiRoutes);
app.use(API_ROUTES.PRICE_HISTORY, priceHistoryRoutes);
app.use(API_ROUTES.PRICES, priceRoutes);
app.use(API_ROUTES.WEATHER, weatherRoutes);
app.use(API_ROUTES.NEWS, newsRoutes);
app.use(API_ROUTES.SCANNER, scannerRoutes);
app.use(API_ROUTES.SUPPLY_CHAIN, supplyChainRoutes);
app.use(API_ROUTES.USERS, userRoutes);
app.use(API_ROUTES.ALERTS, alertRoutes);
app.use(API_ROUTES.CALENDAR, calendarRoutes);
app.use(API_ROUTES.LISTINGS, listingRoutes);
app.use(API_ROUTES.SCHEMES, schemeRoutes);
app.use(API_ROUTES.INVENTORY, inventoryRoutes);
app.use(API_ROUTES.COMMUNITY, communityRoutes);
app.use(API_ROUTES.RBAC, roleRoutes);
app.use(API_ROUTES.UPLOAD, uploadRoutes);
app.use(API_ROUTES.PROVIDERS, providerRoutes);
app.use(API_ROUTES.SERVICES, serviceRoutes);
app.use(API_ROUTES.BOOKINGS, bookingRoutes);
app.use(API_ROUTES.AVAILABILITY, availabilityRoutes);
app.use(API_ROUTES.CHAT, chatRoutes);
app.use(API_ROUTES.NOTIFICATIONS, notificationRoutes);
app.use(API_ROUTES.DEVICES, deviceRoutes);
app.use(API_ROUTES.PAYMENTS, paymentRoutes);
app.use(API_ROUTES.TEAMS, teamRoutes);
app.use(API_ROUTES.JOBS, jobRoutes);
app.use(API_ROUTES.ATTENDANCE, attendanceRoutes);

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

    // Start background workers (notifications, audit logging, recurring bookings)
    startWorkers();

    // Initialize Socket.io
    initializeSocket(httpServer);

    httpServer.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'KisanConnect API started (HTTP + WebSocket)');
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
