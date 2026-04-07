import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, RESOURCE, ACTION } from '../../constants';
import * as teamController from '../controllers/team-controller';

const router = Router();
const E = ENDPOINTS.TEAMS;

router.post(E.CREATE, authenticate, requirePermission(RESOURCE.TEAMS, ACTION.CREATE), asyncHandler(teamController.create));
router.get(E.MY_TEAMS, authenticate, asyncHandler(teamController.myTeams));
router.get(E.DETAIL, authenticate, asyncHandler(teamController.detail));
router.put(E.UPDATE, authenticate, requirePermission(RESOURCE.TEAMS, ACTION.UPDATE), asyncHandler(teamController.update));
router.post(E.ADD_MEMBER, authenticate, requirePermission(RESOURCE.TEAMS, ACTION.UPDATE), asyncHandler(teamController.addMember));
router.put(E.UPDATE_MEMBER, authenticate, requirePermission(RESOURCE.TEAMS, ACTION.UPDATE), asyncHandler(teamController.updateMember));
router.delete(E.REMOVE_MEMBER, authenticate, requirePermission(RESOURCE.TEAMS, ACTION.DELETE), asyncHandler(teamController.removeMember));

export default router;
