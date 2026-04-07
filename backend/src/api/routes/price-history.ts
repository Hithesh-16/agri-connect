import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as priceHistoryController from '../controllers/price-history-controller';

const router = Router();
const E = ENDPOINTS.PRICE_HISTORY;

router.get(E.BY_CROP, asyncHandler(priceHistoryController.getByCrop));

export default router;
