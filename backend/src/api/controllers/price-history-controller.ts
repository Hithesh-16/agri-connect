import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../errors/app-error';

export async function getByCrop(req: AuthRequest, res: Response) {
  const cropId = req.params.cropId as string;
  const mandiId = req.query.mandiId as string | undefined;
  const period = parseInt(req.query.period as string, 10) || 30;

  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop) throw new NotFoundError('Crop');

  const since = new Date();
  since.setDate(since.getDate() - period);

  const where: any = { cropId, date: { gte: since } };
  if (mandiId) where.mandiId = mandiId;

  const history = await prisma.priceHistory.findMany({
    where,
    include: { mandi: true },
    orderBy: { date: 'asc' },
  });

  sendSuccess(res, { crop, period, history });
}
