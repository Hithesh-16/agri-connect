import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types';
import { config } from '../../config';
import { sendSuccess } from '../../utils/response';
import { paginate } from '../../utils/pagination';
import { NotFoundError } from '../../errors/app-error';
import { PriceService } from '../../services/priceService';
import { cacheGet, cacheSet, CACHE_TTL } from '../../config/redis';

export async function list(req: AuthRequest, res: Response) {
  const { cropId, mandiId, type, search, myCrops, page, limit } = req.query as Record<string, string>;
  const pag = paginate(page, limit);

  // If myCrops filter is used, decode userId from optional auth header
  let userId: string | undefined;
  if (myCrops === 'true') {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as any;
        userId = decoded.userId;
      } catch {
        // Optional auth — ignore invalid tokens
      }
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

  sendSuccess(res, prices, { page: pag.page, limit: pag.limit, total, totalPages: Math.ceil(total / pag.limit) });
}

export async function highlights(_req: AuthRequest, res: Response) {
  const cacheKey = 'prices:highlights';
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const data = await PriceService.getHighlights();
  await cacheSet(cacheKey, data, CACHE_TTL.PRICES);

  sendSuccess(res, data);
}

export async function chain(req: AuthRequest, res: Response) {
  const data = await PriceService.getPriceChain(req.params.cropId as string);
  if (!data) throw new NotFoundError('Price data for this crop');

  sendSuccess(res, data);
}
