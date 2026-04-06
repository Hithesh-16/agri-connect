# Phase 9: Admin Dashboard & Government Portal

**Timeline:** Weeks 40-42
**Priority:** HIGH — Required for platform operations, moderation, and government partnerships
**Dependencies:** Phase 0 (RBAC), Phase 1-8 (all data models must exist)

---

## Objective

Replace the existing admin stubs with a fully functional admin dashboard covering 13 operational pages. Extend the same admin-web application with role-restricted portals for Government Officers and FPO Administrators using the RBAC system from Phase 0.

---

## Current State

### What Exists
- `web/src/app/admin/` — stub admin pages with placeholder content
- RBAC system from Phase 0 with PLATFORM_ADMIN, GOVERNMENT_OFFICER, FPO_ADMIN roles
- All data models from Phases 1-8 (users, bookings, payments, services, etc.)
- PostHog integration for analytics (basic setup)

### What's Wrong
- Admin pages are non-functional stubs with no backend integration
- No dispute resolution interface — disputes accumulate without action
- No KYC verification queue — providers wait indefinitely
- No content moderation — community posts and reviews are unmoderated
- No government officer access — scheme management is manual
- No FPO admin view — FPO leaders cannot manage their members

---

## Database Schema Changes

### New Models

```prisma
// ── ADMIN SPECIFIC ──

model AdminAction {
  id          String   @id @default(cuid())
  adminId     String
  actionType  String   // "KYC_APPROVE", "KYC_REJECT", "USER_SUSPEND", "USER_UNSUSPEND",
                       // "DISPUTE_RESOLVE", "REVIEW_REMOVE", "CONTENT_REMOVE",
                       // "PAYOUT_APPROVE", "REFUND_APPROVE", "SCHEME_UPDATE"
  targetType  String   // "USER", "BOOKING", "PAYMENT", "REVIEW", "POST", "DISPUTE", "SCHEME"
  targetId    String
  reason      String?
  notes       String?
  metadata    Json?
  createdAt   DateTime @default(now())

  admin       User @relation(fields: [adminId], references: [id])

  @@index([adminId, createdAt])
  @@index([targetType, targetId])
  @@map("admin_actions")
}

model PlatformSetting {
  id          String   @id @default(cuid())
  key         String   @unique // "commission_rate_machinery", "max_listings_free", etc.
  value       Json     // Any JSON value
  category    String   // "COMMISSION", "LIMITS", "NOTIFICATIONS", "FEATURES"
  description String?
  updatedBy   String?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@index([category])
  @@map("platform_settings")
}

model DataExport {
  id          String   @id @default(cuid())
  requestedBy String
  exportType  String   // "FARMERS", "BOOKINGS", "PAYMENTS", "SCHEME_APPLICATIONS"
  filters     Json?    // { district, state, dateRange, etc. }
  status      String   @default("PENDING") // "PENDING", "PROCESSING", "COMPLETED", "FAILED"
  fileUrl     String?  // Signed S3 URL
  rowCount    Int?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())

  user        User @relation(fields: [requestedBy], references: [id])

  @@index([requestedBy, status])
  @@map("data_exports")
}
```

### Modify Existing Models

```prisma
model User {
  // ... existing fields ...
  
  // ADD:
  adminActions  AdminAction[]
  dataExports   DataExport[]
}
```

---

## API Endpoints

### Admin Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | KPI summary: active users, bookings today, revenue, open disputes | PLATFORM_ADMIN |
| GET | `/api/admin/dashboard/trends` | Time series: signups, bookings, revenue (7d/30d/90d) | PLATFORM_ADMIN |

### User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users (paginated, filterable) | PLATFORM_ADMIN |
| GET | `/api/admin/users/:id` | User detail with roles, bookings, payments | PLATFORM_ADMIN |
| PUT | `/api/admin/users/:id/roles` | Assign/remove roles | PLATFORM_ADMIN |
| PUT | `/api/admin/users/:id/suspend` | Suspend/unsuspend user | PLATFORM_ADMIN |

### Provider Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/providers/kyc-queue` | Pending KYC verifications | PLATFORM_ADMIN |
| PUT | `/api/admin/providers/:id/kyc` | Approve/reject KYC | PLATFORM_ADMIN |
| PUT | `/api/admin/providers/:id/suspend` | Suspend provider | PLATFORM_ADMIN |
| GET | `/api/admin/providers/:id/performance` | Provider metrics (bookings, rating, disputes) | PLATFORM_ADMIN |

### Booking Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/bookings` | All bookings (filterable by status, date, service type) | PLATFORM_ADMIN |
| GET | `/api/admin/bookings/:id` | Booking detail with full history | PLATFORM_ADMIN |
| PUT | `/api/admin/bookings/:id/override` | Override booking status (with reason) | PLATFORM_ADMIN |

### Payment Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/payments/transactions` | All transactions (filterable) | PLATFORM_ADMIN |
| GET | `/api/admin/payments/payouts` | Pending/completed vendor payouts | PLATFORM_ADMIN |
| POST | `/api/admin/payments/payouts/:id/approve` | Approve payout | PLATFORM_ADMIN |
| POST | `/api/admin/payments/refunds/:id/approve` | Approve refund | PLATFORM_ADMIN |
| GET | `/api/admin/payments/revenue` | Revenue breakdown by category | PLATFORM_ADMIN |

### Dispute Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/disputes` | All disputes (filterable by status, type) | PLATFORM_ADMIN |
| GET | `/api/admin/disputes/:id` | Dispute detail with messages | PLATFORM_ADMIN |
| POST | `/api/admin/disputes/:id/resolve` | Resolve dispute with decision | PLATFORM_ADMIN |
| POST | `/api/admin/disputes/:id/message` | Send message in dispute thread | PLATFORM_ADMIN |

### Review Moderation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/reviews` | Reviews flagged or pending moderation | CONTENT_MODERATOR |
| PUT | `/api/admin/reviews/:id/action` | Approve/remove/flag review | CONTENT_MODERATOR |

### Community Moderation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/community/flagged` | Flagged posts/comments | CONTENT_MODERATOR |
| PUT | `/api/admin/community/:id/action` | Approve/remove/warn | CONTENT_MODERATOR |

### Service Category Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/services/categories` | All service categories | PLATFORM_ADMIN |
| POST | `/api/admin/services/categories` | Create category | PLATFORM_ADMIN |
| PUT | `/api/admin/services/categories/:id` | Update category | PLATFORM_ADMIN |
| DELETE | `/api/admin/services/categories/:id` | Deactivate category | PLATFORM_ADMIN |

### Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/analytics/posthog-token` | Get PostHog embed token | PLATFORM_ADMIN |
| GET | `/api/admin/analytics/custom/:reportId` | Custom report data | PLATFORM_ADMIN |

### News Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/news` | All news articles | CONTENT_MODERATOR |
| POST | `/api/admin/news` | Create news article | CONTENT_MODERATOR |
| PUT | `/api/admin/news/:id` | Update article | CONTENT_MODERATOR |
| DELETE | `/api/admin/news/:id` | Remove article | CONTENT_MODERATOR |

### Scheme Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/schemes` | All government schemes | PLATFORM_ADMIN |
| POST | `/api/admin/schemes` | Add new scheme | PLATFORM_ADMIN |
| PUT | `/api/admin/schemes/:id` | Update scheme details/criteria | PLATFORM_ADMIN |
| GET | `/api/admin/schemes/:id/applications` | Scheme applications | PLATFORM_ADMIN |

### Platform Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/settings` | All platform settings (grouped by category) | SUPER_ADMIN |
| PUT | `/api/admin/settings/:key` | Update setting | SUPER_ADMIN |

### Data Export

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/exports` | Request data export | PLATFORM_ADMIN |
| GET | `/api/admin/exports` | List export requests | PLATFORM_ADMIN |
| GET | `/api/admin/exports/:id/download` | Download exported file | PLATFORM_ADMIN |

### Government Officer Portal

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/gov/dashboard` | District/state agricultural overview | GOVERNMENT_OFFICER |
| GET | `/api/gov/farmers` | Farmers in officer's jurisdiction | GOVERNMENT_OFFICER |
| POST | `/api/gov/exports/farmers` | Export farmer data for district/state | GOVERNMENT_OFFICER |
| GET | `/api/gov/schemes` | Schemes applicable to jurisdiction | GOVERNMENT_OFFICER |
| GET | `/api/gov/schemes/:id/applications` | Scheme applications in jurisdiction | GOVERNMENT_OFFICER |
| PUT | `/api/gov/schemes/:id/applications/:appId` | Approve/reject scheme application | GOVERNMENT_OFFICER |

### FPO Admin Portal

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/fpo/dashboard` | FPO overview: members, activity, revenue | FPO_ADMIN |
| GET | `/api/fpo/members` | List FPO members | FPO_ADMIN |
| POST | `/api/fpo/members/invite` | Invite farmer to join FPO | FPO_ADMIN |
| DELETE | `/api/fpo/members/:id` | Remove member | FPO_ADMIN |
| GET | `/api/fpo/group-purchases` | Coordinate group input purchases | FPO_ADMIN |
| POST | `/api/fpo/group-purchases` | Create group purchase request | FPO_ADMIN |
| GET | `/api/fpo/reports` | Activity reports for FPO | FPO_ADMIN |
| POST | `/api/fpo/reports/export` | Export FPO activity data | FPO_ADMIN |

---

## Backend Implementation

### 1. Admin Dashboard Service

```typescript
// backend/src/services/adminDashboardService.ts

export class AdminDashboardService {
  async getKPIs(): Promise<DashboardKPIs> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeUsers,
      bookingsToday,
      revenueToday,
      openDisputes,
      pendingKYC,
      newSignupsToday,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true, lastLoginAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.booking.count({ where: { createdAt: { gte: today } } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: today }, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.kycVerification.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    return {
      activeUsers,
      bookingsToday,
      revenueToday: revenueToday._sum.amount || 0,
      openDisputes,
      pendingKYC,
      newSignupsToday,
    };
  }

  async getTrends(period: '7d' | '30d' | '90d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 86400000);

    // Daily aggregation queries for signups, bookings, revenue
    const signups = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const bookings = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM bookings
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const revenue = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(amount) as total
      FROM payments
      WHERE created_at >= ${startDate} AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return { signups, bookings, revenue };
  }
}
```

### 2. Dispute Resolution Service

```typescript
// backend/src/services/disputeResolutionService.ts

export class DisputeResolutionService {
  async resolveDispute(
    disputeId: string,
    adminId: string,
    decision: DisputeDecision
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) throw new AppError('Dispute not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      // Update dispute
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution: decision.resolution,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // Execute resolution action
      switch (decision.resolution) {
        case 'FULL_REFUND':
          await tx.payment.create({
            data: {
              bookingId: dispute.bookingId,
              type: 'REFUND',
              amount: dispute.booking.totalAmount,
              status: 'PENDING',
            },
          });
          break;

        case 'PARTIAL_REFUND':
          await tx.payment.create({
            data: {
              bookingId: dispute.bookingId,
              type: 'REFUND',
              amount: decision.refundAmount!,
              status: 'PENDING',
            },
          });
          break;

        case 'PROVIDER_SUSPENSION':
          await tx.user.update({
            where: { id: dispute.booking.providerId },
            data: { isSuspended: true, suspendedReason: decision.reason },
          });
          break;

        case 'NO_ACTION':
          break;
      }

      // Log admin action
      await tx.adminAction.create({
        data: {
          adminId,
          actionType: 'DISPUTE_RESOLVE',
          targetType: 'DISPUTE',
          targetId: disputeId,
          reason: decision.reason,
          notes: decision.notes,
          metadata: { resolution: decision.resolution, refundAmount: decision.refundAmount },
        },
      });

      return updated;
    });

    // Notify both parties
    await Promise.all([
      notificationService.send({
        userId: dispute.reporterId,
        type: 'DISPUTE_RESOLVED',
        title: { en: 'Dispute resolved', hi: 'विवाद हल' },
        body: { en: `Your dispute has been resolved: ${decision.resolution}` },
      }),
      notificationService.send({
        userId: dispute.booking.providerId,
        type: 'DISPUTE_RESOLVED',
        title: { en: 'Dispute resolved', hi: 'विवाद हल' },
        body: { en: `A dispute regarding your booking has been resolved.` },
      }),
    ]);

    return result;
  }
}
```

### 3. Data Export Service

```typescript
// backend/src/services/dataExportService.ts

import { createObjectCsvWriter } from 'csv-writer';
import { uploadToS3 } from '../utils/s3';

export class DataExportService {
  async requestExport(userId: string, type: string, filters: any) {
    const exportRecord = await prisma.dataExport.create({
      data: {
        requestedBy: userId,
        exportType: type,
        filters,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 3600000), // 24h expiry
      },
    });

    // Process async via job queue
    await jobQueue.add('data-export', { exportId: exportRecord.id });

    return exportRecord;
  }

  async processExport(exportId: string) {
    const exportRecord = await prisma.dataExport.findUnique({ where: { id: exportId } });
    if (!exportRecord) return;

    await prisma.dataExport.update({
      where: { id: exportId },
      data: { status: 'PROCESSING' },
    });

    try {
      let data: any[];
      switch (exportRecord.exportType) {
        case 'FARMERS':
          data = await this.fetchFarmerData(exportRecord.filters);
          break;
        case 'BOOKINGS':
          data = await this.fetchBookingData(exportRecord.filters);
          break;
        case 'PAYMENTS':
          data = await this.fetchPaymentData(exportRecord.filters);
          break;
        case 'SCHEME_APPLICATIONS':
          data = await this.fetchSchemeApplicationData(exportRecord.filters);
          break;
        default:
          throw new Error(`Unknown export type: ${exportRecord.exportType}`);
      }

      const csvPath = `/tmp/export_${exportId}.csv`;
      await this.writeCsv(csvPath, data);

      const s3Url = await uploadToS3(csvPath, `exports/${exportId}.csv`);

      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl: s3Url,
          rowCount: data.length,
        },
      });
    } catch (error) {
      await prisma.dataExport.update({
        where: { id: exportId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}
```

### 4. Government Officer Dashboard

```typescript
// backend/src/services/govPortalService.ts

export class GovPortalService {
  async getDashboard(officerId: string) {
    // Get officer's jurisdiction from RBAC scope
    const userRoles = await prisma.userRole.findMany({
      where: { userId: officerId, role: { name: 'GOVERNMENT_OFFICER' } },
      include: { role: true },
    });

    const scope = userRoles[0]?.scope as { type: string; level: string; values: string[] };
    const geoFilter = this.buildGeoFilter(scope);

    const [
      totalFarmers,
      activeFarmers,
      totalBookings,
      schemeApplications,
      cropDistribution,
    ] = await Promise.all([
      prisma.user.count({ where: { ...geoFilter, userRoles: { some: { role: { name: 'FARMER' } } } } }),
      prisma.user.count({ where: { ...geoFilter, lastLoginAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.booking.count({ where: { farmer: geoFilter } }),
      prisma.schemeApplication.count({ where: { farmer: geoFilter } }),
      prisma.cropRotation.groupBy({ by: ['cropName'], _count: true, where: { farm: { owner: geoFilter } } }),
    ]);

    return {
      totalFarmers,
      activeFarmers,
      totalBookings,
      schemeApplications,
      cropDistribution,
      jurisdiction: scope,
    };
  }

  private buildGeoFilter(scope: any) {
    if (scope?.level === 'district') {
      return { district: { in: scope.values } };
    }
    if (scope?.level === 'state') {
      return { state: { in: scope.values } };
    }
    return {};
  }
}
```

---

## Frontend Implementation

### Admin Dashboard Pages (13 Pages)

```
web/src/app/admin/
├── page.tsx                    # Dashboard — KPIs + trend charts
├── users/
│   ├── page.tsx                # User list with search, filter, role badges
│   └── [id]/page.tsx           # User detail with role management
├── providers/
│   ├── page.tsx                # Provider list + KYC queue tab
│   └── [id]/page.tsx           # Provider detail + verification actions
├── bookings/
│   └── page.tsx                # All bookings table with filters
├── payments/
│   └── page.tsx                # Transactions + payouts + refunds tabs
├── disputes/
│   ├── page.tsx                # Dispute list with status filters
│   └── [id]/page.tsx           # Dispute resolution interface
├── reviews/
│   └── page.tsx                # Review moderation queue
├── community/
│   └── page.tsx                # Flagged content moderation
├── services/
│   └── page.tsx                # Service category management
├── analytics/
│   └── page.tsx                # PostHog embedded dashboards
├── news/
│   └── page.tsx                # News article management
├── schemes/
│   ├── page.tsx                # Scheme list + create
│   └── [id]/page.tsx           # Scheme detail + applications
└── settings/
    └── page.tsx                # Platform configuration
```

### Government Officer Pages

```
web/src/app/admin/gov/
├── page.tsx                    # District/state overview dashboard
├── farmers/page.tsx            # Farmer list in jurisdiction
├── schemes/page.tsx            # Scheme management + applications
└── exports/page.tsx            # Data export interface
```

### FPO Admin Pages

```
web/src/app/admin/fpo/
├── page.tsx                    # FPO overview dashboard
├── members/page.tsx            # Member management + invitations
├── group-purchases/page.tsx    # Coordinate group purchases
└── reports/page.tsx            # Activity reports + export
```

### Role-Based Navigation

```typescript
// web/src/components/admin/AdminSidebar.tsx

const ADMIN_NAV = [
  // Visible to PLATFORM_ADMIN + SUPER_ADMIN
  { label: 'Dashboard', href: '/admin', permission: 'admin:dashboard:read' },
  { label: 'Users', href: '/admin/users', permission: 'users:manage' },
  { label: 'Providers', href: '/admin/providers', permission: 'providers:manage' },
  { label: 'Bookings', href: '/admin/bookings', permission: 'bookings:read' },
  { label: 'Payments', href: '/admin/payments', permission: 'payments:manage' },
  { label: 'Disputes', href: '/admin/disputes', permission: 'disputes:resolve' },
  { label: 'Reviews', href: '/admin/reviews', permission: 'reviews:delete' },
  { label: 'Community', href: '/admin/community', permission: 'community:delete' },
  { label: 'Services', href: '/admin/services', permission: 'services:manage' },
  { label: 'Analytics', href: '/admin/analytics', permission: 'reports:read' },
  { label: 'News', href: '/admin/news', permission: 'news:create' },
  { label: 'Schemes', href: '/admin/schemes', permission: 'schemes:manage' },
  { label: 'Settings', href: '/admin/settings', permission: 'settings:manage' },
];

const GOV_NAV = [
  { label: 'Overview', href: '/admin/gov', permission: 'gov:dashboard:read' },
  { label: 'Farmers', href: '/admin/gov/farmers', permission: 'users:read:geographic' },
  { label: 'Schemes', href: '/admin/gov/schemes', permission: 'schemes:manage' },
  { label: 'Exports', href: '/admin/gov/exports', permission: 'reports:export:geographic' },
];

const FPO_NAV = [
  { label: 'Overview', href: '/admin/fpo', permission: 'fpo:dashboard:read' },
  { label: 'Members', href: '/admin/fpo/members', permission: 'users:manage:organization' },
  { label: 'Group Purchases', href: '/admin/fpo/group-purchases', permission: 'group-buy:manage:organization' },
  { label: 'Reports', href: '/admin/fpo/reports', permission: 'reports:read:organization' },
];

export function AdminSidebar() {
  const { can, hasRole } = usePermission();

  const getNav = () => {
    if (hasRole('GOVERNMENT_OFFICER')) return GOV_NAV;
    if (hasRole('FPO_ADMIN')) return FPO_NAV;
    return ADMIN_NAV;
  };

  return (
    <nav>
      {getNav()
        .filter(item => can(...item.permission.split(':')))
        .map(item => (
          <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
        ))}
    </nav>
  );
}
```

---

## Testing Checklist

### Admin Dashboard
- [ ] Dashboard loads KPIs: active users, bookings today, revenue, disputes
- [ ] Trend charts display correctly for 7d, 30d, 90d periods
- [ ] KPIs update in real-time or on refresh

### User Management
- [ ] List all users with pagination (20 per page)
- [ ] Search users by name, phone, email
- [ ] Filter by role, status, registration date
- [ ] Assign additional role to user → user gains new permissions
- [ ] Suspend user → user cannot login, gets 403 on API calls
- [ ] Unsuspend user → user can login again

### Provider Management
- [ ] KYC queue shows pending verifications sorted by submission date
- [ ] Approve KYC → provider status changes, notification sent
- [ ] Reject KYC with reason → provider notified with reason
- [ ] Suspend provider → all active bookings flagged, provider blocked

### Booking Management
- [ ] Filter bookings by status, date range, service type, location
- [ ] View booking detail with full status history
- [ ] Override booking status with required reason → audit log created

### Payment Management
- [ ] View all transactions with filters
- [ ] Approve pending payout → payout processed
- [ ] Approve refund → refund initiated
- [ ] Revenue breakdown by service category matches actual totals

### Dispute Resolution
- [ ] View open disputes with urgency sorting
- [ ] Open dispute detail → see both parties' messages + booking details
- [ ] Resolve with full refund → refund payment created
- [ ] Resolve with partial refund → correct amount refunded
- [ ] Resolve with provider suspension → provider account suspended
- [ ] Both parties receive notification on resolution

### Review Moderation
- [ ] Flagged reviews appear in moderation queue
- [ ] Remove review → review hidden, user warned
- [ ] Approve review → review stays visible

### Content Moderation
- [ ] Flagged community posts appear in queue
- [ ] Remove post → post hidden, user warned
- [ ] Repeated violations → user suspension recommended

### Data Export
- [ ] Request farmer data export for district → CSV generated
- [ ] Export contains correct columns and row count
- [ ] Download link expires after 24 hours
- [ ] Large export (>10K rows) processes asynchronously

### Government Officer Portal
- [ ] Officer sees only their district/state data (geographic scope)
- [ ] Cannot access data outside jurisdiction
- [ ] Can export farmer data for their jurisdiction
- [ ] Can view and process scheme applications in jurisdiction

### FPO Admin Portal
- [ ] FPO admin sees only their organization's members
- [ ] Can invite new members (farmer receives invitation)
- [ ] Can create group purchase requests
- [ ] Activity reports show only FPO-scoped data

### Role-Based Access
- [ ] PLATFORM_ADMIN sees all 13 admin pages
- [ ] CONTENT_MODERATOR sees only Reviews, Community, News
- [ ] SUPPORT_AGENT sees only Users, Bookings, Disputes
- [ ] GOVERNMENT_OFFICER sees only Gov portal pages
- [ ] FPO_ADMIN sees only FPO portal pages
- [ ] Unauthorized access returns 403

---

## Files to Create/Modify

### New Files
```
backend/src/services/adminDashboardService.ts       # Dashboard KPIs + trends
backend/src/services/disputeResolutionService.ts     # Dispute resolution logic
backend/src/services/dataExportService.ts            # Async CSV export
backend/src/services/govPortalService.ts             # Government officer features
backend/src/services/fpoPortalService.ts             # FPO admin features
backend/src/routes/admin/dashboard.ts                # Admin dashboard endpoints
backend/src/routes/admin/users.ts                    # User management endpoints
backend/src/routes/admin/providers.ts                # Provider management endpoints
backend/src/routes/admin/bookings.ts                 # Booking management endpoints
backend/src/routes/admin/payments.ts                 # Payment management endpoints
backend/src/routes/admin/disputes.ts                 # Dispute endpoints
backend/src/routes/admin/reviews.ts                  # Review moderation endpoints
backend/src/routes/admin/community.ts                # Community moderation endpoints
backend/src/routes/admin/services.ts                 # Service category endpoints
backend/src/routes/admin/news.ts                     # News management endpoints
backend/src/routes/admin/schemes.ts                  # Scheme management endpoints
backend/src/routes/admin/settings.ts                 # Platform settings endpoints
backend/src/routes/admin/exports.ts                  # Data export endpoints
backend/src/routes/gov.ts                            # Government officer endpoints
backend/src/routes/fpo.ts                            # FPO admin endpoints
web/src/app/admin/page.tsx                           # Dashboard page (replace stub)
web/src/app/admin/users/page.tsx                     # Users page
web/src/app/admin/users/[id]/page.tsx                # User detail page
web/src/app/admin/providers/page.tsx                 # Providers page
web/src/app/admin/providers/[id]/page.tsx            # Provider detail
web/src/app/admin/bookings/page.tsx                  # Bookings page
web/src/app/admin/payments/page.tsx                  # Payments page
web/src/app/admin/disputes/page.tsx                  # Disputes page
web/src/app/admin/disputes/[id]/page.tsx             # Dispute resolution page
web/src/app/admin/reviews/page.tsx                   # Reviews page
web/src/app/admin/community/page.tsx                 # Community page
web/src/app/admin/services/page.tsx                  # Services page
web/src/app/admin/analytics/page.tsx                 # Analytics page
web/src/app/admin/news/page.tsx                      # News page
web/src/app/admin/schemes/page.tsx                   # Schemes page
web/src/app/admin/schemes/[id]/page.tsx              # Scheme detail page
web/src/app/admin/settings/page.tsx                  # Settings page
web/src/app/admin/gov/page.tsx                       # Gov dashboard
web/src/app/admin/gov/farmers/page.tsx               # Gov farmers view
web/src/app/admin/gov/schemes/page.tsx               # Gov schemes view
web/src/app/admin/gov/exports/page.tsx               # Gov data export
web/src/app/admin/fpo/page.tsx                       # FPO dashboard
web/src/app/admin/fpo/members/page.tsx               # FPO members
web/src/app/admin/fpo/group-purchases/page.tsx       # FPO group purchases
web/src/app/admin/fpo/reports/page.tsx               # FPO reports
web/src/components/admin/AdminSidebar.tsx             # Role-aware sidebar
web/src/components/admin/AdminLayout.tsx              # Admin layout wrapper
web/src/components/admin/KPICard.tsx                  # Dashboard KPI card
web/src/components/admin/DataTable.tsx                # Reusable admin data table
web/src/components/admin/DisputeThread.tsx            # Dispute message thread
```

### Modified Files
```
backend/prisma/schema.prisma                         # Add AdminAction, PlatformSetting, DataExport
backend/src/index.ts                                 # Mount admin, gov, fpo routes
web/src/app/admin/layout.tsx                         # Wrap with AdminLayout + role check
```

---

## Definition of Done

- [ ] All 13 admin pages functional with real data
- [ ] KYC verification queue processes pending providers
- [ ] Dispute resolution with full/partial refund and suspension options
- [ ] Government officer portal restricted to geographic scope
- [ ] FPO admin portal restricted to organizational scope
- [ ] All admin actions create audit log entries
- [ ] Data export generates downloadable CSV files
- [ ] PostHog analytics embedded and loading
- [ ] Role-based navigation hides unauthorized pages
- [ ] All endpoints protected by RBAC middleware
