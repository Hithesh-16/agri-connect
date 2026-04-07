import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { paginate } from '../../utils/pagination';
import { AppError, NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';
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
} from '../../services/jobService';

export async function getSkills(_req: AuthRequest, res: Response) {
  sendSuccess(res, LABOR_SKILLS);
}

export async function create(req: AuthRequest, res: Response) {
  const farmerId = req.user!.userId;
  const { title, description, skillRequired, workersNeeded, startDate, endDate, daysNeeded, slotType, farmLocation, farmSize, cropType, budgetPerWorkerPerDay, totalBudget } = req.body;

  if (!title || !skillRequired || !workersNeeded || !startDate || !endDate || !daysNeeded || !farmLocation) {
    throw new AppError('title, skillRequired, workersNeeded, startDate, endDate, daysNeeded, and farmLocation are required.', 400);
  }

  const result = await createJobPosting(farmerId, {
    title, description, skillRequired, workersNeeded, startDate, endDate, daysNeeded, slotType, farmLocation, farmSize, cropType, budgetPerWorkerPerDay, totalBudget,
  });

  sendCreated(res, {
    ...result.job,
    ...(result.holidayConflicts.length > 0 ? { warnings: { holidayConflicts: result.holidayConflicts } } : {}),
  });
}

export async function list(req: AuthRequest, res: Response) {
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
  sendSuccess(res, jobs, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function detail(req: AuthRequest, res: Response) {
  const job = await getJobDetails(req.params.id as string);
  sendSuccess(res, job);
}

export async function update(req: AuthRequest, res: Response) {
  const farmerId = req.user!.userId;
  const job = await prisma.jobPosting.findFirst({
    where: { id: req.params.id as string, farmerId },
  });

  if (!job) throw new NotFoundError('Job posting');
  if (job.status !== 'OPEN') throw new AppError('Can only edit open job postings.', 400);

  const updated = await prisma.jobPosting.update({
    where: { id: req.params.id as string },
    data: req.body,
  });

  sendSuccess(res, updated);
}

export async function cancel(req: AuthRequest, res: Response) {
  await cancelJobPosting(req.user!.userId, req.params.id as string);
  sendMessage(res, 'Job posting cancelled.');
}

export async function createBid(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) throw new ForbiddenError('Must be a registered service provider to bid.');

  const { ratePerWorkerPerDay, workersOffered, teamId, message } = req.body;
  if (!ratePerWorkerPerDay || !workersOffered) {
    throw new AppError('ratePerWorkerPerDay and workersOffered are required.', 400);
  }

  const bid = await submitBid(provider.id, {
    jobPostingId: req.params.id as string,
    teamId,
    ratePerWorkerPerDay,
    workersOffered,
    message,
  });

  sendCreated(res, bid);
}

export async function listBids(req: AuthRequest, res: Response) {
  const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id as string } });
  if (!job) throw new NotFoundError('Job posting');

  if (job.farmerId !== req.user!.userId) {
    throw new ForbiddenError('Only the job poster can view all bids.');
  }

  const bids = await prisma.bid.findMany({
    where: { jobPostingId: req.params.id as string },
    include: {
      team: { select: { name: true, rating: true, completionRate: true, activeMembers: true } },
      provider: { select: { businessName: true, rating: true, completionRate: true, totalBookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, bids);
}

export async function acceptBidHandler(req: AuthRequest, res: Response) {
  await acceptBid(req.user!.userId, req.params.bidId as string);
  sendMessage(res, 'Bid accepted.');
}

export async function rejectBidHandler(req: AuthRequest, res: Response) {
  await rejectBid(req.user!.userId, req.params.bidId as string, req.body.reason);
  sendMessage(res, 'Bid rejected.');
}

export async function withdrawBidHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) throw new ForbiddenError('Provider profile not found.');

  await withdrawBid(provider.id, req.params.bidId as string);
  sendMessage(res, 'Bid withdrawn.');
}
