import { startNotificationWorker } from './notificationWorker';
import { startAuditWorker } from './auditWorker';
import { startRecurringBookingWorker } from './recurringBookingWorker';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('workers');

export function startWorkers() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    log.warn('REDIS_URL not set — workers disabled');
    return;
  }

  startNotificationWorker();
  startAuditWorker();
  startRecurringBookingWorker();
  log.info('All workers started (notification, audit, recurring-bookings)');
}
