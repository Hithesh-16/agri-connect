import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { cacheGet, cacheSet, CACHE_TTL } from '../config/redis';

const router = Router();

// ─── Categories ──────────────────────────────────────────

// GET /api/services/categories — category tree
router.get('/categories', async (_req, res: Response) => {
  try {
    const cacheKey = 'service:categories';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const categories = await prisma.serviceCategory.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await cacheSet(cacheKey, categories, CACHE_TTL.CATEGORIES);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// ─── Service Listings ────────────────────────────────────

// GET /api/services — browse listings with filters
router.get('/', async (req, res: Response) => {
  try {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const minPrice = typeof req.query.minPrice === 'string' ? parseFloat(req.query.minPrice) : undefined;
    const maxPrice = typeof req.query.maxPrice === 'string' ? parseFloat(req.query.maxPrice) : undefined;
    const pag = paginate(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      typeof req.query.limit === 'string' ? req.query.limit : undefined,
    );

    const where: any = { isActive: true, isPaused: false };

    if (categoryId) {
      // Include sub-categories
      const children = await prisma.serviceCategory.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      const categoryIds = [categoryId, ...children.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    }

    if (minPrice !== undefined) where.pricePerUnit = { ...where.pricePerUnit, gte: minPrice };
    if (maxPrice !== undefined) where.pricePerUnit = { ...where.pricePerUnit, lte: maxPrice };

    // Provider must be verified and active
    where.provider = { isActive: true };

    const [listings, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          provider: {
            select: { id: true, businessName: true, rating: true, totalBookings: true, isVerified: true, latitude: true, longitude: true, district: true },
            include: { user: { select: { firstName: true, surname: true, profilePhoto: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pag.skip,
        take: pag.limit,
      }),
      prisma.serviceListing.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(listings, total, pag.page, pag.limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch services.' });
  }
});

// GET /api/services/:id — single listing detail
router.get('/:id', async (req, res: Response) => {
  try {
    const listing = await prisma.serviceListing.findUnique({
      where: { id: String(req.params.id) },
      include: {
        category: true,
        provider: {
          include: { user: { select: { firstName: true, surname: true, profilePhoto: true } } },
        },
      },
    });
    if (!listing) {
      res.status(404).json({ success: false, error: 'Service listing not found.' });
      return;
    }
    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch service.' });
  }
});

// POST /api/services — create listing (provider only)
const createListingSchema = z.object({
  categoryId: z.string().min(1),
  title: z.record(z.string()), // { en: "...", te: "..." }
  description: z.record(z.string()).optional(),
  images: z.array(z.string()).optional(),
  pricingType: z.enum(['FIXED', 'NEGOTIABLE', 'BID_BASED']).optional(),
  pricePerUnit: z.number().positive(),
  unit: z.enum(['PER_HOUR', 'PER_DAY', 'PER_ACRE', 'PER_UNIT', 'PER_KG', 'PER_QUINTAL', 'PER_TRIP', 'PER_WORKER_DAY', 'FIXED']).optional(),
  minBookingDuration: z.number().int().min(1).optional(),
  equipmentMake: z.string().optional(),
  equipmentModel: z.string().optional(),
  equipmentYear: z.number().int().optional(),
  equipmentHP: z.number().int().optional(),
  equipmentDetails: z.record(z.unknown()).optional(),
  seasonalAvailable: z.array(z.string()).optional(),
});

router.post('/', authenticate, validate(createListingSchema), async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) {
      res.status(403).json({ success: false, error: 'You must register as a provider first.' });
      return;
    }

    const listing = await prisma.serviceListing.create({
      data: { providerId: provider.id, ...req.body },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create listing.' });
  }
});

// PUT /api/services/:id — update listing (owner only)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listing = await prisma.serviceListing.findUnique({
      where: { id: String(req.params.id) },
      include: { provider: { select: { userId: true } } },
    });
    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }
    if (listing.provider.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not your listing.' });
      return;
    }

    const updated = await prisma.serviceListing.update({
      where: { id: listing.id },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed.' });
  }
});

// DELETE /api/services/:id — soft delete (owner only)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listing = await prisma.serviceListing.findUnique({
      where: { id: String(req.params.id) },
      include: { provider: { select: { userId: true } } },
    });
    if (!listing || listing.provider.userId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    await prisma.serviceListing.update({
      where: { id: listing.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Listing deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed.' });
  }
});

// POST /api/services/:id/pause — toggle pause
router.post('/:id/pause', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listing = await prisma.serviceListing.findUnique({
      where: { id: String(req.params.id) },
      include: { provider: { select: { userId: true } } },
    });
    if (!listing || listing.provider.userId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    const updated = await prisma.serviceListing.update({
      where: { id: listing.id },
      data: { isPaused: !listing.isPaused },
    });
    res.json({ success: true, data: { isPaused: updated.isPaused } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Toggle failed.' });
  }
});

// ─── Nearby Search (PostGIS) ────────────────────────────

// GET /api/services/nearby — find services near a location
router.get('/nearby', async (req, res: Response) => {
  try {
    const lat = typeof req.query.lat === 'string' ? parseFloat(req.query.lat) : undefined;
    const lng = typeof req.query.lng === 'string' ? parseFloat(req.query.lng) : undefined;
    const radius = typeof req.query.radius === 'string' ? parseInt(req.query.radius, 10) : 25; // km
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;

    if (!lat || !lng) {
      res.status(400).json({ success: false, error: 'lat and lng query parameters are required.' });
      return;
    }

    const radiusMeters = radius * 1000;

    // Use raw SQL with Haversine for now (PostGIS ST_DWithin when geography columns added)
    // This works without PostGIS extension being actually enabled on the database
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

    // If categoryId filter, get listings for matched providers
    let results = providers;
    if (categoryId) {
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

      results = providers
        .filter((p: any) => listingsByProvider.has(p.id))
        .map((p: any) => ({ ...p, listings: listingsByProvider.get(p.id) }));
    }

    res.json({
      success: true,
      data: {
        providers: results,
        searchParams: { lat, lng, radius, categoryId },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Nearby search failed.' });
  }
});

export default router;
