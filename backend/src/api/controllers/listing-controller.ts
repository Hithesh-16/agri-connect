import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as listingService from '../../services/listing-service';
import { AppError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';

export async function nearby(req: AuthRequest, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  if (isNaN(lat) || isNaN(lon)) throw new AppError('lat and lon query parameters are required.', 400);

  const radius = parseFloat((req.query.radius as string) || '20');
  const data = await listingService.findNearby(lat, lon, radius);
  sendSuccess(res, data);
}

export async function list(req: AuthRequest, res: Response) {
  const { listings, total, page, limit } = await listingService.listAll(req.query as Record<string, string>);
  sendSuccess(res, listings, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getDetail(req: AuthRequest, res: Response) {
  const listing = await listingService.getDetail(req.params.id as string);
  sendSuccess(res, listing);
}

export async function create(req: AuthRequest, res: Response) {
  const listing = await listingService.createListing(req.user!.userId, req.body);
  sendCreated(res, listing);
}

export async function update(req: AuthRequest, res: Response) {
  const listing = await listingService.updateListing(req.params.id as string, req.user!.userId, req.body);
  sendSuccess(res, listing);
}

export async function remove(req: AuthRequest, res: Response) {
  await listingService.deleteListing(req.params.id as string, req.user!.userId);
  sendMessage(res, 'Listing deactivated.');
}

export async function createInquiry(req: AuthRequest, res: Response) {
  const inquiry = await listingService.createInquiry(req.params.id as string, req.user!.userId, req.body.message, req.body.phone);
  sendCreated(res, inquiry);
}
