import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/permissions';
import { prisma } from '../config';
import { AuthRequest } from '../types';
import { paginate, paginatedResponse } from '../types';
import { cacheDelete } from '../config/redis';

// Helper: safely extract string from Express v5 query param
const qs = (val: unknown): string | undefined => typeof val === 'string' ? val : undefined;

const router = Router();

// GET /api/roles — list all role definitions
router.get('/', authenticate, requirePermission('roles', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.roleDefinition.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch roles.' });
  }
});

// GET /api/roles/:id — single role with permissions
router.get('/:id', authenticate, requirePermission('roles', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.roleDefinition.findUnique({
      where: { id: String(req.params.id) },
      include: {
        permissions: { include: { permission: true } },
        userRoles: { include: { user: { select: { id: true, mobile: true, firstName: true, surname: true } } } },
      },
    });
    if (!role) {
      res.status(404).json({ success: false, error: 'Role not found.' });
      return;
    }
    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch role.' });
  }
});

// POST /api/users/:userId/roles — assign role to user
const assignRoleSchema = z.object({
  roleId: z.string().min(1),
  organizationId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

router.post('/users/:userId/roles', authenticate, requirePermission('roles', 'manage'), validate(assignRoleSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const { roleId, organizationId, expiresAt } = req.body;

    const userRole = await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: { isActive: true, organizationId, expiresAt: expiresAt ? new Date(expiresAt) : null, assignedBy: req.user!.userId },
      create: { userId, roleId, organizationId, expiresAt: expiresAt ? new Date(expiresAt) : null, assignedBy: req.user!.userId },
      include: { role: true },
    });

    // Invalidate permission cache for this user
    await cacheDelete(`permissions:${userId}`);
    await cacheDelete(`roles:${userId}`);

    res.json({ success: true, data: userRole });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to assign role.' });
  }
});

// DELETE /api/users/:userId/roles/:roleId — remove role from user
router.delete('/users/:userId/roles/:roleId', authenticate, requirePermission('roles', 'manage'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const roleId = String(req.params.roleId);

    await prisma.userRole.updateMany({
      where: { userId, roleId },
      data: { isActive: false },
    });

    await cacheDelete(`permissions:${userId}`);
    await cacheDelete(`roles:${userId}`);

    res.json({ success: true, message: 'Role removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove role.' });
  }
});

// GET /api/users/:userId/roles — get user's roles
router.get('/users/:userId/roles', authenticate, requirePermission('users', 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.userRole.findMany({
      where: { userId: String(req.params.userId), isActive: true },
      include: { role: true, organization: true },
    });
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user roles.' });
  }
});

// GET /api/permissions — list all permissions
router.get('/permissions', authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    res.json({ success: true, data: permissions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch permissions.' });
  }
});

// GET /api/audit-logs — query audit logs (admin only)
router.get('/audit-logs', authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = qs(req.query.userId);
    const resource = qs(req.query.resource);
    const action = qs(req.query.action);
    const pag = paginate(qs(req.query.page), qs(req.query.limit));

    const where: any = {};
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, mobile: true, firstName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: pag.skip,
        take: pag.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(logs, total, pag.page, pag.limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

export default router;
