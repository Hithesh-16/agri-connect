# Phase 5: Village Resource Exchange & FPO Integration

**Timeline:** Weeks 22-25
**Priority:** MEDIUM-HIGH — Unique differentiator, builds community moat
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers), Phase 2 (Booking Engine), Phase 3 (Payments)

> **UNIQUE** — No competitor has village-level P2P resource sharing. This feature creates a community network effect that is nearly impossible to replicate without ground-level trust infrastructure.

---

## Objective

Build a village-level peer-to-peer resource exchange system — water sharing, fertilizer/input splitting, tool lending — with geo-fenced village circles, trust scoring, FPO group buying integration, multi-dimensional reviews, dispute resolution, and automated eKYC via KARZA/IDfy (replacing manual KYC from Phase 1).

---

## Current State

### What Exists
- User model with location (village, mandal, district, state)
- RBAC with FPO_ADMIN role and organizational scoping
- Listing model for products (crop, machinery, tool categories)
- Payment infrastructure with wallet and escrow
- KYC flow (currently manual admin verification from Phase 1)

### What's Missing
- No village circle / community concept
- No P2P resource exchange (only marketplace listings)
- No water sharing / scheduling system
- No barter or group buying
- No trust scoring
- No FPO integration beyond role assignment
- No review system (reviews model exists in Phase 1 but not implemented)
- No dispute resolution system
- No automated eKYC (manual only)

---

## Resource Categories

### 1. Water Resources
| Resource | Transaction Types | Notes |
|----------|------------------|-------|
| Borewell sharing | Share Schedule, Rent | Time-slot based water sharing |
| Canal turn trading | Sell, Barter | Irrigation canal time allocation |
| Solar pump pooling | Share Schedule, Group Buy | Shared solar pump for multiple farms |
| Rainwater harvesting | Lend Free, Sell | Harvested rainwater surplus |
| Drip system lending | Rent, Lend Free | Portable drip irrigation kits |

### 2. Fertilizer & Input Sharing
| Resource | Transaction Types | Notes |
|----------|------------------|-------|
| Surplus fertilizer sale | Sell | Unused bags after season |
| Seed exchange | Barter, Sell | Traditional seed varieties |
| Pesticide splitting | Group Buy | Split large drums among farmers |
| Organic compost | Sell, Barter, Lend Free | Farm-made compost |
| Group input buying | Group Buy | Bulk purchase for 15-30% discount |

### 3. Tools & Equipment
| Resource | Transaction Types | Notes |
|----------|------------------|-------|
| Hand tools | Lend Free, Rent | Shovels, hoes, sickles |
| Power tools | Rent | Chainsaws, brush cutters, pumps |
| Irrigation pipes | Rent, Lend Free | Temporary pipe extensions |
| Storage containers | Rent | Grain bags, drums, crates |
| Protective gear | Rent, Lend Free | Spray suits, masks, gloves |

---

## Transaction Types

```typescript
enum ExchangeType {
  SELL = 'SELL',           // Cash/UPI payment
  RENT = 'RENT',           // Per day/hour rental
  BARTER = 'BARTER',       // Trade item for item
  LEND_FREE = 'LEND_FREE', // Free lending (trust-based)
  GROUP_BUY = 'GROUP_BUY', // Collective purchase for discount
  SHARE_SCHEDULE = 'SHARE_SCHEDULE', // Shared time-slot access (water, equipment)
}
```

---

## Database Schema Changes

### New Models

```prisma
// ── VILLAGE CIRCLE ──

model VillageCircle {
  id              String   @id @default(cuid())
  name            Json     // { "en": "Warangal East Circle", "te": "వరంగల్ తూర్పు సర్కిల్" }
  description     Json?
  
  // Location center
  centerLat       Float
  centerLng       Float
  village         String?
  mandal          String?
  district        String
  state           String
  
  // Radius configuration (km)
  toolRadius      Int      @default(5)   // Tools available within 5km
  machineryRadius Int      @default(15)  // Machinery within 15km
  inputRadius     Int      @default(50)  // Inputs within 50km
  
  // Stats
  memberCount     Int      @default(0)
  listingCount    Int      @default(0)
  exchangeCount   Int      @default(0)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  members         VillageCircleMember[]
  listings        ExchangeListing[]
  groupBuys       GroupBuy[]
  waterSchedules  WaterSchedule[]
  
  @@index([centerLat, centerLng])
  @@index([district, state])
  @@map("village_circles")
}

model VillageCircleMember {
  id              String   @id @default(cuid())
  circleId        String
  userId          String
  
  role            String   @default("MEMBER") // "MEMBER" | "MODERATOR" | "ADMIN"
  
  // Verification
  isVerified      Boolean  @default(false)
  verifiedVia     String?  // "AADHAAR" | "PANCHAYAT" | "REFERRAL"
  verifiedAt      DateTime?
  verifiedBy      String?
  
  joinedAt        DateTime @default(now())
  isActive        Boolean  @default(true)
  
  circle          VillageCircle @relation(fields: [circleId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  
  @@unique([circleId, userId])
  @@map("village_circle_members")
}

// ── EXCHANGE LISTINGS ──

model ExchangeListing {
  id              String   @id @default(cuid())
  circleId        String
  userId          String   // Owner/seller
  
  // Resource
  category        String   // "WATER" | "FERTILIZER_INPUT" | "TOOLS"
  subcategory     String   // "borewell", "surplus_fertilizer", "hand_tools", etc.
  title           Json     // { "en": "10 bags DAP fertilizer", "te": "..." }
  description     Json?
  images          String[]
  
  // Transaction type
  exchangeType    String   // "SELL" | "RENT" | "BARTER" | "LEND_FREE" | "GROUP_BUY" | "SHARE_SCHEDULE"
  
  // Pricing (for SELL/RENT)
  price           Float?
  pricingUnit     String?  // "PER_UNIT" | "PER_DAY" | "PER_HOUR" | "PER_KG" | "PER_BAG"
  deposit         Float?   // Security deposit for rentals
  
  // Barter (for BARTER type)
  barterWants     Json?    // { "items": ["Seeds - Tomato"], "description": "Looking for tomato seeds" }
  
  // Availability
  quantity        Int?     // Units available
  availableFrom   DateTime?
  availableTo     DateTime?
  
  // Geo
  location        Json     // { lat, lng }
  
  // Status
  status          String   @default("ACTIVE")
  // "ACTIVE" | "RESERVED" | "COMPLETED" | "EXPIRED" | "CANCELLED"
  
  viewCount       Int      @default(0)
  requestCount    Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  circle          VillageCircle  @relation(fields: [circleId], references: [id])
  user            User           @relation(fields: [userId], references: [id])
  requests        ExchangeRequest[]
  reviews         Review[]
  
  @@index([circleId, category, status])
  @@index([userId, status])
  @@map("exchange_listings")
}

model ExchangeRequest {
  id              String   @id @default(cuid())
  listingId       String
  requesterId     String
  
  message         Json?    // { "en": "I need 3 bags, can pick up tomorrow", "te": "..." }
  quantity        Int?     // How many units requested
  
  // For BARTER
  barterOffer     Json?    // { "items": ["5 kg Neem Seeds"], "description": "..." }
  
  status          String   @default("PENDING")
  // "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED"
  
  // Schedule (for RENT/SHARE_SCHEDULE)
  scheduledDate   DateTime?
  returnDate      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  listing         ExchangeListing @relation(fields: [listingId], references: [id])
  requester       User            @relation(fields: [requesterId], references: [id])
  
  @@index([listingId, status])
  @@map("exchange_requests")
}

// ── VILLAGE TRUST ──

model VillageTrust {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  // Overall score (0-100)
  trustScore      Int      @default(50) // Start at 50 (neutral)
  
  // Component scores
  exchangeScore   Int      @default(50) // Based on exchange history
  verificationScore Int    @default(0)  // Aadhaar + panchayat verification
  communityScore  Int      @default(50) // Community endorsements
  
  // Penalties
  lateReturnCount Int      @default(0)
  noShowCount     Int      @default(0)
  damageReportCount Int    @default(0)
  disputeCount    Int      @default(0)
  
  // Positive signals
  successfulExchanges Int  @default(0)
  endorsementCount Int     @default(0)
  referralCount    Int     @default(0)
  
  // History
  scoreHistory    Json[]   // [{ date, score, reason }]
  
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@map("village_trust")
}

// ── GROUP BUY ──

model GroupBuy {
  id              String   @id @default(cuid())
  circleId        String
  organizerId     String
  
  // Product
  productName     Json     // { "en": "DAP Fertilizer 50kg", "te": "..." }
  description     Json?
  images          String[]
  
  // Supplier
  supplierName    String?
  supplierContact String?
  
  // Pricing
  marketPrice     Float    // Regular market price per unit
  groupPrice      Float    // Discounted bulk price per unit
  discountPercent Float    // Calculated: (market - group) / market * 100
  minQuantity     Int      // Minimum total units to activate group buy
  maxQuantity     Int?     // Maximum available from supplier
  
  // Progress
  currentQuantity Int      @default(0)
  participantCount Int     @default(0)
  
  // Status
  status          String   @default("OPEN")
  // "OPEN" | "MIN_REACHED" | "PURCHASING" | "DISTRIBUTING" | "COMPLETED" | "CANCELLED"
  
  // Deadlines
  enrollmentDeadline DateTime
  deliveryDate    DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  circle          VillageCircle    @relation(fields: [circleId], references: [id])
  participants    GroupBuyParticipant[]
  
  @@index([circleId, status])
  @@map("group_buys")
}

model GroupBuyParticipant {
  id              String   @id @default(cuid())
  groupBuyId      String
  userId          String
  
  quantity        Int      // Units requested
  amount          Float    // quantity * groupPrice
  
  paymentStatus   String   @default("PENDING") // "PENDING" | "PAID" | "REFUNDED"
  paymentId       String?
  
  deliveryStatus  String   @default("PENDING") // "PENDING" | "DELIVERED" | "CONFIRMED"
  deliveredAt     DateTime?
  
  createdAt       DateTime @default(now())
  
  groupBuy        GroupBuy @relation(fields: [groupBuyId], references: [id])
  
  @@unique([groupBuyId, userId])
  @@map("group_buy_participants")
}

// ── WATER SCHEDULE ──

model WaterSchedule {
  id              String   @id @default(cuid())
  circleId        String
  resourceId      String   // ExchangeListing ID (borewell, canal, pump)
  
  // Schedule
  dayOfWeek       Int      // 0-6
  startTime       String   // "06:00"
  endTime         String   // "08:00"
  
  assignedUserId  String
  
  // Status
  isActive        Boolean  @default(true)
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  circle          VillageCircle @relation(fields: [circleId], references: [id])
  
  @@unique([resourceId, dayOfWeek, startTime])
  @@map("water_schedules")
}

// ── REVIEWS ──

model Review {
  id              String   @id @default(cuid())
  
  // What's being reviewed
  targetType      String   // "SERVICE_LISTING" | "EXCHANGE_LISTING" | "SERVICE_PROVIDER" | "LABOR_TEAM"
  targetId        String
  
  // Who wrote it
  reviewerId      String
  bookingId       String?  // For service reviews
  exchangeRequestId String? // For exchange reviews
  
  // Ratings (1-5)
  overallRating   Int      // 1-5
  
  // Sub-ratings
  punctualityRating Int?   // On-time delivery/service
  qualityRating   Int?     // Quality of service/product
  communicationRating Int? // Responsiveness
  valueRating     Int?     // Value for money
  
  // Content
  title           String?
  comment         Json?    // { "en": "...", "te": "..." }
  images          String[] // Photo reviews
  
  // Provider response
  providerResponse Json?   // { "en": "Thank you...", "te": "..." }
  respondedAt     DateTime?
  
  // Moderation
  isVerified      Boolean  @default(false) // Verified purchase/exchange
  isHidden        Boolean  @default(false) // Flagged by moderation
  hiddenReason    String?
  
  helpfulCount    Int      @default(0)
  reportCount     Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([targetType, targetId])
  @@index([reviewerId])
  @@map("reviews")
}

// ── DISPUTES ──

model Dispute {
  id              String   @id @default(cuid())
  
  // Context
  type            String   // "BOOKING" | "EXCHANGE" | "PAYMENT" | "REVIEW"
  bookingId       String?
  exchangeRequestId String?
  paymentId       String?
  
  // Parties
  raisedBy        String   // User ID
  againstUserId   String   // User ID
  
  // Details
  category        String   // "SERVICE_NOT_DELIVERED" | "QUALITY_ISSUE" | "DAMAGE" | "LATE_RETURN" | "PAYMENT_DISPUTE" | "WRONG_ITEM" | "SAFETY_CONCERN"
  title           String
  description     Json     // { "en": "...", "te": "..." }
  evidence        String[] // Image/document URLs
  
  // Resolution
  status          String   @default("OPEN")
  // "OPEN" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED" | "CLOSED"
  
  tier            Int      @default(1)
  // Tier 1: Auto-resolve (immediate) — refund <INR 500
  // Tier 2: Support review (48h) — manual review
  // Tier 3: Escalation (7 days) — senior team
  // Tier 4: Insurance claim — external
  
  assignedTo      String?  // Support agent user ID
  
  resolution      Json?    // { type: "REFUND" | "REPLACEMENT" | "PARTIAL_REFUND" | "NO_ACTION", amount?, notes }
  resolvedAt      DateTime?
  resolvedBy      String?
  
  // Communication
  messages        Json[]   // [{ userId, message, timestamp, attachments }]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([raisedBy, status])
  @@index([status, tier])
  @@map("disputes")
}
```

---

## Geo-Fenced Village Circles

```typescript
// backend/src/services/circleService.ts

// Create or find a village circle for a user's location
export async function joinOrCreateCircle(userId: string, location: {
  lat: number;
  lng: number;
  village: string;
  mandal: string;
  district: string;
  state: string;
}) {
  // Find existing circle within 5km of user's village
  const nearbyCircle = await prisma.$queryRaw`
    SELECT *, (
      6371 * acos(
        cos(radians(${location.lat})) * cos(radians("centerLat"))
        * cos(radians("centerLng") - radians(${location.lng}))
        + sin(radians(${location.lat})) * sin(radians("centerLat"))
      )
    ) AS distance
    FROM village_circles
    WHERE "isActive" = true
    HAVING distance < 5
    ORDER BY distance
    LIMIT 1
  `;

  let circle = nearbyCircle[0];

  if (!circle) {
    // Create new circle
    circle = await prisma.villageCircle.create({
      data: {
        name: {
          en: `${location.village || location.mandal} Circle`,
          te: `${location.village || location.mandal} సర్కిల్`,
          hi: `${location.village || location.mandal} सर्कल`,
        },
        centerLat: location.lat,
        centerLng: location.lng,
        village: location.village,
        mandal: location.mandal,
        district: location.district,
        state: location.state,
      },
    });
  }

  // Add user as member
  await prisma.villageCircleMember.upsert({
    where: { circleId_userId: { circleId: circle.id, userId } },
    create: { circleId: circle.id, userId },
    update: { isActive: true },
  });

  await prisma.villageCircle.update({
    where: { id: circle.id },
    data: { memberCount: { increment: 1 } },
  });

  return circle;
}

// Find listings within radius based on category
export async function findNearbyExchanges(params: {
  lat: number;
  lng: number;
  category: 'WATER' | 'FERTILIZER_INPUT' | 'TOOLS';
  exchangeType?: string;
  page?: number;
  limit?: number;
}) {
  // Determine radius based on category
  const radiusMap = { WATER: 5, TOOLS: 5, FERTILIZER_INPUT: 50 };
  const radius = radiusMap[params.category] || 15;

  return await prisma.$queryRaw`
    SELECT el.*, u.name as "ownerName",
      (6371 * acos(
        cos(radians(${params.lat})) * cos(radians((el.location->>'lat')::float))
        * cos(radians((el.location->>'lng')::float) - radians(${params.lng}))
        + sin(radians(${params.lat})) * sin(radians((el.location->>'lat')::float))
      )) AS distance
    FROM exchange_listings el
    JOIN users u ON el."userId" = u.id
    WHERE el.category = ${params.category}
      AND el.status = 'ACTIVE'
    HAVING distance < ${radius}
    ORDER BY distance
    LIMIT ${params.limit || 20}
    OFFSET ${((params.page || 1) - 1) * (params.limit || 20)}
  `;
}
```

---

## Village Trust Score

```typescript
// backend/src/services/trustService.ts

// Trust score = weighted average of components (0-100)
// 40% exchange history + 30% verification + 20% community + 10% penalties

export async function recalculateTrustScore(userId: string): Promise<number> {
  const trust = await prisma.villageTrust.findUnique({ where: { userId } });
  if (!trust) return 50;

  // Exchange score (0-100)
  // Based on successful exchanges, completion rate
  const exchangeScore = Math.min(100, Math.max(0,
    50 + (trust.successfulExchanges * 3) - (trust.noShowCount * 10) - (trust.lateReturnCount * 5)
  ));

  // Verification score (0-100)
  // Aadhaar verified: +40, Panchayat verified: +30, Referral: +30
  let verificationScore = 0;
  const member = await prisma.villageCircleMember.findFirst({
    where: { userId, isVerified: true },
  });
  if (member) {
    switch (member.verifiedVia) {
      case 'AADHAAR': verificationScore = 70; break;
      case 'PANCHAYAT': verificationScore = 80; break;
      case 'REFERRAL': verificationScore = 50; break;
    }
  }

  // Community score (0-100)
  const communityScore = Math.min(100, Math.max(0,
    50 + (trust.endorsementCount * 5) + (trust.referralCount * 3)
  ));

  // Penalty deduction
  const penaltyDeduction = (trust.damageReportCount * 15) + (trust.disputeCount * 10);

  // Weighted total
  const totalScore = Math.round(
    (exchangeScore * 0.4) +
    (verificationScore * 0.3) +
    (communityScore * 0.2) -
    (penaltyDeduction * 0.1)
  );

  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Update trust record
  await prisma.villageTrust.update({
    where: { userId },
    data: {
      trustScore: finalScore,
      exchangeScore,
      verificationScore,
      communityScore,
      scoreHistory: {
        push: { date: new Date().toISOString(), score: finalScore, reason: 'Recalculation' },
      },
    },
  });

  return finalScore;
}

// Apply penalties
export async function applyTrustPenalty(userId: string, reason: 'LATE_RETURN' | 'NO_SHOW' | 'DAMAGE' | 'DISPUTE') {
  const fieldMap = {
    LATE_RETURN: 'lateReturnCount',
    NO_SHOW: 'noShowCount',
    DAMAGE: 'damageReportCount',
    DISPUTE: 'disputeCount',
  };

  await prisma.villageTrust.update({
    where: { userId },
    data: { [fieldMap[reason]]: { increment: 1 } },
  });

  await recalculateTrustScore(userId);
}
```

---

## FPO Integration

```typescript
// backend/src/services/fpoService.ts

// FPO Group Account — managed by FPO_ADMIN
export async function createFPOGroupBuy(fpoAdminId: string, circleId: string, data: CreateGroupBuyInput) {
  // Verify FPO admin role
  const admin = await prisma.userRole.findFirst({
    where: { userId: fpoAdminId, role: { name: 'FPO_ADMIN' }, isActive: true },
  });
  if (!admin) throw new Error('Only FPO admins can create group buys');

  const groupBuy = await prisma.groupBuy.create({
    data: {
      circleId,
      organizerId: fpoAdminId,
      productName: data.productName,
      description: data.description,
      images: data.images || [],
      supplierName: data.supplierName,
      supplierContact: data.supplierContact,
      marketPrice: data.marketPrice,
      groupPrice: data.groupPrice,
      discountPercent: ((data.marketPrice - data.groupPrice) / data.marketPrice) * 100,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      enrollmentDeadline: data.enrollmentDeadline,
      deliveryDate: data.deliveryDate,
    },
  });

  // Notify all circle members
  const members = await prisma.villageCircleMember.findMany({
    where: { circleId, isActive: true },
  });

  for (const member of members) {
    await queueNotification({
      userId: member.userId,
      type: 'GROUP_BUY_CREATED',
      title: {
        en: `Group Buy: ${data.productName.en}`,
        te: `గ్రూప్ కొనుగోలు: ${data.productName.te}`,
        hi: `सामूहिक खरीद: ${data.productName.hi}`,
      },
      body: {
        en: `Save ${Math.round(groupBuy.discountPercent)}%! ${data.minQuantity} units needed. Enroll by ${new Date(data.enrollmentDeadline).toLocaleDateString()}.`,
        te: `${Math.round(groupBuy.discountPercent)}% ఆదా! ${data.minQuantity} యూనిట్లు అవసరం.`,
        hi: `${Math.round(groupBuy.discountPercent)}% बचत! ${data.minQuantity} यूनिट चाहिए।`,
      },
      channels: ['PUSH', 'IN_APP'],
    });
  }

  return groupBuy;
}

// Participate in group buy
export async function joinGroupBuy(userId: string, groupBuyId: string, quantity: number) {
  const groupBuy = await prisma.groupBuy.findUnique({ where: { id: groupBuyId } });
  if (!groupBuy || groupBuy.status === 'CANCELLED' || groupBuy.status === 'COMPLETED') {
    throw new Error('Group buy not available');
  }
  if (new Date() > groupBuy.enrollmentDeadline) throw new Error('Enrollment deadline passed');
  if (groupBuy.maxQuantity && (groupBuy.currentQuantity + quantity) > groupBuy.maxQuantity) {
    throw new Error('Exceeds maximum quantity');
  }

  const amount = quantity * groupBuy.groupPrice;

  await prisma.groupBuyParticipant.create({
    data: { groupBuyId, userId, quantity, amount },
  });

  const newQuantity = groupBuy.currentQuantity + quantity;
  const newStatus = newQuantity >= groupBuy.minQuantity ? 'MIN_REACHED' : 'OPEN';

  await prisma.groupBuy.update({
    where: { id: groupBuyId },
    data: {
      currentQuantity: newQuantity,
      participantCount: { increment: 1 },
      status: newStatus,
    },
  });

  if (newStatus === 'MIN_REACHED' && groupBuy.status !== 'MIN_REACHED') {
    // Notify all participants — minimum reached, buying will proceed
    await notifyGroupBuyMinReached(groupBuyId);
  }

  return { amount, currentQuantity: newQuantity, status: newStatus };
}

// FPO Admin Dashboard data
export async function getFPODashboard(fpoAdminId: string, organizationId: string) {
  const [members, activeGroupBuys, totalSavings, sharedEquipment] = await Promise.all([
    prisma.userRole.count({
      where: { organizationId, isActive: true },
    }),
    prisma.groupBuy.count({
      where: { organizerId: fpoAdminId, status: { in: ['OPEN', 'MIN_REACHED', 'PURCHASING'] } },
    }),
    prisma.groupBuyParticipant.aggregate({
      where: { groupBuy: { organizerId: fpoAdminId, status: 'COMPLETED' } },
      _sum: { amount: true },
    }),
    prisma.exchangeListing.count({
      where: { userId: fpoAdminId, exchangeType: { in: ['LEND_FREE', 'SHARE_SCHEDULE'] } },
    }),
  ]);

  return { members, activeGroupBuys, totalSavings: totalSavings._sum.amount || 0, sharedEquipment };
}
```

---

## Dispute Resolution

```typescript
// backend/src/services/disputeService.ts

// Tier-based resolution
export async function createDispute(params: CreateDisputeInput) {
  // Determine initial tier based on amount and category
  let tier = 2; // Default: support review

  if (params.category === 'PAYMENT_DISPUTE') {
    const amount = await getDisputeAmount(params);
    if (amount && amount < 500) tier = 1; // Auto-resolve small amounts
  }

  const dispute = await prisma.dispute.create({
    data: {
      type: params.type,
      bookingId: params.bookingId,
      exchangeRequestId: params.exchangeRequestId,
      paymentId: params.paymentId,
      raisedBy: params.userId,
      againstUserId: params.againstUserId,
      category: params.category,
      title: params.title,
      description: params.description,
      evidence: params.evidence || [],
      tier,
      status: tier === 1 ? 'UNDER_REVIEW' : 'OPEN',
    },
  });

  // Tier 1: Auto-resolve
  if (tier === 1) {
    await autoResolveDispute(dispute.id);
  }

  // Notify the other party
  await queueNotification({
    userId: params.againstUserId,
    type: 'DISPUTE_RAISED',
    title: { en: 'Dispute Raised', te: 'వివాదం', hi: 'विवाद' },
    body: {
      en: `A dispute has been raised regarding: ${params.title}. Please respond within 48 hours.`,
      te: `వివాదం లేవనెత్తబడింది: ${params.title}. 48 గంటల్లో స్పందించండి.`,
      hi: `विवाद उठाया गया: ${params.title}. 48 घंटे में जवाब दें।`,
    },
    channels: ['PUSH', 'SMS', 'IN_APP'],
  });

  // Apply trust penalty
  await applyTrustPenalty(params.againstUserId, 'DISPUTE');

  return dispute;
}

// Auto-resolve for Tier 1 (small amounts, clear-cut cases)
async function autoResolveDispute(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });

  // Auto-refund for amounts < INR 500
  if (dispute.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: dispute.bookingId } });
    if (booking && booking.totalAmount < 500) {
      await processRefund(booking.id, booking.totalAmount, 'Auto-resolved dispute');
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution: { type: 'REFUND', amount: booking.totalAmount, notes: 'Auto-resolved: amount under INR 500' },
          resolvedAt: new Date(),
          resolvedBy: 'SYSTEM',
        },
      });
    }
  }
}

// Escalation timeline
// Tier 2: If unresolved in 48h → escalate to Tier 3
// Tier 3: If unresolved in 7 days → escalate to Tier 4 (insurance)
export async function checkDisputeEscalation() {
  const staleDisputes = await prisma.dispute.findMany({
    where: {
      status: { in: ['OPEN', 'UNDER_REVIEW'] },
      OR: [
        { tier: 2, createdAt: { lt: subHours(new Date(), 48) } },
        { tier: 3, createdAt: { lt: subDays(new Date(), 7) } },
      ],
    },
  });

  for (const dispute of staleDisputes) {
    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        tier: dispute.tier + 1,
        status: 'ESCALATED',
        messages: {
          push: {
            userId: 'SYSTEM',
            message: `Dispute escalated to Tier ${dispute.tier + 1} due to resolution timeline exceeded`,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });
  }
}
```

---

## KARZA/IDfy eKYC Integration

```typescript
// backend/src/services/ekycService.ts
// Replace manual KYC from Phase 1 with automated eKYC

// KARZA API for Aadhaar verification
export async function verifyAadhaar(aadhaarNumber: string, otp: string): Promise<{
  verified: boolean;
  name: string;
  dob: string;
  address: string;
  photo: string;
}> {
  const response = await fetch('https://api.karza.in/v3/aadhaar-verification', {
    method: 'POST',
    headers: {
      'x-karza-key': process.env.KARZA_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aadhaar_no: aadhaarNumber,
      otp,
      consent: 'Y',
    }),
  });

  const data = await response.json();
  return {
    verified: data.status === 'success',
    name: data.result?.name,
    dob: data.result?.dob,
    address: data.result?.address,
    photo: data.result?.photo, // Base64 encoded
  };
}

// IDfy for PAN verification
export async function verifyPAN(panNumber: string): Promise<{
  verified: boolean;
  name: string;
  status: string;
}> {
  const response = await fetch('https://eve.idfy.com/v3/tasks/async/verify_with_source/ind_pan', {
    method: 'POST',
    headers: {
      'api-key': process.env.IDFY_API_KEY!,
      'account-id': process.env.IDFY_ACCOUNT_ID!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task_id: `pan_${Date.now()}`,
      group_id: 'kisanconnect',
      data: { id_number: panNumber },
    }),
  });

  const data = await response.json();
  return {
    verified: data[0]?.result?.source_output?.status === 'Active',
    name: data[0]?.result?.source_output?.name,
    status: data[0]?.result?.source_output?.status,
  };
}

// Bank account verification via penny drop
export async function verifyBankAccount(accountNumber: string, ifsc: string): Promise<{
  verified: boolean;
  accountName: string;
}> {
  const response = await fetch('https://api.karza.in/v3/bank-verification', {
    method: 'POST',
    headers: {
      'x-karza-key': process.env.KARZA_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_number: accountNumber,
      ifsc,
      consent: 'Y',
    }),
  });

  const data = await response.json();
  return {
    verified: data.status === 'success',
    accountName: data.result?.accountName,
  };
}
```

---

## Reviews System

### Minimum Display Threshold
```typescript
// Reviews are not publicly displayed until a target has at least 3 verified reviews
// This prevents manipulation and ensures statistical significance

export async function getReviewSummary(targetType: string, targetId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetType, targetId, isHidden: false },
  });

  const totalReviews = reviews.length;
  const displayThreshold = 3;

  if (totalReviews < displayThreshold) {
    return {
      totalReviews,
      canDisplay: false,
      message: `${displayThreshold - totalReviews} more reviews needed before ratings are shown`,
    };
  }

  const avgOverall = reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
  const avgPunctuality = reviews.filter(r => r.punctualityRating).reduce((sum, r) => sum + r.punctualityRating!, 0) / reviews.filter(r => r.punctualityRating).length || 0;
  const avgQuality = reviews.filter(r => r.qualityRating).reduce((sum, r) => sum + r.qualityRating!, 0) / reviews.filter(r => r.qualityRating).length || 0;
  const avgCommunication = reviews.filter(r => r.communicationRating).reduce((sum, r) => sum + r.communicationRating!, 0) / reviews.filter(r => r.communicationRating).length || 0;
  const avgValue = reviews.filter(r => r.valueRating).reduce((sum, r) => sum + r.valueRating!, 0) / reviews.filter(r => r.valueRating).length || 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: reviews.filter(r => r.overallRating === star).length,
    percent: Math.round((reviews.filter(r => r.overallRating === star).length / totalReviews) * 100),
  }));

  return {
    totalReviews,
    canDisplay: true,
    averageRating: Math.round(avgOverall * 10) / 10,
    subRatings: {
      punctuality: Math.round(avgPunctuality * 10) / 10,
      quality: Math.round(avgQuality * 10) / 10,
      communication: Math.round(avgCommunication * 10) / 10,
      value: Math.round(avgValue * 10) / 10,
    },
    ratingDistribution,
    photoReviewCount: reviews.filter(r => r.images.length > 0).length,
  };
}
```

---

## API Endpoints

### Village Circles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/circles/join` | Auth | Join or create nearest circle |
| GET | `/api/circles/me` | Auth | Get user's circles |
| GET | `/api/circles/:id` | Member | Circle details + members |
| GET | `/api/circles/:id/feed` | Member | Exchange listings feed |

### Exchange Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/exchange` | Auth | Create exchange listing |
| GET | `/api/exchange` | Auth | Search listings (geo-filtered) |
| GET | `/api/exchange/:id` | Auth | Listing details |
| PUT | `/api/exchange/:id` | Owner | Update listing |
| DELETE | `/api/exchange/:id` | Owner | Cancel listing |
| POST | `/api/exchange/:id/request` | Auth | Request to buy/rent/barter |
| PUT | `/api/exchange/requests/:id` | Owner | Accept/reject request |

### Trust Score

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trust/:userId` | Auth | Get user's trust score |
| GET | `/api/trust/me` | Auth | Get own trust details |
| POST | `/api/trust/:userId/endorse` | Auth | Endorse a community member |

### Group Buy

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/group-buy` | FPO_ADMIN/Auth | Create group buy |
| GET | `/api/group-buy` | Auth | List group buys in circle |
| GET | `/api/group-buy/:id` | Auth | Group buy details + participants |
| POST | `/api/group-buy/:id/join` | Auth | Join group buy |
| PUT | `/api/group-buy/:id/status` | FPO_ADMIN | Update status (purchasing, distributing) |

### Water Schedule

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/water-schedule/:circleId` | Member | Get water schedule |
| POST | `/api/water-schedule` | Auth | Create/update schedule |
| PUT | `/api/water-schedule/:id` | Owner/Admin | Modify time slot |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | Auth | Submit review |
| GET | `/api/reviews/:targetType/:targetId` | Public | Get reviews for target |
| POST | `/api/reviews/:id/respond` | Provider | Provider response |
| POST | `/api/reviews/:id/report` | Auth | Report review |
| POST | `/api/reviews/:id/helpful` | Auth | Mark as helpful |

### Disputes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/disputes` | Auth | Raise dispute |
| GET | `/api/disputes` | Auth | My disputes |
| GET | `/api/disputes/:id` | Participant/Admin | Dispute details |
| POST | `/api/disputes/:id/message` | Participant | Add message to dispute |
| PUT | `/api/disputes/:id/resolve` | ADMIN/SUPPORT | Resolve dispute |

---

## Industry Comparison

| Feature | DeHaat | AgroStar | Arya.ag | KisanConnect (Ours) |
|---------|--------|----------|---------|---------------------|
| Village community | No | No | No | Yes — geo-fenced circles |
| P2P exchange | No | No | No | Yes — 6 transaction types |
| Water sharing | No | No | No | Yes — schedule-based |
| Group buying | No | No | Yes (post-harvest) | Yes — FPO-organized, all inputs |
| Trust score | No | No | No | Yes — 0-100 with verification |
| Barter system | No | No | No | Yes — trade item for item |
| Automated eKYC | No | No | No | Yes — KARZA/IDfy |
| Dispute resolution | Basic | Basic | Basic | Tiered — auto → support → escalation → insurance |
| Multi-dimensional reviews | No | No | No | Yes — 4 sub-ratings + photos |

---

## Testing Checklist

- [ ] **Geo-Fencing**: Create listing → visible within configured radius; invisible beyond radius
- [ ] **Geo-Fencing**: Tool listing visible within 5km; input listing visible within 50km
- [ ] **Trust Score**: New user starts at 50; verified user increases to 70+
- [ ] **Trust Score**: Late return penalty decreases score; successful exchange increases
- [ ] **Trust Score**: Score recalculation produces consistent results
- [ ] **Barter Matching**: List item for barter → matching request accepted → both items exchanged
- [ ] **Group Buy Lifecycle**: Create → participants join → min reached → purchasing → distributing → completed
- [ ] **Group Buy**: Enrollment after deadline → rejected
- [ ] **Group Buy**: Exceeding max quantity → rejected
- [ ] **Group Buy**: Min not reached by deadline → cancelled with refunds
- [ ] **Water Schedule**: Create schedule → no overlapping slots for same resource
- [ ] **Water Schedule**: Conflict detection when same time slot requested by two users
- [ ] **Review Display**: Less than 3 reviews → ratings not displayed publicly
- [ ] **Review Display**: 3+ reviews → average ratings displayed correctly
- [ ] **Review**: Photo review uploads and displays correctly
- [ ] **Review**: Provider response attached to review
- [ ] **Dispute Tier 1**: Amount < INR 500 → auto-resolved with refund
- [ ] **Dispute Tier 2**: Unresolved after 48h → escalated to Tier 3
- [ ] **Dispute Tier 3**: Unresolved after 7 days → escalated to Tier 4
- [ ] **eKYC**: Aadhaar verification via KARZA returns verified status
- [ ] **eKYC**: PAN verification via IDfy returns active status
- [ ] **eKYC**: Bank account penny drop verification works
- [ ] **Circle Membership**: User joins multiple circles → sees listings from all circles
- [ ] **FPO Dashboard**: Admin sees correct member count, active group buys, total savings

---

## Files to Create/Modify

### New Files
```
backend/src/routes/circles.ts               # Village circle management
backend/src/routes/exchange.ts              # Exchange listing CRUD + requests
backend/src/routes/trust.ts                 # Trust score retrieval + endorsements
backend/src/routes/groupBuy.ts              # Group buy CRUD + participation
backend/src/routes/waterSchedule.ts         # Water schedule management
backend/src/routes/reviews.ts               # Review CRUD + moderation
backend/src/routes/disputes.ts              # Dispute lifecycle
backend/src/services/circleService.ts       # Circle geo-logic
backend/src/services/exchangeService.ts     # Exchange listing logic
backend/src/services/trustService.ts        # Trust score calculation
backend/src/services/fpoService.ts          # FPO group buy + dashboard
backend/src/services/reviewService.ts       # Review aggregation + display
backend/src/services/disputeService.ts      # Dispute resolution + escalation
backend/src/services/ekycService.ts         # KARZA/IDfy eKYC integration
backend/src/workers/disputeEscalation.ts    # Cron: check dispute escalation timelines
backend/src/workers/groupBuyDeadline.ts     # Cron: check enrollment deadlines
packages/shared/types/exchange.ts           # Exchange TypeScript types
packages/shared/types/trust.ts              # Trust score types
packages/shared/types/review.ts             # Review types
mobile/src/screens/exchange/CircleFeedScreen.tsx    # Village circle feed
mobile/src/screens/exchange/ExchangeListingScreen.tsx # Create/view exchange
mobile/src/screens/exchange/GroupBuyScreen.tsx       # Group buy details
mobile/src/screens/exchange/WaterScheduleScreen.tsx  # Water schedule
mobile/src/screens/exchange/TrustProfileScreen.tsx   # Trust score view
mobile/src/screens/reviews/ReviewListScreen.tsx      # Reviews for a target
mobile/src/screens/reviews/WriteReviewScreen.tsx     # Write review form
mobile/src/screens/disputes/DisputeScreen.tsx        # Raise/view dispute
web/src/pages/exchange/index.tsx                     # Exchange marketplace
web/src/pages/exchange/groups/index.tsx              # Group buy listing
web/src/pages/fpo/dashboard.tsx                      # FPO admin dashboard
```

### Modified Files
```
backend/prisma/schema.prisma                # Add all new models
backend/src/index.ts                        # Mount new routes
backend/src/services/kycService.ts          # Replace manual KYC with eKYC calls
backend/src/routes/providers.ts             # Update KYC endpoints to use eKYC
mobile/src/navigation/AppNavigator.tsx      # Add exchange/review/dispute screens
web/src/components/layout/Sidebar.tsx       # Add exchange/community nav items
```

---

## Definition of Done

- [ ] Village circles auto-created based on user location with geo-fencing
- [ ] Exchange listings support all 6 transaction types (sell, rent, barter, lend, group buy, share schedule)
- [ ] Geo-filtered search returns listings within category-appropriate radius
- [ ] Trust score calculated from exchange history, verification, and community signals
- [ ] FPO group buying works end-to-end with discount tracking
- [ ] Water schedule prevents conflicting time slots
- [ ] Reviews display only after 3+ verified reviews with multi-dimensional ratings
- [ ] Dispute resolution follows tier system with automatic escalation
- [ ] KARZA/IDfy eKYC replaces manual verification
- [ ] All frontend screens functional for farmers, FPO admins, and community members
