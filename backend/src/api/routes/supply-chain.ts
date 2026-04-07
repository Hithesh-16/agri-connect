import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as supplyChainController from '../controllers/supply-chain-controller';

const router = Router();
const E = ENDPOINTS.SUPPLY_CHAIN;

router.get(E.COTTON, asyncHandler(supplyChainController.getCotton));
router.get(E.ENAM, asyncHandler(supplyChainController.getEnam));
router.get(E.FINANCE, asyncHandler(supplyChainController.getFinance));

export default router;
