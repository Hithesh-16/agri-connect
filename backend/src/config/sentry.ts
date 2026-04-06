import * as Sentry from '@sentry/node';
import { config } from './index';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    if (!config.isDev) {
      console.warn('SENTRY_DSN not set — error tracking disabled in production');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: config.nodeEnv,
    tracesSampleRate: config.isDev ? 1.0 : 0.2,
  });
}

export { Sentry };
