import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { AppError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess } from '../../utils/response';
import { CACHE_TTL as APP_CACHE_TTL, BLOCK_REASON, SLOT_TYPE } from '../../constants';
import { checkAvailability } from '../../services/bookingService';
import { cacheGet, cacheSet } from '../../config/redis';

export async function getCalendar(req: AuthRequest, res: Response) {
  const providerId = req.params.providerId as string;
  const { month, year, serviceListingId } = req.query as Record<string, string>;

  const targetYear = parseInt(year) || new Date().getFullYear();
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const cacheKey = `availability:${providerId}:${targetYear}-${targetMonth}:${serviceListingId || 'all'}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'WEATHER_HOLD', 'PENDING'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    select: { id: true, startDate: true, endDate: true, slotType: true, status: true, bookingNumber: true },
  });

  const blockedSlots = await prisma.availabilitySlot.findMany({
    where: {
      providerId,
      date: { gte: startDate, lte: endDate },
      ...(serviceListingId ? { OR: [{ serviceListingId }, { serviceListingId: null }] } : {}),
    },
  });

  const calendar: Record<string, any> = {};
  const daysInMonth = endDate.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(targetYear, targetMonth - 1, day);
    const dateStr = date.toISOString().slice(0, 10);

    const dayBookings = bookings.filter((b: any) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return bStart <= new Date(date.getTime() + 86400000) && bEnd >= date;
    });

    const dayBlocked = blockedSlots.filter((s: any) => {
      const slotDate = new Date(s.date);
      return slotDate.toISOString().slice(0, 10) === dateStr;
    });

    const slots: Record<string, string> = {};
    for (const slotType of [SLOT_TYPE.MORNING, SLOT_TYPE.AFTERNOON, SLOT_TYPE.FULL_DAY]) {
      const isBookedSlot = dayBookings.some((b: any) => !b.slotType || b.slotType === slotType || b.slotType === SLOT_TYPE.FULL_DAY);
      const isBlockedSlot = dayBlocked.some((s: any) => s.slotType === slotType && (!s.isAvailable || s.isBlocked));

      if (isBookedSlot) slots[slotType] = 'BOOKED';
      else if (isBlockedSlot) slots[slotType] = 'BLOCKED';
      else slots[slotType] = 'AVAILABLE';
    }

    calendar[dateStr] = { date: dateStr, slots, bookingCount: dayBookings.length };
  }

  const result = { calendar, month: targetMonth, year: targetYear };
  await cacheSet(cacheKey, result, APP_CACHE_TTL.AVAILABILITY);

  sendSuccess(res, result);
}

export async function check(req: AuthRequest, res: Response) {
  const providerId = req.params.providerId as string;
  const { startDate, endDate, slotType } = req.query as Record<string, string>;

  if (!startDate || !endDate) {
    throw new AppError('startDate and endDate are required.', 400);
  }

  const result = await checkAvailability(
    providerId,
    new Date(startDate),
    new Date(endDate),
    slotType,
  );

  sendSuccess(res, result);
}

export async function updateSlots(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });

  if (!provider) throw new ForbiddenError('Not a service provider.');

  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new AppError('slots array is required.', 400);
  }

  const results = [];
  for (const slot of slots) {
    const { date, slotType, isAvailable, serviceListingId } = slot;

    const upserted = await prisma.availabilitySlot.upsert({
      where: {
        providerId_date_slotType_serviceListingId: {
          providerId: provider.id,
          date: new Date(date),
          slotType,
          serviceListingId: serviceListingId || '',
        },
      },
      create: {
        providerId: provider.id,
        date: new Date(date),
        slotType,
        isAvailable,
        serviceListingId: serviceListingId || null,
      },
      update: { isAvailable },
    });
    results.push(upserted);
  }

  sendSuccess(res, results);
}

export async function blockDates(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });

  if (!provider) throw new ForbiddenError('Not a service provider.');

  const { startDate, endDate, reason, serviceListingId } = req.body;
  if (!startDate || !endDate) {
    throw new AppError('startDate and endDate are required.', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const blocked = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (const slotType of [SLOT_TYPE.MORNING, SLOT_TYPE.AFTERNOON, SLOT_TYPE.FULL_DAY]) {
      const slot = await prisma.availabilitySlot.upsert({
        where: {
          providerId_date_slotType_serviceListingId: {
            providerId: provider.id,
            date: new Date(d),
            slotType,
            serviceListingId: serviceListingId || '',
          },
        },
        create: {
          providerId: provider.id,
          date: new Date(d),
          slotType,
          isAvailable: false,
          isBlocked: true,
          blockReason: reason || BLOCK_REASON.PERSONAL,
          serviceListingId: serviceListingId || null,
        },
        update: {
          isAvailable: false,
          isBlocked: true,
          blockReason: reason || BLOCK_REASON.PERSONAL,
        },
      });
      blocked.push(slot);
    }
  }

  sendSuccess(res, { blockedCount: blocked.length });
}
