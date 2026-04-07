import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── CONVERSATION ───────────────────────────────────────

export async function findConversationById(id: string, include?: Prisma.ChatConversationInclude) {
  return prisma.chatConversation.findUnique({ where: { id }, include });
}

export async function findConversationFirst(where: Prisma.ChatConversationWhereInput) {
  return prisma.chatConversation.findFirst({ where });
}

export async function findConversations(
  where: Prisma.ChatConversationWhereInput,
  pagination: { skip: number; take: number },
  include?: Prisma.ChatConversationInclude,
) {
  return Promise.all([
    prisma.chatConversation.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { lastMessageAt: 'desc' },
      include,
    }),
    prisma.chatConversation.count({ where }),
  ]);
}

export async function createConversation(data: Prisma.ChatConversationCreateInput) {
  return prisma.chatConversation.create({ data });
}

export async function updateConversation(id: string, data: Prisma.ChatConversationUpdateInput) {
  return prisma.chatConversation.update({ where: { id }, data });
}

// ─── MESSAGE ────────────────────────────────────────────

export async function createMessage(data: Prisma.ChatMessageCreateInput) {
  return prisma.chatMessage.create({ data });
}

export async function findMessages(
  where: Prisma.ChatMessageWhereInput,
  pagination: { skip: number; take: number },
) {
  return Promise.all([
    prisma.chatMessage.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chatMessage.count({ where }),
  ]);
}

export async function updateMessage(id: string, data: Prisma.ChatMessageUpdateInput) {
  return prisma.chatMessage.update({ where: { id }, data });
}

export async function markMessagesRead(conversationId: string, senderId: string) {
  return prisma.chatMessage.updateMany({
    where: { conversationId, senderId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
