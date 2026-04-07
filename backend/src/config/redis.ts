import Redis from 'ioredis';
import { createChildLogger } from './logger';
import { env } from './env';

const log = createChildLogger('redis');

const redisUrl = env.redisUrl;

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  if (!redisUrl) {
    log.warn('REDIS_URL not set — caching disabled');
    return null;
  }

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => log.info('Redis connected'));
  redis.on('error', (err) => log.error({ err }, 'Redis error'));
  redis.on('close', () => log.warn('Redis connection closed'));

  redis.connect().catch((err) => {
    log.error({ err }, 'Failed to connect to Redis');
    redis = null;
  });

  return redis;
}

// Cache helper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Swallow cache write errors — cache is best-effort
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Swallow
  }
}

// Cache TTL constants (seconds)
export const CACHE_TTL = {
  PRICES: 15 * 60,       // 15 minutes
  WEATHER: 30 * 60,      // 30 minutes
  SCHEMES: 24 * 60 * 60, // 24 hours
  CATEGORIES: 60 * 60,   // 1 hour
  CROPS: 60 * 60,        // 1 hour
  MANDIS: 60 * 60,       // 1 hour
  NEWS: 10 * 60,         // 10 minutes
} as const;
