import { Job } from 'bullmq';
import { prisma } from '../config';
import { createWorker, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';
import { sendPushNotification } from '../services/pushService';
import { sendTransactionalSMS, SMS_TEMPLATES } from '../services/smsService';
import { emitNotification } from '../services/socketService';

const log = createChildLogger('notification-worker');

interface NotificationPayload {
  type: 'sms' | 'push' | 'whatsapp' | 'email';
  to: string; // userId
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

async function processNotification(job: Job<NotificationPayload>) {
  const { type, to, title, body, data } = job.data;

  // 1. Persist in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId: to,
      type: (data?.screen as string) || 'SYSTEM',
      title: { en: title || '' },
      body: { en: body },
      data: (data as any) || undefined,
      channel: [type.toUpperCase(), 'IN_APP'],
    },
  });

  // 2. Emit via Socket.io for real-time delivery
  emitNotification(to, notification);

  // 3. Send push notification
  if (type === 'push') {
    const sent = await sendPushNotification({
      userId: to,
      title: title || 'KisanConnect',
      body,
      data: data as Record<string, string> | undefined,
    });

    if (sent) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushSent: true, pushSentAt: new Date() },
      });
    }
  }

  // 4. Send SMS if type is sms
  if (type === 'sms') {
    const user = await prisma.user.findUnique({ where: { id: to }, select: { mobile: true } });
    if (user?.mobile) {
      const templateId = getTemplateId(data);
      if (templateId) {
        await sendTransactionalSMS(user.mobile, templateId, { body });
        await prisma.notification.update({
          where: { id: notification.id },
          data: { smsSent: true, smsSentAt: new Date() },
        });
      }
    }
  }

  log.info({ type, to, title }, 'Notification processed');
}

function getTemplateId(data?: Record<string, unknown>): string {
  const screen = data?.screen as string;
  switch (screen) {
    case 'BookingDetail':
      return SMS_TEMPLATES.BOOKING_CONFIRMED;
    case 'BookingCancelled':
      return SMS_TEMPLATES.BOOKING_CANCELLED;
    default:
      return '';
  }
}

export function startNotificationWorker() {
  return createWorker(QUEUES.NOTIFICATION, processNotification, 10);
}
