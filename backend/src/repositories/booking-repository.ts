import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── BOOKING ────────────────────────────────────────────

export async function findById(id: string, include?: Prisma.BookingInclude) {
  return prisma.booking.findUnique({ where: { id }, include });
}

export async function findMany(
  where: Prisma.BookingWhereInput,
  pagination: { skip: number; take: number },
  include?: Prisma.BookingInclude,
) {
  return Promise.all([
    prisma.booking.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include,
    }),
    prisma.booking.count({ where }),
  ]);
}

export async function create(data: Prisma.BookingCreateInput, include?: Prisma.BookingInclude) {
  return prisma.booking.create({ data, include });
}

export async function update(id: string, data: Prisma.BookingUpdateInput, include?: Prisma.BookingInclude) {
  return prisma.booking.update({ where: { id }, data, include });
}

export async function updateMany(where: Prisma.BookingWhereInput, data: Prisma.BookingUpdateManyMutationInput) {
  return prisma.booking.updateMany({ where, data });
}

export async function countByPrefix(prefix: string) {
  return prisma.booking.count({
    where: { bookingNumber: { startsWith: prefix } },
  });
}

export async function findConflicting(
  providerId: string,
  startDate: Date,
  endDate: Date,
  statuses: string[],
  excludeId?: string,
) {
  return prisma.booking.findMany({
    where: {
      providerId,
      status: { in: statuses },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
    },
    select: { id: true, bookingNumber: true, startDate: true, endDate: true, slotType: true },
  });
}

// ─── RECURRING BOOKING ──────────────────────────────────

export async function findRecurringById(id: string) {
  return prisma.recurringBooking.findUnique({ where: { id } });
}

export async function createRecurring(data: Prisma.RecurringBookingCreateInput) {
  return prisma.recurringBooking.create({ data });
}

export async function updateRecurring(id: string, data: Prisma.RecurringBookingUpdateInput) {
  return prisma.recurringBooking.update({ where: { id }, data });
}

export async function findActiveRecurring() {
  return prisma.recurringBooking.findMany({
    where: {
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    include: {
      bookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });
}

export async function cancelRecurringSeries(recurringId: string) {
  return prisma.$transaction([
    prisma.recurringBooking.update({
      where: { id: recurringId },
      data: { isActive: false },
    }),
    prisma.booking.updateMany({
      where: {
        recurringBookingId: recurringId,
        status: 'PENDING',
        startDate: { gt: new Date() },
      },
      data: {
        status: 'CANCELLED',
        cancelledBy: 'FARMER',
        cancellationReason: 'Recurring series cancelled',
      },
    }),
  ]);
}
