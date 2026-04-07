import { prisma } from '../config';
import { createChildLogger } from '../config/logger';
import {
  BOOKING_STATUS,
  PLATFORM_FEE_RATE,
  GST_RATE,
  MAINTENANCE_BUFFER,
} from '../constants';

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

  const count = await prisma.booking.count({
    where: {
      bookingNumber: { startsWith: prefix },
    },
  });

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

  // 1. Check existing bookings for overlap
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'WEATHER_HOLD'] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
    select: { id: true, bookingNumber: true, startDate: true, endDate: true, slotType: true },
  });

  // For slot-based bookings, only conflict if same slot type
  const realConflicts = slotType
    ? conflictingBookings.filter(b => !b.slotType || b.slotType === slotType || b.slotType === 'FULL_DAY' || slotType === 'FULL_DAY')
    : conflictingBookings;

  if (realConflicts.length > 0) {
    conflicts.push(...realConflicts.map(b => `Booking ${b.bookingNumber} overlaps (${b.startDate.toISOString()} - ${b.endDate.toISOString()})`));
  }

  // 2. Check blocked availability slots
  const blockedSlots = await prisma.availabilitySlot.findMany({
    where: {
      providerId,
      date: { gte: startDate, lte: endDate },
      isAvailable: false,
      ...(slotType ? { slotType } : {}),
    },
  });

  if (blockedSlots.length > 0) {
    conflicts.push(`${blockedSlots.length} slot(s) are blocked in the requested range`);
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  };
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

function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const calc = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
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

  if (booking.status === 'WEATHER_HOLD') {
    return { refundPercent: 100, fee: 0, reason: 'Weather cancellation - full refund' };
  }

  if (booking.cancelledBy === 'PROVIDER') {
    return { refundPercent: 100, fee: 0, reason: 'Provider cancelled - full refund' };
  }

  if (isMachinery) {
    if (hoursUntilStart >= 48) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (48h+ before)' };
    if (hoursUntilStart >= 24) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (24-48h)' };
    return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<24h)' };
  } else {
    if (hoursUntilStart >= 24) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (24h+ before)' };
    if (hoursUntilStart >= 12) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (12-24h)' };
    return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<12h)' };
  }
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
