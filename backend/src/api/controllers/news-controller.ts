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

  const [news, total] = await Promise.all([
    prisma.news.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.news.count({ where }),
  ]);

  sendSuccess(res, news, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function detail(req: AuthRequest, res: Response) {
  const article = await prisma.news.findUnique({
    where: { id: req.params.id as string },
  });

  if (!article) throw new NotFoundError('News article');

  sendSuccess(res, article);
}
