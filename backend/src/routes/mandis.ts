import { Router, Request, Response } from 'express';
import { prisma } from '../config';
import { paginate, paginatedResponse } from '../types';

const router = Router();

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/mandis
router.get('/', async (req: Request, res: Response) => {
  try {
    const { radius, lat, lng, page, limit } = req.query as Record<string, string | undefined>;
    const { page: p, limit: l, skip } = paginate(page, limit);

    let mandis = await prisma.mandi.findMany({ orderBy: { distanceKm: 'asc' } });

    // Filter by radius if coordinates provided
    if (radius && lat && lng) {
      const r = parseFloat(radius);
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      mandis = mandis.filter((m) => haversineDistance(userLat, userLng, m.latitude, m.longitude) <= r);
    }

    const total = mandis.length;
    const paginated = mandis.slice(skip, skip + l);

    res.json({ success: true, ...paginatedResponse(paginated, total, p, l) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch mandis.' });
  }
});

// GET /api/mandis/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const mandi = await prisma.mandi.findUnique({
      where: { id: req.params.id as string },
      include: {
        prices: {
          include: { crop: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!mandi) {
      res.status(404).json({ success: false, error: 'Mandi not found.' });
      return;
    }

    res.json({ success: true, data: mandi });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch mandi.' });
  }
});

export default router;
