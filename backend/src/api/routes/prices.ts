import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as priceController from '../controllers/price-controller';

const router = Router();
const E = ENDPOINTS.PRICES;

router.get(E.HIGHLIGHTS, asyncHandler(priceController.highlights));
router.get(E.CHAIN, asyncHandler(priceController.chain));
router.get(E.LIST, asyncHandler(priceController.list));

export default router;
