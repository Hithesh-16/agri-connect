import { Job } from 'bullmq';
import { prisma } from '../config';
import { createWorker, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';
import {
  checkAvailability,
  calculatePricing,
  generateBookingNumber,
  makeStatusEntry,
} from '../services/bookingService';

const log = createChildLogger('recurring-booking-worker');

async function processRecurringBookings(job: Job) {
  log.info('Processing recurring bookings');

  const activeRecurring = await prisma.recurringBooking.findMany({
    where: {
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } },
      ],
    },
    include: {
      bookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });

  for (const recurring of activeRecurring) {
    try {
      // Get the listing for pricing
      const listing = await prisma.serviceListing.findUnique({
        where: { id: recurring.serviceListingId },
        include: { category: true },
      });

      if (!listing || !listing.isActive) {
        log.warn({ recurringId: recurring.id }, 'Listing inactive — skipping');
        continue;
      }

      // Find next occurrence after the last booking
      const lastBookingDate = recurring.bookings[0]?.startDate || recurring.startDate;
      const next = getNextOccurrence(recurring, lastBookingDate);

      if (!next) continue;
      if (recurring.endDate && next > recurring.endDate) continue;

      const dayEnd = new Date(next);
      dayEnd.setHours(18, 0, 0, 0);

      const { available } = await checkAvailability(recurring.providerId, next, dayEnd, recurring.slotType || undefined);
      if (!available) {
        log.info({ recurringId: recurring.id, date: next }, 'Slot unavailable — skipping');
        continue;
      }

      const rawBase = Number(listing.pricePerUnit);
      const pricing = calculatePricing(rawBase);
      const bookingNumber = await generateBookingNumber();

      await prisma.booking.create({
        data: {
          bookingNumber,
          farmerId: recurring.farmerId,
          providerId: recurring.providerId,
          serviceListingId: recurring.serviceListingId,
          bookingType: listing.category.bookingType,
          startDate: next,
          endDate: dayEnd,
          slotType: recurring.slotType || null,
          farmLocation: {}, // Will be filled from first booking or farmer profile
          ...pricing,
          status: 'PENDING',
          statusHistory: [makeStatusEntry('PENDING', 'SYSTEM', 'Auto-generated from recurring booking')],
          recurringBookingId: recurring.id,
        },
      });

      await prisma.recurringBooking.update({
        where: { id: recurring.id },
        data: {
          nextOccurrence: next,
          totalGenerated: { increment: 1 },
        },
      });

      log.info({ recurringId: recurring.id, bookingNumber, date: next }, 'Recurring booking created');
    } catch (err) {
      log.error({ err, recurringId: recurring.id }, 'Failed to process recurring booking');
    }
  }
}

function getNextOccurrence(
  recurring: { frequency: string; dayOfWeek?: number | null; dayOfMonth?: number | null },
  afterDate: Date,
): Date | null {
  const next = new Date(afterDate);

  switch (recurring.frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      if (recurring.dayOfMonth) next.setDate(recurring.dayOfMonth);
      break;
    default:
      return null;
  }

  next.setHours(6, 0, 0, 0);
  return next;
}

export function startRecurringBookingWorker() {
  return createWorker(QUEUES.RECURRING_BOOKING, processRecurringBookings, 1);
}
