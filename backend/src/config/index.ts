import { PrismaClient } from '@prisma/client';

const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = nodeEnv === 'development';

if (!isDev && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || (isDev ? 'dev-only-secret-not-for-production' : ''),
  jwtExpiresIn: '15m',
  refreshTokenExpiresInDays: 30,
  otpExpiryMinutes: 5,
  // Universal OTP only works in development mode
  universalOtp: isDev ? '123456' : null,
  nodeEnv,
  isDev,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
  // External API keys
  openWeatherMapKey: process.env.OPENWEATHERMAP_API_KEY || '',
  agmarknetApiKey: process.env.AGMARKNET_API_KEY || '',
};

export const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
  datasourceUrl: process.env.DATABASE_URL,
});
