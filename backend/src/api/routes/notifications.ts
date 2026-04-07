import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as notificationController from '../controllers/notification-controller';

const router = Router();
const E = ENDPOINTS.NOTIFICATIONS;

router.get(E.LIST, authenticate, asyncHandler(notificationController.list));
router.put(E.MARK_ALL_READ, authenticate, asyncHandler(notificationController.markAllRead));
router.put(E.MARK_READ, authenticate, asyncHandler(notificationController.markRead));

export default router;
