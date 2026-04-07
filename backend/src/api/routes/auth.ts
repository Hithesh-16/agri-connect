import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  refreshSchema,
} from '../../validations/auth';
import * as authController from '../controllers/auth-controller';

const router = Router();
const E = ENDPOINTS.AUTH;

router.post(E.SEND_OTP, validate(sendOtpSchema), asyncHandler(authController.sendOtp));
router.post(E.VERIFY_OTP, validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post(E.REGISTER, authenticate, validate(registerSchema), asyncHandler(authController.register));
router.post(E.REFRESH, validate(refreshSchema), asyncHandler(authController.refresh));
router.post(E.LOGOUT, authenticate, asyncHandler(authController.logout));

export default router;
