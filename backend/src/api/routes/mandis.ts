import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as mandiController from '../controllers/mandi-controller';

const router = Router();
const E = ENDPOINTS.MANDIS;

router.get(E.LIST, asyncHandler(mandiController.list));
router.get(E.DETAIL, asyncHandler(mandiController.detail));

export default router;
