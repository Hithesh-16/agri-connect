import { Router, Response } from 'express';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { ENDPOINTS, BOOKING_STATUS, RESOURCE, ACTION, CANCELLED_BY } from '../constants';
import {
  generateBookingNumber,
  calculatePricing,
  checkAvailability,
  isValidTransition,
  canPerformTransition,
  calculateCancellationFee,
  makeStatusEntry,
  generateOccurrences,
} from '../services/bookingService';
import { enqueue, QUEUES } from '../config/queue';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('bookings-route');
const E = ENDPOINTS.BOOKINGS;

// ─── CREATE BOOKING ─────────────────────────────────────
router.post(E.CREATE, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.CREATE), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!.userId;
    const {
      serviceListingId, startDate, endDate, slotType,
      farmLocation, farmSize, cropType, farmerNotes,
    } = req.body;

    if (!serviceListingId || !startDate || !endDate || !farmLocation) {
      res.status(400).json({ success: false, error: 'serviceListingId, startDate, endDate, and farmLocation are required.' });
      return;
    }

    const listing = await prisma.serviceListing.findUnique({
      where: { id: serviceListingId },
      include: { provider: true, category: true },
    });

    if (!listing || !listing.isActive || listing.isPaused) {
      res.status(404).json({ success: false, error: 'Service listing not found or unavailable.' });
      return;
    }

    if (listing.provider.userId === farmerId) {
      res.status(400).json({ success: false, error: 'Cannot book your own service.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      res.status(400).json({ success: false, error: 'endDate must be after startDate.' });
      return;
    }

    const { available, conflicts } = await checkAvailability(listing.providerId, start, end, slotType);
    if (!available) {
      res.status(409).json({ success: false, error: 'Provider not available for the requested dates.', data: { conflicts } });
      return;
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const rawBase = Number(listing.pricePerUnit) * (farmSize || days);
    const pricing = calculatePricing(rawBase);

    const bookingNumber = await generateBookingNumber();
    const bookingType = listing.category.bookingType;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        farmerId,
        providerId: listing.providerId,
        serviceListingId,
        bookingType,
        startDate: start,
        endDate: end,
        slotType: slotType || null,
        farmLocation,
        farmSize: farmSize || null,
        cropType: cropType || null,
        ...pricing,
        status: BOOKING_STATUS.PENDING,
        statusHistory: [makeStatusEntry(BOOKING_STATUS.PENDING, farmerId, 'Booking created')],
        farmerNotes: farmerNotes || null,
      },
      include: {
        serviceListing: { select: { title: true } },
        provider: { select: { businessName: true, userId: true } },
      },
    });

    await enqueue(QUEUES.NOTIFICATION, 'booking-created', {
      type: 'push',
      to: booking.provider.userId,
      title: 'New Booking Request',
      body: `New booking ${bookingNumber} from a farmer. Please review.`,
      data: { bookingId: booking.id, screen: 'BookingDetail' },
    });

    log.info({ bookingId: booking.id, bookingNumber }, 'Booking created');
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    log.error({ err }, 'Failed to create booking');
    res.status(500).json({ success: false, error: 'Failed to create booking.' });
  }
});

// ─── LIST BOOKINGS ──────────────────────────────────────
router.get(E.LIST, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.READ), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    const role = req.query.role as string | undefined;
    const { page: p, limit: l, skip } = paginate(req.query.page as string, req.query.limit as string);

    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });

    const where: any = {};
    if (status) where.status = status;

    if (role === 'provider' && provider) {
      where.providerId = provider.id;
    } else if (role === 'farmer') {
      where.farmerId = userId;
    } else {
      where.OR = [
        { farmerId: userId },
        ...(provider ? [{ providerId: provider.id }] : []),
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceListing: { select: { title: true, images: true, unit: true } },
          provider: { select: { businessName: true, profilePhoto: true, type: true } },
          farmer: { select: { firstName: true, surname: true, mobile: true, village: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(bookings, total, p, l) });
  } catch (err) {
    log.error({ err }, 'Failed to list bookings');
    res.status(500).json({ success: false, error: 'Failed to list bookings.' });
  }
});

// ─── GET BOOKING DETAIL ─────────────────────────────────
router.get(E.DETAIL, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.READ), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        serviceListing: { include: { category: true } },
        provider: { select: { id: true, businessName: true, profilePhoto: true, type: true, userId: true, rating: true, totalBookings: true, latitude: true, longitude: true } },
        farmer: { select: { id: true, firstName: true, surname: true, mobile: true, village: true, district: true } },
        chatConversation: { select: { id: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    const userId = req.user!.userId;
    const isParty = booking.farmerId === userId || booking.provider.userId === userId;
    const scope = (req as any).permissionScope;
    if (!isParty && scope !== 'all') {
      res.status(403).json({ success: false, error: 'Not authorized to view this booking.' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    log.error({ err }, 'Failed to get booking');
    res.status(500).json({ success: false, error: 'Failed to get booking.' });
  }
});

// ─── UPDATE BOOKING STATUS ──────────────────────────────
router.put(E.UPDATE_STATUS, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.UPDATE), async (req: AuthRequest, res: Response) => {
  try {
    const { status: newStatus, reason } = req.body;
    const userId = req.user!.userId;

    if (!newStatus) {
      res.status(400).json({ success: false, error: 'status is required.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: { provider: { select: { userId: true, type: true } } },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (!isValidTransition(booking.status, newStatus)) {
      res.status(400).json({ success: false, error: `Cannot transition from ${booking.status} to ${newStatus}.` });
      return;
    }

    let role: string = CANCELLED_BY.FARMER;
    if (booking.provider.userId === userId) role = CANCELLED_BY.PROVIDER;
    const scope = (req as any).permissionScope;
    if (scope === 'all') role = 'ADMIN';

    if (!canPerformTransition(booking.status, newStatus, role)) {
      res.status(403).json({ success: false, error: `${role} cannot perform this transition.` });
      return;
    }

    const updateData: any = {
      status: newStatus,
      statusHistory: {
        push: makeStatusEntry(newStatus, userId, reason),
      },
    };

    if (newStatus === BOOKING_STATUS.COMPLETED) {
      updateData.completedAt = new Date();
      if (role === CANCELLED_BY.PROVIDER) updateData.providerConfirmed = true;
      if (role === CANCELLED_BY.FARMER) updateData.farmerConfirmed = true;
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        serviceListing: { select: { title: true } },
        provider: { select: { businessName: true, userId: true } },
        farmer: { select: { firstName: true, mobile: true } },
      },
    });

    const notifyUserId = role === CANCELLED_BY.FARMER ? updated.provider.userId : updated.farmerId;
    await enqueue(QUEUES.NOTIFICATION, 'booking-status', {
      type: 'push',
      to: notifyUserId,
      title: `Booking ${newStatus}`,
      body: `Booking ${updated.bookingNumber} has been updated to ${newStatus}.`,
      data: { bookingId: updated.id, screen: 'BookingDetail' },
    });

    log.info({ bookingId: updated.id, from: booking.status, to: newStatus }, 'Booking status updated');
    res.json({ success: true, data: updated });
  } catch (err) {
    log.error({ err }, 'Failed to update booking status');
    res.status(500).json({ success: false, error: 'Failed to update booking status.' });
  }
});

// ─── CANCEL BOOKING ─────────────────────────────────────
router.post(E.CANCEL, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.UPDATE), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: { provider: { select: { userId: true, type: true } } },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (!isValidTransition(booking.status, BOOKING_STATUS.CANCELLED)) {
      res.status(400).json({ success: false, error: `Cannot cancel a booking with status ${booking.status}.` });
      return;
    }

    const cancelledBy = booking.provider.userId === userId ? CANCELLED_BY.PROVIDER : CANCELLED_BY.FARMER;
    const cancellation = calculateCancellationFee(
      { ...booking, cancelledBy },
      booking.provider.type,
    );

    const updated = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledBy,
        cancellationReason: reason || null,
        cancellationFee: cancellation.fee,
        statusHistory: {
          push: makeStatusEntry(BOOKING_STATUS.CANCELLED, userId, reason || cancellation.reason),
        },
      },
    });

    const notifyUserId = cancelledBy === CANCELLED_BY.FARMER ? booking.provider.userId : booking.farmerId;
    await enqueue(QUEUES.NOTIFICATION, 'booking-cancelled', {
      type: 'push',
      to: notifyUserId,
      title: 'Booking Cancelled',
      body: `Booking ${updated.bookingNumber} has been cancelled. ${cancellation.reason}`,
      data: { bookingId: updated.id },
    });

    log.info({ bookingId: updated.id, cancelledBy }, 'Booking cancelled');
    res.json({ success: true, data: { booking: updated, cancellation } });
  } catch (err) {
    log.error({ err }, 'Failed to cancel booking');
    res.status(500).json({ success: false, error: 'Failed to cancel booking.' });
  }
});

// ─── RESCHEDULE BOOKING ─────────────────────────────────
router.post(E.RESCHEDULE, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.UPDATE), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, slotType, reason } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required.' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: { provider: { select: { userId: true } } },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }

    if (!isValidTransition(booking.status, BOOKING_STATUS.RESCHEDULED)) {
      res.status(400).json({ success: false, error: `Cannot reschedule a booking with status ${booking.status}.` });
      return;
    }

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    const { available, conflicts } = await checkAvailability(booking.providerId, newStart, newEnd, slotType, booking.id);
    if (!available) {
      res.status(409).json({ success: false, error: 'Provider not available for the new dates.', data: { conflicts } });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: {
        status: BOOKING_STATUS.RESCHEDULED,
        originalStartDate: booking.originalStartDate || booking.startDate,
        startDate: newStart,
        endDate: newEnd,
        slotType: slotType || booking.slotType,
        rescheduledFrom: booking.id,
        statusHistory: {
          push: makeStatusEntry(BOOKING_STATUS.RESCHEDULED, userId, reason || 'Rescheduled'),
        },
      },
    });

    const notifyUserId = booking.provider.userId === userId ? booking.farmerId : booking.provider.userId;
    await enqueue(QUEUES.NOTIFICATION, 'booking-rescheduled', {
      type: 'push',
      to: notifyUserId,
      title: 'Booking Rescheduled',
      body: `Booking ${updated.bookingNumber} has been rescheduled to ${newStart.toLocaleDateString()}.`,
      data: { bookingId: updated.id },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    log.error({ err }, 'Failed to reschedule booking');
    res.status(500).json({ success: false, error: 'Failed to reschedule booking.' });
  }
});

// ─── CREATE RECURRING BOOKING ───────────────────────────
router.post(E.RECURRING_CREATE, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.CREATE), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = req.user!.userId;
    const {
      serviceListingId, frequency, dayOfWeek, dayOfMonth, slotType,
      startDate, endDate, farmLocation, farmSize, cropType,
    } = req.body;

    if (!serviceListingId || !frequency || !startDate || !farmLocation) {
      res.status(400).json({ success: false, error: 'serviceListingId, frequency, startDate, and farmLocation are required.' });
      return;
    }

    const listing = await prisma.serviceListing.findUnique({
      where: { id: serviceListingId },
      include: { provider: true, category: true },
    });

    if (!listing || !listing.isActive) {
      res.status(404).json({ success: false, error: 'Service listing not found.' });
      return;
    }

    const recurring = await prisma.recurringBooking.create({
      data: {
        farmerId,
        providerId: listing.providerId,
        serviceListingId,
        frequency,
        dayOfWeek: dayOfWeek ?? null,
        dayOfMonth: dayOfMonth ?? null,
        slotType: slotType || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    const occurrences = generateOccurrences(
      { frequency, dayOfWeek, dayOfMonth, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null },
      4,
    );

    const createdBookings = [];
    for (const date of occurrences) {
      const dayEnd = new Date(date);
      dayEnd.setHours(18, 0, 0, 0);

      const { available } = await checkAvailability(listing.providerId, date, dayEnd, slotType);
      if (available) {
        const rawBase = Number(listing.pricePerUnit) * (farmSize || 1);
        const pricing = calculatePricing(rawBase);
        const bookingNumber = await generateBookingNumber();

        const booking = await prisma.booking.create({
          data: {
            bookingNumber,
            farmerId,
            providerId: listing.providerId,
            serviceListingId,
            bookingType: listing.category.bookingType,
            startDate: date,
            endDate: dayEnd,
            slotType: slotType || null,
            farmLocation,
            farmSize: farmSize || null,
            cropType: cropType || null,
            ...pricing,
            status: BOOKING_STATUS.PENDING,
            statusHistory: [makeStatusEntry(BOOKING_STATUS.PENDING, farmerId, 'Recurring booking')],
            recurringBookingId: recurring.id,
          },
        });
        createdBookings.push(booking);
      }
    }

    await prisma.recurringBooking.update({
      where: { id: recurring.id },
      data: { totalGenerated: createdBookings.length },
    });

    res.status(201).json({ success: true, data: { recurring, bookings: createdBookings } });
  } catch (err) {
    log.error({ err }, 'Failed to create recurring booking');
    res.status(500).json({ success: false, error: 'Failed to create recurring booking.' });
  }
});

// ─── CANCEL RECURRING BOOKING ───────────────────────────
router.delete(E.RECURRING_DELETE, authenticate, requirePermission(RESOURCE.BOOKINGS, ACTION.DELETE), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const recurring = await prisma.recurringBooking.findUnique({
      where: { id: req.params.id as string },
    });

    if (!recurring) {
      res.status(404).json({ success: false, error: 'Recurring booking not found.' });
      return;
    }

    if (recurring.farmerId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized.' });
      return;
    }

    await prisma.$transaction([
      prisma.recurringBooking.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
      }),
      prisma.booking.updateMany({
        where: {
          recurringBookingId: req.params.id as string,
          status: BOOKING_STATUS.PENDING,
          startDate: { gt: new Date() },
        },
        data: {
          status: BOOKING_STATUS.CANCELLED,
          cancelledBy: CANCELLED_BY.FARMER,
          cancellationReason: 'Recurring series cancelled',
        },
      }),
    ]);

    res.json({ success: true, message: 'Recurring booking cancelled.' });
  } catch (err) {
    log.error({ err }, 'Failed to cancel recurring booking');
    res.status(500).json({ success: false, error: 'Failed to cancel recurring booking.' });
  }
});

export default router;
