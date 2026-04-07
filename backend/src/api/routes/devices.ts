import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as deviceController from '../controllers/device-controller';

const router = Router();
const E = ENDPOINTS.DEVICES;

router.post(E.REGISTER_TOKEN, authenticate, asyncHandler(deviceController.registerToken));
router.delete(E.REMOVE_TOKEN, authenticate, asyncHandler(deviceController.removeToken));

export default router;
