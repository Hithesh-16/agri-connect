import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { sendSuccess } from '../../utils/response';
import { paginate } from '../../utils/pagination';
import { NotFoundError, AppError } from '../../errors/app-error';
import { haversineDistance } from '../../utils/geo';

export async function list(req: AuthRequest, res: Response) {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
  const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;

  if ((lat !== undefined && lng === undefined) || (lat === undefined && lng !== undefined)) {
    throw new AppError('Both lat and lng are required for radius filtering.', 400);
  }

  const allMandis = await prisma.mandi.findMany({ orderBy: { name: 'asc' } });

  let filtered = allMandis;
  if (lat !== undefined && lng !== undefined) {
    filtered = allMandis.filter((m) => {
      const dist = haversineDistance({ lat, lng }, { lat: m.latitude, lng: m.longitude });
      return dist <= radius;
    });
  }

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);

  sendSuccess(res, paginated, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function detail(req: AuthRequest, res: Response) {
  const mandi = await prisma.mandi.findUnique({
    where: { id: req.params.id as string },
    include: { prices: true },
  });

  if (!mandi) throw new NotFoundError('Mandi');

  sendSuccess(res, mandi);
}
