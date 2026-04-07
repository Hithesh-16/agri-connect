import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, RESOURCE, ACTION } from '../../constants';
import * as availabilityController from '../controllers/availability-controller';

const router = Router();
const E = ENDPOINTS.AVAILABILITY;

router.get(E.CALENDAR, asyncHandler(availabilityController.getCalendar));
router.get(E.CHECK, asyncHandler(availabilityController.check));
router.put(E.UPDATE, authenticate, requirePermission(RESOURCE.SERVICES, ACTION.UPDATE), asyncHandler(availabilityController.updateSlots));
router.post(E.BLOCK, authenticate, requirePermission(RESOURCE.SERVICES, ACTION.UPDATE), asyncHandler(availabilityController.blockDates));

export default router;
