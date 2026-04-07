import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';

export async function list(req: AuthRequest, res: Response) {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: req.user!.userId },
    include: { crop: true, mandi: true },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, alerts);
}

export async function create(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { cropId, mandiId, targetPrice, direction, priceType } = req.body;

  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop) throw new NotFoundError('Crop');

  if (mandiId) {
    const mandi = await prisma.mandi.findUnique({ where: { id: mandiId } });
    if (!mandi) throw new NotFoundError('Mandi');
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      cropId,
      mandiId: mandiId || null,
      targetPrice,
      direction,
      priceType,
    },
    include: { crop: true, mandi: true },
  });

  sendCreated(res, alert);
}

export async function toggle(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const existing = await prisma.priceAlert.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Alert');
  if (existing.userId !== userId) throw new ForbiddenError('Not authorized to modify this alert.');

  const alert = await prisma.priceAlert.update({
    where: { id },
    data: { isActive: !existing.isActive },
    include: { crop: true, mandi: true },
  });

  sendSuccess(res, alert);
}

export async function remove(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const existing = await prisma.priceAlert.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Alert');
  if (existing.userId !== userId) throw new ForbiddenError('Not authorized to delete this alert.');

  await prisma.priceAlert.delete({ where: { id } });

  sendMessage(res, 'Alert deleted.');
}
