import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { prisma } from '../config';
import {
  createJobPosting,
  submitBid,
  acceptBid,
  rejectBid,
  withdrawBid,
  listJobs,
  getJobDetails,
  cancelJobPosting,
  LABOR_SKILLS,
} from '../services/jobService';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('jobs-route');

// ─── GET LABOR SKILLS (reference data) ──────────────────
router.get('/skills', (_req, res: Response) => {
  res.json({ success: true, data: LABOR_SKILLS });
});

// ─── CREATE JOB POSTING ─────────────────────────────────
router.post('/', authenticate, requirePermission('jobs', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!.userId;

    const { title, description, skillRequired, workersNeeded, startDate, endDate, daysNeeded, slotType, farmLocation, farmSize, cropType, budgetPerWorkerPerDay, totalBudget } = req.body;

    if (!title || !skillRequired || !workersNeeded || !startDate || !endDate || !daysNeeded || !farmLocation) {
      res.status(400).json({ success: false, error: 'title, skillRequired, workersNeeded, startDate, endDate, daysNeeded, and farmLocation are required.' });
      return;
    }

    const result = await createJobPosting(farmerId, {
      title, description, skillRequired, workersNeeded, startDate, endDate, daysNeeded, slotType, farmLocation, farmSize, cropType, budgetPerWorkerPerDay, totalBudget,
    });

    res.status(201).json({
      success: true,
      data: result.job,
      warnings: result.holidayConflicts.length > 0
        ? { holidayConflicts: result.holidayConflicts }
        : undefined,
    });
  } catch (err: any) {
    log.error({ err }, 'Failed to create job posting');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── LIST JOBS ──────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page: pageStr, limit: limitStr, status, skillRequired, mine, lat, lng, radius } = req.query as Record<string, string | undefined>;
    const { page, limit } = paginate(pageStr, limitStr);

    const filters: Parameters<typeof listJobs>[0] = { page, limit };

    if (status) filters.status = status;
    if (skillRequired) filters.skillRequired = skillRequired;
    if (mine === 'true') filters.farmerId = req.user!.userId;
    if (lat && lng) {
      filters.lat = parseFloat(lat);
      filters.lng = parseFloat(lng);
      filters.radiusKm = radius ? parseFloat(radius) : 30;
    }

    const { jobs, total } = await listJobs(filters);
    res.json(paginatedResponse(jobs, total, page, limit));
  } catch (err: any) {
    log.error({ err }, 'Failed to list jobs');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET JOB DETAILS ────────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const job = await getJobDetails(req.params.id as string);
    res.json({ success: true, data: job });
  } catch (err: any) {
    log.error({ err }, 'Failed to get job details');
    res.status(404).json({ success: false, error: err.message });
  }
});

// ─── UPDATE JOB POSTING ─────────────────────────────────
router.put('/:id', authenticate, requirePermission('jobs', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!.userId;
    const job = await prisma.jobPosting.findFirst({
      where: { id: req.params.id as string, farmerId },
    });

    if (!job) {
      res.status(404).json({ success: false, error: 'Job posting not found or unauthorized.' });
      return;
    }

    if (job.status !== 'OPEN') {
      res.status(400).json({ success: false, error: 'Can only edit open job postings.' });
      return;
    }

    const updated = await prisma.jobPosting.update({
      where: { id: req.params.id as string },
      data: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    log.error({ err }, 'Failed to update job posting');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── CANCEL JOB POSTING ────────────────────────────────
router.delete('/:id', authenticate, requirePermission('jobs', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    await cancelJobPosting(req.user!.userId, req.params.id as string);
    res.json({ success: true, message: 'Job posting cancelled.' });
  } catch (err: any) {
    log.error({ err }, 'Failed to cancel job posting');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── SUBMIT BID ─────────────────────────────────────────
router.post('/:id/bids', authenticate, requirePermission('bids', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(403).json({ success: false, error: 'Must be a registered service provider to bid.' });
      return;
    }

    const { ratePerWorkerPerDay, workersOffered, teamId, message } = req.body;

    if (!ratePerWorkerPerDay || !workersOffered) {
      res.status(400).json({ success: false, error: 'ratePerWorkerPerDay and workersOffered are required.' });
      return;
    }

    const bid = await submitBid(provider.id, {
      jobPostingId: req.params.id as string,
      teamId,
      ratePerWorkerPerDay,
      workersOffered,
      message,
    });

    res.status(201).json({ success: true, data: bid });
  } catch (err: any) {
    log.error({ err }, 'Failed to submit bid');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── LIST BIDS FOR JOB ─────────────────────────────────
router.get('/:id/bids', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id as string } });
    if (!job) {
      res.status(404).json({ success: false, error: 'Job posting not found.' });
      return;
    }

    if (job.farmerId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Only the job poster can view all bids.' });
      return;
    }

    const bids = await prisma.bid.findMany({
      where: { jobPostingId: req.params.id as string },
      include: {
        team: { select: { name: true, rating: true, completionRate: true, activeMembers: true } },
        provider: {
          select: { businessName: true, rating: true, completionRate: true, totalBookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: bids });
  } catch (err: any) {
    log.error({ err }, 'Failed to list bids');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ACCEPT BID ─────────────────────────────────────────
router.put('/bids/:bidId/accept', authenticate, requirePermission('bids', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    await acceptBid(req.user!.userId, req.params.bidId as string);
    res.json({ success: true, message: 'Bid accepted.' });
  } catch (err: any) {
    log.error({ err }, 'Failed to accept bid');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── REJECT BID ─────────────────────────────────────────
router.put('/bids/:bidId/reject', authenticate, requirePermission('bids', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    await rejectBid(req.user!.userId, req.params.bidId as string, req.body.reason);
    res.json({ success: true, message: 'Bid rejected.' });
  } catch (err: any) {
    log.error({ err }, 'Failed to reject bid');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── WITHDRAW BID ───────────────────────────────────────
router.delete('/bids/:bidId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(403).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    await withdrawBid(provider.id, req.params.bidId as string);
    res.json({ success: true, message: 'Bid withdrawn.' });
  } catch (err: any) {
    log.error({ err }, 'Failed to withdraw bid');
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
