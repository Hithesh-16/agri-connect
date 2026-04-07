import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { paginate } from '../../utils/pagination';
import { NotFoundError } from '../../errors/app-error';
import { sendSuccess, sendMessage } from '../../utils/response';
import { cacheDelete } from '../../config/redis';

export async function list(req: AuthRequest, res: Response) {
  const roles = await prisma.roleDefinition.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { userRoles: true } },
    },
    orderBy: { name: 'asc' },
  });

  sendSuccess(res, roles);
}

export async function detail(req: AuthRequest, res: Response) {
  const role = await prisma.roleDefinition.findUnique({
    where: { id: req.params.id as string },
    include: {
      permissions: { include: { permission: true } },
      userRoles: {
        include: {
          user: { select: { id: true, mobile: true, firstName: true, surname: true } },
        },
      },
    },
  });

  if (!role) throw new NotFoundError('Role');

  sendSuccess(res, role);
}

export async function assignRole(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const { roleId, organizationId, expiresAt } = req.body;

  const userRole = await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {
      isActive: true,
      organizationId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      assignedBy: req.user!.userId,
    },
    create: {
      userId,
      roleId,
      organizationId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      assignedBy: req.user!.userId,
    },
    include: { role: true },
  });

  await cacheDelete(`permissions:${userId}`);
  await cacheDelete(`roles:${userId}`);

  sendSuccess(res, userRole);
}

export async function removeRole(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const roleId = req.params.roleId as string;

  await prisma.userRole.updateMany({
    where: { userId, roleId },
    data: { isActive: false },
  });

  await cacheDelete(`permissions:${userId}`);
  await cacheDelete(`roles:${userId}`);

  sendMessage(res, 'Role removed.');
}

export async function getUserRoles(req: AuthRequest, res: Response) {
  const roles = await prisma.userRole.findMany({
    where: { userId: req.params.userId as string, isActive: true },
    include: { role: true, organization: true },
  });

  sendSuccess(res, roles);
}

export async function getPermissions(_req: AuthRequest, res: Response) {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });

  sendSuccess(res, permissions);
}

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const userId = req.query.userId as string | undefined;
  const resource = req.query.resource as string | undefined;
  const action = req.query.action as string | undefined;
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);

  const where: any = {};
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, mobile: true, firstName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  sendSuccess(res, logs, { page, limit, total, totalPages: Math.ceil(total / limit) });
}
