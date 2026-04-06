# Phase 11: Monetization Engine

**Timeline:** Weeks 46–49
**Dependencies:** Phase 10 (Schemes & Advisory) complete, Razorpay fully operational (Phase 3)

---

## Objective

Build the revenue engine with 6 distinct revenue streams: marketplace commissions, vendor subscriptions, farmer packages, financial services, data analytics, and advertising/sponsored listings.

---

## 6 Revenue Streams

### 1. Marketplace Commission

| Category | Commission Rate | Avg Booking Value | Commission/Booking |
|----------|----------------|-------------------|-------------------|
| Machinery rental | 10–12% | INR 3,000 | INR 300–360 |
| Labor booking | 8–10% | INR 1,500 | INR 120–150 |
| Transport | 10–15% | INR 2,000 | INR 200–300 |
| Agri inputs | 5–8% | INR 1,000 | INR 50–80 |
| Professional services | 15–20% | INR 500 | INR 75–100 |
| Drone services | 12–15% | INR 2,500 | INR 300–375 |
| Livestock | 8% | INR 15,000 | INR 1,200 |

Commission deducted at payout — farmer pays listed price, vendor receives price minus commission.

### 2. Vendor Subscriptions

| Tier | Price | Features |
|------|-------|----------|
| **Free** | INR 0 | 3 active listings, 5 bookings/month, basic profile |
| **Pro** | INR 299/month | Unlimited listings, priority in search, analytics dashboard, verified badge |
| **Business** | INR 999/month | Pro + promoted listings, API access, bulk booking management, dedicated support |

Razorpay Subscriptions API for recurring billing. Auto-renewal with 3-day grace period.

### 3. Farmer Packages

| Package | Price | Includes |
|---------|-------|----------|
| **Kharif** (Jun–Oct) | INR 199/season | Priority booking, weather alerts, crop advisory, 1 free soil test |
| **Rabi** (Oct–Mar) | INR 199/season | Same for Rabi season |
| **Annual** | INR 349/year | Both seasons + disease scanning + satellite NDVI monitoring |
| **FPO Group** | INR 199/member/year | All annual benefits + 15% group discount on bookings |

### 4. Financial Services

- KCC loan application assistance → referral fee from banks (INR 200-500/application)
- Booking-level insurance → INR 50/booking, partnered with ICICI Lombard / Bajaj Allianz
- Warehouse receipt financing → commission on loan facilitation
- PMFBY enrollment assistance → per-application fee
- Equipment loan facilitation → referral commission

### 5. Data & Analytics (B2B)

- Agri-input companies: demand forecasting by region, crop, season
- Government: farmer activity analytics, scheme utilization
- Banks/NBFCs: creditworthiness signals based on booking/payment history
- Insurance: risk profiling data for crop insurance pricing
- Pricing: SaaS subscription INR 50K–5L/month based on data scope

### 6. Advertising & Partnerships

- Seasonal input brand promotions (pesticide/fertilizer companies during spray season)
- Equipment manufacturer partnerships (tractor brands during sowing)
- Sponsored vendor listings (pay-per-click or pay-per-impression)
- Government scheme awareness campaigns (paid by government bodies)

---

## Revenue Projections (Revised — Scalability Audit Corrected)

| Year | Revenue | Vendors | Bookings | Key Drivers |
|------|---------|---------|----------|-------------|
| Year 1 | INR 25L | 1K (500 Pro) | 10K | Vendor subscriptions + commissions |
| Year 2 | INR 3Cr | 5K | 100K | + Farmer packages + financial services |
| Year 3 | INR 15Cr | 20K | 500K | + Data analytics + advertising |
| Year 5 | INR 80Cr | 100K | 2M | + Fintech + ONDC + B2B data |

---

## Database Schema

```prisma
model Subscription {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  planId                String
  plan                  SubscriptionPlan @relation(fields: [planId], references: [id])
  status                SubscriptionStatus @default(ACTIVE)
  startDate             DateTime
  endDate               DateTime
  razorpaySubscriptionId String? @unique
  autoRenew             Boolean  @default(true)
  cancelledAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model SubscriptionPlan {
  id             String   @id @default(cuid())
  name           String
  type           PlanType // VENDOR_FREE, VENDOR_PRO, VENDOR_BUSINESS, FARMER_KHARIF, FARMER_RABI, FARMER_ANNUAL, FPO_GROUP
  price          Decimal  @db.Decimal(10, 2)
  billingPeriod  BillingPeriod // MONTHLY, SEASONAL, ANNUAL
  features       Json     // { maxListings: 3, prioritySearch: false, analytics: false, ... }
  limits         Json     // { maxBookingsPerMonth: 5, maxImages: 3, ... }
  isActive       Boolean  @default(true)
  subscriptions  Subscription[]
  createdAt      DateTime @default(now())
}

model Commission {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  paymentId   String?
  categoryId  String
  rate        Decimal  @db.Decimal(5, 2) // e.g., 10.00 for 10%
  amount      Decimal  @db.Decimal(15, 4)
  status      CommissionStatus @default(PENDING) // PENDING, COLLECTED, DISPUTED
  collectedAt DateTime?
  createdAt   DateTime @default(now())
}

model SponsoredListing {
  id              String   @id @default(cuid())
  serviceListingId String
  providerId      String
  budgetTotal     Decimal  @db.Decimal(10, 2)
  budgetSpent     Decimal  @db.Decimal(10, 2) @default(0)
  costPerClick    Decimal  @db.Decimal(6, 2)
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model Referral {
  id          String   @id @default(cuid())
  referrerId  String
  referrer    User     @relation("referrer", fields: [referrerId], references: [id])
  refereeId   String?
  referee     User?    @relation("referee", fields: [refereeId], references: [id])
  code        String   @unique
  reward      Json     // { referrerReward: 50, refereeReward: 25, type: "wallet_credit" }
  status      ReferralStatus @default(PENDING)
  completedAt DateTime?
  createdAt   DateTime @default(now())
}

enum SubscriptionStatus { ACTIVE, EXPIRED, CANCELLED, PAST_DUE }
enum PlanType { VENDOR_FREE, VENDOR_PRO, VENDOR_BUSINESS, FARMER_KHARIF, FARMER_RABI, FARMER_ANNUAL, FPO_GROUP }
enum BillingPeriod { MONTHLY, SEASONAL, ANNUAL }
enum CommissionStatus { PENDING, COLLECTED, DISPUTED }
enum ReferralStatus { PENDING, COMPLETED, EXPIRED }
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subscriptions/plans` | List available plans | Public |
| POST | `/api/subscriptions` | Subscribe to a plan | Yes |
| GET | `/api/subscriptions/me` | My active subscription | Yes |
| PUT | `/api/subscriptions/:id/cancel` | Cancel subscription | Yes |
| POST | `/api/subscriptions/webhook` | Razorpay subscription webhook | Signature |
| GET | `/api/commissions` | Commission history (admin) | Admin |
| GET | `/api/commissions/vendor/:id` | Vendor's commission history | Yes |
| POST | `/api/sponsored` | Create sponsored listing | Yes |
| GET | `/api/sponsored/:id/stats` | Sponsored listing performance | Yes |
| PUT | `/api/sponsored/:id` | Update budget/dates | Yes |
| POST | `/api/referrals/generate` | Generate referral code | Yes |
| POST | `/api/referrals/redeem` | Redeem referral code | Yes |
| GET | `/api/referrals/me` | My referral stats | Yes |

---

## Implementation Details

### Commission Engine
- On booking completion, calculate commission based on category rate
- Deduct from payout amount before releasing to vendor
- Track in Commission table for audit + tax compliance
- Admin can adjust rates per category via admin panel

### Subscription Lifecycle
1. User selects plan → create Razorpay subscription
2. Razorpay charges recurring → webhook updates status
3. Grace period: 3 days after failed payment → retry
4. After grace: downgrade to Free tier, preserve data
5. Upgrade: prorate remaining days, charge difference

### Sponsored Listings Algorithm
- Boosted listings appear in top 3 of search results
- Charged per click (CPC) model
- Daily budget cap prevents overspend
- Click deduplication: same user, same listing, within 1 hour = 1 click

---

## Testing Checklist

- [ ] Commission calculated correctly for each category rate
- [ ] Commission deducted from vendor payout, not charged to farmer
- [ ] Subscription creation via Razorpay succeeds
- [ ] Subscription renewal webhook processes correctly
- [ ] Failed payment → grace period → downgrade lifecycle
- [ ] Subscription cancellation stops future charges
- [ ] Sponsored listing appears in search results when active
- [ ] CPC charges deducted from budget correctly
- [ ] Budget exhaustion deactivates sponsored listing
- [ ] Referral code generation and redemption flow
- [ ] Referral rewards credited to both parties' wallets
- [ ] Admin can view and adjust commission rates
- [ ] Revenue dashboard shows accurate totals by stream
