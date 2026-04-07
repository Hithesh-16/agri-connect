import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { sendSuccess } from '../../utils/response';
import { paginate } from '../../utils/pagination';
import { NotFoundError } from '../../errors/app-error';

export async function list(req: AuthRequest, res: Response) {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const category = req.query.category as string | undefined;

  const where: any = {};
  if (category) where.category = category;

  const [crops, total] = await Promise.all([
    prisma.crop.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.crop.count({ where }),
  ]);

  sendSuccess(res, crops, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function detail(req: AuthRequest, res: Response) {
  const crop = await prisma.crop.findUnique({
    where: { id: req.params.id as string },
    include: { prices: true },
  });

  if (!crop) throw new NotFoundError('Crop');

  sendSuccess(res, crop);
}
