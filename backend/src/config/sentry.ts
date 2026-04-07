import * as Sentry from '@sentry/node';
import { env } from './env';
import { createChildLogger } from './logger';

const log = createChildLogger('sentry');

export function initSentry() {
  if (!env.sentryDsn) {
    if (!env.isDev) {
      log.warn('SENTRY_DSN not set — error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.isDev ? 1.0 : 0.2,
  });
}

export { Sentry };
