import { prisma } from '../config';
import { cacheGet, cacheSet, CACHE_TTL } from '../config/redis';
import * as serviceListingRepo from '../repositories/service-listing-repository';
import * as providerRepo from '../repositories/provider-repository';
import { NotFoundError, ForbiddenError } from '../errors/app-error';
import { paginate } from '../utils/pagination';

export async function getCategories() {
  const cacheKey = 'service:categories';
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const categories = await serviceListingRepo.findCategories({ parentId: null, isActive: true });
  await cacheSet(cacheKey, categories, CACHE_TTL.CATEGORIES);
  return categories;
}

export async function listServices(filters: Record<string, string>) {
  const { page: p, limit: l, skip } = paginate(filters.page, filters.limit);
  const where: any = { isActive: true, isPaused: false };

  if (filters.categoryId) {
    const children = await prisma.serviceCategory.findMany({
      where: { parentId: filters.categoryId },
      select: { id: true },
    });
    where.categoryId = { in: [filters.categoryId, ...children.map((c) => c.id)] };
  }

  if (filters.minPrice) where.pricePerUnit = { ...where.pricePerUnit, gte: parseFloat(filters.minPrice) };
  if (filters.maxPrice) where.pricePerUnit = { ...where.pricePerUnit, lte: parseFloat(filters.maxPrice) };
  where.provider = { isActive: true };

  const [listings, total] = await serviceListingRepo.findMany(where, { skip, take: l }, {
    category: { select: { id: true, name: true, slug: true, icon: true } },
    provider: {
      select: { id: true, businessName: true, rating: true, totalBookings: true, isVerified: true, latitude: true, longitude: true, district: true },
      include: { user: { select: { firstName: true, surname: true, profilePhoto: true } } },
    },
  });

  return { listings, total, page: p, limit: l };
}

export async function getServiceDetail(id: string) {
  const listing = await serviceListingRepo.findById(id, {
    category: true,
    provider: { include: { user: { select: { firstName: true, surname: true, profilePhoto: true } } } },
  });
  if (!listing) throw new NotFoundError('Service listing');
  return listing;
}

export async function createServiceListing(userId: string, data: any) {
  const provider = await providerRepo.findByUserId(userId);
  if (!provider) throw new ForbiddenError('You must register as a provider first.');

  return serviceListingRepo.create({ providerId: provider.id, ...data });
}

export async function updateServiceListing(listingId: string, userId: string, data: any) {
  const listing = await serviceListingRepo.findById(listingId, { provider: { select: { userId: true } } });
  if (!listing) throw new NotFoundError('Listing');
  if ((listing as any).provider.userId !== userId) throw new ForbiddenError('Not your listing.');

  return serviceListingRepo.update(listingId, data);
}

export async function deleteServiceListing(listingId: string, userId: string) {
  const listing = await serviceListingRepo.findById(listingId, { provider: { select: { userId: true } } });
  if (!listing || (listing as any).provider.userId !== userId) throw new NotFoundError('Listing');

  await serviceListingRepo.update(listingId, { isActive: false });
}

export async function togglePause(listingId: string, userId: string) {
  const listing = await serviceListingRepo.findById(listingId, { provider: { select: { userId: true } } });
  if (!listing || (listing as any).provider.userId !== userId) throw new NotFoundError('Listing');

  const updated = await serviceListingRepo.update(listingId, { isPaused: !listing.isPaused });
  return { isPaused: updated.isPaused };
}

export async function findNearby(lat: number, lng: number, radius: number, categoryId?: string) {
  const radiusMeters = radius * 1000;

  const providers = await prisma.$queryRaw<any[]>`
    SELECT sp.id, sp."businessName", sp.type, sp.rating, sp."totalBookings", sp."isVerified",
           sp.latitude, sp.longitude, sp.district, sp.state,
           u."firstName", u."surname", u."profilePhoto",
           (6371000 * acos(
             cos(radians(${lat})) * cos(radians(sp.latitude)) *
             cos(radians(sp.longitude) - radians(${lng})) +
             sin(radians(${lat})) * sin(radians(sp.latitude))
           )) AS distance_meters
    FROM service_providers sp
    JOIN users u ON sp."userId" = u.id
    WHERE sp."isActive" = true
      AND sp.latitude IS NOT NULL
      AND sp.longitude IS NOT NULL
      AND (6371000 * acos(
        cos(radians(${lat})) * cos(radians(sp.latitude)) *
        cos(radians(sp.longitude) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(sp.latitude))
      )) <= ${radiusMeters}
    ORDER BY distance_meters ASC
    LIMIT 50
  `;

  if (!categoryId) return { providers, searchParams: { lat, lng, radius, categoryId } };

  const providerIds = providers.map((p: any) => p.id);
  const listings = await prisma.serviceListing.findMany({
    where: { providerId: { in: providerIds }, categoryId, isActive: true, isPaused: false },
    include: { category: { select: { name: true, slug: true, icon: true } } },
  });

  const listingsByProvider = new Map<string, typeof listings>();
  for (const l of listings) {
    const arr = listingsByProvider.get(l.providerId) || [];
    arr.push(l);
    listingsByProvider.set(l.providerId, arr);
  }

  const results = providers
    .filter((p: any) => listingsByProvider.has(p.id))
    .map((p: any) => ({ ...p, listings: listingsByProvider.get(p.id) }));

  return { providers: results, searchParams: { lat, lng, radius, categoryId } };
}
