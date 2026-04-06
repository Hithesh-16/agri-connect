# Phase 0: Foundation & RBAC System

**Timeline:** Weeks 1-3
**Priority:** CRITICAL — All other phases depend on this
**Dependencies:** None (builds on existing backend)

---

## Objective

Replace the simple `Role` enum (FARMER, TRADER, DEALER, CORPORATE) with a full RBAC system supporting custom roles, granular permissions, multi-role users, row-level security, and organizational scoping.

---

## Current State

### What Exists
- `Role` enum in Prisma: `FARMER | TRADER | DEALER | CORPORATE`
- Single role per user (`User.role`)
- JWT with `userId` and `role` in payload
- Basic auth middleware (`backend/src/middleware/auth.ts`) — verifies JWT, no permission checks
- 17 API routes — none have role-based guards

### What's Wrong
- No permission system — any authenticated user can access any endpoint
- Single role per user — a farmer who also owns a tractor can't be both
- No organizational scoping — FPOs, districts, states can't manage sub-sets of data
- No admin roles — no way to create content moderators, support agents
- No audit trail — no logging of who did what

---

## Database Schema Changes

### New Models

```prisma
// ── RBAC MODELS ──

model RoleDefinition {
  id          String   @id @default(cuid())
  name        String   @unique  // "FARMER", "VENDOR_MACHINERY", "FPO_ADMIN", etc.
  displayName Json     // { "en": "Farmer", "te": "రైతు", "hi": "किसान" }
  description String?
  isSystem    Boolean  @default(false)  // System roles can't be deleted
  isActive    Boolean  @default(true)
  parentId    String?  // Hierarchical roles
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      RoleDefinition?  @relation("RoleHierarchy", fields: [parentId], references: [id])
  children    RoleDefinition[] @relation("RoleHierarchy")
  permissions RolePermission[]
  userRoles   UserRole[]

  @@map("role_definitions")
}

model Permission {
  id          String   @id @default(cuid())
  resource    String   // "bookings", "services", "users", "payments", etc.
  action      String   // "create", "read", "update", "delete", "approve", "export", "manage"
  description String?
  isActive    Boolean  @default(true)

  rolePermissions RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String  @id @default(cuid())
  roleId       String
  permissionId String
  scope        Json?   // { "type": "own" | "organization" | "geographic", "level": "district" | "state", "values": [] }
  conditions   Json?   // Additional conditions like time-based access

  role       RoleDefinition @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission     @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  id           String    @id @default(cuid())
  userId       String
  roleId       String
  organizationId String? // FPO, company, etc.
  scope        Json?     // Geographic or organizational scope
  assignedBy   String?   // Who assigned this role
  isActive     Boolean   @default(true)
  assignedAt   DateTime  @default(now())
  expiresAt    DateTime? // Temporary role assignments

  user User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  role RoleDefinition @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId, organizationId])
  @@map("user_roles")
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  type        String   // "FPO" | "COMPANY" | "COOPERATIVE" | "GOVERNMENT"
  registrationNumber String?
  address     Json?
  district    String?
  state       String?
  adminUserId String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("organizations")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // "CREATE", "UPDATE", "DELETE", "LOGIN", "ROLE_CHANGE"
  resource   String   // "user", "booking", "payment", etc.
  resourceId String?
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([resource, resourceId])
  @@map("audit_logs")
}
```

### Modify Existing User Model

```prisma
model User {
  // ... existing fields ...
  
  // REMOVE: role  Role?
  // ADD:
  userRoles  UserRole[]
  auditLogs  AuditLog[]  // Track user actions
  
  // Keep for backward compat during migration:
  legacyRole String?  // Migrated from old Role enum, removed after migration
}
```

---

## API Endpoints

### Role Management (Admin only)

```
GET    /api/roles                    # List all roles (with permissions)
POST   /api/roles                    # Create custom role
GET    /api/roles/:id                # Get role details
PUT    /api/roles/:id                # Update role (name, permissions)
DELETE /api/roles/:id                # Deactivate role (soft delete)
GET    /api/roles/:id/users          # List users with this role
```

### Permission Management (Super Admin only)

```
GET    /api/permissions              # List all permissions
POST   /api/permissions              # Create new permission
PUT    /api/permissions/:id          # Update permission
```

### User Role Assignment

```
GET    /api/users/:id/roles          # Get user's roles
POST   /api/users/:id/roles          # Assign role to user
DELETE /api/users/:id/roles/:roleId  # Remove role from user
PUT    /api/users/:id/roles/:roleId  # Update role scope/expiry
```

### Audit Log

```
GET    /api/audit-logs               # Query audit logs (admin)
GET    /api/audit-logs/user/:userId  # Logs for specific user
```

---

## Backend Implementation

### 1. Permission Middleware

```typescript
// backend/src/middleware/permissions.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';

interface PermissionCheck {
  resource: string;
  action: string;
  scope?: 'own' | 'organization' | 'all';
}

export function requirePermission(check: PermissionCheck) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get all user's active roles with their permissions
    const userRoles = await prisma.userRole.findMany({
      where: { userId, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
              where: {
                permission: {
                  resource: check.resource,
                  action: check.action,
                },
              },
            },
          },
        },
      },
    });

    // Check if any role grants the required permission
    const hasPermission = userRoles.some(ur =>
      ur.role.permissions.length > 0
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Determine scope
    const maxScope = determineMaxScope(userRoles, check);
    req.permissionScope = maxScope;

    next();
  };
}

function determineMaxScope(userRoles, check) {
  // 'all' > 'organization' > 'own'
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      if (rp.scope?.type === 'all') return { type: 'all' };
      if (rp.scope?.type === 'organization') {
        return { type: 'organization', organizationId: ur.organizationId };
      }
      if (rp.scope?.type === 'geographic') {
        return { type: 'geographic', ...rp.scope };
      }
    }
  }
  return { type: 'own', userId: userRoles[0]?.userId };
}
```

### 2. Route Protection Example

```typescript
// backend/src/routes/bookings.ts

import { requirePermission } from '../middleware/permissions';

router.get('/bookings',
  authenticate,
  requirePermission({ resource: 'bookings', action: 'read' }),
  async (req, res) => {
    const scope = req.permissionScope;
    
    let where = {};
    if (scope.type === 'own') {
      where = { OR: [{ farmerId: scope.userId }, { providerId: scope.userId }] };
    } else if (scope.type === 'organization') {
      // FPO admin sees all members' bookings
      where = { farmer: { userRoles: { some: { organizationId: scope.organizationId } } } };
    }
    // scope.type === 'all' → no filter (admin)

    const bookings = await prisma.booking.findMany({ where });
    res.json(bookings);
  }
);
```

### 3. JWT Claims Update

```typescript
// backend/src/services/authService.ts

function generateToken(user) {
  const roles = user.userRoles.map(ur => ({
    role: ur.role.name,
    orgId: ur.organizationId,
    scope: ur.scope,
  }));

  return jwt.sign({
    userId: user.id,
    roles,
    // Flatten top-level permissions for quick frontend checks
    permissions: extractPermissions(user.userRoles),
  }, JWT_SECRET, { expiresIn: '7d' });
}

function extractPermissions(userRoles) {
  const perms = new Set();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      perms.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
  }
  return Array.from(perms);
}
```

### 4. Audit Logger

```typescript
// backend/src/services/auditService.ts

export async function logAction(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  req?: Request;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ipAddress: params.req?.ip,
      userAgent: params.req?.headers['user-agent'],
    },
  });
}
```

---

## Seed Data — Default Roles & Permissions

### System Roles (cannot be deleted)

```typescript
const SYSTEM_ROLES = [
  {
    name: 'SUPER_ADMIN',
    displayName: { en: 'Super Admin', te: 'సూపర్ అడ్మిన్', hi: 'सुपर एडमिन' },
    isSystem: true,
    permissions: ['*:*'], // All permissions
  },
  {
    name: 'PLATFORM_ADMIN',
    displayName: { en: 'Platform Admin', te: 'ప్లాట్‌ఫారమ్ అడ్మిన్', hi: 'प्लेटफॉर्म एडमिन' },
    isSystem: true,
    parent: 'SUPER_ADMIN',
    permissions: [
      'users:read', 'users:update', 'users:manage',
      'bookings:read', 'bookings:update',
      'services:read', 'services:approve',
      'disputes:read', 'disputes:resolve',
      'reviews:read', 'reviews:delete',
      'news:create', 'news:update', 'news:delete',
      'reports:read', 'reports:export',
    ],
  },
  {
    name: 'FARMER',
    displayName: { en: 'Farmer', te: 'రైతు', hi: 'किसान' },
    isSystem: true,
    permissions: [
      'listings:create:own', 'listings:read', 'listings:update:own', 'listings:delete:own',
      'bookings:create:own', 'bookings:read:own', 'bookings:update:own',
      'services:read',
      'prices:read',
      'weather:read',
      'community:create', 'community:read', 'community:update:own',
      'reviews:create:own',
      'disputes:create:own', 'disputes:read:own',
      'exchange:create:own', 'exchange:read',
      'jobs:create:own', 'jobs:read',
      'schemes:read',
      'calendar:read', 'calendar:create:own', 'calendar:update:own',
      'alerts:create:own', 'alerts:read:own',
    ],
  },
  {
    name: 'VENDOR',
    displayName: { en: 'Service Provider', te: 'సేవా ప్రదాత', hi: 'सेवा प्रदाता' },
    isSystem: true,
    permissions: [
      'services:create:own', 'services:read', 'services:update:own', 'services:delete:own',
      'bookings:read:assigned', 'bookings:update:assigned',
      'availability:create:own', 'availability:read:own', 'availability:update:own',
      'payments:read:own',
      'reviews:read:own',
      'disputes:create:own', 'disputes:read:own',
      'jobs:read', 'jobs:bid',
      'earnings:read:own',
    ],
  },
  {
    name: 'LABOR_INDIVIDUAL',
    displayName: { en: 'Farm Worker', te: 'వ్యవసాయ కార్మికుడు', hi: 'खेत मजदूर' },
    isSystem: true,
    permissions: [
      'services:create:own', 'services:read', 'services:update:own',
      'bookings:read:assigned', 'bookings:update:assigned',
      'availability:create:own', 'availability:update:own',
      'jobs:read', 'jobs:bid',
      'attendance:create:own', 'attendance:read:own',
      'payments:read:own',
    ],
  },
  {
    name: 'LABOR_TEAM_LEADER',
    displayName: { en: 'Team Leader', te: 'జట్టు నాయకుడు', hi: 'टीम लीडर' },
    isSystem: true,
    parent: 'LABOR_INDIVIDUAL',
    permissions: [
      // Inherits LABOR_INDIVIDUAL permissions +
      'teams:create:own', 'teams:read:own', 'teams:update:own',
      'attendance:read:team', 'attendance:update:team',
      'payments:read:team',
    ],
  },
  {
    name: 'FPO_ADMIN',
    displayName: { en: 'FPO Administrator', te: 'FPO నిర్వాహకుడు', hi: 'FPO प्रशासक' },
    isSystem: true,
    permissions: [
      'users:read:organization', 'users:manage:organization',
      'bookings:read:organization',
      'services:read:organization',
      'payments:read:organization',
      'reports:read:organization', 'reports:export:organization',
      'exchange:read:organization',
      'group-buy:create', 'group-buy:manage:organization',
    ],
  },
  {
    name: 'GOVERNMENT_OFFICER',
    displayName: { en: 'Agriculture Officer', te: 'వ్యవసాయ అధికారి', hi: 'कृषि अधिकारी' },
    isSystem: true,
    permissions: [
      'users:read:geographic',
      'bookings:read:geographic',
      'reports:read:geographic', 'reports:export:geographic',
      'schemes:manage',
      'news:create',
      'community:read',
    ],
  },
  {
    name: 'SUPPORT_AGENT',
    displayName: { en: 'Support Agent', te: 'సపోర్ట్ ఏజెంట్', hi: 'सपोर्ट एजेंट' },
    isSystem: true,
    parent: 'PLATFORM_ADMIN',
    permissions: [
      'users:read',
      'bookings:read', 'bookings:update',
      'disputes:read', 'disputes:update',
      'reviews:read',
    ],
  },
  {
    name: 'CONTENT_MODERATOR',
    displayName: { en: 'Content Moderator', te: 'కంటెంట్ మోడరేటర్', hi: 'कंटेंट मॉडरेटर' },
    isSystem: true,
    parent: 'PLATFORM_ADMIN',
    permissions: [
      'community:read', 'community:update', 'community:delete',
      'reviews:read', 'reviews:delete',
      'news:create', 'news:update', 'news:delete',
      'listings:read', 'listings:update',
    ],
  },
];
```

---

## Migration Strategy

### Step 1: Add new tables (non-breaking)
```bash
prisma migrate dev --name add_rbac_tables
```

### Step 2: Seed default roles and permissions
```bash
npx ts-node prisma/seeds/rbac-seed.ts
```

### Step 3: Migrate existing users
```typescript
// For each user with legacyRole:
// 1. Find matching RoleDefinition
// 2. Create UserRole record
// 3. Mark legacyRole as migrated
```

### Step 4: Update auth middleware
- Keep old `authenticate` middleware working
- Add new `requirePermission` middleware
- Gradually protect routes with permissions

### Step 5: Update JWT generation
- Include roles and permissions in token
- Extend token expiry handling

### Step 6: Remove legacy Role enum
- After all routes are migrated to new RBAC
- Remove `role` field from User model
- Remove old `Role` enum

---

## Frontend Changes

### Token Handling (shared/api-client)
```typescript
// Decode JWT to get permissions
const decoded = jwtDecode(token);
const permissions = decoded.permissions; // ['bookings:create', 'services:read', ...]
const roles = decoded.roles; // [{ role: 'FARMER', orgId: null }, { role: 'VENDOR', orgId: null }]
```

### Permission Hook
```typescript
// packages/shared/hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuth();
  
  const can = (resource: string, action: string): boolean => {
    return user?.permissions?.includes(`${resource}:${action}`) || 
           user?.permissions?.includes('*:*');
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some(r => r.role === roleName);
  };

  return { can, hasRole };
}
```

### Route Guards
```typescript
// Farmer app: hide vendor features
if (!can('services', 'create')) {
  // Don't show "List your service" button
}

// Partner app: show earnings dashboard only for vendors
if (hasRole('VENDOR') || hasRole('LABOR_TEAM_LEADER')) {
  // Show earnings tab
}
```

---

## Testing Checklist

- [ ] Create a user with FARMER role → verify can only access farmer endpoints
- [ ] Assign VENDOR role to same user → verify can now access vendor endpoints
- [ ] Create custom role with limited permissions → verify it works
- [ ] Test FPO_ADMIN can see org members' data but not others'
- [ ] Test GOVERNMENT_OFFICER geographic scope (district level)
- [ ] Test role expiry (temporary roles)
- [ ] Test audit log captures all CRUD operations
- [ ] Test JWT contains correct roles and permissions after role change
- [ ] Test backward compatibility — old tokens still work during migration
- [ ] Load test permission middleware (should add <5ms per request)

---

## Files to Create/Modify

### New Files
```
backend/src/middleware/permissions.ts       # Permission check middleware
backend/src/middleware/audit.ts             # Audit logging middleware
backend/src/routes/roles.ts                # Role management routes
backend/src/routes/permissions.ts          # Permission management routes
backend/src/services/auditService.ts       # Audit logging service
backend/src/services/rbacService.ts        # RBAC helper functions
backend/prisma/seeds/rbac-seed.ts          # Seed roles & permissions
packages/shared/types/rbac.ts             # TypeScript types
packages/shared/hooks/usePermission.ts    # Frontend permission hook
```

### Modified Files
```
backend/prisma/schema.prisma              # Add RBAC models
backend/src/middleware/auth.ts             # Update JWT handling
backend/src/services/authService.ts        # Update token generation
backend/src/routes/auth.ts                # Include roles in login response
backend/src/index.ts                      # Mount new routes
web/src/hooks/useAuth.ts                  # Parse permissions from JWT
```

---

## Definition of Done

- [ ] RBAC tables created and migrated
- [ ] 10 system roles seeded with correct permissions
- [ ] Existing users migrated to new role system
- [ ] JWT includes roles and permissions
- [ ] `requirePermission` middleware protects all 17 existing routes
- [ ] Custom role creation API works
- [ ] Role assignment API works
- [ ] Audit log captures all mutations
- [ ] Frontend `usePermission` hook works
- [ ] All existing tests still pass
- [ ] API documentation updated
