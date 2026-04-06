# KisanConnect — Master Implementation Plan

> **Last Updated:** April 2026 — v2.0 incorporating scalability audit corrections

## Scalability Audit Corrections (v2.0)

The following corrections from the cross-check & scalability analysis have been applied:

| Original Assumption | Correction Applied |
|--------------------|--------------------|
| DigiLocker/UIDAI eKYC in Phase 1 | Phase 1: manual KYC → Phase 3: KARZA/IDfy → Phase 6+: direct UIDAI (AUA licence takes 3-6 months) |
| Bhashini API for all voice features | Bhashini for TTS/translate only. Sarvam AI ASR for voice input (better agri-term accuracy) |
| OpenWeatherMap → IMD immediate | Keep OpenWeatherMap for MVP. IMD licensing in Phase 5 (requires formal agreement) |
| Revenue Year 1: INR 50L | Revised to INR 25L (math corrected: 500 Pro vendors × INR 3,588 + 10K bookings × INR 150 commission) |
| Decimal fields without precision | All currency fields: `@db.Decimal(15,4)`, user-facing prices: `@db.Decimal(10,2)` |
| Mapbox/Sentinel Hub in current stack | Moved to Phase 7. Free tier initially |
| TimescaleDB as separate instance | Start as PostgreSQL extension, separate after 6 months |
| TDS 194-O not in data model | Added TaxProfile model (PAN, GSTIN, TDS tracking) to Phase 3 |
| No observability | Added Sentry + Pino + BetterStack to Phase 0 as non-negotiable |
| No caching layer | Added Redis (Upstash) with TTL patterns to Phase 0 |
| No async job queue | Added BullMQ + Redis workers to Phase 0 |
| No connection pooling | Added Neon pooling mode + Prisma connection_limit=5 |
| Mixpanel for analytics | Changed to PostHog (open-source, self-hostable, cheaper at scale) |

---

## Project Vision

KisanConnect is an all-in-one agriculture super-app for Indian farmers, vendors, laborers, and FPOs. It combines market intelligence, service marketplace, labor booking, village resource exchange, livestock services, government scheme access, and community features — all in one platform that works offline in 10+ Indian languages.

---

## Market Context (2025-2026)

| Metric | Value | Source |
|--------|-------|--------|
| Indian Agritech Market | $974M (2025) | IMARC Group |
| Projected Size | $2.5B by 2034 (10.6% CAGR) | IMARC |
| Addressable Market | $34B by 2027 (50% CAGR) | Avendus Capital |
| Active AgriTech Companies | 3,839 | Tracxn |
| Total Funding Raised | $6.44B across 735 companies | Tracxn |
| 2024 Funding | $392M across 105 rounds | Entrackr |
| Rural UPI Adoption | 40%+ from rural/semi-urban | NPCI |
| Smartphone Penetration (Rural) | 60%+ (2025) | TRAI |

### Competitive Landscape

| Company | Funding | Users | Core Focus | Gap KisanConnect Fills |
|---------|---------|-------|------------|----------------------|
| DeHaat | $222M | 12M farmers | Full-stack inputs + advisory | No service marketplace, no labor |
| AgroStar | $140M+ | 10M farmers | AI agronomy + input e-commerce | No booking, no community |
| Ninjacart | $417M+ | 17K stores | B2B produce supply chain | B2B only, no farmer tools |
| Arya.ag | $200M+ | 12K warehouses | Post-harvest + finance (profitable) | Post-harvest only |
| BharatAgri | $4.3M | 10M monthly | AI advisory + inputs | No marketplace, no booking |
| Plantix | $7.3M | 20M downloads | Disease detection | Single feature |
| Trringo | Corporate | 15M farmers | Tractor rental | Machinery only, no multi-service |
| EM3 AgriServices | $7M+ | Scaled | Pay-per-use machinery | Hub-and-spoke, not platform |

### White Space (What Nobody Has Built)
1. **Unified Service Marketplace** — No platform combines machinery + labor + drones + livestock + inputs
2. **Agricultural Labor Marketplace** — Zero scaled digital platforms for farm labor booking
3. **Village Resource Exchange** — No P2P resource sharing within villages
4. **Voice-First Multi-Language** — Most apps are Hindi/English only, no voice navigation
5. **Offline-First Booking** — No competitor handles bookings without internet

---

## Apps Architecture Decision

### Strategy: 2 Mobile Apps + 1 Web Admin + 1 PWA

| App | Target Users | Why Separate |
|-----|-------------|--------------|
| **KisanConnect Farmer** (Mobile) | Farmers, FPO members, consumers | Primary consumer app — browse services, book, buy, sell, community. Lightweight (<15MB). Voice-first. Offline-capable. |
| **KisanConnect Partner** (Mobile) | Vendors, machinery owners, labor teams, drone operators, input dealers, transport providers | Completely different UX — manage listings, calendar, earnings, KYC, order management. Heavy calendar/scheduling features. |
| **KisanConnect Admin** (Web) | Platform admins, support, government officers, FPO admins | Dashboard, user management, analytics, dispute resolution, content moderation, scheme management. Desktop-first. |
| **KisanConnect Lite** (PWA) | Farmers without app install | Lightweight web version for quick price checks, booking, WhatsApp-redirected flows. No install required. |

### Why NOT a Single Super-App
- **APK Size**: Combined app would be 40-60MB. Rural India needs <15MB
- **UX Clarity**: Farmer needs are opposite to vendor needs. One combined UI = confusion for illiterate users
- **Performance**: Vendor calendar, earnings, order management adds weight farmers don't need
- **Offline Strategy**: Different offline needs — farmer caches prices/weather, vendor caches bookings/calendar
- **Store Discoverability**: "Farmer App" and "Partner App" are separate search intents

### How to Handle Dual Roles (Farmer + Tractor Owner)
A user who is BOTH a farmer AND a vendor:
- Has ONE account (same mobile number, same Aadhaar)
- Downloads BOTH apps
- Same JWT token works in both apps (shared auth)
- Backend recognizes all assigned roles
- No data duplication — single User record with multiple role assignments

### Code Sharing Strategy (Monorepo)
```
kisanconnect/
├── packages/
│   ├── shared/              # Shared across all apps
│   │   ├── types/           # TypeScript types, API contracts
│   │   ├── utils/           # Validators, formatters, constants
│   │   ├── api-client/      # Axios/fetch wrapper, API hooks
│   │   └── i18n/            # Translation strings (10+ languages)
│   ├── mobile-core/         # Shared RN components
│   │   ├── components/      # Button, Input, Card, Modal
│   │   ├── hooks/           # useAuth, useLocation, useOffline
│   │   ├── navigation/      # Common nav patterns
│   │   └── theme/           # Colors, typography, spacing
│   ├── farmer-app/          # Farmer mobile app
│   ├── partner-app/         # Vendor/labor mobile app
│   ├── admin-web/           # Next.js admin dashboard
│   ├── pwa/                 # Progressive Web App
│   └── backend/             # Express.js API (existing)
├── pnpm-workspace.yaml
└── package.json
```

---

## RBAC (Role-Based Access Control) System

### Role Hierarchy

```
SUPER_ADMIN
├── PLATFORM_ADMIN
│   ├── SUPPORT_AGENT
│   └── CONTENT_MODERATOR
├── GOVERNMENT_OFFICER (state/district level)
├── FPO_ADMIN
│   └── FPO_MEMBER
├── VENDOR
│   ├── MACHINERY_OWNER
│   ├── INPUT_DEALER
│   ├── DRONE_OPERATOR
│   ├── TRANSPORTER
│   └── PROFESSIONAL (vet, agronomist, soil tester)
├── LABOR
│   ├── TEAM_LEADER
│   └── INDIVIDUAL_WORKER
├── FARMER (default role for all registrations)
├── TRADER
├── DEALER
└── CORPORATE
```

### Permission System

#### Resource-Permission Matrix
Each permission is: `resource:action`

```
RESOURCES: users, listings, bookings, services, payments, reviews, disputes,
           community, news, schemes, prices, weather, calendar, exchange,
           jobs, bids, teams, attendance, reports, settings

ACTIONS: create, read, update, delete, approve, export, manage
```

#### Role-Permission Mapping (Examples)

| Permission | Farmer | Vendor | Labor | FPO Admin | Platform Admin |
|-----------|--------|--------|-------|-----------|---------------|
| `listings:create` | Own | Own | — | Members' | All |
| `bookings:create` | Own | — | — | Members' | All |
| `bookings:read` | Own | Assigned | Assigned | Members' | All |
| `services:create` | — | Own | Own | — | All |
| `payments:read` | Own | Own | Own | Members' | All |
| `reviews:create` | Own bookings | — | — | — | All |
| `disputes:create` | Own | Own | Own | Members' | All |
| `disputes:resolve` | — | — | — | — | Yes |
| `users:manage` | — | — | — | Members | All |
| `reports:export` | — | — | — | Own | All |
| `settings:manage` | — | — | — | — | Yes |

#### Custom Role Builder
Platform admins can create custom roles:
```json
{
  "name": "District Agriculture Officer",
  "description": "Government officer with read access to district data",
  "permissions": [
    "users:read:district",
    "bookings:read:district",
    "reports:export:district",
    "schemes:manage",
    "news:create"
  ],
  "scope": {
    "type": "geographic",
    "level": "district",
    "values": ["Warangal", "Karimnagar"]
  }
}
```

#### Row-Level Security
- **Farmer**: Sees own data only
- **Vendor**: Sees own listings + assigned bookings
- **Team Leader**: Sees own team members + bookings
- **FPO Admin**: Sees all members within FPO
- **District Officer**: Sees all users/data within district
- **State Admin**: Sees all data within state
- **Super Admin**: Sees everything

---

## Phase-by-Phase Implementation

### Phase 0: Foundation & RBAC (Weeks 1-3)
**File:** `01-PHASE-0-FOUNDATION.md`
- RBAC system with Role, Permission, RolePermission models
- Custom role builder API
- JWT with embedded roles/permissions
- Auth middleware with permission checks
- User role assignment and multi-role support

### Phase 1: Service Provider Platform (Weeks 4-7)
**File:** `02-PHASE-1-SERVICE-PROVIDERS.md`
- Vendor onboarding & KYC
- Service listing CRUD
- Service categories (machinery, drones, inputs, transport, professional)
- Equipment details & photos
- Pricing models (per hour/day/acre/unit)
- Vendor profile & dashboard

### Phase 2: Booking & Calendar Engine (Weeks 8-11)
**File:** `03-PHASE-2-BOOKING-CALENDAR.md`
- Availability calendar system
- Slot-based booking (half-day/full-day)
- Day-based booking (multi-day for machinery)
- Calendar blocking with transit/maintenance buffers
- Booking status state machine
- SMS/WhatsApp confirmations
- Recurring bookings

### Phase 3: Payment Integration (Weeks 12-15)
**File:** `04-PHASE-3-PAYMENTS.md`
- Razorpay integration (UPI, escrow)
- Payment escrow flow (hold → confirm → release)
- Advance + balance payment model
- In-app wallet
- Vendor payouts (weekly/daily)
- GST invoicing
- Earnings dashboard
- Refund handling

### Phase 4: Labor Marketplace (Weeks 16-19)
**File:** `05-PHASE-4-LABOR-MARKETPLACE.md`
- Individual worker profiles
- Team management (leader + members)
- Job posting by farmers (reverse marketplace)
- Bidding system
- QR attendance with GPS verification
- Worker payment distribution
- Substitute matching
- Daily wage enforcement by state

### Phase 5: Village Exchange & Tools (Weeks 20-23)
**File:** `06-PHASE-5-VILLAGE-EXCHANGE.md`
- Resource listing (water, tools, fertilizers, seeds)
- Transaction types (sell, rent, barter, lend free, group buy)
- Geo-fenced village circles
- Village trust score system
- FPO group accounts
- Group buying coordination
- Water schedule sharing
- Barter matching

### Phase 6: Livestock & Specialized Services (Weeks 24-27)
**File:** `07-PHASE-6-LIVESTOCK-SERVICES.md`
- Livestock marketplace (cattle, poultry, goats, fish)
- Veterinary on-call booking
- Breeding services (AI)
- Livestock health tracking
- Drone-as-a-service
- Cold chain transport
- Post-harvest services
- Soil testing services

### Phase 7: Intelligence & Weather (Weeks 28-31)
**File:** `08-PHASE-7-INTELLIGENCE.md`
- Weather-based auto-rescheduling (WeatherHold)
- IMD API deep integration
- Seasonal demand prediction
- Surge pricing engine
- Price prediction ML models
- Crop advisory engine
- Disease detection (TFLite)
- Satellite NDVI monitoring

### Phase 8: Review, Disputes & Trust (Weeks 32-35)
**File:** `09-PHASE-8-REVIEWS-DISPUTES.md`
- Review system with sub-ratings
- Photo reviews
- Vendor response mechanism
- Dispute creation & tracking
- Tiered resolution (auto → support → escalation)
- Escrow hold during disputes
- Blacklisting system
- Insurance integration

### Phase 9: Farmer Hub & News (Weeks 36-38)
**File:** `10-PHASE-9-FARMER-HUB.md`
- Home dashboard (prices, weather, calendar, news)
- Agricultural news aggregation
- Government scheme eligibility checker
- One-click scheme application
- Personalization engine (by crop, location, season, role)
- Notification strategy (SMS → WhatsApp → Push)
- Success stories & community highlights

### Phase 10: Voice, Offline & Accessibility (Weeks 39-42)
**File:** `11-PHASE-10-ACCESSIBILITY.md`
- Bhashini API integration (10+ languages)
- Voice navigation & search
- Text-to-speech for news/advisories
- Offline-first with WatermelonDB
- Background sync
- SMS/USSD booking fallback
- WhatsApp chatbot
- PWA for no-install
- <15MB APK optimization
- Icon-heavy UI for illiterate users

### Phase 11: Admin, Analytics & Scale (Weeks 43-46)
**File:** `12-PHASE-11-ADMIN-ANALYTICS.md`
- Admin dashboard (Next.js)
- User management with role assignment
- Content moderation
- Analytics & reporting
- Revenue tracking
- Vendor verification queue
- Dispute resolution interface
- Government officer portal
- FPO admin dashboard
- Cross-region supply matching

### Phase 12: Monetization & Growth (Weeks 47-50)
**File:** `13-PHASE-12-MONETIZATION.md`
- Commission engine (10-20% by category)
- Vendor subscription tiers (Free/Pro/Business)
- Farmer seasonal packages
- Financial services (KCC, insurance)
- Data analytics for enterprises
- Advertising & sponsored listings
- Referral program
- FPO group pricing

---

## New API Routes Needed (Total: 45+)

### Service Marketplace
```
POST   /api/providers              # Register as provider
GET    /api/providers/:id          # Get provider profile
PUT    /api/providers/:id          # Update provider profile
POST   /api/providers/:id/kyc      # Submit KYC documents
GET    /api/services               # Browse services (with filters)
POST   /api/services               # Create service listing
PUT    /api/services/:id           # Update service listing
DELETE /api/services/:id           # Remove service listing
GET    /api/services/categories    # Service categories tree
GET    /api/services/nearby        # Location-based discovery
```

### Booking & Calendar
```
POST   /api/bookings               # Create booking
GET    /api/bookings               # List bookings (farmer/vendor view)
GET    /api/bookings/:id           # Booking details
PUT    /api/bookings/:id/status    # Update status (confirm/complete/cancel)
GET    /api/availability/:providerId  # Get provider availability
PUT    /api/availability           # Set availability (vendor)
POST   /api/bookings/:id/reschedule   # Reschedule booking
```

### Payments
```
POST   /api/payments/order         # Create Razorpay order
POST   /api/payments/verify        # Verify payment
POST   /api/payments/escrow/release  # Release escrow
GET    /api/payments/history       # Payment history
GET    /api/wallet/balance         # Wallet balance
POST   /api/wallet/add             # Add to wallet
GET    /api/payouts                # Vendor payout history
```

### Labor
```
POST   /api/jobs                   # Post a job
GET    /api/jobs                   # Browse jobs
POST   /api/jobs/:id/bid           # Bid on a job
PUT    /api/jobs/:id/bid/:bidId    # Accept/reject bid
POST   /api/teams                  # Create labor team
PUT    /api/teams/:id              # Update team
POST   /api/attendance             # Check-in (QR + GPS)
GET    /api/attendance/:bookingId  # Attendance report
```

### Village Exchange
```
POST   /api/exchange               # Create exchange listing
GET    /api/exchange               # Browse village exchange
POST   /api/exchange/:id/request   # Request resource
PUT    /api/exchange/:id/request/:reqId  # Accept/reject request
POST   /api/group-buy              # Create group buy
POST   /api/group-buy/:id/join     # Join group buy
GET    /api/trust/:userId          # Get trust score
```

### Reviews & Disputes
```
POST   /api/reviews                # Submit review
GET    /api/reviews/:providerId    # Provider reviews
POST   /api/disputes               # Raise dispute
PUT    /api/disputes/:id           # Update dispute
PUT    /api/disputes/:id/resolve   # Resolve dispute (admin)
```

### RBAC
```
GET    /api/roles                  # List roles
POST   /api/roles                  # Create custom role
PUT    /api/roles/:id              # Update role permissions
POST   /api/users/:id/roles       # Assign role to user
DELETE /api/users/:id/roles/:roleId  # Remove role
GET    /api/permissions            # List all permissions
```

---

## New Prisma Models Needed (30+)

See individual phase files for complete schema definitions.

**Summary:**
- Phase 0: Role, Permission, RolePermission, UserRole
- Phase 1: ServiceProvider, ServiceListing, ServiceCategory
- Phase 2: Booking, AvailabilitySlot, RecurringBooking
- Phase 3: Payment, Wallet, WalletTransaction, Payout, Invoice
- Phase 4: JobPosting, Bid, LaborTeam, TeamMember, Attendance
- Phase 5: ExchangeListing, ExchangeRequest, VillageTrust, WaterSchedule, GroupBuy, GroupBuyParticipant
- Phase 6: LivestockListing, VetBooking, DroneService
- Phase 7: WeatherHold, PricePrediction, CropAdvisory, SatelliteData
- Phase 8: Review, Dispute, InsuranceClaim
- Phase 9: Notification, NewsSource, SchemeApplication
- Phase 10: VoiceCommand, OfflineQueue
- Phase 11: AuditLog, Report, ModeratorAction

---

## Tech Stack (Final)

| Layer | Technology |
|-------|-----------|
| **Farmer App** | React Native 0.81, WatermelonDB, Zustand, TanStack Query |
| **Partner App** | React Native 0.81, shared mobile-core package |
| **Admin Web** | Next.js 14, Tailwind CSS, Recharts, Mapbox GL |
| **PWA** | Next.js, Service Worker, IndexedDB |
| **Backend** | Express.js 4.21, TypeScript 5.6, Prisma 5.22 |
| **Database** | PostgreSQL (Neon), Redis (Upstash), S3 (images) |
| **Auth** | JWT + refresh tokens + OTP (MSG91), manual KYC → KARZA/IDfy eKYC (Phase 3) → UIDAI (Phase 6+) |
| **Payments** | Razorpay (UPI, Route API for escrow, auto-payouts) |
| **Voice** | Sarvam AI ASR (voice input) + Bhashini API (TTS + translation, 22 languages) |
| **Weather** | OpenWeatherMap (MVP) → IMD (Phase 5, requires formal licence) |
| **SMS** | MSG91 + Gupshup (WhatsApp) |
| **Push** | Firebase Cloud Messaging |
| **Search** | PostgreSQL full-text + PostGIS (geo) → Typesense (Phase 4+) |
| **Cache** | Redis (Upstash) — prices 15min TTL, weather 30min, schemes 24h |
| **Job Queue** | BullMQ + Redis — notifications, price ingestion, escrow release |
| **Real-time** | Socket.io (booking/chat) + Redis pub/sub |
| **Monitoring** | Sentry (errors), Pino (structured logs), PostHog (analytics), BetterStack (uptime) |
| **CI/CD** | GitHub Actions → Railway/Render (backend Docker) + Vercel (Next.js) + Expo EAS (mobile) |
