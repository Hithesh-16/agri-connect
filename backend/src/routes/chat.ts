import { Router, Response } from 'express';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthRequest, paginate, paginatedResponse } from '../types';
import { ENDPOINTS } from '../constants';
import { createChatMessage, markMessageRead, markAllRead } from '../services/chatService';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('chat-route');
const E = ENDPOINTS.CHAT;

// ─── LIST CONVERSATIONS ─────────────────────────────────
router.get(E.CONVERSATIONS, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page: p, limit: l, skip } = paginate(req.query.page as string, req.query.limit as string);

    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });

    const where: any = {
      isActive: true,
      OR: [
        { farmerId: userId },
        ...(provider ? [{ providerId: provider.id }] : []),
      ],
    };

    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
        skip,
        take: l,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          farmer: { select: { id: true, firstName: true, surname: true, profilePhoto: true } },
          provider: { select: { id: true, businessName: true, profilePhoto: true, userId: true } },
          booking: { select: { id: true, bookingNumber: true, status: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, type: true, createdAt: true, senderId: true },
          },
        },
      }),
      prisma.chatConversation.count({ where }),
    ]);

    // Add unread count for current user
    const enriched = conversations.map((c: any) => ({
      ...c,
      unreadCount: c.farmerId === userId ? c.farmerUnread : c.providerUnread,
      lastMessage: c.messages[0] || null,
      messages: undefined,
    }));

    res.json({ success: true, ...paginatedResponse(enriched, total, p, l) });
  } catch (err) {
    log.error({ err }, 'Failed to list conversations');
    res.status(500).json({ success: false, error: 'Failed to list conversations.' });
  }
});

// ─── GET MESSAGES ───────────────────────────────────────
router.get(E.MESSAGES, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id as string;
    const { page: p, limit: l, skip } = paginate(req.query.page as string, req.query.limit as string);

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { provider: { select: { userId: true } } },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    // Verify participant
    if (conversation.farmerId !== userId && conversation.provider.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation.' });
      return;
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { conversationId, isDeleted: false },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chatMessage.count({ where: { conversationId, isDeleted: false } }),
    ]);

    // Mark messages as read
    await markAllRead(conversationId, userId);

    res.json({ success: true, ...paginatedResponse(messages, total, p, l) });
  } catch (err) {
    log.error({ err }, 'Failed to get messages');
    res.status(500).json({ success: false, error: 'Failed to get messages.' });
  }
});

// ─── START CONVERSATION ─────────────────────────────────
router.post(E.CREATE_CONVERSATION, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { providerId, bookingId, initialMessage } = req.body;

    if (!providerId) {
      res.status(400).json({ success: false, error: 'providerId is required.' });
      return;
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider not found.' });
      return;
    }

    // Check if conversation already exists (with this booking or between these parties)
    const existingWhere: any = bookingId
      ? { bookingId }
      : { farmerId: userId, providerId, bookingId: null };

    let conversation = await prisma.chatConversation.findFirst({
      where: existingWhere,
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          farmerId: userId,
          providerId,
          bookingId: bookingId || null,
        },
      });
    }

    // Send initial message if provided
    if (initialMessage) {
      await createChatMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: initialMessage,
      });
    }

    const full = await prisma.chatConversation.findUnique({
      where: { id: conversation.id },
      include: {
        farmer: { select: { id: true, firstName: true, surname: true, profilePhoto: true } },
        provider: { select: { id: true, businessName: true, profilePhoto: true, userId: true } },
        booking: { select: { id: true, bookingNumber: true, status: true } },
      },
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    log.error({ err }, 'Failed to create conversation');
    res.status(500).json({ success: false, error: 'Failed to create conversation.' });
  }
});

// ─── SEND MESSAGE (REST fallback) ───────────────────────
router.post(E.SEND_MESSAGE, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id as string;
    const { content, type, metadata } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'content is required.' });
      return;
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { provider: { select: { userId: true } } },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    if (conversation.farmerId !== userId && (conversation.provider as any).userId !== userId) {
      res.status(403).json({ success: false, error: 'Not a participant.' });
      return;
    }

    const message = await createChatMessage({
      conversationId,
      senderId: userId,
      content,
      type,
      metadata,
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    log.error({ err }, 'Failed to send message');
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

// ─── MARK MESSAGE READ ──────────────────────────────────
router.put(E.MARK_READ, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const message = await markMessageRead(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: message });
  } catch (err) {
    log.error({ err }, 'Failed to mark message read');
    res.status(500).json({ success: false, error: 'Failed to mark message read.' });
  }
});

export default router;
