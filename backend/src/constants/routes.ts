// ─── API MOUNT PATHS (used in index.ts) ─────────────────

export const API_ROUTES = {
  HEALTH: '/api/health',
  AUTH: '/api/auth',
  CROPS: '/api/crops',
  MANDIS: '/api/mandis',
  PRICE_HISTORY: '/api/prices/history',
  PRICES: '/api/prices',
  WEATHER: '/api/weather',
  NEWS: '/api/news',
  SCANNER: '/api/scanner',
  SUPPLY_CHAIN: '/api/supply-chain',
  USERS: '/api/users',
  ALERTS: '/api/alerts',
  CALENDAR: '/api/calendar',
  LISTINGS: '/api/listings',
  SCHEMES: '/api/schemes',
  INVENTORY: '/api/inventory',
  COMMUNITY: '/api/community',
  RBAC: '/api/rbac',
  UPLOAD: '/api/upload',
  PROVIDERS: '/api/providers',
  SERVICES: '/api/services',
  BOOKINGS: '/api/bookings',
  AVAILABILITY: '/api/availability',
  CHAT: '/api/chat',
  NOTIFICATIONS: '/api/notifications',
  DEVICES: '/api/devices',
  PAYMENTS: '/api/payments',
  TEAMS: '/api/teams',
  JOBS: '/api/jobs',
  ATTENDANCE: '/api/attendance',
} as const;

// ─── ENDPOINT PATHS (used inside route files) ───────────

export const ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_OTP: '/send-otp',
    VERIFY_OTP: '/verify-otp',
    REGISTER: '/register',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
  },

  // Users
  USERS: {
    PROFILE: '/profile',
    CROPS: '/crops',
    MANDIS: '/mandis',
  },

  // Crops
  CROPS: {
    LIST: '/',
    DETAIL: '/:id',
  },

  // Mandis
  MANDIS: {
    LIST: '/',
    DETAIL: '/:id',
  },

  // Prices
  PRICES: {
    LIST: '/',
    HIGHLIGHTS: '/highlights',
    CHAIN: '/chain/:cropId',
  },

  // Price History
  PRICE_HISTORY: {
    BY_CROP: '/:cropId',
  },

  // Weather
  WEATHER: {
    GET: '/',
  },

  // News
  NEWS: {
    LIST: '/',
    DETAIL: '/:id',
  },

  // Scanner
  SCANNER: {
    ANALYZE: '/analyze',
  },

  // Supply Chain
  SUPPLY_CHAIN: {
    COTTON: '/cotton',
    ENAM: '/enam',
    FINANCE: '/finance',
  },

  // Alerts
  ALERTS: {
    LIST: '/',
    CREATE: '/',
    UPDATE: '/:id',
    DELETE: '/:id',
  },

  // Calendar
  CALENDAR: {
    TEMPLATES: '/templates/:cropId',
    TASKS: '/tasks',
    CREATE_TASK: '/tasks',
    UPDATE_TASK: '/tasks/:id',
  },

  // Listings
  LISTINGS: {
    NEARBY: '/nearby',
    LIST: '/',
    DETAIL: '/:id',
    CREATE: '/',
    UPDATE: '/:id',
    DELETE: '/:id',
    INQUIRIES: '/:id/inquiries',
  },

  // Schemes
  SCHEMES: {
    LIST: '/',
    CHECK_ELIGIBILITY: '/check-eligibility',
  },

  // Inventory
  INVENTORY: {
    LIST: '/',
    SEARCH: '/search',
    BY_CATEGORY: '/:categoryId',
    ITEM: '/items/:itemId',
  },

  // Community
  COMMUNITY: {
    LIST: '/',
    DETAIL: '/:id',
    CREATE: '/',
    COMMENTS: '/:id/comments',
    UPVOTE: '/:id/upvote',
    MARK_ANSWER: '/comments/:id/answer',
    DELETE: '/:id',
  },

  // RBAC / Roles
  RBAC: {
    LIST: '/',
    DETAIL: '/:id',
    ASSIGN_ROLE: '/users/:userId/roles',
    REMOVE_ROLE: '/users/:userId/roles/:roleId',
    USER_ROLES: '/users/:userId/roles',
    PERMISSIONS: '/permissions',
    AUDIT_LOGS: '/audit-logs',
  },

  // Upload
  UPLOAD: {
    SINGLE: '/',
    MULTIPLE: '/multiple',
  },

  // Providers
  PROVIDERS: {
    REGISTER: '/',
    ME: '/me',
    UPDATE_ME: '/me',
    DETAIL: '/:id',
    SUBMIT_KYC: '/me/kyc',
    GET_KYC: '/me/kyc',
    REVIEW_KYC: '/:id/kyc',
    ADMIN_KYC_QUEUE: '/admin/kyc-queue',
  },

  // Services
  SERVICES: {
    CATEGORIES: '/categories',
    LIST: '/',
    DETAIL: '/:id',
    CREATE: '/',
    UPDATE: '/:id',
    DELETE: '/:id',
    PAUSE: '/:id/pause',
    NEARBY: '/nearby',
  },

  // Bookings
  BOOKINGS: {
    CREATE: '/',
    LIST: '/',
    DETAIL: '/:id',
    UPDATE_STATUS: '/:id/status',
    CANCEL: '/:id/cancel',
    RESCHEDULE: '/:id/reschedule',
    RECURRING_CREATE: '/recurring',
    RECURRING_DELETE: '/recurring/:id',
  },

  // Availability
  AVAILABILITY: {
    CALENDAR: '/:providerId',
    CHECK: '/:providerId/check',
    UPDATE: '/',
    BLOCK: '/block',
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/conversations',
    MESSAGES: '/conversations/:id/messages',
    CREATE_CONVERSATION: '/conversations',
    SEND_MESSAGE: '/conversations/:id/messages',
    MARK_READ: '/messages/:id/read',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/',
    MARK_READ: '/:id/read',
    MARK_ALL_READ: '/read-all',
  },

  // Devices
  DEVICES: {
    REGISTER_TOKEN: '/token',
    REMOVE_TOKEN: '/token/:token',
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: '/order',
    VERIFY: '/verify',
    ESCROW_RELEASE: '/escrow/release',
    REFUND: '/refund',
    HISTORY: '/history',
    WALLET: '/wallet',
    WALLET_ADD: '/wallet/add',
    EARNINGS: '/earnings',
    WEBHOOK: '/webhook',
    INVOICE: '/invoices/:id',
  },

  // Teams
  TEAMS: {
    CREATE: '/',
    MY_TEAMS: '/me',
    DETAIL: '/:id',
    UPDATE: '/:id',
    ADD_MEMBER: '/:id/members',
    UPDATE_MEMBER: '/:id/members/:memberId',
    REMOVE_MEMBER: '/:id/members/:memberId',
  },

  // Jobs
  JOBS: {
    SKILLS: '/skills',
    CREATE: '/',
    LIST: '/',
    DETAIL: '/:id',
    UPDATE: '/:id',
    DELETE: '/:id',
    CREATE_BID: '/:id/bids',
    LIST_BIDS: '/:id/bids',
    ACCEPT_BID: '/bids/:bidId/accept',
    REJECT_BID: '/bids/:bidId/reject',
    DELETE_BID: '/bids/:bidId',
  },

  // Attendance
  ATTENDANCE: {
    GENERATE_QR: '/qr/:bookingId',
    CHECK_IN: '/check-in',
    CHECK_OUT: '/check-out',
    BY_BOOKING: '/booking/:bookingId',
    SUBSTITUTES: '/substitutes',
    ADD_SUBSTITUTE: '/substitute',
    DISTRIBUTE_PAYMENT: '/distribute-payment/:bookingId',
  },
} as const;
