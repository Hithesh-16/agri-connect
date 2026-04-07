import { createChildLogger } from '../config/logger';
import {
  BOOKING_STATUS,
  PLATFORM_FEE_RATE,
  GST_RATE,
  MAINTENANCE_BUFFER,
  CANCELLED_BY,
} from '../constants';
import * as bookingRepo from '../repositories/booking-repository';
import * as availabilityRepo from '../repositories/availability-repository';
import * as serviceListingRepo from '../repositories/service-listing-repository';
import * as providerRepo from '../repositories/provider-repository';
import { haversineDistance } from '../utils/geo';
import { paginate } from '../utils/pagination';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../errors/app-error';
import { enqueue, QUEUES } from '../config/queue';

const log = createChildLogger('booking-service');

// ─── STATE MACHINE ──────────────────────────────────────

const S = BOOKING_STATUS;

export const VALID_TRANSITIONS: Record<string, string[]> = {
  [S.PENDING]: [S.CONFIRMED, S.CANCELLED],
  [S.CONFIRMED]: [S.IN_PROGRESS, S.CANCELLED, S.WEATHER_HOLD, S.RESCHEDULED],
  [S.IN_PROGRESS]: [S.COMPLETED, S.DISPUTED],
  [S.COMPLETED]: [S.DISPUTED],
  [S.WEATHER_HOLD]: [S.RESCHEDULED, S.CANCELLED],
  [S.RESCHEDULED]: [S.CONFIRMED, S.CANCELLED],
  [S.CANCELLED]: [],
  [S.DISPUTED]: [S.COMPLETED, S.CANCELLED],
};

export const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'PENDING→CONFIRMED': ['PROVIDER', 'SYSTEM'],
  'PENDING→CANCELLED': ['FARMER', 'PROVIDER', 'SYSTEM'],
  'CONFIRMED→IN_PROGRESS': ['PROVIDER'],
  'CONFIRMED→CANCELLED': ['FARMER', 'PROVIDER', 'ADMIN'],
  'CONFIRMED→WEATHER_HOLD': ['SYSTEM', 'PROVIDER', 'ADMIN'],
  'CONFIRMED→RESCHEDULED': ['FARMER', 'PROVIDER'],
  'IN_PROGRESS→COMPLETED': ['PROVIDER'],
  'COMPLETED→DISPUTED': ['FARMER'],
  'WEATHER_HOLD→RESCHEDULED': ['FARMER', 'PROVIDER'],
  'WEATHER_HOLD→CANCELLED': ['FARMER', 'PROVIDER'],
  'RESCHEDULED→CONFIRMED': ['PROVIDER'],
  'RESCHEDULED→CANCELLED': ['FARMER', 'PROVIDER'],
  'DISPUTED→COMPLETED': ['ADMIN'],
  'DISPUTED→CANCELLED': ['ADMIN'],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canPerformTransition(from: string, to: string, role: string): boolean {
  const key = `${from}→${to}`;
  return TRANSITION_PERMISSIONS[key]?.includes(role) ?? false;
}

// ─── BOOKING NUMBER ─────────────────────────────────────

export async function generateBookingNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `KC-BK-${dateStr}`;
  const count = await bookingRepo.countByPrefix(prefix);
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// ─── PRICING ────────────────────────────────────────────

export function calculatePricing(basePrice: number) {
  const platformFee = Math.round(basePrice * PLATFORM_FEE_RATE * 100) / 100;
  const gstAmount = Math.round(platformFee * GST_RATE * 100) / 100;
  const totalAmount = Math.round((basePrice + platformFee + gstAmount) * 100) / 100;
  return { basePrice, platformFee, gstAmount, totalAmount };
}

// ─── AVAILABILITY / CONFLICT DETECTION ──────────────────

export async function checkAvailability(
  providerId: string,
  startDate: Date,
  endDate: Date,
  slotType?: string,
  excludeBookingId?: string,
): Promise<{ available: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];

  const conflictingBookings = await bookingRepo.findConflicting(
    providerId,
    startDate,
    endDate,
    ['CONFIRMED', 'IN_PROGRESS', 'WEATHER_HOLD'],
    excludeBookingId,
  );

  const realConflicts = slotType
    ? conflictingBookings.filter((b) => !b.slotType || b.slotType === slotType || b.slotType === 'FULL_DAY' || slotType === 'FULL_DAY')
    : conflictingBookings;

  if (realConflicts.length > 0) {
    conflicts.push(
      ...realConflicts.map((b) => `Booking ${b.bookingNumber} overlaps (${b.startDate.toISOString()} - ${b.endDate.toISOString()})`),
    );
  }

  const blockedSlots = await availabilityRepo.findSlots({
    providerId,
    date: { gte: startDate, lte: endDate },
    isAvailable: false,
    ...(slotType ? { slotType } : {}),
  });

  if (blockedSlots.length > 0) {
    conflicts.push(`${blockedSlots.length} slot(s) are blocked in the requested range`);
  }

  return { available: conflicts.length === 0, conflicts };
}

// ─── TRANSIT BUFFER ─────────────────────────────────────

export function calculateTransitBuffer(
  fromLocation: { lat: number; lng: number },
  toLocation: { lat: number; lng: number },
): number {
  const distanceKm = haversineDistance(fromLocation, toLocation);
  if (distanceKm < 20) return 0;
  if (distanceKm < 50) return 0.5;
  if (distanceKm < 100) return 1;
  return Math.ceil(distanceKm / 100);
}

// ─── MAINTENANCE BUFFER ─────────────────────────────────

export const MAINTENANCE_BUFFERS = MAINTENANCE_BUFFER;

// ─── CANCELLATION FEE ───────────────────────────────────

export function calculateCancellationFee(
  booking: { startDate: Date; totalAmount: number; status: string; cancelledBy?: string | null },
  providerType: string,
): { refundPercent: number; fee: number; reason: string } {
  const hoursUntilStart = (booking.startDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isMachinery = providerType === 'MACHINERY_OWNER';

  if (booking.status === S.WEATHER_HOLD) {
    return { refundPercent: 100, fee: 0, reason: 'Weather cancellation - full refund' };
  }
  if (booking.cancelledBy === 'PROVIDER') {
    return { refundPercent: 100, fee: 0, reason: 'Provider cancelled - full refund' };
  }

  if (isMachinery) {
    if (hoursUntilStart >= 48) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (48h+ before)' };
    if (hoursUntilStart >= 24) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (24-48h)' };
    return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<24h)' };
  }

  if (hoursUntilStart >= 24) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (24h+ before)' };
  if (hoursUntilStart >= 12) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (12-24h)' };
  return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<12h)' };
}

// ─── RECURRING BOOKING HELPERS ──────────────────────────

export function generateOccurrences(
  params: { frequency: string; dayOfWeek?: number; dayOfMonth?: number; startDate: Date; endDate?: Date | null },
  count: number,
): Date[] {
  const dates: Date[] = [];
  const current = new Date(params.startDate);
  const end = params.endDate ? new Date(params.endDate) : null;

  for (let i = 0; i < count; i++) {
    if (end && current > end) break;

    if (i > 0) {
      switch (params.frequency) {
        case 'WEEKLY':
          current.setDate(current.getDate() + 7);
          break;
        case 'BIWEEKLY':
          current.setDate(current.getDate() + 14);
          break;
        case 'MONTHLY':
          current.setMonth(current.getMonth() + 1);
          if (params.dayOfMonth) current.setDate(params.dayOfMonth);
          break;
      }
    }

    dates.push(new Date(current));
  }

  return dates;
}

// ─── STATUS HISTORY ENTRY ───────────────────────────────

export function makeStatusEntry(status: string, changedBy: string, reason?: string) {
  return {
    status,
    timestamp: new Date().toISOString(),
    changedBy,
    reason: reason || null,
  };
}

// ═══════════════════════════════════════════════════════════
// ORCHESTRATION METHODS (called by controllers)
// ═══════════════════════════════════════════════════════════

export async function createBooking(farmerId: string, input: {
  serviceListingId: string; startDate: string; endDate: string; slotType?: string;
  farmLocation: any; farmSize?: number; cropType?: string; farmerNotes?: string;
}) {
  const listing = await serviceListingRepo.findById(input.serviceListingId, { provider: true, category: true });
  if (!listing || !listing.isActive || listing.isPaused) throw new NotFoundError('Service listing');
  if ((listing as any).provider.userId === farmerId) throw new AppError('Cannot book your own service.', 400);

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (start >= end) throw new AppError('endDate must be after startDate.', 400);

  const { available, conflicts } = await checkAvailability((listing as any).provider.id, start, end, input.slotType);
  if (!available) throw new ConflictError(`Provider not available. Conflicts: ${conflicts.join('; ')}`);

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const rawBase = Number(listing.pricePerUnit) * (input.farmSize || days);
  const pricing = calculatePricing(rawBase);
  const bookingNumber = await generateBookingNumber();

  const booking = await bookingRepo.create({
    bookingNumber,
    farmer: { connect: { id: farmerId } },
    provider: { connect: { id: (listing as any).provider.id } },
    serviceListing: { connect: { id: input.serviceListingId } },
    bookingType: (listing as any).category.bookingType,
    startDate: start,
    endDate: end,
    slotType: input.slotType || null,
    farmLocation: input.farmLocation,
    farmSize: input.farmSize || null,
    cropType: input.cropType || null,
    ...pricing,
    status: S.PENDING,
    statusHistory: [makeStatusEntry(S.PENDING, farmerId, 'Booking created')],
    farmerNotes: input.farmerNotes || null,
  }, {
    serviceListing: { select: { title: true } },
    provider: { select: { businessName: true, userId: true } },
  });

  await enqueue(QUEUES.NOTIFICATION, 'booking-created', {
    type: 'push', to: (booking as any).provider.userId,
    title: 'New Booking Request',
    body: `New booking ${bookingNumber} from a farmer. Please review.`,
    data: { bookingId: booking.id, screen: 'BookingDetail' },
  });

  log.info({ bookingId: booking.id, bookingNumber }, 'Booking created');
  return booking;
}

export async function listBookings(userId: string, filters: { status?: string; role?: string; page?: string; limit?: string }) {
  const { page: p, limit: l, skip } = paginate(filters.page, filters.limit);
  const provider = await providerRepo.findByUserId(userId);

  const where: any = {};
  if (filters.status) where.status = filters.status;

  if (filters.role === 'provider' && provider) {
    where.providerId = provider.id;
  } else if (filters.role === 'farmer') {
    where.farmerId = userId;
  } else {
    where.OR = [{ farmerId: userId }, ...(provider ? [{ providerId: provider.id }] : [])];
  }

  const [bookings, total] = await bookingRepo.findMany(where, { skip, take: l }, {
    serviceListing: { select: { title: true, images: true, unit: true } },
    provider: { select: { businessName: true, profilePhoto: true, type: true } },
    farmer: { select: { firstName: true, surname: true, mobile: true, village: true } },
  });

  return { bookings, total, page: p, limit: l };
}

export async function getBookingDetail(bookingId: string, userId: string, permissionScope: string) {
  const booking = await bookingRepo.findById(bookingId, {
    serviceListing: { include: { category: true } },
    provider: { select: { id: true, businessName: true, profilePhoto: true, type: true, userId: true, rating: true, totalBookings: true, latitude: true, longitude: true } },
    farmer: { select: { id: true, firstName: true, surname: true, mobile: true, village: true, district: true } },
    chatConversation: { select: { id: true } },
  });

  if (!booking) throw new NotFoundError('Booking');

  const isParty = booking.farmerId === userId || (booking as any).provider.userId === userId;
  if (!isParty && permissionScope !== 'all') throw new ForbiddenError('Not authorized to view this booking.');

  return booking;
}

export async function updateBookingStatus(
  bookingId: string, newStatus: string, userId: string, permissionScope: string, reason?: string,
) {
  const booking = await bookingRepo.findById(bookingId, { provider: { select: { userId: true, type: true } } });
  if (!booking) throw new NotFoundError('Booking');

  if (!isValidTransition(booking.status, newStatus)) {
    throw new AppError(`Cannot transition from ${booking.status} to ${newStatus}.`, 400);
  }

  let role: string = CANCELLED_BY.FARMER;
  if ((booking as any).provider.userId === userId) role = CANCELLED_BY.PROVIDER;
  if (permissionScope === 'all') role = 'ADMIN';

  if (!canPerformTransition(booking.status, newStatus, role)) {
    throw new ForbiddenError(`${role} cannot perform this transition.`);
  }

  const updateData: any = {
    status: newStatus,
    statusHistory: { push: makeStatusEntry(newStatus, userId, reason) },
  };

  if (newStatus === S.COMPLETED) {
    updateData.completedAt = new Date();
    if (role === CANCELLED_BY.PROVIDER) updateData.providerConfirmed = true;
    if (role === CANCELLED_BY.FARMER) updateData.farmerConfirmed = true;
  }

  const updated = await bookingRepo.update(bookingId, updateData, {
    serviceListing: { select: { title: true } },
    provider: { select: { businessName: true, userId: true } },
    farmer: { select: { firstName: true, mobile: true } },
  });

  const notifyUserId = role === CANCELLED_BY.FARMER ? (updated as any).provider.userId : updated.farmerId;
  await enqueue(QUEUES.NOTIFICATION, 'booking-status', {
    type: 'push', to: notifyUserId,
    title: `Booking ${newStatus}`,
    body: `Booking ${updated.bookingNumber} has been updated to ${newStatus}.`,
    data: { bookingId: updated.id, screen: 'BookingDetail' },
  });

  log.info({ bookingId: updated.id, from: booking.status, to: newStatus }, 'Booking status updated');
  return updated;
}

export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await bookingRepo.findById(bookingId, { provider: { select: { userId: true, type: true } } });
  if (!booking) throw new NotFoundError('Booking');

  if (!isValidTransition(booking.status, S.CANCELLED)) {
    throw new AppError(`Cannot cancel a booking with status ${booking.status}.`, 400);
  }

  const cancelledBy = (booking as any).provider.userId === userId ? CANCELLED_BY.PROVIDER : CANCELLED_BY.FARMER;
  const cancellation = calculateCancellationFee({ ...booking, cancelledBy }, (booking as any).provider.type);

  const updated = await bookingRepo.update(bookingId, {
    status: S.CANCELLED,
    cancelledBy,
    cancellationReason: reason || null,
    cancellationFee: cancellation.fee,
    statusHistory: { push: makeStatusEntry(S.CANCELLED, userId, reason || cancellation.reason) },
  });

  const notifyUserId = cancelledBy === CANCELLED_BY.FARMER ? (booking as any).provider.userId : booking.farmerId;
  await enqueue(QUEUES.NOTIFICATION, 'booking-cancelled', {
    type: 'push', to: notifyUserId,
    title: 'Booking Cancelled',
    body: `Booking ${updated.bookingNumber} has been cancelled. ${cancellation.reason}`,
    data: { bookingId: updated.id },
  });

  log.info({ bookingId: updated.id, cancelledBy }, 'Booking cancelled');
  return { booking: updated, cancellation };
}

export async function rescheduleBooking(
  bookingId: string, userId: string, input: { startDate: string; endDate: string; slotType?: string; reason?: string },
) {
  const booking = await bookingRepo.findById(bookingId, { provider: { select: { userId: true } } });
  if (!booking) throw new NotFoundError('Booking');

  if (!isValidTransition(booking.status, S.RESCHEDULED)) {
    throw new AppError(`Cannot reschedule a booking with status ${booking.status}.`, 400);
  }

  const newStart = new Date(input.startDate);
  const newEnd = new Date(input.endDate);

  const { available, conflicts } = await checkAvailability(booking.providerId, newStart, newEnd, input.slotType, booking.id);
  if (!available) throw new ConflictError(`Provider not available. Conflicts: ${conflicts.join('; ')}`);

  const updated = await bookingRepo.update(bookingId, {
    status: S.RESCHEDULED,
    originalStartDate: booking.originalStartDate || booking.startDate,
    startDate: newStart,
    endDate: newEnd,
    slotType: input.slotType || booking.slotType,
    rescheduledFrom: booking.id,
    statusHistory: { push: makeStatusEntry(S.RESCHEDULED, userId, input.reason || 'Rescheduled') },
  });

  const notifyUserId = (booking as any).provider.userId === userId ? booking.farmerId : (booking as any).provider.userId;
  await enqueue(QUEUES.NOTIFICATION, 'booking-rescheduled', {
    type: 'push', to: notifyUserId,
    title: 'Booking Rescheduled',
    body: `Booking ${updated.bookingNumber} has been rescheduled to ${newStart.toLocaleDateString()}.`,
    data: { bookingId: updated.id },
  });

  return updated;
}

export async function createRecurringBooking(farmerId: string, input: {
  serviceListingId: string; frequency: string; dayOfWeek?: number; dayOfMonth?: number;
  slotType?: string; startDate: string; endDate?: string; farmLocation: any; farmSize?: number; cropType?: string;
}) {
  const listing = await serviceListingRepo.findById(input.serviceListingId, { provider: true, category: true });
  if (!listing || !listing.isActive) throw new NotFoundError('Service listing');

  const recurring = await bookingRepo.createRecurring({
    farmerId,
    providerId: (listing as any).provider.id,
    serviceListingId: input.serviceListingId,
    frequency: input.frequency,
    dayOfWeek: input.dayOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    slotType: input.slotType || null,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : null,
  });

  const occurrences = generateOccurrences(
    { frequency: input.frequency, dayOfWeek: input.dayOfWeek, dayOfMonth: input.dayOfMonth, startDate: new Date(input.startDate), endDate: input.endDate ? new Date(input.endDate) : null },
    4,
  );

  const createdBookings = [];
  for (const date of occurrences) {
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const { available } = await checkAvailability((listing as any).provider.id, date, dayEnd, input.slotType);
    if (!available) continue;

    const rawBase = Number(listing.pricePerUnit) * (input.farmSize || 1);
    const pricing = calculatePricing(rawBase);
    const bookingNumber = await generateBookingNumber();

    const booking = await bookingRepo.create({
      bookingNumber,
      farmer: { connect: { id: farmerId } },
      provider: { connect: { id: (listing as any).provider.id } },
      serviceListing: { connect: { id: input.serviceListingId } },
      bookingType: (listing as any).category.bookingType,
      startDate: date,
      endDate: dayEnd,
      slotType: input.slotType || null,
      farmLocation: input.farmLocation,
      farmSize: input.farmSize || null,
      cropType: input.cropType || null,
      ...pricing,
      status: S.PENDING,
      statusHistory: [makeStatusEntry(S.PENDING, farmerId, 'Recurring booking')],
      recurringBooking: { connect: { id: recurring.id } },
    });
    createdBookings.push(booking);
  }

  await bookingRepo.updateRecurring(recurring.id, { totalGenerated: createdBookings.length });
  return { recurring, bookings: createdBookings };
}

export async function cancelRecurringBooking(recurringId: string, userId: string) {
  const recurring = await bookingRepo.findRecurringById(recurringId);
  if (!recurring) throw new NotFoundError('Recurring booking');
  if (recurring.farmerId !== userId) throw new ForbiddenError('Not authorized.');

  await bookingRepo.cancelRecurringSeries(recurringId);
}
