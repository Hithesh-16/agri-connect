import { Queue, Worker, Job } from 'bullmq';
import { createChildLogger } from './logger';
import { env } from './env';

const log = createChildLogger('queue');

const redisUrl = env.redisUrl;

function getConnection() {
  if (!redisUrl) return null;
  // Parse Redis URL for BullMQ connection options
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

// Queue names
export const QUEUES = {
  NOTIFICATION: 'notification',
  SMS: 'sms',
  AUDIT_LOG: 'audit-log',
  PRICE_UPDATE: 'price-update',
  RECURRING_BOOKING: 'recurring-bookings',
} as const;

type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue | null {
  const conn = getConnection();
  if (!conn) {
    log.warn({ queue: name }, 'Redis not configured — queue disabled');
    return null;
  }

  if (queues.has(name)) return queues.get(name)!;

  const queue = new Queue(name, { connection: conn });
  queues.set(name, queue);
  log.info({ queue: name }, 'Queue initialized');
  return queue;
}

export function createWorker(
  name: QueueName,
  processor: (job: Job) => Promise<void>,
  concurrency = 5,
): Worker | null {
  const conn = getConnection();
  if (!conn) return null;

  const worker = new Worker(name, processor, {
    connection: conn,
    concurrency,
  });

  worker.on('completed', (job) => {
    log.debug({ queue: name, jobId: job.id, jobName: job.name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ queue: name, jobId: job?.id, jobName: job?.name, err }, 'Job failed');
  });

  log.info({ queue: name, concurrency }, 'Worker started');
  return worker;
}

// Helper to add jobs easily
export async function enqueue(queueName: QueueName, jobName: string, data: Record<string, unknown>, opts?: { delay?: number; attempts?: number }) {
  const queue = getQueue(queueName);
  if (!queue) {
    log.warn({ queue: queueName, job: jobName }, 'Queue unavailable — job dropped');
    return null;
  }

  return queue.add(jobName, data, {
    attempts: opts?.attempts ?? 3,
    backoff: { type: 'exponential', delay: 1000 },
    delay: opts?.delay,
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
