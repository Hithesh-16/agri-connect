import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { paginate } from '../../utils/pagination';
import { AppError, NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated } from '../../utils/response';
import { createChatMessage, markMessageRead, markAllRead } from '../../services/chatService';

export async function listConversations(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);

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
      take: limit,
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

  const enriched = conversations.map((c: any) => ({
    ...c,
    unreadCount: c.farmerId === userId ? c.farmerUnread : c.providerUnread,
    lastMessage: c.messages[0] || null,
    messages: undefined,
  }));

  sendSuccess(res, enriched, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getMessages(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const conversationId = req.params.id as string;
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { provider: { select: { userId: true } } },
  });

  if (!conversation) throw new NotFoundError('Conversation');

  if (conversation.farmerId !== userId && conversation.provider.userId !== userId) {
    throw new ForbiddenError('Not a participant in this conversation.');
  }

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { conversationId, isDeleted: false },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chatMessage.count({ where: { conversationId, isDeleted: false } }),
  ]);

  await markAllRead(conversationId, userId);

  sendSuccess(res, messages, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function createConversation(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { providerId, bookingId, initialMessage } = req.body;

  if (!providerId) throw new AppError('providerId is required.', 400);

  const provider = await prisma.serviceProvider.findUnique({ where: { id: providerId } });
  if (!provider) throw new NotFoundError('Provider');

  const existingWhere: any = bookingId
    ? { bookingId }
    : { farmerId: userId, providerId, bookingId: null };

  let conversation = await prisma.chatConversation.findFirst({ where: existingWhere });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: { farmerId: userId, providerId, bookingId: bookingId || null },
    });
  }

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

  sendCreated(res, full);
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const conversationId = req.params.id as string;
  const { content, type, metadata } = req.body;

  if (!content) throw new AppError('content is required.', 400);

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { provider: { select: { userId: true } } },
  });

  if (!conversation) throw new NotFoundError('Conversation');

  if (conversation.farmerId !== userId && (conversation.provider as any).userId !== userId) {
    throw new ForbiddenError('Not a participant.');
  }

  const message = await createChatMessage({
    conversationId,
    senderId: userId,
    content,
    type,
    metadata,
  });

  sendCreated(res, message);
}

export async function markRead(req: AuthRequest, res: Response) {
  const message = await markMessageRead(req.params.id as string, req.user!.userId);
  sendSuccess(res, message);
}
