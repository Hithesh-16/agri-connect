import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as cropController from '../controllers/crop-controller';

const router = Router();
const E = ENDPOINTS.CROPS;

router.get(E.LIST, asyncHandler(cropController.list));
router.get(E.DETAIL, asyncHandler(cropController.detail));

export default router;
