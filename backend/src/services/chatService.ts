import { prisma } from '../config';
import { emitChatMessage, emitMessageRead } from './socketService';

export async function createChatMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  metadata?: any;
}) {
  const { conversationId, senderId, content, type = 'TEXT', metadata } = params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { provider: { select: { userId: true } } },
  });

  if (!conversation) throw new Error('Conversation not found');

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId,
      type,
      content,
      metadata: metadata || undefined,
    },
  });

  // Update conversation metadata + unread counts
  const isFarmer = senderId === conversation.farmerId;
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      ...(isFarmer
        ? { providerUnread: { increment: 1 } }
        : { farmerUnread: { increment: 1 } }),
    },
  });

  // Emit via Socket.io
  emitChatMessage(conversationId, message);

  return message;
}

export async function markMessageRead(messageId: string, userId: string) {
  const message = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { isRead: true, readAt: new Date() },
  });

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: message.conversationId },
    include: { provider: { select: { userId: true } } },
  });

  if (conversation) {
    const isFarmer = userId === conversation.farmerId;
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: isFarmer ? { farmerUnread: 0 } : { providerUnread: 0 },
    });

    emitMessageRead(message.conversationId, { messageId, readBy: userId });
  }

  return message;
}

export async function markAllRead(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { provider: { select: { userId: true } } },
  });

  if (!conversation) throw new Error('Conversation not found');

  // Mark all unread messages from the other party as read
  const isFarmer = userId === conversation.farmerId;
  const otherUserId = isFarmer ? conversation.provider.userId : conversation.farmerId;

  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: otherUserId,
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: isFarmer ? { farmerUnread: 0 } : { providerUnread: 0 },
  });
}
