import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as chatController from '../controllers/chat-controller';

const router = Router();
const E = ENDPOINTS.CHAT;

router.get(E.CONVERSATIONS, authenticate, asyncHandler(chatController.listConversations));
router.get(E.MESSAGES, authenticate, asyncHandler(chatController.getMessages));
router.post(E.CREATE_CONVERSATION, authenticate, asyncHandler(chatController.createConversation));
router.post(E.SEND_MESSAGE, authenticate, asyncHandler(chatController.sendMessage));
router.put(E.MARK_READ, authenticate, asyncHandler(chatController.markRead));

export default router;
