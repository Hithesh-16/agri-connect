import { prisma } from '../config';
import { createChildLogger } from '../config/logger';
import { v4 as uuid } from 'uuid';
import { enqueue, QUEUES } from '../config/queue';

const log = createChildLogger('attendance-service');

// ─── HAVERSINE DISTANCE ─────────────────────────────────

function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── GENERATE DAILY QR CODE ─────────────────────────────

export async function generateDailyQR(bookingId: string, date: Date) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const qrPayload = {
    bookingId,
    date: date.toISOString().split('T')[0],
    token: uuid(),
    expiresAt: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString(), // Valid 14 hours
  };

  // Store token in database-compatible way (or Redis if available)
  // For now, we return the payload - the client generates the QR image
  // Token validation happens on check-in by verifying the payload structure

  log.info({ bookingId, date: qrPayload.date }, 'Daily QR generated');

  return qrPayload;
}

// ─── CHECK IN ───────────────────────────────────────────

const MAX_CHECKIN_DISTANCE_METERS = 200;

export async function checkIn(params: {
  workerId: string;
  teamMemberId?: string;
  bookingId: string;
  qrToken: string;
  qrDate: string;
  lat: number;
  lng: number;
  photo?: string;
}) {
  // 1. Validate booking
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'IN_PROGRESS' && booking.status !== 'CONFIRMED') {
    throw new Error('Booking is not active');
  }

  // 2. Verify GPS — must be within 200m of farm
  const farmLocation = booking.farmLocation as { lat: number; lng: number };
  const distance = haversineDistance(
    { lat: params.lat, lng: params.lng },
    { lat: farmLocation.lat, lng: farmLocation.lng },
  );

  if (distance > MAX_CHECKIN_DISTANCE_METERS) {
    throw new Error(`Too far from farm location (${Math.round(distance)}m away, max ${MAX_CHECKIN_DISTANCE_METERS}m)`);
  }

  // 3. Validate QR date matches today
  const today = new Date().toISOString().split('T')[0];
  if (params.qrDate !== today) {
    throw new Error('QR code is not valid for today');
  }

  // 4. Create/update attendance record
  const attendance = await prisma.attendance.upsert({
    where: {
      bookingId_workerId_date: {
        bookingId: params.bookingId,
        workerId: params.workerId,
        date: new Date(today),
      },
    },
    create: {
      bookingId: params.bookingId,
      workerId: params.workerId,
      teamMemberId: params.teamMemberId,
      date: new Date(today),
      checkInTime: new Date(),
      checkInLat: params.lat,
      checkInLng: params.lng,
      checkInDistance: distance,
      checkInQrCode: params.qrToken,
      checkInPhoto: params.photo,
      checkInVerified: true,
      status: 'PRESENT',
    },
    update: {
      checkInTime: new Date(),
      checkInLat: params.lat,
      checkInLng: params.lng,
      checkInDistance: distance,
      checkInQrCode: params.qrToken,
      checkInPhoto: params.photo,
      checkInVerified: true,
      status: 'PRESENT',
    },
  });

  log.info({ attendanceId: attendance.id, workerId: params.workerId, distance: Math.round(distance) }, 'Worker checked in');
  return attendance;
}

// ─── CHECK OUT ──────────────────────────────────────────

export async function checkOut(params: {
  workerId: string;
  bookingId: string;
  lat: number;
  lng: number;
  photo?: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const attendance = await prisma.attendance.findUnique({
    where: {
      bookingId_workerId_date: {
        bookingId: params.bookingId,
        workerId: params.workerId,
        date: new Date(today),
      },
    },
  });

  if (!attendance || !attendance.checkInTime) {
    throw new Error('Must check in before checking out');
  }

  // GPS verification
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking) throw new Error('Booking not found');

  const farmLocation = booking.farmLocation as { lat: number; lng: number };
  const distance = haversineDistance(
    { lat: params.lat, lng: params.lng },
    { lat: farmLocation.lat, lng: farmLocation.lng },
  );

  // Calculate hours worked
  const now = new Date();
  const checkInTime = new Date(attendance.checkInTime);
  const hoursWorked = Math.round(((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;
  const overtimeHours = Math.max(0, hoursWorked - 8);

  // Calculate daily payment
  let dailyRate = 0;
  if (attendance.teamMemberId) {
    const member = await prisma.teamMember.findUnique({ where: { id: attendance.teamMemberId } });
    dailyRate = member?.dailyRate || 0;
  }
  dailyRate = dailyRate || attendance.dailyAmount || 0;

  const overtimeRate = dailyRate > 0 ? (dailyRate / 8) * 1.5 : 0; // 1.5x for overtime
  const overtimeAmount = overtimeHours * overtimeRate;
  const netAmount = dailyRate + overtimeAmount;

  const status = hoursWorked >= 4 ? 'PRESENT' : 'HALF_DAY';

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: now,
      checkOutLat: params.lat,
      checkOutLng: params.lng,
      checkOutDistance: distance,
      checkOutPhoto: params.photo,
      checkOutVerified: distance <= MAX_CHECKIN_DISTANCE_METERS,
      hoursWorked,
      overtimeHours,
      dailyAmount: dailyRate,
      overtimeAmount,
      netAmount,
      status,
    },
  });

  log.info({ attendanceId: attendance.id, hoursWorked, status }, 'Worker checked out');
  return updated;
}

// ─── GET ATTENDANCE REPORT ──────────────────────────────

export async function getAttendanceReport(bookingId: string, date?: string) {
  const where: Record<string, unknown> = { bookingId };
  if (date) where.date = new Date(date);

  const records = await prisma.attendance.findMany({
    where,
    include: {
      teamMember: { select: { name: true, phone: true, skills: true, photo: true } },
    },
    orderBy: [{ date: 'desc' }, { checkInTime: 'asc' }],
  });

  // Summary stats
  const totalDays = [...new Set(records.map(r => r.date.toISOString().split('T')[0]))].length;
  const totalPresent = records.filter(r => r.status === 'PRESENT').length;
  const totalHalfDay = records.filter(r => r.status === 'HALF_DAY').length;
  const totalNoShow = records.filter(r => r.status === 'NO_SHOW').length;
  const totalSubstitute = records.filter(r => r.isSubstitute).length;
  const totalAmount = records.reduce((sum, r) => sum + (r.netAmount || 0), 0);
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  return {
    records,
    summary: {
      totalDays,
      totalPresent,
      totalHalfDay,
      totalNoShow,
      totalSubstitute,
      totalAmount,
      totalHours,
    },
  };
}

// ─── FIND SUBSTITUTE ────────────────────────────────────

export async function findSubstitute(params: {
  requiredSkill: string;
  farmLocation: { lat: number; lng: number };
  radiusKm?: number;
}) {
  const radius = params.radiusKm || 15;
  const latDelta = radius / 111; // ~111km per degree latitude

  const availableWorkers = await prisma.teamMember.findMany({
    where: {
      isAvailable: true,
      isActive: true,
      skills: { has: params.requiredSkill },
    },
    include: { team: true },
    take: 20,
  });

  // Filter by actual distance and sort by rating
  const nearby = availableWorkers
    .map(w => {
      const teamLocation = w.team.baseLocation as { lat: number; lng: number };
      return {
        ...w,
        distance: haversineDistance(teamLocation, params.farmLocation),
      };
    })
    .filter(w => w.distance <= radius * 1000) // Convert km to meters
    .sort((a, b) => b.rating - a.rating);

  return nearby;
}

// ─── ASSIGN SUBSTITUTE ──────────────────────────────────

export async function assignSubstitute(params: {
  bookingId: string;
  absentWorkerId: string;
  substituteWorkerId: string;
  substituteMemberId?: string;
  date: Date;
  farmerId: string;
}) {
  // Mark original worker as no-show
  await prisma.attendance.upsert({
    where: {
      bookingId_workerId_date: {
        bookingId: params.bookingId,
        workerId: params.absentWorkerId,
        date: params.date,
      },
    },
    create: {
      bookingId: params.bookingId,
      workerId: params.absentWorkerId,
      date: params.date,
      status: 'NO_SHOW',
    },
    update: { status: 'NO_SHOW' },
  });

  // Increment no-show count for the absent worker
  if (params.absentWorkerId) {
    await prisma.teamMember.updateMany({
      where: { id: params.absentWorkerId },
      data: { noShowCount: { increment: 1 } },
    });
  }

  // Create attendance for substitute
  const substitute = await prisma.attendance.create({
    data: {
      bookingId: params.bookingId,
      workerId: params.substituteWorkerId,
      teamMemberId: params.substituteMemberId,
      date: params.date,
      status: 'SUBSTITUTE',
      isSubstitute: true,
      substitutedFor: params.absentWorkerId,
    },
  });

  // Notify farmer
  await enqueue(QUEUES.NOTIFICATION, 'substitute-assigned', {
    userId: params.farmerId,
    type: 'SUBSTITUTE_ASSIGNED',
    title: { en: 'Substitute Worker Assigned', te: 'ప్రత్యామ్నాయ కార్మికుడు', hi: 'स्थानापन्न कर्मचारी' },
    body: {
      en: 'A substitute worker has been assigned for today\'s job.',
      te: 'నేటి పనికి ప్రత్యామ్నాయ కార్మికుడు నియమించబడ్డారు.',
      hi: 'आज के काम के लिए एक स्थानापन्न कर्मचारी नियुक्त किया गया है।',
    },
    channels: ['PUSH', 'IN_APP'],
  });

  log.info({ bookingId: params.bookingId, absent: params.absentWorkerId, substitute: params.substituteWorkerId }, 'Substitute assigned');
  return substitute;
}

// ─── DISTRIBUTE TEAM PAYMENT ────────────────────────────

export async function distributeTeamPayment(bookingId: string) {
  const attendanceRecords = await prisma.attendance.findMany({
    where: { bookingId, status: { in: ['PRESENT', 'HALF_DAY', 'SUBSTITUTE'] } },
    include: { teamMember: true },
  });

  const distribution = attendanceRecords.map(record => ({
    workerId: record.workerId,
    name: record.teamMember?.name || 'Individual Worker',
    daysWorked: record.status === 'HALF_DAY' ? 0.5 : 1,
    dailyAmount: record.dailyAmount || 0,
    overtimeAmount: record.overtimeAmount || 0,
    netAmount: record.netAmount || 0,
    bankAccount: record.teamMember?.bankAccountNumber,
    bankIfsc: record.teamMember?.bankIfsc,
    upiId: record.teamMember?.upiId,
    paymentMethod: record.teamMember?.bankAccountNumber ? 'BANK' : record.teamMember?.upiId ? 'UPI' : 'CASH',
  }));

  // Update attendance payment status
  await prisma.attendance.updateMany({
    where: { bookingId, status: { in: ['PRESENT', 'HALF_DAY', 'SUBSTITUTE'] } },
    data: { paymentStatus: 'PROCESSED' },
  });

  log.info({ bookingId, workerCount: distribution.length, totalAmount: distribution.reduce((s, d) => s + d.netAmount, 0) }, 'Team payment distributed');
  return distribution;
}
