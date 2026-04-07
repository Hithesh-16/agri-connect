import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { createServiceListingSchema } from '../../validations/services';
import * as serviceController from '../controllers/service-controller';

const router = Router();
const E = ENDPOINTS.SERVICES;

router.get(E.NEARBY, asyncHandler(serviceController.nearby));
router.get(E.CATEGORIES, asyncHandler(serviceController.getCategories));
router.get(E.LIST, asyncHandler(serviceController.list));
router.get(E.DETAIL, asyncHandler(serviceController.getDetail));
router.post(E.CREATE, authenticate, validate(createServiceListingSchema), asyncHandler(serviceController.create));
router.put(E.UPDATE, authenticate, asyncHandler(serviceController.update));
router.delete(E.DELETE, authenticate, asyncHandler(serviceController.remove));
router.post(E.PAUSE, authenticate, asyncHandler(serviceController.togglePause));

export default router;
