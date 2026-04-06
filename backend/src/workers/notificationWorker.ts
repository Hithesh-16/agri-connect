import { Job } from 'bullmq';
import { createWorker, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('notification-worker');

interface NotificationPayload {
  type: 'sms' | 'push' | 'whatsapp' | 'email';
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

async function processNotification(job: Job<NotificationPayload>) {
  const { type, to, title, body } = job.data;

  switch (type) {
    case 'sms':
      // TODO: Integrate MSG91 API
      log.info({ to, body: body.substring(0, 50) }, 'SMS notification (stub)');
      break;

    case 'push':
      // TODO: Integrate Firebase Cloud Messaging
      log.info({ to, title }, 'Push notification (stub)');
      break;

    case 'whatsapp':
      // TODO: Integrate Gupshup API
      log.info({ to, body: body.substring(0, 50) }, 'WhatsApp notification (stub)');
      break;

    case 'email':
      log.info({ to, title }, 'Email notification (stub)');
      break;

    default:
      log.warn({ type }, 'Unknown notification type');
  }
}

export function startNotificationWorker() {
  return createWorker(QUEUES.NOTIFICATION, processNotification, 10);
}
