import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { AppError, NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendMessage } from '../../utils/response';
import {
  generateDailyQR,
  checkIn,
  checkOut,
  getAttendanceReport,
  findSubstitute,
  assignSubstitute,
  distributeTeamPayment,
} from '../../services/attendanceService';

export async function generateQR(req: AuthRequest, res: Response) {
  const farmerId = req.user!.userId;
  const bookingId = req.params.bookingId as string;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');
  if (booking.farmerId !== farmerId) throw new ForbiddenError('Only the booking farmer can generate QR codes.');

  const date = req.body.date ? new Date(req.body.date) : new Date();
  const qrPayload = await generateDailyQR(bookingId, date);

  sendSuccess(res, qrPayload);
}

export async function doCheckIn(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { bookingId, qrToken, qrDate, lat, lng, photo, teamMemberId } = req.body;

  if (!bookingId || !qrToken || !qrDate || lat === undefined || lng === undefined) {
    throw new AppError('bookingId, qrToken, qrDate, lat, and lng are required.', 400);
  }

  const workerId = teamMemberId || userId;

  const attendance = await checkIn({
    workerId,
    teamMemberId,
    bookingId,
    qrToken,
    qrDate,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    photo,
  });

  sendSuccess(res, attendance);
}

export async function doCheckOut(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { bookingId, lat, lng, photo, teamMemberId } = req.body;

  if (!bookingId || lat === undefined || lng === undefined) {
    throw new AppError('bookingId, lat, and lng are required.', 400);
  }

  const workerId = teamMemberId || userId;

  const attendance = await checkOut({
    workerId,
    bookingId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    photo,
  });

  sendSuccess(res, attendance);
}

export async function getReport(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const bookingId = req.params.bookingId as string;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { provider: true },
  });

  if (!booking) throw new NotFoundError('Booking');

  if (booking.farmerId !== userId && booking.provider.userId !== userId) {
    throw new ForbiddenError('Unauthorized to view this attendance report.');
  }

  const date = req.query.date as string | undefined;
  const report = await getAttendanceReport(bookingId, date);

  sendSuccess(res, report);
}

export async function getSubstitutes(req: AuthRequest, res: Response) {
  const skill = req.query.skill as string | undefined;
  const lat = req.query.lat as string | undefined;
  const lng = req.query.lng as string | undefined;
  const radius = req.query.radius as string | undefined;

  if (!skill || !lat || !lng) {
    throw new AppError('skill, lat, and lng are required.', 400);
  }

  const workers = await findSubstitute({
    requiredSkill: skill,
    farmLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
    radiusKm: radius ? parseFloat(radius) : 15,
  });

  sendSuccess(res, workers);
}

export async function addSubstitute(req: AuthRequest, res: Response) {
  const { bookingId, absentWorkerId, substituteWorkerId, substituteMemberId, date } = req.body;

  if (!bookingId || !absentWorkerId || !substituteWorkerId || !date) {
    throw new AppError('bookingId, absentWorkerId, substituteWorkerId, and date are required.', 400);
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');

  const attendance = await assignSubstitute({
    bookingId,
    absentWorkerId,
    substituteWorkerId,
    substituteMemberId,
    date: new Date(date),
    farmerId: booking.farmerId,
  });

  sendSuccess(res, attendance);
}

export async function distributePayment(req: AuthRequest, res: Response) {
  const bookingId = req.params.bookingId as string;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');
  if (booking.status !== 'COMPLETED') throw new AppError('Booking must be completed before distributing payment.', 400);

  const distribution = await distributeTeamPayment(bookingId);
  sendSuccess(res, distribution);
}
