import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { createPostSchema, createCommentSchema } from '../../validations/community';
import * as communityController from '../controllers/community-controller';

const router = Router();
const E = ENDPOINTS.COMMUNITY;

router.get(E.LIST, asyncHandler(communityController.list));
router.get(E.DETAIL, asyncHandler(communityController.detail));
router.post(E.CREATE, authenticate, validate(createPostSchema), asyncHandler(communityController.create));
router.post(E.COMMENTS, authenticate, validate(createCommentSchema), asyncHandler(communityController.addComment));
router.post(E.UPVOTE, authenticate, asyncHandler(communityController.upvote));
router.patch(E.MARK_ANSWER, authenticate, asyncHandler(communityController.markAnswer));
router.delete(E.DELETE, authenticate, asyncHandler(communityController.remove));

export default router;
