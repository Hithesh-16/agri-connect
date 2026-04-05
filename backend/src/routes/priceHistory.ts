import { Router, Response } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/prices/history/:cropId
router.get('/:cropId', async (req: AuthRequest, res: Response) => {
  try {
    const cropId = req.params.cropId as string;
    const { mandiId, period } = req.query as Record<string, string>;

    const days = [7, 30, 90].includes(Number(period)) ? Number(period) : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      cropId,
      date: { gte: since },
    };

    if (mandiId) {
      where.mandiId = mandiId;
    }

    // Verify crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(404).json({ success: false, error: 'Crop not found.' });
      return;
    }

    const history = await prisma.priceHistory.findMany({
      where,
      include: { crop: true, mandi: true },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch price history.' });
  }
});

export default router;
