import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AuthRequest } from '../types';
import { prisma } from '../config';
import {
  generateDailyQR,
  checkIn,
  checkOut,
  getAttendanceReport,
  findSubstitute,
  assignSubstitute,
  distributeTeamPayment,
} from '../services/attendanceService';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('attendance-route');

// ─── GENERATE DAILY QR CODE ─────────────────────────────
router.post('/qr/:bookingId', authenticate, requirePermission('attendance', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!.userId;
    const bookingId = req.params.bookingId as string;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (booking.farmerId !== farmerId) {
      res.status(403).json({ success: false, error: 'Only the booking farmer can generate QR codes.' });
      return;
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    const qrPayload = await generateDailyQR(bookingId, date);

    res.json({ success: true, data: qrPayload });
  } catch (err: any) {
    log.error({ err }, 'Failed to generate QR');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── CHECK IN ───────────────────────────────────────────
router.post('/check-in', authenticate, requirePermission('attendance', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { bookingId, qrToken, qrDate, lat, lng, photo, teamMemberId } = req.body;

    if (!bookingId || !qrToken || !qrDate || lat === undefined || lng === undefined) {
      res.status(400).json({ success: false, error: 'bookingId, qrToken, qrDate, lat, and lng are required.' });
      return;
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

    res.json({ success: true, data: attendance });
  } catch (err: any) {
    log.error({ err }, 'Check-in failed');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── CHECK OUT ──────────────────────────────────────────
router.post('/check-out', authenticate, requirePermission('attendance', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { bookingId, lat, lng, photo, teamMemberId } = req.body;

    if (!bookingId || lat === undefined || lng === undefined) {
      res.status(400).json({ success: false, error: 'bookingId, lat, and lng are required.' });
      return;
    }

    const workerId = teamMemberId || userId;

    const attendance = await checkOut({
      workerId,
      bookingId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      photo,
    });

    res.json({ success: true, data: attendance });
  } catch (err: any) {
    log.error({ err }, 'Check-out failed');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── GET ATTENDANCE REPORT ──────────────────────────────
router.get('/booking/:bookingId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const bookingId = req.params.bookingId as string;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (booking.farmerId !== userId && booking.provider.userId !== userId) {
      res.status(403).json({ success: false, error: 'Unauthorized to view this attendance report.' });
      return;
    }

    const date = req.query.date as string | undefined;
    const report = await getAttendanceReport(bookingId, date);

    res.json({ success: true, data: report });
  } catch (err: any) {
    log.error({ err }, 'Failed to get attendance report');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── FIND SUBSTITUTE WORKERS ────────────────────────────
router.get('/substitutes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const skill = req.query.skill as string | undefined;
    const lat = req.query.lat as string | undefined;
    const lng = req.query.lng as string | undefined;
    const radius = req.query.radius as string | undefined;

    if (!skill || !lat || !lng) {
      res.status(400).json({ success: false, error: 'skill, lat, and lng are required.' });
      return;
    }

    const workers = await findSubstitute({
      requiredSkill: skill,
      farmLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radiusKm: radius ? parseFloat(radius) : 15,
    });

    res.json({ success: true, data: workers });
  } catch (err: any) {
    log.error({ err }, 'Failed to find substitutes');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ASSIGN SUBSTITUTE ──────────────────────────────────
router.post('/substitute', authenticate, requirePermission('attendance', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, absentWorkerId, substituteWorkerId, substituteMemberId, date } = req.body;

    if (!bookingId || !absentWorkerId || !substituteWorkerId || !date) {
      res.status(400).json({ success: false, error: 'bookingId, absentWorkerId, substituteWorkerId, and date are required.' });
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    const attendance = await assignSubstitute({
      bookingId,
      absentWorkerId,
      substituteWorkerId,
      substituteMemberId,
      date: new Date(date),
      farmerId: booking.farmerId,
    });

    res.json({ success: true, data: attendance });
  } catch (err: any) {
    log.error({ err }, 'Failed to assign substitute');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── DISTRIBUTE TEAM PAYMENT ────────────────────────────
router.post('/distribute-payment/:bookingId', authenticate, requirePermission('payments', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({ success: false, error: 'Booking must be completed before distributing payment.' });
      return;
    }

    const distribution = await distributeTeamPayment(bookingId);
    res.json({ success: true, data: distribution });
  } catch (err: any) {
    log.error({ err }, 'Failed to distribute payment');
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
