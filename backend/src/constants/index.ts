// ─── BOOKING ────────────────────────────────────────────

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  WEATHER_HOLD: 'WEATHER_HOLD',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;

export const BOOKING_TYPE = {
  SLOT: 'SLOT',
  DAY: 'DAY',
  MULTI_DAY: 'MULTI_DAY',
  ON_DEMAND: 'ON_DEMAND',
} as const;

export const SLOT_TYPE = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  FULL_DAY: 'FULL_DAY',
} as const;

export const RECURRING_FREQUENCY = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export const CANCELLED_BY = {
  FARMER: 'FARMER',
  PROVIDER: 'PROVIDER',
  SYSTEM: 'SYSTEM',
} as const;

export const BLOCK_REASON = {
  TRANSIT: 'TRANSIT',
  MAINTENANCE: 'MAINTENANCE',
  PERSONAL: 'PERSONAL',
  BOOKED: 'BOOKED',
} as const;

// ─── PROVIDER ───────────────────────────────────────────

export const PROVIDER_TYPE = {
  MACHINERY_OWNER: 'MACHINERY_OWNER',
  INPUT_DEALER: 'INPUT_DEALER',
  TRANSPORTER: 'TRANSPORTER',
  LABOR_INDIVIDUAL: 'LABOR_INDIVIDUAL',
  LABOR_TEAM_LEADER: 'LABOR_TEAM_LEADER',
  LIVESTOCK_DEALER: 'LIVESTOCK_DEALER',
  DRONE_OPERATOR: 'DRONE_OPERATOR',
  PROFESSIONAL: 'PROFESSIONAL',
} as const;

export const KYC_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

// ─── PRICING ────────────────────────────────────────────

export const PRICING_TYPE = {
  FIXED: 'FIXED',
  NEGOTIABLE: 'NEGOTIABLE',
  BID_BASED: 'BID_BASED',
} as const;

export const PRICING_UNIT = {
  PER_HOUR: 'PER_HOUR',
  PER_DAY: 'PER_DAY',
  PER_ACRE: 'PER_ACRE',
  PER_UNIT: 'PER_UNIT',
  PER_KG: 'PER_KG',
  PER_QUINTAL: 'PER_QUINTAL',
  PER_TRIP: 'PER_TRIP',
  PER_WORKER_DAY: 'PER_WORKER_DAY',
  FIXED: 'FIXED',
} as const;

export const PLATFORM_FEE_RATE = 0.05; // 5%
export const GST_RATE = 0.18; // 18% on platform fee

// ─── PAYMENTS ───────────────────────────────────────────

export const PAYMENT_FLOW = {
  FULL_PREPAY: 'FULL_PREPAY',
  ADVANCE_BALANCE: 'ADVANCE_BALANCE',
  POST_PAY: 'POST_PAY',
  CASH_SPLIT: 'CASH_SPLIT',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  ESCROWED: 'ESCROWED',
  RELEASED: 'RELEASED',
} as const;

export const WALLET_TX_TYPE = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

export const WALLET_TX_SOURCE = {
  TOPUP: 'TOPUP',
  BOOKING_PAYMENT: 'BOOKING_PAYMENT',
  REFUND: 'REFUND',
  PAYOUT: 'PAYOUT',
} as const;

// ─── NOTIFICATIONS ──────────────────────────────────────

export const NOTIFICATION_CHANNEL = {
  PUSH: 'PUSH',
  SMS: 'SMS',
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
} as const;

export const NOTIFICATION_TYPE = {
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',
  BOOKING_STATUS: 'BOOKING_STATUS',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  WEATHER_ALERT: 'WEATHER_ALERT',
  PRICE_ALERT: 'PRICE_ALERT',
  KYC_SUBMITTED: 'KYC_SUBMITTED',
  KYC_REVIEWED: 'KYC_REVIEWED',
  PROVIDER_REGISTERED: 'PROVIDER_REGISTERED',
  SYSTEM: 'SYSTEM',
} as const;

export const DEVICE_PLATFORM = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  WEB: 'WEB',
} as const;

// ─── CHAT ───────────────────────────────────────────────

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  LOCATION: 'LOCATION',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  VOICE: 'VOICE',
} as const;

// ─── LISTINGS / MARKETPLACE ─────────────────────────────

export const LISTING_TYPE = {
  SELL: 'sell',
  BUY: 'buy',
  RENT: 'rent',
  EXCHANGE: 'exchange',
} as const;

export const LISTING_CATEGORY = {
  CROP: 'crop',
  MACHINERY: 'machinery',
  RESOURCE: 'resource',
  TOOL: 'tool',
  SEED: 'seed',
  LABOR: 'labor',
  IRRIGATION: 'irrigation',
  ANIMAL: 'animal',
  POSTHARVEST: 'postharvest',
  GROWTH_REGULATOR: 'growth_regulator',
} as const;

export const ITEM_CONDITION = {
  NEW: 'new',
  USED: 'used',
  HALF_USED: 'half_used',
} as const;

export const RENTAL_BASIS = {
  PER_DAY: 'per_day',
  PER_HOUR: 'per_hour',
  PER_ACRE: 'per_acre',
} as const;

// ─── COMMUNITY ──────────────────────────────────────────

export const POST_TYPE = {
  QUESTION: 'question',
  SUCCESS_STORY: 'success_story',
  TIP: 'tip',
  PEST_HELP: 'pest_help',
} as const;

// ─── ALERTS ─────────────────────────────────────────────

export const ALERT_DIRECTION = {
  ABOVE: 'above',
  BELOW: 'below',
} as const;

export const ALERT_PRICE_TYPE = {
  MANDI: 'mandi',
  FARM_GATE: 'farmGate',
  DEALER: 'dealer',
  RETAIL: 'retail',
} as const;

// ─── USER / AUTH ────────────────────────────────────────

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export const USER_ROLE = {
  FARMER: 'FARMER',
  TRADER: 'TRADER',
  DEALER: 'DEALER',
  CORPORATE: 'CORPORATE',
} as const;

export const RBAC_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  CONTENT_MODERATOR: 'CONTENT_MODERATOR',
  GOVERNMENT_OFFICER: 'GOVERNMENT_OFFICER',
  FPO_ADMIN: 'FPO_ADMIN',
  FPO_MEMBER: 'FPO_MEMBER',
  VENDOR: 'VENDOR',
  FARMER: 'FARMER',
  TRADER: 'TRADER',
  DEALER: 'DEALER',
  CORPORATE: 'CORPORATE',
  LABOR_INDIVIDUAL: 'LABOR_INDIVIDUAL',
  LABOR_TEAM_LEADER: 'LABOR_TEAM_LEADER',
} as const;

// ─── RBAC RESOURCES ─────────────────────────────────────

export const RESOURCE = {
  USERS: 'users',
  SERVICES: 'services',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  COMMUNITY: 'community',
  LISTINGS: 'listings',
  PRICES: 'prices',
  SCHEMES: 'schemes',
  DISPUTES: 'disputes',
  REVIEWS: 'reviews',
  AUDIT: 'audit',
  TEAMS: 'teams',
  JOBS: 'jobs',
  BIDS: 'bids',
  ATTENDANCE: 'attendance',
  ALL: '*',
} as const;

export const ACTION = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

export const SCOPE = {
  OWN: 'own',
  ORGANIZATION: 'organization',
  GEOGRAPHIC: 'geographic',
  ALL: 'all',
} as const;

// ─── LABOR / JOBS ───────────────────────────────────────

export const LABOR_SKILL = {
  WEEDING: 'weeding',
  TRANSPLANTING: 'transplanting',
  HARVESTING: 'harvesting',
  PRUNING: 'pruning',
  GRAFTING: 'grafting',
  SPRAYING: 'spraying',
  LOADING: 'loading',
  GENERAL: 'general',
} as const;

export const JOB_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
} as const;

export const BID_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

// ─── CACHE ──────────────────────────────────────────────

export const CACHE_TTL = {
  PRICES: 15 * 60,          // 15 min
  WEATHER: 30 * 60,         // 30 min
  SCHEMES: 24 * 60 * 60,    // 24 hours
  CATEGORIES: 60 * 60,      // 1 hour
  CROPS: 60 * 60,           // 1 hour
  MANDIS: 60 * 60,          // 1 hour
  NEWS: 10 * 60,            // 10 min
  AVAILABILITY: 5 * 60,     // 5 min
  PERMISSIONS: 5 * 60,      // 5 min
} as const;

export const CACHE_KEY = {
  PRICES_HIGHLIGHTS: 'prices:highlights',
  WEATHER: (lat: number, lng: number) => `weather:${lat}:${lng}`,
  SERVICE_CATEGORIES: 'service:categories',
  AVAILABILITY: (providerId: string, year: number, month: number, listingId: string) =>
    `availability:${providerId}:${year}-${month}:${listingId}`,
  PERMISSIONS: (userId: string) => `permissions:${userId}`,
  ROLES: (userId: string) => `roles:${userId}`,
} as const;

// ─── UPLOAD / FILE ──────────────────────────────────────

export const UPLOAD_LIMITS = {
  SCANNER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024,    // 5MB
} as const;

export const ALLOWED_MIME_TYPES = {
  SCANNER: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  UPLOAD: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// ─── RATE LIMITS ────────────────────────────────────────

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,  // 15 min
  MAX_GENERAL: 200,
  MAX_AUTH: 20,
} as const;

// ─── MAINTENANCE BUFFERS (days) ─────────────────────────

export const MAINTENANCE_BUFFER = {
  HARVESTER: 1,
  LASER_LEVELER: 1,
  TRANSPLANTER: 0.5,
  TRACTOR: 0,
} as const;

// ─── STATE MINIMUM WAGES (₹/day) ───────────────────────

export const STATE_MIN_WAGE: Record<string, number> = {
  Telangana: 400,
  'Andhra Pradesh': 375,
  Karnataka: 371,
  'Tamil Nadu': 389,
  Maharashtra: 398,
  Gujarat: 351,
  'Madhya Pradesh': 331,
  'Uttar Pradesh': 341,
  Rajasthan: 349,
  Punjab: 386,
  Bihar: 309,
  'West Bengal': 338,
};

// Re-export routes
export { API_ROUTES, ENDPOINTS } from './routes';
