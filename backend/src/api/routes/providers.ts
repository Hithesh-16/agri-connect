import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { registerProviderSchema, submitKycSchema, reviewKycSchema } from '../../validations/providers';
import * as providerController from '../controllers/provider-controller';

const router = Router();
const E = ENDPOINTS.PROVIDERS;

router.post(E.REGISTER, authenticate, validate(registerProviderSchema), asyncHandler(providerController.register));
router.get(E.ME, authenticate, asyncHandler(providerController.getMe));
router.put(E.UPDATE_ME, authenticate, asyncHandler(providerController.updateMe));
router.get(E.ADMIN_KYC_QUEUE, authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(providerController.kycQueue));
router.get(E.DETAIL, asyncHandler(providerController.getPublic));
router.post(E.SUBMIT_KYC, authenticate, validate(submitKycSchema), asyncHandler(providerController.submitKyc));
router.get(E.GET_KYC, authenticate, asyncHandler(providerController.getKycStatus));
router.put(E.REVIEW_KYC, authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), validate(reviewKycSchema), asyncHandler(providerController.reviewKyc));

export default router;
