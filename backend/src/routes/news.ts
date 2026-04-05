import { Router, Request, Response } from 'express';
import { prisma } from '../config';
import { paginate, paginatedResponse } from '../types';

const router = Router();

// GET /api/news
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, page, limit } = req.query as Record<string, string | undefined>;
    const { page: p, limit: l, skip } = paginate(page, limit);

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({ where, skip, take: l, orderBy: { createdAt: 'desc' } }),
      prisma.news.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(news, total, p, l) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news.' });
  }
});

// GET /api/news/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.news.findUnique({ where: { id: req.params.id as string } });

    if (!item) {
      res.status(404).json({ success: false, error: 'News item not found.' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news item.' });
  }
});

export default router;
