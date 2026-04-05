import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, prisma } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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

const app = express();

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');

    app.listen(config.port, () => {
      console.log(`Kisan Connect API running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
