import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, RESOURCE, ACTION } from '../../constants';
import * as jobController from '../controllers/job-controller';

const router = Router();
const E = ENDPOINTS.JOBS;

router.get(E.SKILLS, asyncHandler(jobController.getSkills));
router.post(E.CREATE, authenticate, requirePermission(RESOURCE.JOBS, ACTION.CREATE), asyncHandler(jobController.create));
router.get(E.LIST, authenticate, asyncHandler(jobController.list));
router.get(E.DETAIL, authenticate, asyncHandler(jobController.detail));
router.put(E.UPDATE, authenticate, requirePermission(RESOURCE.JOBS, ACTION.UPDATE), asyncHandler(jobController.update));
router.delete(E.DELETE, authenticate, requirePermission(RESOURCE.JOBS, ACTION.DELETE), asyncHandler(jobController.cancel));
router.post(E.CREATE_BID, authenticate, requirePermission(RESOURCE.BIDS, ACTION.CREATE), asyncHandler(jobController.createBid));
router.get(E.LIST_BIDS, authenticate, asyncHandler(jobController.listBids));
router.put(E.ACCEPT_BID, authenticate, requirePermission(RESOURCE.BIDS, ACTION.UPDATE), asyncHandler(jobController.acceptBidHandler));
router.put(E.REJECT_BID, authenticate, requirePermission(RESOURCE.BIDS, ACTION.UPDATE), asyncHandler(jobController.rejectBidHandler));
router.delete(E.DELETE_BID, authenticate, asyncHandler(jobController.withdrawBidHandler));

export default router;
