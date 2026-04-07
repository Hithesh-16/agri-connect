import { prisma } from '../config';
import { createChildLogger } from '../config/logger';
import { enqueue, QUEUES } from '../config/queue';

const log = createChildLogger('job-service');

// ─── STATE-WISE MINIMUM WAGES ──────────────────────────

const STATE_MINIMUM_WAGES: Record<string, { daily: number; updated: string }> = {
  'Telangana':       { daily: 400, updated: '2026-04-01' },
  'Andhra Pradesh':  { daily: 375, updated: '2026-04-01' },
  'Karnataka':       { daily: 371, updated: '2026-04-01' },
  'Tamil Nadu':      { daily: 389, updated: '2026-04-01' },
  'Maharashtra':     { daily: 398, updated: '2026-04-01' },
  'Gujarat':         { daily: 351, updated: '2026-04-01' },
  'Madhya Pradesh':  { daily: 331, updated: '2026-04-01' },
  'Uttar Pradesh':   { daily: 341, updated: '2026-04-01' },
  'Rajasthan':       { daily: 349, updated: '2026-04-01' },
  'Punjab':          { daily: 386, updated: '2026-04-01' },
  'Bihar':           { daily: 309, updated: '2026-04-01' },
  'West Bengal':     { daily: 338, updated: '2026-04-01' },
};

export function validateDailyRate(rate: number, state: string): { valid: boolean; minRate: number } {
  const stateMin = STATE_MINIMUM_WAGES[state];
  if (!stateMin) return { valid: true, minRate: 300 };
  return { valid: rate >= stateMin.daily, minRate: stateMin.daily };
}

// ─── REGIONAL HOLIDAYS ─────────────────────────────────

const REGIONAL_HOLIDAYS_2026: Record<string, Array<{ date: string; name: string }>> = {
  'Telangana': [
    { date: '2026-01-14', name: 'Sankranti' },
    { date: '2026-03-30', name: 'Ugadi' },
    { date: '2026-04-14', name: 'Ambedkar Jayanti' },
    { date: '2026-06-19', name: 'Bonalu' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-10', name: 'Diwali' },
  ],
  'Andhra Pradesh': [
    { date: '2026-01-14', name: 'Sankranti' },
    { date: '2026-03-30', name: 'Ugadi' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-10', name: 'Diwali' },
  ],
};

export function checkHolidayConflicts(startDate: Date, endDate: Date, state: string): Array<{ date: string; holiday: string }> {
  const holidays = REGIONAL_HOLIDAYS_2026[state] || [];
  const conflicts: Array<{ date: string; holiday: string }> = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateStr);
    if (holiday) conflicts.push({ date: dateStr, holiday: holiday.name });
    current.setDate(current.getDate() + 1);
  }

  return conflicts;
}

// ─── LABOR SKILLS ───────────────────────────────────────

export const LABOR_SKILLS: Record<string, { name: Record<string, string>; dailyRateRange: { min: number; max: number } }> = {
  weeding:        { name: { en: 'Weeding', te: 'కలుపు తీయడం', hi: 'निराई' }, dailyRateRange: { min: 300, max: 450 } },
  transplanting:  { name: { en: 'Transplanting', te: 'నాట్లు', hi: 'रोपाई' }, dailyRateRange: { min: 350, max: 500 } },
  harvesting:     { name: { en: 'Harvesting', te: 'కోత', hi: 'कटाई' }, dailyRateRange: { min: 350, max: 500 } },
  pruning:        { name: { en: 'Pruning', te: 'కొమ్మల కత్తిరింపు', hi: 'छंटाई' }, dailyRateRange: { min: 400, max: 550 } },
  grafting:       { name: { en: 'Grafting', te: 'అంట్లు కట్టడం', hi: 'कलम बांधना' }, dailyRateRange: { min: 500, max: 700 } },
  spraying:       { name: { en: 'Spraying', te: 'పిచికారి', hi: 'छिड़काव' }, dailyRateRange: { min: 350, max: 500 } },
  loading:        { name: { en: 'Loading/Unloading', te: 'లోడింగ్/అన్‌లోడింగ్', hi: 'लोडिंग/अनलोडिंग' }, dailyRateRange: { min: 400, max: 550 } },
  general:        { name: { en: 'General Farm Work', te: 'సాధారణ పని', hi: 'सामान्य कार्य' }, dailyRateRange: { min: 300, max: 400 } },
};

// ─── CREATE JOB POSTING ─────────────────────────────────

export async function createJobPosting(farmerId: string, data: {
  title: Record<string, string>;
  description?: Record<string, string>;
  skillRequired: string;
  workersNeeded: number;
  startDate: string;
  endDate: string;
  daysNeeded: number;
  slotType?: string;
  farmLocation: { lat: number; lng: number; village?: string; mandal?: string; district?: string; state?: string };
  farmSize?: number;
  cropType?: string;
  budgetPerWorkerPerDay?: number;
  totalBudget?: number;
}) {
  const state = data.farmLocation.state || '';

  // Validate minimum wage
  if (data.budgetPerWorkerPerDay) {
    const { valid, minRate } = validateDailyRate(data.budgetPerWorkerPerDay, state);
    if (!valid) {
      throw new Error(`Budget per worker must be at least INR ${minRate}/day (state minimum wage for ${state})`);
    }
  }

  // Check holiday conflicts
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const holidayConflicts = checkHolidayConflicts(startDate, endDate, state);

  // Set expiry to day before start
  const expiresAt = new Date(startDate);
  expiresAt.setDate(expiresAt.getDate() - 1);

  const job = await prisma.jobPosting.create({
    data: {
      farmerId,
      title: data.title,
      description: data.description,
      skillRequired: data.skillRequired,
      workersNeeded: data.workersNeeded,
      startDate,
      endDate,
      daysNeeded: data.daysNeeded,
      slotType: data.slotType || 'FULL_DAY',
      farmLocation: data.farmLocation,
      farmSize: data.farmSize,
      cropType: data.cropType,
      budgetPerWorkerPerDay: data.budgetPerWorkerPerDay,
      totalBudget: data.budgetPerWorkerPerDay
        ? data.budgetPerWorkerPerDay * data.workersNeeded * data.daysNeeded
        : data.totalBudget,
      expiresAt,
    },
  });

  log.info({ jobId: job.id, farmerId }, 'Job posting created');

  return { job, holidayConflicts };
}

// ─── SUBMIT BID ─────────────────────────────────────────

export async function submitBid(providerId: string, data: {
  jobPostingId: string;
  teamId?: string;
  ratePerWorkerPerDay: number;
  workersOffered: number;
  message?: Record<string, string>;
}) {
  const job = await prisma.jobPosting.findUnique({ where: { id: data.jobPostingId } });
  if (!job) throw new Error('Job posting not found');
  if (job.status !== 'OPEN' && job.status !== 'BIDDING') throw new Error('Job not available for bidding');

  if (new Date() > job.expiresAt) throw new Error('Job posting has expired');

  // Validate minimum wage
  const farmLocation = job.farmLocation as { state?: string };
  const state = farmLocation.state || '';
  const { valid, minRate } = validateDailyRate(data.ratePerWorkerPerDay, state);
  if (!valid) {
    throw new Error(`Rate must be at least INR ${minRate}/day (state minimum wage for ${state})`);
  }

  // Verify team belongs to provider
  if (data.teamId) {
    const team = await prisma.laborTeam.findFirst({
      where: { id: data.teamId, leaderId: providerId },
    });
    if (!team) throw new Error('Team not found or does not belong to you');
  }

  const bid = await prisma.bid.create({
    data: {
      jobPostingId: data.jobPostingId,
      providerId,
      teamId: data.teamId,
      ratePerWorkerPerDay: data.ratePerWorkerPerDay,
      totalAmount: data.ratePerWorkerPerDay * data.workersOffered * job.daysNeeded,
      workersOffered: data.workersOffered,
      message: data.message,
    },
  });

  // Update job status to BIDDING and increment bid count
  await prisma.jobPosting.update({
    where: { id: data.jobPostingId },
    data: {
      bidCount: { increment: 1 },
      status: job.status === 'OPEN' ? 'BIDDING' : undefined,
    },
  });

  // Notify farmer
  await enqueue(QUEUES.NOTIFICATION, 'new-bid', {
    userId: job.farmerId,
    type: 'NEW_BID',
    title: { en: 'New Bid Received', te: 'కొత్త బిడ్ వచ్చింది', hi: 'नई बोली आई' },
    body: {
      en: `${bid.workersOffered} workers offered at INR ${bid.ratePerWorkerPerDay}/day`,
      te: `${bid.workersOffered} కార్మికులు INR ${bid.ratePerWorkerPerDay}/రోజు`,
      hi: `${bid.workersOffered} मजदूर INR ${bid.ratePerWorkerPerDay}/दिन`,
    },
    channels: ['PUSH', 'IN_APP'],
    data: { jobPostingId: job.id, bidId: bid.id },
  });

  log.info({ bidId: bid.id, jobId: job.id, providerId }, 'Bid submitted');
  return bid;
}

// ─── ACCEPT BID ─────────────────────────────────────────

export async function acceptBid(farmerId: string, bidId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { jobPosting: true, team: true, provider: true },
  });

  if (!bid) throw new Error('Bid not found');
  if (bid.jobPosting.farmerId !== farmerId) throw new Error('Unauthorized');
  if (bid.status !== 'PENDING') throw new Error('Bid is no longer pending');

  await prisma.$transaction([
    // Accept this bid
    prisma.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
    // Reject all other pending bids
    prisma.bid.updateMany({
      where: { jobPostingId: bid.jobPostingId, id: { not: bidId }, status: 'PENDING' },
      data: { status: 'REJECTED', rejectionReason: 'Another bid accepted' },
    }),
    // Update job status
    prisma.jobPosting.update({
      where: { id: bid.jobPostingId },
      data: { status: 'ASSIGNED', assignedBidId: bidId, assignedTeamId: bid.teamId },
    }),
  ]);

  // Notify provider their bid was accepted
  await enqueue(QUEUES.NOTIFICATION, 'bid-accepted', {
    userId: bid.provider.userId,
    type: 'BID_ACCEPTED',
    title: { en: 'Bid Accepted!', te: 'బిడ్ ఆమోదించబడింది!', hi: 'बोली स्वीकृत!' },
    body: {
      en: `Your bid for ${bid.workersOffered} workers has been accepted.`,
      te: `${bid.workersOffered} కార్మికులకు మీ బిడ్ ఆమోదించబడింది.`,
      hi: `${bid.workersOffered} मजदूरों की आपकी बोली स्वीकृत हुई।`,
    },
    channels: ['PUSH', 'IN_APP', 'SMS'],
    data: { jobPostingId: bid.jobPostingId, bidId },
  });

  log.info({ bidId, jobId: bid.jobPostingId }, 'Bid accepted');
  return bid;
}

// ─── REJECT BID ─────────────────────────────────────────

export async function rejectBid(farmerId: string, bidId: string, reason?: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { jobPosting: true },
  });

  if (!bid) throw new Error('Bid not found');
  if (bid.jobPosting.farmerId !== farmerId) throw new Error('Unauthorized');
  if (bid.status !== 'PENDING') throw new Error('Bid is no longer pending');

  await prisma.bid.update({
    where: { id: bidId },
    data: { status: 'REJECTED', rejectionReason: reason || 'Rejected by farmer' },
  });

  log.info({ bidId }, 'Bid rejected');
}

// ─── WITHDRAW BID ───────────────────────────────────────

export async function withdrawBid(providerId: string, bidId: string) {
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });

  if (!bid) throw new Error('Bid not found');
  if (bid.providerId !== providerId) throw new Error('Unauthorized');
  if (bid.status !== 'PENDING') throw new Error('Can only withdraw pending bids');

  await prisma.bid.update({
    where: { id: bidId },
    data: { status: 'WITHDRAWN' },
  });

  await prisma.jobPosting.update({
    where: { id: bid.jobPostingId },
    data: { bidCount: { decrement: 1 } },
  });

  log.info({ bidId }, 'Bid withdrawn');
}

// ─── LIST JOBS ──────────────────────────────────────────

export async function listJobs(filters: {
  status?: string;
  skillRequired?: string;
  farmerId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page: number;
  limit: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.skillRequired) where.skillRequired = filters.skillRequired;
  if (filters.farmerId) where.farmerId = filters.farmerId;

  const [jobs, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: {
        farmer: { select: { firstName: true, surname: true, village: true, district: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  return { jobs, total };
}

// ─── GET JOB DETAILS ────────────────────────────────────

export async function getJobDetails(jobId: string) {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      farmer: { select: { firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
      bids: {
        include: {
          team: { select: { name: true, rating: true, completionRate: true, activeMembers: true } },
          provider: {
            select: { businessName: true, rating: true, completionRate: true, totalBookings: true },
            include: { user: { select: { firstName: true, surname: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) throw new Error('Job posting not found');

  // Increment view count
  await prisma.jobPosting.update({
    where: { id: jobId },
    data: { viewCount: { increment: 1 } },
  });

  return job;
}

// ─── CANCEL JOB ─────────────────────────────────────────

export async function cancelJobPosting(farmerId: string, jobId: string) {
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, farmerId },
  });

  if (!job) throw new Error('Job posting not found or unauthorized');
  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    throw new Error('Cannot cancel a completed or already cancelled job');
  }

  await prisma.$transaction([
    prisma.jobPosting.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    }),
    // Expire all pending bids
    prisma.bid.updateMany({
      where: { jobPostingId: jobId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    }),
  ]);

  log.info({ jobId }, 'Job posting cancelled');
}
