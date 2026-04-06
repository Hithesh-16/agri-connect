import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../config';
import { cacheGet, cacheSet } from '../config/redis';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('rbac');

const PERMISSION_CACHE_TTL = 300; // 5 minutes

interface UserPermission {
  resource: string;
  action: string;
  scope: string;
  conditions?: Record<string, unknown>;
}

// Load user permissions (with Redis cache)
async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const cacheKey = `permissions:${userId}`;
  const cached = await cacheGet<UserPermission[]>(cacheKey);
  if (cached) return cached;

  const userRoles = await prisma.userRole.findMany({
    where: { userId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions: UserPermission[] = [];
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.push({
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.scope,
        conditions: rp.conditions as Record<string, unknown> | undefined,
      });
    }
  }

  await cacheSet(cacheKey, permissions, PERMISSION_CACHE_TTL);
  return permissions;
}

// Check if user has a specific permission
function hasPermission(
  permissions: UserPermission[],
  resource: string,
  action: string,
): UserPermission | undefined {
  return permissions.find((p) => {
    // Exact match
    if (p.resource === resource && p.action === action) return true;
    // "manage" action grants all actions on that resource
    if (p.resource === resource && p.action === 'manage') return true;
    // Wildcard resource with manage grants everything
    if (p.resource === '*' && p.action === 'manage') return true;
    return false;
  });
}

/**
 * Middleware: require a specific permission.
 * Usage: router.get('/admin/users', authenticate, requirePermission('users', 'read'), handler)
 */
export function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    try {
      const permissions = await getUserPermissions(req.user.userId);

      const match = hasPermission(permissions, resource, action);
      if (!match) {
        log.warn({ userId: req.user.userId, resource, action }, 'Permission denied');
        res.status(403).json({ success: false, error: 'You do not have permission to perform this action.' });
        return;
      }

      // Attach permissions and matched scope to request for row-level filtering
      (req as any).permissions = permissions;
      (req as any).permissionScope = match.scope;
      (req as any).permissionConditions = match.conditions;

      next();
    } catch (err) {
      log.error({ err, userId: req.user.userId }, 'Permission check failed');
      res.status(500).json({ success: false, error: 'Authorization check failed.' });
    }
  };
}

/**
 * Middleware: require any of the specified roles.
 * Simpler alternative when you just need role-based access.
 * Usage: router.get('/admin', authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), handler)
 */
export function requireRole(...roleNames: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    try {
      const cacheKey = `roles:${req.user.userId}`;
      let userRoleNames = await cacheGet<string[]>(cacheKey);

      if (!userRoleNames) {
        const userRoles = await prisma.userRole.findMany({
          where: { userId: req.user.userId, isActive: true },
          include: { role: { select: { name: true } } },
        });
        userRoleNames = userRoles.map((ur) => ur.role.name);
        await cacheSet(cacheKey, userRoleNames, PERMISSION_CACHE_TTL);
      }

      const hasRole = roleNames.some((rn) => userRoleNames!.includes(rn));
      if (!hasRole) {
        log.warn({ userId: req.user.userId, required: roleNames, has: userRoleNames }, 'Role denied');
        res.status(403).json({ success: false, error: 'Insufficient role privileges.' });
        return;
      }

      (req as any).userRoles = userRoleNames;
      next();
    } catch (err) {
      log.error({ err }, 'Role check failed');
      res.status(500).json({ success: false, error: 'Authorization check failed.' });
    }
  };
}
