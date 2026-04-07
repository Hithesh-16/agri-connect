import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, RESOURCE, ACTION } from '../../constants';
import {
  createBookingSchema,
  updateStatusSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  createRecurringSchema,
} from '../../validations/bookings';
import * as bookingController from '../controllers/booking-controller';

const router = Router();
const E = ENDPOINTS.BOOKINGS;
const perm = (action: string) => requirePermission(RESOURCE.BOOKINGS, action);

router.post(E.CREATE, authenticate, perm(ACTION.CREATE), validate(createBookingSchema), asyncHandler(bookingController.create));
router.get(E.LIST, authenticate, perm(ACTION.READ), asyncHandler(bookingController.list));
router.get(E.DETAIL, authenticate, perm(ACTION.READ), asyncHandler(bookingController.getDetail));
router.put(E.UPDATE_STATUS, authenticate, perm(ACTION.UPDATE), validate(updateStatusSchema), asyncHandler(bookingController.updateStatus));
router.post(E.CANCEL, authenticate, perm(ACTION.UPDATE), validate(cancelBookingSchema), asyncHandler(bookingController.cancel));
router.post(E.RESCHEDULE, authenticate, perm(ACTION.UPDATE), validate(rescheduleBookingSchema), asyncHandler(bookingController.reschedule));
router.post(E.RECURRING_CREATE, authenticate, perm(ACTION.CREATE), validate(createRecurringSchema), asyncHandler(bookingController.createRecurring));
router.delete(E.RECURRING_DELETE, authenticate, perm(ACTION.DELETE), asyncHandler(bookingController.cancelRecurring));

export default router;
