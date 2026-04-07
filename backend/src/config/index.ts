import { PrismaClient } from '@prisma/client';
import { env } from './env';

export const config = {
  port: env.port,
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  refreshTokenExpiresInDays: env.refreshTokenExpiresInDays,
  otpExpiryMinutes: env.otpExpiryMinutes,
  universalOtp: env.universalOtp,
  nodeEnv: env.nodeEnv,
  isDev: env.isDev,
  corsOrigins: env.corsOrigins,
  openWeatherMapKey: env.openWeatherMapKey,
  agmarknetApiKey: env.agmarknetApiKey,
};

export const prisma = new PrismaClient({
  log: env.isDev ? ['warn', 'error'] : ['error'],
  datasourceUrl: env.databaseUrl,
});
