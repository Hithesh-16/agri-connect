import { createServer } from 'http';
import { prisma, config } from './config';
import { logger } from './config/logger';
import { Sentry } from './config/sentry';
import { startWorkers } from './workers';
import { initializeSocket } from './services/socketService';
import app from './app';

const httpServer = createServer(app);

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    startWorkers();
    initializeSocket(httpServer);

    httpServer.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'KisanConnect API started (HTTP + WebSocket)');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

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
