import { Router, Response } from 'express';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { ENDPOINTS } from '../constants';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('notifications-route');
const E = ENDPOINTS.NOTIFICATIONS;

// ─── LIST NOTIFICATIONS ─────────────────────────────────
router.get(E.LIST, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page, limit, unreadOnly } = req.query as Record<string, string>;
    const { page: p, limit: l, skip } = paginate(page, limit);

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      ...paginatedResponse(notifications, total, p, l),
      unreadCount,
    });
  } catch (err) {
    log.error({ err }, 'Failed to list notifications');
    res.status(500).json({ success: false, error: 'Failed to list notifications.' });
  }
});

// ─── MARK AS READ ───────────────────────────────────────
router.put(E.MARK_READ, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id as string },
    });

    if (!notification || notification.userId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    log.error({ err }, 'Failed to mark notification read');
    res.status(500).json({ success: false, error: 'Failed to mark notification read.' });
  }
});

// ─── MARK ALL AS READ ───────────────────────────────────
router.put(E.MARK_ALL_READ, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: { count: result.count } });
  } catch (err) {
    log.error({ err }, 'Failed to mark all read');
    res.status(500).json({ success: false, error: 'Failed to mark all read.' });
  }
});

export default router;
