import { Job } from 'bullmq';
import { createWorker, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('audit-worker');

interface AuditPayload {
  action: string;
  userId?: string;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

async function processAuditLog(job: Job<AuditPayload>) {
  const { action, userId, resource, resourceId } = job.data;
  // TODO: Write to AuditLog table once RBAC phase creates it
  log.info({ action, userId, resource, resourceId }, 'Audit event recorded');
}

export function startAuditWorker() {
  return createWorker(QUEUES.AUDIT_LOG, processAuditLog, 5);
}
