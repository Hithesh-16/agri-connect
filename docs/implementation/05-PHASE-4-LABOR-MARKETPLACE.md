# Phase 4: Labor Marketplace

**Timeline:** Weeks 18-21
**Priority:** HIGH — Greenfield opportunity with zero scaled competitors
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers), Phase 2 (Booking Engine), Phase 3 (Payments)

> **GREENFIELD** — No existing platform handles structured agricultural labor booking with attendance tracking, team management, and direct payment distribution. This is a category-defining feature.

---

## Objective

Build a complete agricultural labor marketplace — individual worker profiles with skill-based discovery, team management for labor leaders, reverse-marketplace job postings with bidding, GPS-verified QR check-in/check-out attendance, hours tracking, substitute worker matching, and direct bank payment to individual workers.

---

## Current State

### What Exists
- `ServiceCategory` with labor subcategories (general, harvesting, transplanting, weeding, spraying, specialist, loading)
- `LABOR_INDIVIDUAL` and `LABOR_TEAM_LEADER` system roles in RBAC
- `ServiceListing` supports `PER_WORKER_DAY` pricing unit
- Booking engine from Phase 2 with state machine
- Payment infrastructure from Phase 3 with escrow and payouts

### What's Missing
- No individual worker profile (skills, daily rate, preferred crops)
- No team management (leader → members relationship)
- No job posting / reverse marketplace (farmer posts, vendors bid)
- No bidding system
- No QR-based attendance tracking
- No GPS verification at farm location
- No hours tracking and overtime calculation
- No substitute worker handling
- No direct payment distribution to team members
- No regional holiday/festival calendar
- No state-wise minimum wage compliance

---

## Database Schema Changes

### New Models

```prisma
// ── LABOR TEAM MODELS ──

model LaborTeam {
  id              String   @id @default(cuid())
  leaderId        String   // ServiceProvider with type LABOR_TEAM_LEADER
  
  name            Json     // { "en": "Raju's Harvesting Team", "te": "రాజు కోత జట్టు" }
  description     Json?
  
  // Skills (aggregated from members)
  skills          String[] // ["weeding", "transplanting", "harvesting", "pruning", "grafting"]
  primarySkill    String   // Most common skill across team
  
  // Capacity
  maxMembers      Int      @default(20)
  activeMembers   Int      @default(0)
  
  // Location
  baseLocation    Json     // { lat, lng, village, mandal, district, state }
  serviceRadius   Int      @default(30) // km
  
  // Rates
  dailyRatePerWorker Float  // INR — leader sets team rate
  minimumWorkers  Int      @default(1)
  
  // Stats
  rating          Float    @default(0)
  totalJobs       Int      @default(0)
  completionRate  Float    @default(0)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  leader          ServiceProvider @relation(fields: [leaderId], references: [id])
  members         TeamMember[]
  bids            Bid[]
  
  @@index([leaderId])
  @@index([primarySkill, baseLocation])
  @@map("labor_teams")
}

model TeamMember {
  id              String   @id @default(cuid())
  teamId          String
  
  // Worker profile
  name            String
  phone           String
  aadhaarLast4    String?  // Last 4 digits for verification
  photo           String?
  
  // Skills
  skills          String[] // ["weeding", "transplanting", "harvesting"]
  experience      Int?     // Years
  preferredCrops  String[] // ["cotton", "rice", "chilli"]
  
  // Availability
  isAvailable     Boolean  @default(true)
  unavailableFrom DateTime?
  unavailableTo   DateTime?
  unavailableReason String?
  
  // Rate
  dailyRate       Float    // INR 300-600 per day
  
  // Bank details (for direct payment)
  bankAccountNumber String? // Encrypted
  bankIfsc        String?
  bankAccountName String?
  upiId           String?
  
  // Stats
  daysWorked      Int      @default(0)
  rating          Float    @default(0)
  noShowCount     Int      @default(0)
  
  isActive        Boolean  @default(true)
  joinedAt        DateTime @default(now())
  
  team            LaborTeam @relation(fields: [teamId], references: [id])
  attendance      Attendance[]
  
  @@index([teamId, isAvailable])
  @@map("team_members")
}

// ── JOB POSTING & BIDDING ──

model JobPosting {
  id              String   @id @default(cuid())
  farmerId        String
  
  // Job details
  title           Json     // { "en": "Need 5 laborers for cotton picking", "te": "..." }
  description     Json?
  
  // Requirements
  skillRequired   String   // "harvesting" | "weeding" | "transplanting" | etc.
  workersNeeded   Int      // Number of workers
  
  // Schedule
  startDate       DateTime
  endDate         DateTime
  daysNeeded      Int      // Total working days
  slotType        String   @default("FULL_DAY") // "MORNING" | "AFTERNOON" | "FULL_DAY"
  
  // Location
  farmLocation    Json     // { lat, lng, village, mandal, district, state }
  farmSize        Float?   // Acres
  cropType        String?  // What crop
  
  // Budget
  budgetPerWorkerPerDay Float?  // Farmer's budget (optional)
  totalBudget     Float?         // Total budget (optional)
  
  // Status
  status          String   @default("OPEN")
  // "OPEN" | "BIDDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  
  // Assignment
  assignedBidId   String?  @unique
  assignedTeamId  String?
  
  // Metadata
  viewCount       Int      @default(0)
  bidCount        Int      @default(0)
  
  expiresAt       DateTime // Auto-close if no bids accepted
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  farmer          User     @relation(fields: [farmerId], references: [id])
  assignedBid     Bid?     @relation("AssignedBid", fields: [assignedBidId], references: [id])
  bids            Bid[]    @relation("JobBids")
  
  @@index([status, skillRequired, farmLocation])
  @@index([farmerId, status])
  @@map("job_postings")
}

model Bid {
  id              String   @id @default(cuid())
  jobPostingId    String
  teamId          String?  // Team bid (leader bids on behalf)
  providerId      String   // Individual or team leader's provider ID
  
  // Bid details
  ratePerWorkerPerDay Float // Bid amount per worker per day
  totalAmount     Float    // Calculated: rate x workers x days
  workersOffered  Int      // Workers the bidder can provide
  message         Json?    // { "en": "We have experienced cotton pickers...", "te": "..." }
  
  // Status
  status          String   @default("PENDING")
  // "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "EXPIRED"
  
  rejectionReason String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  jobPosting      JobPosting @relation("JobBids", fields: [jobPostingId], references: [id])
  team            LaborTeam? @relation(fields: [teamId], references: [id])
  assignedTo      JobPosting? @relation("AssignedBid")
  
  @@unique([jobPostingId, providerId]) // One bid per provider per job
  @@index([jobPostingId, status])
  @@map("bids")
}

// ── ATTENDANCE ──

model Attendance {
  id              String   @id @default(cuid())
  bookingId       String
  teamMemberId    String?  // Null for individual worker (not in team)
  workerId        String   // User ID or TeamMember ID
  
  date            DateTime @db.Date
  
  // Check-in
  checkInTime     DateTime?
  checkInLat      Float?
  checkInLng      Float?
  checkInDistance  Float?   // Distance from farm in meters
  checkInQrCode   String?  // QR code value scanned
  checkInPhoto    String?  // Selfie at check-in
  checkInVerified Boolean  @default(false)
  
  // Check-out
  checkOutTime    DateTime?
  checkOutLat     Float?
  checkOutLng     Float?
  checkOutDistance Float?
  checkOutQrCode  String?
  checkOutPhoto   String?
  checkOutVerified Boolean @default(false)
  
  // Hours
  hoursWorked     Float?   // Calculated from check-in/check-out
  overtimeHours   Float?   // Hours beyond 8
  breakMinutes    Int?     // Total break time
  
  // Status
  status          String   @default("ABSENT")
  // "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE" | "SUBSTITUTE" | "NO_SHOW"
  
  // Substitute
  isSubstitute    Boolean  @default(false)
  substitutedFor  String?  // Original worker's ID
  
  // Payment
  dailyAmount     Float?   // Amount earned this day
  overtimeAmount  Float?
  deductions      Float?   // Late penalty, etc.
  netAmount       Float?
  paymentStatus   String   @default("PENDING") // "PENDING" | "PROCESSED" | "PAID"
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  teamMember      TeamMember? @relation(fields: [teamMemberId], references: [id])
  
  @@unique([bookingId, workerId, date])
  @@index([bookingId, date])
  @@index([teamMemberId, date])
  @@map("attendance")
}
```

---

## Worker Profile & Skills

### Skill Categories
```typescript
const LABOR_SKILLS = {
  weeding: {
    name: { en: 'Weeding', te: 'కలుపు తీయడం', hi: 'निराई' },
    dailyRateRange: { min: 300, max: 450 },
    description: 'Manual and chemical weeding',
  },
  transplanting: {
    name: { en: 'Transplanting', te: 'నాట్లు', hi: 'रोपाई' },
    dailyRateRange: { min: 350, max: 500 },
    description: 'Rice/vegetable transplanting',
  },
  harvesting: {
    name: { en: 'Harvesting', te: 'కోత', hi: 'कटाई' },
    dailyRateRange: { min: 350, max: 500 },
    description: 'Crop cutting and collection',
  },
  pruning: {
    name: { en: 'Pruning', te: 'కొమ్మల కత్తిరింపు', hi: 'छंटाई' },
    dailyRateRange: { min: 400, max: 550 },
    description: 'Fruit tree pruning (skilled)',
  },
  grafting: {
    name: { en: 'Grafting', te: 'అంట్లు కట్టడం', hi: 'कलम बांधना' },
    dailyRateRange: { min: 500, max: 700 },
    description: 'Plant grafting (specialist)',
  },
  spraying: {
    name: { en: 'Spraying', te: 'పిచికారి', hi: 'छिड़काव' },
    dailyRateRange: { min: 350, max: 500 },
    description: 'Pesticide/fertilizer spraying',
  },
  loading: {
    name: { en: 'Loading/Unloading', te: 'లోడింగ్/అన్‌లోడింగ్', hi: 'लोडिंग/अनलोडिंग' },
    dailyRateRange: { min: 400, max: 550 },
    description: 'Heavy lifting and transportation',
  },
  general: {
    name: { en: 'General Farm Work', te: 'సాధారణ పని', hi: 'सामान्य कार्य' },
    dailyRateRange: { min: 300, max: 400 },
    description: 'Multi-purpose farm labor',
  },
};
```

### State-Wise Minimum Wage Compliance
```typescript
// Dynamic minimum pricing based on state government notifications
const STATE_MINIMUM_WAGES: Record<string, { daily: number; updated: string }> = {
  'Telangana':     { daily: 400, updated: '2026-04-01' },
  'Andhra Pradesh': { daily: 375, updated: '2026-04-01' },
  'Karnataka':     { daily: 371, updated: '2026-04-01' },
  'Tamil Nadu':    { daily: 389, updated: '2026-04-01' },
  'Maharashtra':   { daily: 398, updated: '2026-04-01' },
  'Gujarat':       { daily: 351, updated: '2026-04-01' },
  'Madhya Pradesh':{ daily: 331, updated: '2026-04-01' },
  'Uttar Pradesh': { daily: 341, updated: '2026-04-01' },
  'Rajasthan':     { daily: 349, updated: '2026-04-01' },
  'Punjab':        { daily: 386, updated: '2026-04-01' },
  'Bihar':         { daily: 309, updated: '2026-04-01' },
  'West Bengal':   { daily: 338, updated: '2026-04-01' },
};

// Enforce minimum wage on all bids and listings
function validateDailyRate(rate: number, state: string): { valid: boolean; minRate: number } {
  const stateMin = STATE_MINIMUM_WAGES[state];
  if (!stateMin) return { valid: true, minRate: 300 }; // Default fallback
  return { valid: rate >= stateMin.daily, minRate: stateMin.daily };
}
```

---

## Team Management

```typescript
// backend/src/services/teamService.ts

// Create team
export async function createTeam(leaderId: string, data: CreateTeamInput) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { id: leaderId, type: 'LABOR_TEAM_LEADER' },
  });
  if (!provider) throw new Error('Only team leaders can create teams');

  return await prisma.laborTeam.create({
    data: {
      leaderId,
      name: data.name,
      description: data.description,
      skills: data.skills,
      primarySkill: data.primarySkill,
      maxMembers: data.maxMembers || 20,
      baseLocation: data.baseLocation,
      serviceRadius: data.serviceRadius || 30,
      dailyRatePerWorker: data.dailyRatePerWorker,
      minimumWorkers: data.minimumWorkers || 1,
    },
  });
}

// Add member to team
export async function addTeamMember(teamId: string, leaderId: string, memberData: AddMemberInput) {
  const team = await prisma.laborTeam.findFirst({
    where: { id: teamId, leaderId },
  });
  if (!team) throw new Error('Team not found or unauthorized');
  if (team.activeMembers >= team.maxMembers) throw new Error('Team is full');

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      name: memberData.name,
      phone: memberData.phone,
      aadhaarLast4: memberData.aadhaarLast4,
      skills: memberData.skills,
      experience: memberData.experience,
      preferredCrops: memberData.preferredCrops,
      dailyRate: memberData.dailyRate,
      bankAccountNumber: memberData.bankAccountNumber, // Encrypted
      bankIfsc: memberData.bankIfsc,
      bankAccountName: memberData.bankAccountName,
      upiId: memberData.upiId,
    },
  });

  await prisma.laborTeam.update({
    where: { id: teamId },
    data: { activeMembers: { increment: 1 } },
  });

  return member;
}

// Handle substitute worker
export async function assignSubstitute(params: {
  bookingId: string;
  absentWorkerId: string;
  substituteWorkerId: string;
  date: Date;
}) {
  // Mark original worker as no-show
  await prisma.attendance.update({
    where: {
      bookingId_workerId_date: {
        bookingId: params.bookingId,
        workerId: params.absentWorkerId,
        date: params.date,
      },
    },
    data: { status: 'NO_SHOW' },
  });

  // Create attendance for substitute
  await prisma.attendance.create({
    data: {
      bookingId: params.bookingId,
      workerId: params.substituteWorkerId,
      date: params.date,
      status: 'SUBSTITUTE',
      isSubstitute: true,
      substitutedFor: params.absentWorkerId,
    },
  });

  // Notify farmer
  await queueNotification({
    userId: /* farmerId */,
    type: 'SUBSTITUTE_ASSIGNED',
    title: { en: 'Substitute Worker Assigned', te: 'ప్రత్యామ్నాయ కార్మికుడు', hi: 'स्थानापन्न कर्मचारी' },
    body: {
      en: `A substitute worker has been assigned for today's job.`,
      te: `నేటి పనికి ప్రత్యామ్నాయ కార్మికుడు నియమించబడ్డారు.`,
      hi: `आज के काम के लिए एक स्थानापन्न कर्मचारी नियुक्त किया गया है।`,
    },
    channels: ['PUSH', 'IN_APP'],
  });
}
```

---

## Job Posting & Bidding (Reverse Marketplace)

```typescript
// backend/src/services/jobService.ts

// Farmer posts a job
export async function createJobPosting(farmerId: string, data: CreateJobInput) {
  // Validate minimum wage
  if (data.budgetPerWorkerPerDay) {
    const { valid, minRate } = validateDailyRate(data.budgetPerWorkerPerDay, data.farmLocation.state);
    if (!valid) {
      throw new Error(`Budget per worker must be at least INR ${minRate}/day (state minimum wage)`);
    }
  }

  const job = await prisma.jobPosting.create({
    data: {
      farmerId,
      title: data.title,
      description: data.description,
      skillRequired: data.skillRequired,
      workersNeeded: data.workersNeeded,
      startDate: data.startDate,
      endDate: data.endDate,
      daysNeeded: data.daysNeeded,
      slotType: data.slotType || 'FULL_DAY',
      farmLocation: data.farmLocation,
      farmSize: data.farmSize,
      cropType: data.cropType,
      budgetPerWorkerPerDay: data.budgetPerWorkerPerDay,
      totalBudget: data.budgetPerWorkerPerDay
        ? data.budgetPerWorkerPerDay * data.workersNeeded * data.daysNeeded
        : data.totalBudget,
      expiresAt: addDays(data.startDate, -1), // Expires day before start
    },
  });

  // Notify nearby labor providers/teams
  await notifyNearbyProviders(job);

  return job;
}

// Provider/team submits bid
export async function submitBid(providerId: string, data: SubmitBidInput) {
  const job = await prisma.jobPosting.findUnique({ where: { id: data.jobPostingId } });
  if (!job || job.status !== 'OPEN') throw new Error('Job not available for bidding');

  // Validate minimum wage
  const { valid, minRate } = validateDailyRate(data.ratePerWorkerPerDay, job.farmLocation.state);
  if (!valid) throw new Error(`Rate must be at least INR ${minRate}/day (state minimum wage)`);

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

  await prisma.jobPosting.update({
    where: { id: data.jobPostingId },
    data: { bidCount: { increment: 1 }, status: 'BIDDING' },
  });

  // Notify farmer
  await queueNotification({
    userId: job.farmerId,
    type: 'NEW_BID',
    title: { en: 'New Bid Received', te: 'కొత్త బిడ్ వచ్చింది', hi: 'नई बोली आई' },
    body: {
      en: `${bid.workersOffered} workers offered at INR ${bid.ratePerWorkerPerDay}/day`,
      te: `${bid.workersOffered} కార్మికులు INR ${bid.ratePerWorkerPerDay}/రోజు`,
      hi: `${bid.workersOffered} मजदूर INR ${bid.ratePerWorkerPerDay}/दिन`,
    },
    channels: ['PUSH', 'IN_APP'],
  });

  return bid;
}

// Farmer accepts bid
export async function acceptBid(farmerId: string, bidId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { jobPosting: true },
  });
  if (!bid || bid.jobPosting.farmerId !== farmerId) throw new Error('Unauthorized');
  if (bid.status !== 'PENDING') throw new Error('Bid no longer available');

  await prisma.$transaction([
    // Accept this bid
    prisma.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
    // Reject all other bids
    prisma.bid.updateMany({
      where: { jobPostingId: bid.jobPostingId, id: { not: bidId } },
      data: { status: 'REJECTED', rejectionReason: 'Another bid accepted' },
    }),
    // Update job status
    prisma.jobPosting.update({
      where: { id: bid.jobPostingId },
      data: { status: 'ASSIGNED', assignedBidId: bidId, assignedTeamId: bid.teamId },
    }),
  ]);

  // Create booking from job + bid
  await createBookingFromJob(bid.jobPosting, bid);
}
```

---

## QR Check-In/Check-Out Attendance

### QR Code Generation
```typescript
// backend/src/services/attendanceService.ts
import QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';

// Generate daily QR code for a booking (farmer scans to let workers check in)
export async function generateDailyQR(bookingId: string, date: Date): Promise<string> {
  const qrPayload = {
    bookingId,
    date: date.toISOString().split('T')[0],
    token: uuid(), // One-time token
    expiresAt: addHours(date, 14).toISOString(), // Valid 6AM-8PM
  };

  // Store token for validation
  await redis.setex(
    `qr:${qrPayload.token}`,
    14 * 60 * 60, // 14 hours TTL
    JSON.stringify(qrPayload)
  );

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
  return qrDataUrl;
}

// Worker scans QR + GPS check
export async function checkIn(params: {
  workerId: string;
  qrCode: string;
  lat: number;
  lng: number;
  photo?: string;
}) {
  // 1. Validate QR code
  const qrData = JSON.parse(params.qrCode);
  const storedToken = await redis.get(`qr:${qrData.token}`);
  if (!storedToken) throw new Error('Invalid or expired QR code');

  const stored = JSON.parse(storedToken);
  if (new Date(stored.expiresAt) < new Date()) throw new Error('QR code expired');

  // 2. Verify GPS — must be within 200m of farm
  const booking = await prisma.booking.findUnique({ where: { id: stored.bookingId } });
  const farmLat = booking.farmLocation.lat;
  const farmLng = booking.farmLocation.lng;
  const distance = haversineDistance(
    { lat: params.lat, lng: params.lng },
    { lat: farmLat, lng: farmLng }
  );

  if (distance > 200) {
    throw new Error(`Too far from farm location (${Math.round(distance)}m away, max 200m)`);
  }

  // 3. Create/update attendance record
  const today = new Date().toISOString().split('T')[0];
  const attendance = await prisma.attendance.upsert({
    where: {
      bookingId_workerId_date: {
        bookingId: stored.bookingId,
        workerId: params.workerId,
        date: new Date(today),
      },
    },
    create: {
      bookingId: stored.bookingId,
      workerId: params.workerId,
      date: new Date(today),
      checkInTime: new Date(),
      checkInLat: params.lat,
      checkInLng: params.lng,
      checkInDistance: distance,
      checkInQrCode: qrData.token,
      checkInPhoto: params.photo,
      checkInVerified: true,
      status: 'PRESENT',
    },
    update: {
      checkInTime: new Date(),
      checkInLat: params.lat,
      checkInLng: params.lng,
      checkInDistance: distance,
      checkInQrCode: qrData.token,
      checkInPhoto: params.photo,
      checkInVerified: true,
      status: 'PRESENT',
    },
  });

  // Invalidate QR token for this worker (one-time use per worker)
  // Note: other workers can still use the same QR for the same booking

  return attendance;
}

// Worker checks out
export async function checkOut(params: {
  workerId: string;
  bookingId: string;
  lat: number;
  lng: number;
  photo?: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const attendance = await prisma.attendance.findUnique({
    where: {
      bookingId_workerId_date: {
        bookingId: params.bookingId,
        workerId: params.workerId,
        date: new Date(today),
      },
    },
  });

  if (!attendance || !attendance.checkInTime) {
    throw new Error('Must check in before checking out');
  }

  // GPS verification (same 200m radius)
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  const distance = haversineDistance(
    { lat: params.lat, lng: params.lng },
    { lat: booking.farmLocation.lat, lng: booking.farmLocation.lng }
  );

  // Calculate hours worked
  const hoursWorked = differenceInHours(new Date(), attendance.checkInTime);
  const overtimeHours = Math.max(0, hoursWorked - 8);

  // Calculate daily payment
  const member = await prisma.teamMember.findUnique({ where: { id: params.workerId } });
  const dailyRate = member?.dailyRate || attendance.dailyAmount || 0;
  const overtimeRate = dailyRate / 8 * 1.5; // 1.5x for overtime
  const overtimeAmount = overtimeHours * overtimeRate;
  const netAmount = dailyRate + overtimeAmount;

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: new Date(),
      checkOutLat: params.lat,
      checkOutLng: params.lng,
      checkOutDistance: distance,
      checkOutPhoto: params.photo,
      checkOutVerified: distance <= 200,
      hoursWorked,
      overtimeHours,
      dailyAmount: dailyRate,
      overtimeAmount,
      netAmount,
      status: hoursWorked >= 4 ? 'PRESENT' : 'HALF_DAY',
    },
  });
}
```

### Substitute Worker Matching
```typescript
// When a worker doesn't show up, find a replacement within 2 hours
export async function findSubstitute(params: {
  bookingId: string;
  absentWorkerId: string;
  requiredSkill: string;
  farmLocation: { lat: number; lng: number };
}) {
  // Find available workers within 15km with matching skill
  const availableWorkers = await prisma.teamMember.findMany({
    where: {
      isAvailable: true,
      isActive: true,
      skills: { has: params.requiredSkill },
      team: {
        baseLocation: {
          // Within 15km (approximate bounding box for faster query)
          path: ['lat'],
          gte: params.farmLocation.lat - 0.135, // ~15km
          lte: params.farmLocation.lat + 0.135,
        },
      },
    },
    include: { team: true },
    take: 10,
  });

  // Filter by actual distance and sort by rating
  const nearby = availableWorkers
    .map(w => ({
      ...w,
      distance: haversineDistance(
        w.team.baseLocation,
        params.farmLocation
      ),
    }))
    .filter(w => w.distance <= 15000) // 15km in meters
    .sort((a, b) => b.rating - a.rating);

  return nearby;
}
```

---

## Regional Holiday Calendar

```typescript
// Auto-block regional holidays and festivals
const REGIONAL_HOLIDAYS_2026: Record<string, Array<{ date: string; name: string }>> = {
  'Telangana': [
    { date: '2026-01-14', name: 'Sankranti' },
    { date: '2026-03-30', name: 'Ugadi' },
    { date: '2026-04-14', name: 'Ambedkar Jayanti' },
    { date: '2026-06-19', name: 'Bonalu (approx)' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-10', name: 'Diwali' },
    // ... more holidays
  ],
  'Andhra Pradesh': [
    { date: '2026-01-14', name: 'Sankranti' },
    { date: '2026-03-30', name: 'Ugadi' },
    // ... state-specific holidays
  ],
  // ... other states
};

// Warn farmers when posting jobs on holidays
function checkHolidayConflict(dates: Date[], state: string): Array<{ date: string; holiday: string }> {
  const holidays = REGIONAL_HOLIDAYS_2026[state] || [];
  const conflicts = [];
  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateStr);
    if (holiday) conflicts.push({ date: dateStr, holiday: holiday.name });
  }
  return conflicts;
}
```

---

## Payment Distribution to Team Members

```typescript
// After booking completion, distribute payment to individual workers
export async function distributeTeamPayment(bookingId: string) {
  const attendanceRecords = await prisma.attendance.findMany({
    where: { bookingId, status: { in: ['PRESENT', 'HALF_DAY', 'SUBSTITUTE'] } },
    include: { teamMember: true },
  });

  const paymentDistribution = attendanceRecords.map(record => ({
    workerId: record.workerId,
    name: record.teamMember?.name || 'Individual Worker',
    daysWorked: record.status === 'HALF_DAY' ? 0.5 : 1,
    dailyAmount: record.dailyAmount || 0,
    overtimeAmount: record.overtimeAmount || 0,
    netAmount: record.netAmount || 0,
    bankAccount: record.teamMember?.bankAccountNumber,
    upiId: record.teamMember?.upiId,
  }));

  // Batch payout via Razorpay
  for (const worker of paymentDistribution) {
    if (worker.bankAccount || worker.upiId) {
      await initiateWorkerPayout({
        amount: worker.netAmount,
        bankAccount: worker.bankAccount,
        ifsc: worker.teamMember?.bankIfsc,
        upiId: worker.upiId,
        name: worker.name,
        bookingId,
      });
    }
  }

  // Update attendance payment status
  await prisma.attendance.updateMany({
    where: { bookingId, status: { in: ['PRESENT', 'HALF_DAY', 'SUBSTITUTE'] } },
    data: { paymentStatus: 'PROCESSED' },
  });

  return paymentDistribution;
}
```

---

## API Endpoints

### Job Postings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobs` | FARMER | Create job posting |
| GET | `/api/jobs` | Auth | List jobs (farmer: own, worker: nearby open) |
| GET | `/api/jobs/:id` | Auth | Job details with bids |
| PUT | `/api/jobs/:id` | FARMER (owner) | Update job posting |
| DELETE | `/api/jobs/:id` | FARMER (owner) | Cancel job posting |
| GET | `/api/jobs/nearby` | VENDOR/LABOR | Find jobs near location |

### Bids

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobs/:id/bids` | VENDOR/LABOR | Submit bid on job |
| GET | `/api/jobs/:id/bids` | FARMER (owner) | List bids for job |
| PUT | `/api/bids/:id/accept` | FARMER | Accept bid |
| PUT | `/api/bids/:id/reject` | FARMER | Reject bid |
| DELETE | `/api/bids/:id` | VENDOR (owner) | Withdraw bid |

### Teams

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/teams` | LABOR_TEAM_LEADER | Create team |
| GET | `/api/teams/me` | LABOR_TEAM_LEADER | Get my teams |
| GET | `/api/teams/:id` | Auth | Team details + members |
| PUT | `/api/teams/:id` | LABOR_TEAM_LEADER (owner) | Update team |
| POST | `/api/teams/:id/members` | LABOR_TEAM_LEADER (owner) | Add member |
| PUT | `/api/teams/:id/members/:memberId` | LABOR_TEAM_LEADER (owner) | Update member |
| DELETE | `/api/teams/:id/members/:memberId` | LABOR_TEAM_LEADER (owner) | Remove member |

### Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/attendance/check-in` | VENDOR/LABOR | QR + GPS check-in |
| POST | `/api/attendance/check-out` | VENDOR/LABOR | GPS check-out |
| GET | `/api/attendance/booking/:bookingId` | Owner/Provider | Attendance report |
| POST | `/api/attendance/qr/:bookingId` | FARMER | Generate daily QR code |

---

## Frontend Screens

### Farmer App

| Screen | Component | Description |
|--------|-----------|-------------|
| PostJob | `PostJobScreen` | Form: skill, workers, dates, location, budget |
| MyJobs | `MyJobsScreen` | Tabs: Open, Bidding, Assigned, Completed |
| BidReview | `BidReviewScreen` | Compare bids: rate, workers, team rating, message |
| AttendanceReport | `AttendanceReportScreen` | Daily attendance view, hours, payment summary |

### Partner/Worker App

| Screen | Component | Description |
|--------|-----------|-------------|
| BrowseJobs | `BrowseJobsScreen` | Nearby jobs with map, filters by skill, rate |
| SubmitBid | `SubmitBidScreen` | Bid form: rate, workers available, message |
| ManageTeam | `ManageTeamScreen` | Add/remove members, update profiles, payment info |
| CheckIn | `CheckInScreen` | QR scanner + GPS verification + selfie capture |

---

## Edge Cases

### Worker No-Show
1. Worker does not scan QR by 7 AM → marked as `NO_SHOW`
2. Team leader notified to assign substitute
3. If no substitute within 2 hours → farmer notified, daily fee adjusted proportionally
4. Repeat no-shows (3+ in a month) → worker flagged, team leader warned

### Festival/Holiday Conflicts
1. Job posted on a regional holiday → warning shown to farmer
2. Workers can opt-out of holiday work → availability auto-blocked
3. Holiday premium rate suggested (1.5x-2x daily rate)

### Minimum Wage Enforcement
1. Bid below state minimum wage → rejected with error message showing minimum
2. Job budget below minimum wage → warning shown, cannot publish
3. Minimum wage data updated quarterly from government notifications

---

## Industry Comparison

| Feature | Urban Company | Apna | Kaam.com | KisanConnect (Ours) |
|---------|--------------|------|----------|---------------------|
| Sector | Urban services | Blue-collar (all) | Blue-collar (all) | Agricultural labor (specialized) |
| Team booking | No (individual only) | No | No | Yes — team leader + members |
| Attendance tracking | Basic | No | No | QR + GPS verified |
| Bidding | No | No | No | Yes — reverse marketplace |
| Skill-based matching | Yes | Yes | Basic | Yes + crop-specific |
| Payment distribution | To individual | N/A (job listing only) | N/A | Direct to each worker's bank |
| Holiday calendar | No | No | No | Regional auto-blocking |
| Minimum wage compliance | No | No | No | State-wise enforcement |
| Substitute handling | No | No | No | Auto-matching within 2 hours |

---

## Testing Checklist

- [ ] **GPS Verification**: Check-in within 200m → success; beyond 200m → rejected with distance
- [ ] **GPS Verification**: Check-out within 200m → verified; beyond → recorded but flagged
- [ ] **QR Code**: Generate QR → scan → validate → check-in succeeds
- [ ] **QR Code**: Expired QR (>14h) → rejected
- [ ] **QR Code**: Reused QR token for same worker → rejected
- [ ] **Bid State Machine**: PENDING → ACCEPTED works; PENDING → ACCEPTED for another bid → remaining auto-REJECTED
- [ ] **Bid State Machine**: WITHDRAWN bid cannot be accepted
- [ ] **Bid Validation**: Bid below state minimum wage → rejected
- [ ] **Team Management**: Add member → activeMembers incremented; remove → decremented
- [ ] **Team Management**: Add member beyond maxMembers → rejected
- [ ] **Attendance Reporting**: Daily summary shows correct hours, overtime, amounts per worker
- [ ] **Attendance Reporting**: Half-day calculated when hoursWorked < 4
- [ ] **Payment Distribution**: After completion, each worker receives correct amount to their bank
- [ ] **Payment Distribution**: Worker with no bank details → flagged for cash payment
- [ ] **Substitute Worker**: No-show detected → nearby substitute found → attendance updated
- [ ] **Holiday Warning**: Job posted on Sankranti → warning displayed
- [ ] **Minimum Wage**: Listing rate below state minimum → error with correct minimum shown
- [ ] **Concurrent Bids**: Two providers bid simultaneously → both recorded, no duplicates
- [ ] **Job Expiry**: Unassigned job past expiry date → auto-closed

---

## Files to Create/Modify

### New Files
```
backend/src/routes/jobs.ts                  # Job posting CRUD
backend/src/routes/bids.ts                  # Bid submission, accept, reject
backend/src/routes/teams.ts                 # Team management CRUD
backend/src/routes/attendance.ts            # QR check-in/out, reports
backend/src/services/jobService.ts          # Job posting logic + notifications
backend/src/services/bidService.ts          # Bidding logic + state machine
backend/src/services/teamService.ts         # Team management + member handling
backend/src/services/attendanceService.ts   # QR gen, GPS verify, hours calc
backend/src/services/substituteService.ts   # Substitute worker matching
backend/src/services/minimumWageService.ts  # State-wise minimum wage validation
backend/src/data/holidays.ts               # Regional holiday calendar data
backend/src/data/minimumWages.ts           # State minimum wages data
backend/src/workers/noShowDetector.ts       # Cron: detect no-shows at 7 AM
packages/shared/types/labor.ts              # Labor marketplace TypeScript types
mobile/src/screens/labor/PostJobScreen.tsx   # Farmer: post job
mobile/src/screens/labor/MyJobsScreen.tsx    # Farmer: manage jobs
mobile/src/screens/labor/BidReviewScreen.tsx # Farmer: review bids
mobile/src/screens/labor/AttendanceReportScreen.tsx # Farmer: attendance
partner-app/src/screens/labor/BrowseJobsScreen.tsx  # Worker: find jobs
partner-app/src/screens/labor/SubmitBidScreen.tsx   # Worker: submit bid
partner-app/src/screens/labor/ManageTeamScreen.tsx  # Leader: manage team
partner-app/src/screens/labor/CheckInScreen.tsx     # Worker: QR scanner
```

### Modified Files
```
backend/prisma/schema.prisma                # Add LaborTeam, TeamMember, JobPosting, Bid, Attendance
backend/src/index.ts                        # Mount jobs/bids/teams/attendance routes
backend/src/services/bookingService.ts      # Create booking from accepted bid
backend/src/services/payoutService.ts       # Add worker payment distribution
mobile/src/navigation/AppNavigator.tsx      # Add labor screens
partner-app/src/navigation/AppNavigator.tsx # Add labor screens
```

---

## Definition of Done

- [ ] Individual worker profiles created with skills, rates, and bank details
- [ ] Teams created and managed by team leaders (5-20 members)
- [ ] Job postings created by farmers with skill/worker requirements
- [ ] Bidding system works: submit, accept, reject, withdraw
- [ ] QR-based check-in verified within 200m GPS radius
- [ ] Hours tracked with overtime calculation
- [ ] Substitute workers matched and assigned within 2 hours
- [ ] Payments distributed directly to individual worker bank accounts
- [ ] State-wise minimum wage enforced on all rates
- [ ] Regional holiday calendar warns about conflicts
- [ ] All frontend screens functional for farmers and workers
