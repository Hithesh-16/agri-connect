import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { createAlertSchema } from '../../validations/alerts';
import * as alertController from '../controllers/alert-controller';

const router = Router();
const E = ENDPOINTS.ALERTS;

router.get(E.LIST, authenticate, asyncHandler(alertController.list));
router.post(E.CREATE, authenticate, validate(createAlertSchema), asyncHandler(alertController.create));
router.patch(E.UPDATE, authenticate, asyncHandler(alertController.toggle));
router.delete(E.DELETE, authenticate, asyncHandler(alertController.remove));

export default router;
