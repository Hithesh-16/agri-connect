import { prisma } from '../config';
import { NotFoundError, ForbiddenError, AppError } from '../errors/app-error';
import { paginate } from '../utils/pagination';
import { haversineDistance } from '../utils/geo';

export async function findNearby(lat: number, lng: number, radius: number) {
  const allMandis = await prisma.mandi.findMany();
  const nearbyMandiIds = allMandis
    .filter((m) => haversineDistance({ lat, lng }, { lat: m.latitude, lng: m.longitude }) <= radius)
    .map((m) => m.id);

  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: new Date() },
      OR: [
        { mandiId: { in: nearbyMandiIds } },
        ...(nearbyMandiIds.length > 0 ? [] : [{ location: { not: null } }]),
      ],
    },
    include: {
      user: { select: { id: true, firstName: true, surname: true, village: true, district: true } },
      crop: true,
      mandi: true,
      _count: { select: { inquiries: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const enriched = listings.map((listing) => {
    let distanceKm: number | null = null;
    if (listing.mandi) {
      distanceKm = Math.round(haversineDistance({ lat, lng }, { lat: listing.mandi.latitude, lng: listing.mandi.longitude }) * 10) / 10;
    }
    return { ...listing, distanceKm };
  });

  enriched.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return enriched;
}

export async function listAll(filters: Record<string, string>) {
  const { page: p, limit: l, skip } = paginate(filters.page, filters.limit);
  const where: any = { isActive: true, expiresAt: { gt: new Date() } };

  if (filters.type) where.type = filters.type;
  if (filters.cropId) where.cropId = filters.cropId;
  if (filters.mandiId) where.mandiId = filters.mandiId;
  if (filters.category) where.category = filters.category;
  if (filters.listingType) where.listingType = filters.listingType;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, surname: true, village: true, district: true } },
        crop: true,
        mandi: true,
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: l,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, page: p, limit: l };
}

export async function getDetail(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, surname: true, village: true, district: true, mobile: true } },
      crop: true,
      mandi: true,
      inquiries: {
        include: { fromUser: { select: { id: true, firstName: true, surname: true, village: true, district: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!listing) throw new NotFoundError('Listing');
  return listing;
}

export async function createListing(userId: string, data: any) {
  const crop = await prisma.crop.findUnique({ where: { id: data.cropId } });
  if (!crop) throw new NotFoundError('Crop');

  if (data.mandiId) {
    const mandi = await prisma.mandi.findUnique({ where: { id: data.mandiId } });
    if (!mandi) throw new NotFoundError('Mandi');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return prisma.listing.create({
    data: {
      userId,
      cropId: data.cropId,
      type: data.type,
      quantity: data.quantity,
      unit: data.unit,
      pricePerUnit: data.pricePerUnit || null,
      description: data.description || null,
      mandiId: data.mandiId || null,
      location: data.location || null,
      expiresAt,
      category: data.category || 'crop',
      itemId: data.itemId || null,
      itemName: data.itemName || null,
      listingType: data.listingType || 'sell',
      images: data.images || [],
      phone: data.phone || null,
      condition: data.condition || null,
      rentalBasis: data.rentalBasis || null,
    },
    include: { crop: true, mandi: true },
  });
}

export async function updateListing(id: string, userId: string, data: any) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Listing');
  if (existing.userId !== userId) throw new ForbiddenError('Not authorized to modify this listing.');

  return prisma.listing.update({ where: { id }, data, include: { crop: true, mandi: true } });
}

export async function deleteListing(id: string, userId: string) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Listing');
  if (existing.userId !== userId) throw new ForbiddenError('Not authorized to delete this listing.');

  await prisma.listing.update({ where: { id }, data: { isActive: false } });
}

export async function createInquiry(listingId: string, fromUserId: string, message: string, phone?: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError('Listing');
  if (!listing.isActive) throw new AppError('This listing is no longer active.', 400);

  return prisma.inquiry.create({
    data: { listingId, fromUserId, message, phone: phone || null },
    include: { fromUser: { select: { id: true, firstName: true, surname: true, village: true, district: true } } },
  });
}
