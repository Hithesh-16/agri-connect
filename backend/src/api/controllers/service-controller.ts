import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as serviceListingService from '../../services/service-listing-service';
import { AppError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';

export async function getCategories(_req: AuthRequest, res: Response) {
  const categories = await serviceListingService.getCategories();
  sendSuccess(res, categories);
}

export async function list(req: AuthRequest, res: Response) {
  const { listings, total, page, limit } = await serviceListingService.listServices(req.query as Record<string, string>);
  sendSuccess(res, listings, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getDetail(req: AuthRequest, res: Response) {
  const listing = await serviceListingService.getServiceDetail(req.params.id as string);
  sendSuccess(res, listing);
}

export async function create(req: AuthRequest, res: Response) {
  const listing = await serviceListingService.createServiceListing(req.user!.userId, req.body);
  sendCreated(res, listing);
}

export async function update(req: AuthRequest, res: Response) {
  const updated = await serviceListingService.updateServiceListing(req.params.id as string, req.user!.userId, req.body);
  sendSuccess(res, updated);
}

export async function remove(req: AuthRequest, res: Response) {
  await serviceListingService.deleteServiceListing(req.params.id as string, req.user!.userId);
  sendMessage(res, 'Listing deleted.');
}

export async function togglePause(req: AuthRequest, res: Response) {
  const result = await serviceListingService.togglePause(req.params.id as string, req.user!.userId);
  sendSuccess(res, result);
}

export async function nearby(req: AuthRequest, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (isNaN(lat) || isNaN(lng)) throw new AppError('lat and lng query parameters are required.', 400);

  const radius = parseInt(req.query.radius as string, 10) || 25;
  const categoryId = req.query.categoryId as string | undefined;

  const result = await serviceListingService.findNearby(lat, lng, radius, categoryId);
  sendSuccess(res, result);
}
