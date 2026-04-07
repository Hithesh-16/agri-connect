import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as bookingService from '../../services/bookingService';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';

export async function create(req: AuthRequest, res: Response) {
  const booking = await bookingService.createBooking(req.user!.userId, req.body);
  sendCreated(res, booking);
}

export async function list(req: AuthRequest, res: Response) {
  const { bookings, total, page, limit } = await bookingService.listBookings(
    req.user!.userId,
    req.query as Record<string, string>,
  );
  sendSuccess(res, bookings, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getDetail(req: AuthRequest, res: Response) {
  const booking = await bookingService.getBookingDetail(
    req.params.id as string,
    req.user!.userId,
    (req as any).permissionScope,
  );
  sendSuccess(res, booking);
}

export async function updateStatus(req: AuthRequest, res: Response) {
  const updated = await bookingService.updateBookingStatus(
    req.params.id as string,
    req.body.status,
    req.user!.userId,
    (req as any).permissionScope,
    req.body.reason,
  );
  sendSuccess(res, updated);
}

export async function cancel(req: AuthRequest, res: Response) {
  const result = await bookingService.cancelBooking(
    req.params.id as string,
    req.user!.userId,
    req.body.reason,
  );
  sendSuccess(res, result);
}

export async function reschedule(req: AuthRequest, res: Response) {
  const updated = await bookingService.rescheduleBooking(
    req.params.id as string,
    req.user!.userId,
    req.body,
  );
  sendSuccess(res, updated);
}

export async function createRecurring(req: AuthRequest, res: Response) {
  const result = await bookingService.createRecurringBooking(req.user!.userId, req.body);
  sendCreated(res, result);
}

export async function cancelRecurring(req: AuthRequest, res: Response) {
  await bookingService.cancelRecurringBooking(req.params.id as string, req.user!.userId);
  sendMessage(res, 'Recurring booking cancelled.');
}
