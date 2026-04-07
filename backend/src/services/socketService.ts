import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('socket');

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; mobile: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Shared auth middleware for namespaces
  const nsAuth = async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; mobile: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  };

  // ─── /bookings namespace ────────────────────────────
  const bookingsNs = io.of('/bookings');
  bookingsNs.use(nsAuth);

  bookingsNs.on('connection', async (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    // If user is a provider, also join provider room
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (provider) {
      socket.join(`provider:${provider.id}`);
    }

    log.debug({ userId, namespace: '/bookings' }, 'Client connected');

    socket.on('disconnect', () => {
      log.debug({ userId, namespace: '/bookings' }, 'Client disconnected');
    });
  });

  // ─── /chat namespace ───────────────────────────────
  const chatNs = io.of('/chat');
  chatNs.use(nsAuth);

  chatNs.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      log.debug({ userId, conversationId }, 'Joined conversation');
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', userId);
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', userId);
    });

    socket.on('disconnect', () => {
      log.debug({ userId, namespace: '/chat' }, 'Client disconnected');
    });
  });

  // ─── /notifications namespace ──────────────────────
  const notificationsNs = io.of('/notifications');
  notificationsNs.use(nsAuth);

  notificationsNs.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    log.debug({ userId, namespace: '/notifications' }, 'Client connected');

    socket.on('disconnect', () => {
      log.debug({ userId, namespace: '/notifications' }, 'Client disconnected');
    });
  });

  log.info('Socket.io initialized with /bookings, /chat, /notifications namespaces');
  return io;
}

// ─── EMIT HELPERS ───────────────────────────────────────

export function emitBookingUpdate(booking: { id: string; farmerId: string; providerId: string; [key: string]: any }) {
  if (!io) return;
  const ns = io.of('/bookings');
  ns.to(`user:${booking.farmerId}`).emit('booking:updated', booking);
  ns.to(`provider:${booking.providerId}`).emit('booking:updated', booking);
}

export function emitChatMessage(conversationId: string, message: any) {
  if (!io) return;
  io.of('/chat').to(`conversation:${conversationId}`).emit('message:new', message);
}

export function emitMessageRead(conversationId: string, data: { messageId: string; readBy: string }) {
  if (!io) return;
  io.of('/chat').to(`conversation:${conversationId}`).emit('message:read', data);
}

export function emitNotification(userId: string, notification: any) {
  if (!io) return;
  io.of('/notifications').to(`user:${userId}`).emit('notification:new', notification);
}

export function getIO(): Server | null {
  return io;
}
