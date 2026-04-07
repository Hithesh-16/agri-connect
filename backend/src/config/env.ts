// ─── GUARDS ─────────────────────────────────────────────
// NOTE: This file must NOT import logger.ts to avoid circular deps
// (logger → config/index → env → logger)

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// ─── ENVIRONMENT ────────────────────────────────────────

const nodeEnv = optionalEnv('NODE_ENV', 'development');
const isDev = nodeEnv === 'development';
const isTest = nodeEnv === 'test';
const isProd = nodeEnv === 'production';

// ─── TYPED ENV OBJECT ───────────────────────────────────

export const env = {
  nodeEnv,
  isDev,
  isTest,
  isProd,

  // Server
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  corsOrigins: optionalEnv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8081,http://localhost:19006')
    .split(',')
    .map((s) => s.trim()),

  // Database
  databaseUrl: isDev
    ? optionalEnv('DATABASE_URL', '')
    : requireEnv('DATABASE_URL'),

  // Auth
  jwtSecret: isDev
    ? optionalEnv('JWT_SECRET', 'dev-only-secret-not-for-production')
    : requireEnv('JWT_SECRET'),
  jwtExpiresIn: '15m',
  refreshTokenExpiresInDays: 30,
  otpExpiryMinutes: 5,
  universalOtp: isDev ? '123456' : null,

  // Redis (optional)
  redisUrl: process.env.REDIS_URL || '',

  // External APIs (optional)
  openWeatherMapKey: optionalEnv('OPENWEATHERMAP_API_KEY', ''),
  agmarknetApiKey: optionalEnv('AGMARKNET_API_KEY', ''),

  // Sentry (optional)
  sentryDsn: process.env.SENTRY_DSN || '',

  // Razorpay (optional)
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Firebase (optional)
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',

  // MSG91 SMS (optional)
  msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
  msg91SenderId: optionalEnv('MSG91_SENDER_ID', 'KISANC'),
  msg91OtpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || '',
  msg91TplBookingConfirmed: process.env.MSG91_TPL_BOOKING_CONFIRMED || '',
  msg91TplBookingCancelled: process.env.MSG91_TPL_BOOKING_CANCELLED || '',
  msg91TplProviderArriving: process.env.MSG91_TPL_PROVIDER_ARRIVING || '',
  msg91TplPaymentReceived: process.env.MSG91_TPL_PAYMENT_RECEIVED || '',

  // S3 / Upload (optional)
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: optionalEnv('S3_REGION', 'ap-south-1'),
  cdnUrl: process.env.CDN_URL || '',
  uploadDir: optionalEnv('UPLOAD_DIR', './uploads'),
} as const;
