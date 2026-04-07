import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── NOTIFICATION ───────────────────────────────────────

export async function create(data: Prisma.NotificationCreateInput) {
  return prisma.notification.create({ data });
}

export async function findById(id: string) {
  return prisma.notification.findUnique({ where: { id } });
}

export async function findMany(
  where: Prisma.NotificationWhereInput,
  pagination: { skip: number; take: number },
) {
  return Promise.all([
    prisma.notification.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
}

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function update(id: string, data: Prisma.NotificationUpdateInput) {
  return prisma.notification.update({ where: { id }, data });
}

// ─── DEVICE TOKEN ───────────────────────────────────────

export async function upsertDeviceToken(userId: string, token: string, platform: string) {
  return prisma.deviceToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform, isActive: true, lastUsedAt: new Date() },
  });
}

export async function deactivateDeviceToken(token: string, userId: string) {
  return prisma.deviceToken.updateMany({
    where: { token, userId },
    data: { isActive: false },
  });
}

export async function findActiveDeviceTokens(userId: string) {
  return prisma.deviceToken.findMany({
    where: { userId, isActive: true },
  });
}

export async function deactivateDeviceTokenById(id: string) {
  return prisma.deviceToken.update({
    where: { id },
    data: { isActive: false },
  });
}
