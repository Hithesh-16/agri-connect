# Phase 2: Booking Engine, Real-Time & Notifications

**Timeline:** Weeks 9-13
**Priority:** HIGH — Core transactional layer enabling marketplace revenue
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers & Listings)

---

## Objective

Build the complete booking lifecycle — calendar management, booking state machine, real-time updates via Socket.io, push notifications via FCM, SMS via MSG91, and in-app chat between farmers and service providers. This phase turns a listing catalog into a functioning marketplace.

---

## Current State

### What Exists
- `ServiceListing` model with pricing, availability, and booking configuration fields
- `ServiceProvider` with `serviceRadius`, `baseLocation`, and seasonal availability
- `ServiceCategory` with `bookingType` (SLOT, DAY, MULTI_DAY, ON_DEMAND)
- Basic auth + RBAC middleware from Phase 0
- No booking, calendar, chat, or notification infrastructure

### What's Missing
- No booking model or state machine
- No calendar/availability management
- No real-time communication (Socket.io)
- No push notifications (FCM)
- No SMS integration (OTP is mock, no transactional SMS)
- No in-app chat
- No notification persistence or delivery tracking
- No recurring booking support
- No cancellation/refund policy enforcement

---

## Database Schema Changes

### New Models

```prisma
// ── BOOKING MODELS ──

model Booking {
  id                String   @id @default(cuid())
  bookingNumber     String   @unique // "KC-BK-20260415-0001"
  
  // Parties
  farmerId          String
  providerId        String
  serviceListingId  String
  
  // Booking type (inherited from category)
  bookingType       String   // "SLOT" | "DAY" | "MULTI_DAY" | "ON_DEMAND"
  
  // Schedule
  startDate         DateTime
  endDate           DateTime
  slotType          String?  // "MORNING" (6AM-12PM) | "AFTERNOON" (12PM-6PM) | "FULL_DAY"
  
  // Location
  farmLocation      Json     // { lat, lng, village, mandal, district, state, address }
  farmSize          Float?   // Acres (for per-acre pricing)
  cropType          String?  // What crop is being worked on
  
  // Pricing
  basePrice         Float    // Service charge
  platformFee       Float    // Platform commission
  gstAmount         Float    // GST on platform fee
  totalAmount       Float    // Final amount farmer pays
  advanceAmount     Float?   // For advance+balance payment flow
  balanceAmount     Float?   // Remaining after advance
  
  // State Machine
  status            String   @default("PENDING")
  // PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
  // Also: CANCELLED, DISPUTED, WEATHER_HOLD, RESCHEDULED
  statusHistory     Json[]   // [{ status, timestamp, changedBy, reason }]
  
  // Cancellation
  cancelledBy       String?  // "FARMER" | "PROVIDER" | "SYSTEM"
  cancellationReason String?
  cancellationFee   Float?
  
  // Weather
  weatherHoldReason String?
  originalStartDate DateTime?
  rescheduledFrom   String?  // Original booking ID
  
  // Completion
  completedAt       DateTime?
  farmerConfirmed   Boolean  @default(false)
  providerConfirmed Boolean  @default(false)
  autoConfirmedAt   DateTime? // Auto-confirm after 24-48 hours
  
  // Recurring
  recurringBookingId String?
  
  // Notes
  farmerNotes       String?
  providerNotes     String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  farmer            User            @relation("FarmerBookings", fields: [farmerId], references: [id])
  provider          ServiceProvider @relation(fields: [providerId], references: [id])
  serviceListing    ServiceListing  @relation(fields: [serviceListingId], references: [id])
  recurringBooking  RecurringBooking? @relation(fields: [recurringBookingId], references: [id])
  payments          Payment[]
  chatConversation  ChatConversation?
  
  @@index([farmerId, status])
  @@index([providerId, status])
  @@index([startDate, endDate])
  @@index([status, createdAt])
  @@map("bookings")
}

model AvailabilitySlot {
  id              String   @id @default(cuid())
  providerId      String
  serviceListingId String?  // Null = applies to all services
  
  date            DateTime @db.Date
  slotType        String   // "MORNING" | "AFTERNOON" | "FULL_DAY"
  isAvailable     Boolean  @default(true)
  isBlocked       Boolean  @default(false) // Manual block
  blockReason     String?  // "TRANSIT" | "MAINTENANCE" | "PERSONAL" | "BOOKED"
  
  // Transit buffer
  transitFromBookingId String? // Blocked because travelling from another booking
  transitHours    Int?
  
  // Maintenance buffer
  maintenanceAfterBookingId String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  provider        ServiceProvider @relation(fields: [providerId], references: [id])
  
  @@unique([providerId, date, slotType, serviceListingId])
  @@index([providerId, date, isAvailable])
  @@map("availability_slots")
}

model RecurringBooking {
  id              String   @id @default(cuid())
  farmerId        String
  providerId      String
  serviceListingId String
  
  frequency       String   // "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  dayOfWeek       Int?     // 0-6 (for weekly/biweekly)
  dayOfMonth      Int?     // 1-31 (for monthly)
  slotType        String?  // "MORNING" | "AFTERNOON" | "FULL_DAY"
  
  startDate       DateTime
  endDate         DateTime? // Null = indefinite
  
  isActive        Boolean  @default(true)
  nextOccurrence  DateTime?
  totalGenerated  Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  bookings        Booking[]
  
  @@map("recurring_bookings")
}

// ── CHAT MODELS ──

model ChatConversation {
  id              String   @id @default(cuid())
  bookingId       String?  @unique
  
  farmerId        String
  providerId      String
  
  lastMessageAt   DateTime?
  farmerUnread    Int      @default(0)
  providerUnread  Int      @default(0)
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  booking         Booking?  @relation(fields: [bookingId], references: [id])
  messages        ChatMessage[]
  
  @@index([farmerId, lastMessageAt])
  @@index([providerId, lastMessageAt])
  @@map("chat_conversations")
}

model ChatMessage {
  id              String   @id @default(cuid())
  conversationId  String
  senderId        String
  
  type            String   @default("TEXT") // "TEXT" | "IMAGE" | "LOCATION" | "BOOKING_UPDATE" | "VOICE"
  content         String
  metadata        Json?    // { imageUrl, lat, lng, bookingStatus, voiceUrl, duration }
  
  isRead          Boolean  @default(false)
  readAt          DateTime?
  isDeleted       Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  conversation    ChatConversation @relation(fields: [conversationId], references: [id])
  
  @@index([conversationId, createdAt])
  @@map("chat_messages")
}

// ── NOTIFICATION MODELS ──

model Notification {
  id              String   @id @default(cuid())
  userId          String
  
  type            String   // "BOOKING_CREATED" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "CHAT_MESSAGE" | "PAYMENT_RECEIVED" | "WEATHER_ALERT" | "PRICE_ALERT" | "SYSTEM"
  title           Json     // { "en": "...", "te": "...", "hi": "..." }
  body            Json     // { "en": "...", "te": "...", "hi": "..." }
  data            Json?    // { bookingId, screen, params }
  
  channel         String[] // ["PUSH", "SMS", "IN_APP", "EMAIL"]
  
  isRead          Boolean  @default(false)
  readAt          DateTime?
  
  // Delivery tracking
  pushSent        Boolean  @default(false)
  pushSentAt      DateTime?
  smsSent         Boolean  @default(false)
  smsSentAt       DateTime?
  
  createdAt       DateTime @default(now())
  
  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

model DeviceToken {
  id              String   @id @default(cuid())
  userId          String
  token           String   @unique
  platform        String   // "ANDROID" | "IOS" | "WEB"
  isActive        Boolean  @default(true)
  lastUsedAt      DateTime @default(now())
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, isActive])
  @@map("device_tokens")
}
```

---

## Booking Types

| Type | Slot Structure | Duration | Example Services | Pricing |
|------|---------------|----------|-----------------|---------|
| **SLOT** | 6AM-12PM (Morning), 12PM-6PM (Afternoon) | Half-day | Drone spraying, soil testing, crop advisory | Per acre / Per slot |
| **DAY** | Full day (6AM-6PM) | 1 day | Tractor, rotavator, harvesting | Per hour / Per acre |
| **MULTI_DAY** | Consecutive days | 2-30 days | Combine harvester, land leveling, transplanting crew | Per day / Per acre |
| **ON_DEMAND** | ASAP or scheduled | Variable | Transport, inputs delivery, veterinary emergency | Per trip / Per unit |

---

## Booking State Machine

```
                    ┌──────────────┐
                    │   PENDING    │ ← Farmer creates booking request
                    └──────┬───────┘
                           │
                    Provider accepts / Auto-confirm
                           │
                    ┌──────▼───────┐
          ┌─────── │  CONFIRMED   │ ──────────┐
          │        └──────┬───────┘            │
          │               │                    │
     Weather event   Provider starts      Cancellation
          │               │                    │
   ┌──────▼───────┐ ┌────▼────────┐   ┌──────▼───────┐
   │ WEATHER_HOLD │ │ IN_PROGRESS │   │  CANCELLED   │
   └──────┬───────┘ └──────┬──────┘   └──────────────┘
          │                │
     Rescheduled      Service done
          │                │
   ┌──────▼───────┐ ┌─────▼───────┐
   │ RESCHEDULED  │ │  COMPLETED  │
   └──────────────┘ └──────┬──────┘
                           │
                    Dispute raised
                           │
                    ┌──────▼───────┐
                    │  DISPUTED    │
                    └──────────────┘
```

### State Transition Rules

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:       ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:     ['IN_PROGRESS', 'CANCELLED', 'WEATHER_HOLD', 'RESCHEDULED'],
  IN_PROGRESS:   ['COMPLETED', 'DISPUTED'],
  COMPLETED:     ['DISPUTED'],
  WEATHER_HOLD:  ['RESCHEDULED', 'CANCELLED'],
  RESCHEDULED:   ['CONFIRMED', 'CANCELLED'],
  CANCELLED:     [],  // Terminal state
  DISPUTED:      ['COMPLETED', 'CANCELLED'],  // After resolution
};

// Who can trigger each transition
const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'PENDING→CONFIRMED':     ['PROVIDER', 'SYSTEM'],
  'PENDING→CANCELLED':     ['FARMER', 'PROVIDER', 'SYSTEM'],
  'CONFIRMED→IN_PROGRESS': ['PROVIDER'],
  'CONFIRMED→CANCELLED':   ['FARMER', 'PROVIDER', 'ADMIN'],
  'CONFIRMED→WEATHER_HOLD':['SYSTEM', 'PROVIDER', 'ADMIN'],
  'CONFIRMED→RESCHEDULED': ['FARMER', 'PROVIDER'],
  'IN_PROGRESS→COMPLETED': ['PROVIDER'],
  'COMPLETED→DISPUTED':    ['FARMER'],
  'WEATHER_HOLD→RESCHEDULED': ['FARMER', 'PROVIDER'],
  'WEATHER_HOLD→CANCELLED':   ['FARMER', 'PROVIDER'],
  'RESCHEDULED→CONFIRMED':    ['PROVIDER'],
  'RESCHEDULED→CANCELLED':    ['FARMER', 'PROVIDER'],
  'DISPUTED→COMPLETED':       ['ADMIN'],
  'DISPUTED→CANCELLED':       ['ADMIN'],
};
```

---

## Calendar Blocking Logic

### Transit Days
```typescript
// After a multi-day booking, block transit time based on distance
function calculateTransitBuffer(
  fromLocation: { lat: number; lng: number },
  toLocation: { lat: number; lng: number }
): number {
  const distanceKm = haversineDistance(fromLocation, toLocation);
  if (distanceKm < 20) return 0;       // Same area, no buffer
  if (distanceKm < 50) return 0.5;     // Half day transit
  if (distanceKm < 100) return 1;      // Full day transit
  return Math.ceil(distanceKm / 100);   // 1 day per 100km
}
```

### Maintenance Buffers
```typescript
// Heavy machinery needs maintenance after extended use
const MAINTENANCE_BUFFERS: Record<string, number> = {
  'harvester':     1,  // 1 day after every multi-day booking
  'laser-leveler': 1,  // 1 day maintenance
  'transplanter':  0.5, // Half day
  'tractor':       0,   // No mandatory buffer
};
```

### Conflict Detection
```typescript
async function checkAvailability(
  providerId: string,
  serviceListingId: string,
  startDate: Date,
  endDate: Date,
  slotType?: string
): Promise<{ available: boolean; conflicts: Booking[] }> {
  // 1. Check existing bookings for overlap
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'WEATHER_HOLD'] },
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
  });

  // 2. Check blocked availability slots
  const blockedSlots = await prisma.availabilitySlot.findMany({
    where: {
      providerId,
      date: { gte: startDate, lte: endDate },
      isAvailable: false,
    },
  });

  // 3. Check transit buffers from adjacent bookings
  const adjacentBookings = await getAdjacentBookings(providerId, startDate, endDate);
  const transitConflicts = adjacentBookings.filter(b => {
    const transitDays = calculateTransitBuffer(b.farmLocation, /* new location */);
    return transitDays > 0;
  });

  return {
    available: conflictingBookings.length === 0 && blockedSlots.length === 0 && transitConflicts.length === 0,
    conflicts: [...conflictingBookings, ...transitConflicts],
  };
}
```

---

## Recurring Bookings

```typescript
// Create recurring booking (e.g., weekly tractor service)
async function createRecurringBooking(params: {
  farmerId: string;
  providerId: string;
  serviceListingId: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  slotType?: string;
  startDate: Date;
  endDate?: Date;
}) {
  const recurring = await prisma.recurringBooking.create({ data: params });

  // Generate next 4 occurrences
  const occurrences = generateOccurrences(params, 4);
  for (const date of occurrences) {
    const { available } = await checkAvailability(
      params.providerId,
      params.serviceListingId,
      date,
      date
    );
    if (available) {
      await createBooking({
        ...params,
        startDate: date,
        endDate: date,
        recurringBookingId: recurring.id,
      });
    }
  }

  return recurring;
}

// BullMQ job: generate next occurrence weekly
// Queue: 'recurring-bookings'
// Cron: every Sunday at 6 PM
```

---

## Cancellation Policy

| Condition | Machinery/Equipment | Services/Labor | Refund |
|-----------|-------------------|----------------|--------|
| 48+ hours before (machinery) / 24+ hours (services) | Free cancellation | Free cancellation | 100% refund |
| 24-48 hours before (machinery) / 12-24 hours (services) | Late cancellation fee | Late cancellation fee | 50% refund |
| <24 hours (machinery) / <12 hours (services) | No-show policy | No-show policy | 0% refund |
| Weather event (IMD alert) | Automatic weather hold | Automatic weather hold | 100% refund or free reschedule |
| Provider cancels | Free reschedule + priority rebooking | Free reschedule + priority rebooking | 100% refund |

```typescript
function calculateCancellationFee(booking: Booking): {
  refundPercent: number;
  fee: number;
  reason: string;
} {
  const hoursUntilStart = differenceInHours(booking.startDate, new Date());
  const isMachinery = ['MACHINERY_OWNER'].includes(booking.provider.type);

  // Weather cancellation — always free
  if (booking.status === 'WEATHER_HOLD') {
    return { refundPercent: 100, fee: 0, reason: 'Weather cancellation - full refund' };
  }

  // Provider cancels — always free for farmer
  if (booking.cancelledBy === 'PROVIDER') {
    return { refundPercent: 100, fee: 0, reason: 'Provider cancelled - full refund' };
  }

  // Time-based cancellation
  if (isMachinery) {
    if (hoursUntilStart >= 48) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (48h+ before)' };
    if (hoursUntilStart >= 24) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (24-48h)' };
    return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<24h)' };
  } else {
    if (hoursUntilStart >= 24) return { refundPercent: 100, fee: 0, reason: 'Free cancellation (24h+ before)' };
    if (hoursUntilStart >= 12) return { refundPercent: 50, fee: booking.totalAmount * 0.5, reason: 'Late cancellation (12-24h)' };
    return { refundPercent: 0, fee: booking.totalAmount, reason: 'No-show (<12h)' };
  }
}
```

---

## Real-Time: Socket.io Architecture

### Server Setup
```typescript
// backend/src/services/socketService.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyJWT } from '../middleware/auth';

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URLS?.split(','), credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for horizontal scaling
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = verifyJWT(token);
      socket.data.userId = decoded.userId;
      socket.data.roles = decoded.roles;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  return io;
}
```

### Namespaces

```typescript
// /bookings — Real-time booking status updates
const bookingsNs = io.of('/bookings');
bookingsNs.on('connection', (socket) => {
  // Join room for user's bookings
  socket.join(`user:${socket.data.userId}`);

  // Provider joins their provider room
  if (socket.data.roles.includes('VENDOR')) {
    socket.join(`provider:${socket.data.providerId}`);
  }
});

// Emit booking updates
export function emitBookingUpdate(booking: Booking) {
  bookingsNs.to(`user:${booking.farmerId}`).emit('booking:updated', booking);
  bookingsNs.to(`provider:${booking.providerId}`).emit('booking:updated', booking);
}

// /chat — Real-time messaging
const chatNs = io.of('/chat');
chatNs.on('connection', (socket) => {
  socket.on('join:conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('message:send', async (data: { conversationId: string; content: string; type: string }) => {
    const message = await createChatMessage({
      conversationId: data.conversationId,
      senderId: socket.data.userId,
      content: data.content,
      type: data.type,
    });
    chatNs.to(`conversation:${data.conversationId}`).emit('message:new', message);
  });

  socket.on('message:read', async (data: { conversationId: string; messageId: string }) => {
    await markMessageRead(data.messageId);
    chatNs.to(`conversation:${data.conversationId}`).emit('message:read', data);
  });

  socket.on('typing:start', (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', socket.data.userId);
  });

  socket.on('typing:stop', (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', socket.data.userId);
  });
});

// /notifications — Real-time notification delivery
const notificationsNs = io.of('/notifications');
notificationsNs.on('connection', (socket) => {
  socket.join(`user:${socket.data.userId}`);
});

export function emitNotification(userId: string, notification: Notification) {
  notificationsNs.to(`user:${userId}`).emit('notification:new', notification);
}
```

---

## Push Notifications: FCM

### Server-Side (firebase-admin)
```typescript
// backend/src/services/pushService.ts
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: params.userId, isActive: true },
  });

  if (tokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    tokens: tokens.map(t => t.token),
    notification: {
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
    },
    data: params.data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'bookings',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Deactivate invalid tokens
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
      prisma.deviceToken.update({
        where: { id: tokens[idx].id },
        data: { isActive: false },
      });
    }
  });
}
```

### Client-Side (React Native)
```typescript
// mobile/src/services/pushNotificationService.ts
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export async function setupPushNotifications() {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED
    || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return;

  // Get FCM token
  const token = await messaging().getToken();
  await registerDeviceToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');

  // Listen for token refresh
  messaging().onTokenRefresh(async (newToken) => {
    await registerDeviceToken(newToken, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
  });

  // Create notification channels (Android)
  await notifee.createChannel({
    id: 'bookings',
    name: 'Booking Updates',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'chat',
    name: 'Chat Messages',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'alerts',
    name: 'Price & Weather Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'alert',
  });

  // Foreground message handler
  messaging().onMessage(async (remoteMessage) => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: remoteMessage.data?.channelId || 'bookings',
        pressAction: { id: 'default' },
      },
    });
  });

  // Background message handler
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Handle data-only messages in background
    console.log('Background message:', remoteMessage);
  });
}
```

---

## SMS: MSG91 Integration

```typescript
// backend/src/services/smsService.ts

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'KISANC';

// Replace mock OTP with real SMS
export async function sendOTP(phone: string): Promise<void> {
  const response = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'authkey': MSG91_AUTH_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_OTP_TEMPLATE_ID,
      mobile: `91${phone}`,
      otp_length: 6,
      otp_expiry: 10, // minutes
    }),
  });

  if (!response.ok) throw new Error('OTP send failed');
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const response = await fetch(
    `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${otp}`,
    { headers: { 'authkey': MSG91_AUTH_KEY! } }
  );
  const data = await response.json();
  return data.type === 'success';
}

// Transactional SMS for booking updates
export async function sendTransactionalSMS(phone: string, templateId: string, variables: Record<string, string>): Promise<void> {
  await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'authkey': MSG91_AUTH_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      sender: MSG91_SENDER_ID,
      short_url: '0',
      mobiles: `91${phone}`,
      ...variables,
    }),
  });
}

// SMS Templates (register on MSG91 DLT portal)
// 1. Booking Confirmed: "Your booking {#var#} is confirmed for {#var#}. Provider: {#var#}. Track on KisanConnect."
// 2. Booking Cancelled: "Booking {#var#} has been cancelled. Refund of Rs.{#var#} will be processed in 3-5 days."
// 3. Provider Arriving: "Your service provider {#var#} is on the way. ETA: {#var#} minutes."
// 4. Payment Received: "Payment of Rs.{#var#} received for booking {#var#}. Thank you!"
```

---

## BullMQ Notification Workers

```typescript
// backend/src/workers/notificationWorker.ts
import { Worker, Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', { connection: redisConnection });

// Add notification to queue
export async function queueNotification(params: {
  userId: string;
  type: string;
  title: Json;
  body: Json;
  data?: Json;
  channels: ('PUSH' | 'SMS' | 'IN_APP')[];
}) {
  await notificationQueue.add('send-notification', params, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
  });
}

// Worker processes notifications
const worker = new Worker('notifications', async (job) => {
  const { userId, type, title, body, data, channels } = job.data;

  // 1. Save to database (IN_APP always)
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data, channel: channels },
  });

  // 2. Emit via Socket.io
  emitNotification(userId, notification);

  // 3. Send push if requested
  if (channels.includes('PUSH')) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const lang = user?.language || 'en';
    await sendPushNotification({
      userId,
      title: title[lang] || title.en,
      body: body[lang] || body.en,
      data: { type, ...data },
    });
    await prisma.notification.update({
      where: { id: notification.id },
      data: { pushSent: true, pushSentAt: new Date() },
    });
  }

  // 4. Send SMS if requested
  if (channels.includes('SMS')) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.phone) {
      await sendTransactionalSMS(user.phone, getTemplateId(type), extractVariables(body, data));
      await prisma.notification.update({
        where: { id: notification.id },
        data: { smsSent: true, smsSentAt: new Date() },
      });
    }
  }
}, { connection: redisConnection, concurrency: 10 });
```

---

## API Endpoints

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | FARMER | Create new booking |
| GET | `/api/bookings` | Auth | List user's bookings (farmer or provider) |
| GET | `/api/bookings/:id` | Owner/Provider/Admin | Get booking details |
| PUT | `/api/bookings/:id/status` | Per transition rules | Update booking status |
| POST | `/api/bookings/:id/cancel` | FARMER/PROVIDER | Cancel with reason |
| POST | `/api/bookings/:id/reschedule` | FARMER/PROVIDER | Reschedule booking |
| POST | `/api/bookings/recurring` | FARMER | Create recurring booking |
| DELETE | `/api/bookings/recurring/:id` | FARMER | Cancel recurring series |

### Availability

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/availability/:providerId` | Public | Get provider availability calendar |
| PUT | `/api/availability` | VENDOR | Update availability slots |
| POST | `/api/availability/block` | VENDOR | Block dates (vacation, maintenance) |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat/conversations` | Auth | List user's conversations |
| GET | `/api/chat/conversations/:id/messages` | Participant | Get messages (paginated) |
| POST | `/api/chat/conversations` | Auth | Start new conversation |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Auth | List user's notifications |
| PUT | `/api/notifications/:id/read` | Owner | Mark notification as read |
| PUT | `/api/notifications/read-all` | Auth | Mark all as read |
| POST | `/api/devices/token` | Auth | Register FCM device token |
| DELETE | `/api/devices/token/:token` | Auth | Remove device token |

---

## Frontend Screens

### Web (Next.js)

| Route | Page | Description |
|-------|------|-------------|
| `/services` | ServiceBrowse | Browse/search services with filters, map view |
| `/services/[id]` | ServiceDetail | Service info, provider profile, reviews, booking CTA |
| `/bookings` | BookingList | My bookings (tabs: Active, Past, Cancelled) |
| `/bookings/[id]` | BookingDetail | Booking status, timeline, chat, payment, actions |
| `/chat` | ChatList | Conversations list with unread counts |

### Mobile (Farmer App)

| Screen | Component | Description |
|--------|-----------|-------------|
| ServiceBrowse | `ServiceBrowseScreen` | Category grid, search, location filter |
| ServiceDetail | `ServiceDetailScreen` | Full details, gallery, reviews, availability calendar |
| ServiceMap | `ServiceMapScreen` | Map view of nearby services |
| BookingList | `BookingListScreen` | Tabs: Upcoming, Active, Past |
| BookingDetail | `BookingDetailScreen` | Status tracker, actions, chat link |
| BookingCreate | `BookingCreateScreen` | Date picker, slot selection, farm location, notes |
| ChatList | `ChatListScreen` | Conversation list |
| ChatDetail | `ChatDetailScreen` | Messages, send text/image/location/voice |

### Mobile (Partner App)

| Screen | Component | Description |
|--------|-----------|-------------|
| PartnerHome | `PartnerHomeScreen` | Dashboard: today's bookings, earnings, rating |
| MyListings | `MyListingsScreen` | Provider's active service listings |
| CreateListing | `CreateListingScreen` | Multi-step form: category, details, pricing, photos |
| IncomingBookings | `IncomingBookingsScreen` | Pending requests to accept/reject |
| AvailabilityCalendar | `AvailabilityCalendarScreen` | Calendar view, block dates, set slots |

---

## Industry Comparison

| Feature | Trringo | Urban Company | KisanConnect (Ours) |
|---------|---------|---------------|---------------------|
| Booking types | DAY only | SLOT only | SLOT + DAY + MULTI_DAY + ON_DEMAND |
| Calendar blocking | Basic | No transit buffer | Transit + maintenance buffers |
| Recurring bookings | No | No | Weekly/biweekly/monthly |
| Real-time chat | No | Yes | Yes + voice messages |
| Weather holds | No | No | Auto weather-hold with IMD API |
| Cancellation policy | Rigid | Time-based | Type-aware + weather exceptions |
| Multi-language notifications | No | Hindi/English | 9 languages (expanding to 13) |

---

## Testing Checklist

- [ ] **State Machine**: Test every valid state transition (8 transitions)
- [ ] **State Machine**: Test every invalid state transition is rejected
- [ ] **State Machine**: Test transition permissions (farmer cannot mark IN_PROGRESS)
- [ ] **Calendar**: Create overlapping bookings → verify conflict detected
- [ ] **Calendar**: Transit buffer blocks correct days after multi-day booking
- [ ] **Calendar**: Maintenance buffer applied for harvester/leveler
- [ ] **Calendar**: Recurring booking skips unavailable dates
- [ ] **Cancellation**: Free cancellation at 48h+ returns 100%
- [ ] **Cancellation**: Late cancellation at 30h returns 50%
- [ ] **Cancellation**: No-show at 2h returns 0%
- [ ] **Cancellation**: Weather cancellation always returns 100%
- [ ] **Cancellation**: Provider cancel always returns 100% to farmer
- [ ] **Socket.io**: Booking update delivered to both farmer and provider rooms
- [ ] **Socket.io**: Chat message delivered in real-time to conversation participants
- [ ] **Socket.io**: Typing indicator works
- [ ] **Socket.io**: Reconnection re-joins correct rooms
- [ ] **FCM**: Push notification delivered to Android device
- [ ] **FCM**: Push notification delivered to iOS device
- [ ] **FCM**: Invalid token deactivated after failed delivery
- [ ] **FCM Mock**: Unit tests use mock firebase-admin (no real push in CI)
- [ ] **SMS**: OTP sent via MSG91 (staging environment with test numbers)
- [ ] **SMS**: Transactional SMS sent for booking confirmation
- [ ] **BullMQ**: Notification worker processes jobs with retry on failure
- [ ] **Load Test**: 100 concurrent booking creations → no double-booking
- [ ] **Load Test**: Socket.io handles 500 concurrent connections

---

## Files to Create/Modify

### New Files
```
backend/src/routes/bookings.ts              # Booking CRUD + state machine
backend/src/routes/availability.ts          # Availability management
backend/src/routes/chat.ts                  # Chat conversations + messages
backend/src/routes/notifications.ts         # Notification list + read
backend/src/routes/devices.ts               # Device token registration
backend/src/services/bookingService.ts      # Booking logic, state machine, calendar
backend/src/services/socketService.ts       # Socket.io server setup + namespaces
backend/src/services/pushService.ts         # FCM push notification service
backend/src/services/smsService.ts          # MSG91 OTP + transactional SMS
backend/src/services/chatService.ts         # Chat message creation + read tracking
backend/src/workers/notificationWorker.ts   # BullMQ notification processor
backend/src/workers/recurringBookingWorker.ts # Generate recurring booking instances
backend/prisma/seeds/booking-seed.ts        # Test booking data
packages/shared/types/booking.ts            # Booking TypeScript types
packages/shared/types/chat.ts               # Chat TypeScript types
packages/shared/types/notification.ts       # Notification TypeScript types
mobile/src/services/pushNotificationService.ts   # FCM client setup
mobile/src/services/socketService.ts             # Socket.io client
mobile/src/screens/booking/BookingListScreen.tsx  # Booking list
mobile/src/screens/booking/BookingDetailScreen.tsx # Booking detail
mobile/src/screens/booking/BookingCreateScreen.tsx # Create booking
mobile/src/screens/chat/ChatListScreen.tsx         # Chat list
mobile/src/screens/chat/ChatDetailScreen.tsx       # Chat conversation
mobile/src/screens/services/ServiceBrowseScreen.tsx # Service browsing
mobile/src/screens/services/ServiceDetailScreen.tsx # Service detail
mobile/src/screens/services/ServiceMapScreen.tsx    # Map view
partner-app/src/screens/PartnerHomeScreen.tsx       # Partner dashboard
partner-app/src/screens/IncomingBookingsScreen.tsx  # Incoming requests
partner-app/src/screens/AvailabilityCalendarScreen.tsx # Calendar management
web/src/pages/services/index.tsx                    # Service browse page
web/src/pages/services/[id].tsx                     # Service detail page
web/src/pages/bookings/index.tsx                    # Booking list page
web/src/pages/bookings/[id].tsx                     # Booking detail page
web/src/pages/chat/index.tsx                        # Chat page
```

### Modified Files
```
backend/prisma/schema.prisma                # Add Booking, Chat, Notification models
backend/src/index.ts                        # Mount new routes, initialize Socket.io
backend/src/middleware/auth.ts              # Socket.io auth support
backend/src/services/authService.ts         # Replace mock OTP with MSG91
packages/shared/hooks/useSocket.ts          # Socket.io React hook
mobile/src/navigation/AppNavigator.tsx      # Add booking/chat/service screens
web/src/components/layout/Sidebar.tsx       # Add bookings/chat nav items
```

---

## Definition of Done

- [ ] All 4 booking types (SLOT, DAY, MULTI_DAY, ON_DEMAND) can be created and completed
- [ ] State machine enforces valid transitions with correct permissions
- [ ] Calendar blocking prevents double-booking with transit + maintenance buffers
- [ ] Recurring bookings generate future instances automatically
- [ ] Cancellation fees calculated correctly per policy
- [ ] Socket.io delivers real-time updates to booking parties and chat participants
- [ ] FCM push notifications reach Android and iOS devices
- [ ] MSG91 sends real OTP and transactional SMS (mock OTP removed)
- [ ] BullMQ workers process notifications with retry logic
- [ ] All frontend screens render booking data and handle state changes
- [ ] Load test passes: 100 concurrent bookings with zero conflicts
