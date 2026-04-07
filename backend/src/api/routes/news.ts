import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as newsController from '../controllers/news-controller';

const router = Router();
const E = ENDPOINTS.NEWS;

router.get(E.LIST, asyncHandler(newsController.list));
router.get(E.DETAIL, asyncHandler(newsController.detail));

export default router;
