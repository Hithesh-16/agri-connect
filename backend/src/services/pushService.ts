import { prisma } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('push-service');

// Firebase Admin SDK — lazy-loaded to avoid startup failure when not configured
let firebaseAdmin: any = null;

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    log.warn('Firebase not configured — push notifications disabled');
    return null;
  }

  try {
    // Dynamic import to avoid hard dependency
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    firebaseAdmin = admin;
    log.info('Firebase Admin initialized');
    return admin;
  } catch (err) {
    log.error({ err }, 'Failed to initialize Firebase Admin');
    return null;
  }
}

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}): Promise<boolean> {
  const admin = getFirebaseAdmin();
  if (!admin) {
    log.info({ userId: params.userId, title: params.title }, 'Push notification (stub — Firebase not configured)');
    return false;
  }

  const tokens = await prisma.deviceToken.findMany({
    where: { userId: params.userId, isActive: true },
  });

  if (tokens.length === 0) {
    log.debug({ userId: params.userId }, 'No active device tokens');
    return false;
  }

  try {
    const message = {
      tokens: tokens.map(t => t.token),
      notification: {
        title: params.title,
        body: params.body,
        ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
      },
      data: params.data || {},
      android: {
        priority: 'high' as const,
        notification: { channelId: 'bookings', sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Deactivate invalid tokens
    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        prisma.deviceToken.update({
          where: { id: tokens[idx].id },
          data: { isActive: false },
        }).catch(() => {});
      }
    });

    log.info({ userId: params.userId, sent: response.successCount, failed: response.failureCount }, 'Push sent');
    return response.successCount > 0;
  } catch (err) {
    log.error({ err, userId: params.userId }, 'Push notification failed');
    return false;
  }
}
