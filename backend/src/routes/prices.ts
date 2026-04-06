import { Router, Response } from 'express';
import { PriceService } from '../services/priceService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { paginate, paginatedResponse } from '../types';
import { cacheGet, cacheSet, CACHE_TTL } from '../config/redis';

const router = Router();

// GET /api/prices
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { cropId, mandiId, type, search, myCrops, page, limit } = req.query as Record<string, string>;
    const pag = paginate(page, limit);

    // If myCrops filter is used, we need userId from optional auth
    let userId: string | undefined;
    if (myCrops === 'true') {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = await import('jsonwebtoken');
        const { config } = await import('../config');
        try {
          const decoded = jwt.default.verify(authHeader.split(' ')[1], config.jwtSecret) as any;
          userId = decoded.userId;
        } catch {}
      }
    }

    const { prices, total } = await PriceService.getAllPrices({
      cropId,
      mandiId,
      type,
      search,
      myCrops: myCrops === 'true',
      userId,
      ...pag,
    });

    res.json({ success: true, ...paginatedResponse(prices, total, pag.page, pag.limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch prices.' });
  }
});

// GET /api/prices/highlights
router.get('/highlights', async (_req, res: Response) => {
  try {
    const cacheKey = 'prices:highlights';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const highlights = await PriceService.getHighlights();
    await cacheSet(cacheKey, highlights, CACHE_TTL.PRICES);
    res.json({ success: true, data: highlights });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch highlights.' });
  }
});

// GET /api/prices/chain/:cropId
router.get('/chain/:cropId', async (req, res: Response) => {
  try {
    const chain = await PriceService.getPriceChain(req.params.cropId);
    if (!chain) {
      res.status(404).json({ success: false, error: 'No price data found for this crop.' });
      return;
    }
    res.json({ success: true, data: chain });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch price chain.' });
  }
});

export default router;
