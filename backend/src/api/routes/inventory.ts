import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as inventoryController from '../controllers/inventory-controller';

const router = Router();
const E = ENDPOINTS.INVENTORY;

router.get(E.SEARCH, asyncHandler(inventoryController.search));
router.get(E.ITEM, asyncHandler(inventoryController.itemDetail));
router.get(E.BY_CATEGORY, asyncHandler(inventoryController.byCategory));
router.get(E.LIST, asyncHandler(inventoryController.list));

export default router;
