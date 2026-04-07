import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as schemeController from '../controllers/scheme-controller';

const router = Router();
const E = ENDPOINTS.SCHEMES;

router.get(E.LIST, asyncHandler(schemeController.list));
router.get(E.CHECK_ELIGIBILITY, authenticate, asyncHandler(schemeController.checkEligibility));

export default router;
