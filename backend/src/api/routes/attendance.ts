import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, RESOURCE, ACTION } from '../../constants';
import * as attendanceController from '../controllers/attendance-controller';

const router = Router();
const E = ENDPOINTS.ATTENDANCE;

router.post(E.GENERATE_QR, authenticate, requirePermission(RESOURCE.ATTENDANCE, ACTION.CREATE), asyncHandler(attendanceController.generateQR));
router.post(E.CHECK_IN, authenticate, requirePermission(RESOURCE.ATTENDANCE, ACTION.CREATE), asyncHandler(attendanceController.doCheckIn));
router.post(E.CHECK_OUT, authenticate, requirePermission(RESOURCE.ATTENDANCE, ACTION.UPDATE), asyncHandler(attendanceController.doCheckOut));
router.get(E.BY_BOOKING, authenticate, asyncHandler(attendanceController.getReport));
router.get(E.SUBSTITUTES, authenticate, asyncHandler(attendanceController.getSubstitutes));
router.post(E.ADD_SUBSTITUTE, authenticate, requirePermission(RESOURCE.ATTENDANCE, ACTION.UPDATE), asyncHandler(attendanceController.addSubstitute));
router.post(E.DISTRIBUTE_PAYMENT, authenticate, requirePermission(RESOURCE.PAYMENTS, ACTION.CREATE), asyncHandler(attendanceController.distributePayment));

export default router;
