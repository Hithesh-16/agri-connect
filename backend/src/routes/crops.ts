import { Router, Request, Response } from 'express';
import { prisma } from '../config';
import { paginate, paginatedResponse } from '../types';

const router = Router();

// GET /api/crops
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, page, limit } = req.query as Record<string, string | undefined>;
    const { page: p, limit: l, skip } = paginate(page, limit);

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const [crops, total] = await Promise.all([
      prisma.crop.findMany({ where, skip, take: l, orderBy: { name: 'asc' } }),
      prisma.crop.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(crops, total, p, l) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch crops.' });
  }
});

// GET /api/crops/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const crop = await prisma.crop.findUnique({
      where: { id: req.params.id as string },
      include: {
        prices: {
          include: { mandi: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!crop) {
      res.status(404).json({ success: false, error: 'Crop not found.' });
      return;
    }

    res.json({ success: true, data: crop });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch crop.' });
  }
});

export default router;
