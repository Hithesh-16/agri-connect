import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest, paginate, paginatedResponse } from '../types';

const router = Router();

const createListingSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  type: z.enum(['sell', 'buy']),
  quantity: z.number().positive('quantity must be positive'),
  unit: z.string().min(1, 'unit is required'),
  pricePerUnit: z.number().positive().optional(),
  description: z.string().optional(),
  mandiId: z.string().optional(),
  location: z.string().optional(),
  // New fields
  category: z.enum(['crop', 'machinery', 'resource', 'tool', 'seed', 'labor', 'irrigation', 'animal', 'postharvest', 'growth_regulator']).optional(),
  itemId: z.string().optional(),
  itemName: z.string().optional(),
  listingType: z.enum(['sell', 'buy', 'rent', 'exchange']).optional(),
  images: z.array(z.string()).optional(),
  phone: z.string().optional(),
  condition: z.enum(['new', 'used', 'half_used']).optional(),
  rentalBasis: z.enum(['per_day', 'per_hour', 'per_acre']).optional(),
});

const updateListingSchema = z.object({
  quantity: z.number().positive().optional(),
  pricePerUnit: z.number().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  phone: z.string().nullable().optional(),
  condition: z.enum(['new', 'used', 'half_used']).nullable().optional(),
  rentalBasis: z.enum(['per_day', 'per_hour', 'per_acre']).nullable().optional(),
});

const createInquirySchema = z.object({
  message: z.string().min(1, 'message is required'),
  phone: z.string().optional(),
});

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/listings/nearby - Nearby listings using Haversine against mandi locations
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseFloat((req.query.radius as string) || '20');

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ success: false, error: 'lat and lon query parameters are required.' });
      return;
    }

    // Get all mandis within radius
    const allMandis = await prisma.mandi.findMany();
    const nearbyMandiIds = allMandis
      .filter((m) => haversineDistance(lat, lon, m.latitude, m.longitude) <= radius)
      .map((m) => m.id);

    // Get active listings from those mandis or with location text
    const listings = await prisma.listing.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
        OR: [
          { mandiId: { in: nearbyMandiIds } },
          // Also include listings with location text if no mandi set
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

    // Attach distance info for mandi-based listings
    const enriched = listings.map((listing) => {
      let distance: number | null = null;
      if (listing.mandi) {
        distance = Math.round(haversineDistance(lat, lon, listing.mandi.latitude, listing.mandi.longitude) * 10) / 10;
      }
      return { ...listing, distanceKm: distance };
    });

    // Sort by distance (nearest first), null distances last
    enriched.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch nearby listings.' });
  }
});

// GET /api/listings - List all active listings
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
    const type = req.query.type as string | undefined;
    const cropId = req.query.cropId as string | undefined;
    const mandiId = req.query.mandiId as string | undefined;
    const category = req.query.category as string | undefined;
    const listingType = req.query.listingType as string | undefined;

    const where: any = { isActive: true, expiresAt: { gt: new Date() } };
    if (type) where.type = type;
    if (cropId) where.cropId = cropId;
    if (mandiId) where.mandiId = mandiId;
    if (category) where.category = category;
    if (listingType) where.listingType = listingType;

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
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(listings, total, page, limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch listings.' });
  }
});

// GET /api/listings/:id - Single listing with inquiries
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, surname: true, village: true, district: true, mobile: true } },
        crop: true,
        mandi: true,
        inquiries: {
          include: {
            fromUser: { select: { id: true, firstName: true, surname: true, village: true, district: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch listing.' });
  }
});

// POST /api/listings - Create listing
router.post('/', authenticate, validate(createListingSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      cropId, type, quantity, unit, pricePerUnit, description, mandiId, location,
      category, itemId, itemName, listingType, images, phone, condition, rentalBasis,
    } = req.body;

    // Verify crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(404).json({ success: false, error: 'Crop not found.' });
      return;
    }

    // Verify mandi exists if provided
    if (mandiId) {
      const mandi = await prisma.mandi.findUnique({ where: { id: mandiId } });
      if (!mandi) {
        res.status(404).json({ success: false, error: 'Mandi not found.' });
        return;
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const listing = await prisma.listing.create({
      data: {
        userId,
        cropId,
        type,
        quantity,
        unit,
        pricePerUnit: pricePerUnit || null,
        description: description || null,
        mandiId: mandiId || null,
        location: location || null,
        expiresAt,
        category: category || 'crop',
        itemId: itemId || null,
        itemName: itemName || null,
        listingType: listingType || 'sell',
        images: images || [],
        phone: phone || null,
        condition: condition || null,
        rentalBasis: rentalBasis || null,
      },
      include: { crop: true, mandi: true },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create listing.' });
  }
});

// PATCH /api/listings/:id - Update listing (ownership check)
router.patch('/:id', authenticate, validate(updateListingSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to modify this listing.' });
      return;
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: req.body,
      include: { crop: true, mandi: true },
    });

    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update listing.' });
  }
});

// DELETE /api/listings/:id - Soft delete
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this listing.' });
      return;
    }

    await prisma.listing.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Listing deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete listing.' });
  }
});

// POST /api/listings/:id/inquiries - Send inquiry
router.post('/:id/inquiries', authenticate, validate(createInquirySchema), async (req: AuthRequest, res: Response) => {
  try {
    const fromUserId = req.user!.userId;
    const listingId = req.params.id as string;
    const { message, phone } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }
    if (!listing.isActive) {
      res.status(400).json({ success: false, error: 'This listing is no longer active.' });
      return;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        listingId,
        fromUserId,
        message,
        phone: phone || null,
      },
      include: {
        fromUser: { select: { id: true, firstName: true, surname: true, village: true, district: true } },
      },
    });

    res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send inquiry.' });
  }
});

export default router;
