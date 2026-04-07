import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendSuccess, sendMessage } from '../../utils/response';
import { paginate } from '../../utils/pagination';
import { NotFoundError, ForbiddenError } from '../../errors/app-error';
import * as notificationRepo from '../../repositories/notification-repository';

export async function list(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const unreadOnly = req.query.unreadOnly === 'true';

  const where: any = { userId };
  if (unreadOnly) where.isRead = false;

  const [notifications, total] = await notificationRepo.findMany(where, { skip, take: limit });
  const unreadCount = await notificationRepo.countUnread(userId);

  sendSuccess(
    res,
    { notifications, unreadCount },
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );
}

export async function markRead(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const notification = await notificationRepo.findById(id);
  if (!notification) throw new NotFoundError('Notification');
  if (notification.userId !== userId) throw new ForbiddenError('You can only mark your own notifications as read.');

  const updated = await notificationRepo.markRead(id);

  sendSuccess(res, updated);
}

export async function markAllRead(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  await notificationRepo.markAllRead(userId);

  sendMessage(res, 'All notifications marked as read.');
}
