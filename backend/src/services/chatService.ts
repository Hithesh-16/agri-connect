import * as chatRepo from '../repositories/chat-repository';
import { emitChatMessage, emitMessageRead } from './socketService';

export async function createChatMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  metadata?: any;
}) {
  const { conversationId, senderId, content, type = 'TEXT', metadata } = params;

  const conversation = await chatRepo.findConversationById(conversationId, {
    provider: { select: { userId: true } },
  });
  if (!conversation) throw new Error('Conversation not found');

  const message = await chatRepo.createMessage({
    conversation: { connect: { id: conversationId } },
    senderId,
    type,
    content,
    metadata: metadata || undefined,
  });

  const isFarmer = senderId === conversation.farmerId;
  await chatRepo.updateConversation(conversationId, {
    lastMessageAt: new Date(),
    ...(isFarmer
      ? { providerUnread: { increment: 1 } }
      : { farmerUnread: { increment: 1 } }),
  });

  emitChatMessage(conversationId, message);
  return message;
}

export async function markMessageRead(messageId: string, userId: string) {
  const message = await chatRepo.updateMessage(messageId, {
    isRead: true,
    readAt: new Date(),
  });

  const conversation = await chatRepo.findConversationById(message.conversationId, {
    provider: { select: { userId: true } },
  });

  if (conversation) {
    const isFarmer = userId === conversation.farmerId;
    await chatRepo.updateConversation(conversation.id, isFarmer ? { farmerUnread: 0 } : { providerUnread: 0 });
    emitMessageRead(message.conversationId, { messageId, readBy: userId });
  }

  return message;
}

export async function markAllRead(conversationId: string, userId: string) {
  const conversation = await chatRepo.findConversationById(conversationId, {
    provider: { select: { userId: true } },
  });
  if (!conversation) throw new Error('Conversation not found');

  const isFarmer = userId === conversation.farmerId;
  const otherUserId = isFarmer ? (conversation as any).provider.userId : conversation.farmerId;

  await chatRepo.markMessagesRead(conversationId, otherUserId);
  await chatRepo.updateConversation(conversationId, isFarmer ? { farmerUnread: 0 } : { providerUnread: 0 });
}
