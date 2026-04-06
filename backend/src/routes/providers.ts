import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/permissions';
import { prisma } from '../config';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { createChildLogger } from '../config/logger';
import { enqueue, QUEUES } from '../config/queue';

const log = createChildLogger('providers');
const router = Router();

// ─── Provider Registration ──────────────────────────────

const registerProviderSchema = z.object({
  type: z.enum(['MACHINERY_OWNER', 'INPUT_DEALER', 'TRANSPORTER', 'LABOR_INDIVIDUAL', 'LABOR_TEAM_LEADER', 'LIVESTOCK_DEALER', 'DRONE_OPERATOR', 'PROFESSIONAL']),
  businessName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  serviceRadius: z.number().int().min(1).max(200).optional(),
  languages: z.array(z.string()).optional(),
  experience: z.number().int().min(0).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

// POST /api/providers — register as provider
router.post('/', authenticate, validate(registerProviderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const existing = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (existing) {
      res.status(409).json({ success: false, error: 'You are already registered as a provider.' });
      return;
    }

    const provider = await prisma.serviceProvider.create({
      data: { userId, ...req.body },
    });

    // Auto-assign VENDOR role
    const vendorRole = await prisma.roleDefinition.findUnique({ where: { name: 'VENDOR' } });
    if (vendorRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: vendorRole.id } },
        update: { isActive: true },
        create: { userId, roleId: vendorRole.id },
      });
    }

    await enqueue(QUEUES.AUDIT_LOG, 'provider.registered', { userId, providerId: provider.id, type: provider.type });

    log.info({ userId, providerId: provider.id }, 'Provider registered');
    res.status(201).json({ success: true, data: provider });
  } catch (err) {
    log.error({ err }, 'Provider registration failed');
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

// GET /api/providers/me — own provider profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: req.user!.userId },
      include: { listings: { where: { isActive: true } }, user: { select: { firstName: true, surname: true, mobile: true, profilePhoto: true } } },
    });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Not registered as a provider.' });
      return;
    }
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

// PUT /api/providers/me — update provider profile
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.update({
      where: { userId: req.user!.userId },
      data: req.body,
    });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed.' });
  }
});

// GET /api/providers/:id — public provider profile
router.get('/:id', async (req, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: String(req.params.id) },
      include: {
        listings: { where: { isActive: true, isPaused: false } },
        user: { select: { firstName: true, surname: true, profilePhoto: true } },
      },
    });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider not found.' });
      return;
    }
    // Strip sensitive KYC fields from public view
    const { aadhaarNumber, panNumber, bankAccountNo, bankIfsc, kycDocuments, ...publicData } = provider;
    res.json({ success: true, data: publicData });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch provider.' });
  }
});

// ─── KYC ──────────────────────────────────────────────────

const submitKycSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format').optional(),
  gstNumber: z.string().optional(),
  bankAccountNo: z.string().min(8).max(18),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'),
  kycDocuments: z.array(z.string().url()).min(1, 'At least one document required'),
});

// POST /api/providers/me/kyc — submit KYC documents
router.post('/me/kyc', authenticate, validate(submitKycSchema), async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Not registered as a provider.' });
      return;
    }

    if (provider.kycStatus === 'VERIFIED') {
      res.status(400).json({ success: false, error: 'KYC already verified.' });
      return;
    }

    const updated = await prisma.serviceProvider.update({
      where: { id: provider.id },
      data: {
        ...req.body,
        kycStatus: 'SUBMITTED',
        kycSubmittedAt: new Date(),
      },
    });

    await enqueue(QUEUES.NOTIFICATION, 'kyc.submitted', { providerId: provider.id, userId: req.user!.userId });
    log.info({ providerId: provider.id }, 'KYC submitted');
    res.json({ success: true, data: { kycStatus: updated.kycStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'KYC submission failed.' });
  }
});

// GET /api/providers/me/kyc — KYC status
router.get('/me/kyc', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: req.user!.userId },
      select: { kycStatus: true, kycSubmittedAt: true, kycVerifiedAt: true, kycReviewNote: true, isVerified: true },
    });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Not registered as a provider.' });
      return;
    }
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch KYC status.' });
  }
});

// PUT /api/providers/:id/kyc — admin approve/reject KYC
const reviewKycSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

router.put('/:id/kyc', authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), validate(reviewKycSchema), async (req: AuthRequest, res: Response) => {
  try {
    const providerId = String(req.params.id);
    const { action, note } = req.body;

    const provider = await prisma.serviceProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider not found.' });
      return;
    }

    const isApproved = action === 'approve';
    const updated = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        kycStatus: isApproved ? 'VERIFIED' : 'REJECTED',
        kycVerifiedAt: isApproved ? new Date() : null,
        kycReviewNote: note,
        isVerified: isApproved,
      },
    });

    await enqueue(QUEUES.NOTIFICATION, 'kyc.reviewed', {
      providerId, userId: provider.userId, status: updated.kycStatus, note,
    });

    log.info({ providerId, action, adminId: req.user!.userId }, 'KYC reviewed');
    res.json({ success: true, data: { kycStatus: updated.kycStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'KYC review failed.' });
  }
});

// ─── Admin: KYC Queue ──────────────────────────────────────

// GET /api/providers/admin/kyc-queue — pending KYC reviews
router.get('/admin/kyc-queue', authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'SUBMITTED';
    const pag = paginate(
      typeof req.query.page === 'string' ? req.query.page : undefined,
      typeof req.query.limit === 'string' ? req.query.limit : undefined,
    );

    const where = { kycStatus: status as any };
    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where,
        include: { user: { select: { id: true, mobile: true, firstName: true, surname: true } } },
        orderBy: { kycSubmittedAt: 'asc' },
        skip: pag.skip,
        take: pag.limit,
      }),
      prisma.serviceProvider.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(providers, total, pag.page, pag.limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch KYC queue.' });
  }
});

export default router;
