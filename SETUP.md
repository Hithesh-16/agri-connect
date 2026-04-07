# KisanConnect - Complete Setup Guide

## Table of Contents

- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Infrastructure Services](#infrastructure-services)
- [Environment Variables](#environment-variables)
- [Backend Setup](#backend-setup)
- [Web App Setup](#web-app-setup)
- [Mobile App Setup](#mobile-app-setup)
- [Docker Setup](#docker-setup)
- [Third-Party API Keys](#third-party-api-keys)
- [Database Reference](#database-reference)
- [All Available Scripts](#all-available-scripts)
- [API Endpoints](#api-endpoints)
- [Production Deployment](#production-deployment)

---

## Project Architecture

| App / Service        | Stack                          | Port  | Location                    |
| -------------------- | ------------------------------ | ----- | --------------------------- |
| **Backend API**      | Express + TypeScript + Prisma  | 5000  | `backend/`                  |
| **Web App**          | Next.js 14 (PWA)              | 3000  | `web/`                      |
| **Mobile App**       | Expo (React Native)            | 8081  | `artifacts/kisan-connect/`  |
| **PostgreSQL**       | PostGIS 16                     | 5432  | Docker or local             |
| **Redis**            | Redis 7                        | 6379  | Docker or local (optional)  |

Monorepo managed with **pnpm workspaces**. Shared packages live in `lib/`.

---

## Prerequisites

| Tool       | Version | Install                                        |
| ---------- | ------- | ---------------------------------------------- |
| Node.js    | >= 20   | https://nodejs.org or `brew install node`       |
| pnpm       | >= 8    | `npm install -g pnpm`                           |
| PostgreSQL | >= 16   | `brew install postgresql@16` or Docker          |
| Redis      | >= 7    | `brew install redis` or Docker (optional)       |
| Docker     | latest  | https://docs.docker.com/get-docker/ (optional)  |
| Expo CLI   | latest  | `npm install -g expo-cli` (for mobile only)     |

---

## Infrastructure Services

### Option A: Docker (recommended)

From the project root:

```bash
docker-compose up -d postgres redis
```

This starts:
- **Postgres** on `localhost:5432` (user: `kisanconnect`, password: `kisanconnect`, db: `kisanconnect`)
- **Redis** on `localhost:6379`

### Option B: Local install (macOS)

```bash
# Install
brew install postgresql@16 redis

# Start services
brew services start postgresql@16
brew services start redis

# Create database
createdb kisan_connect
```

### Option C: Cloud services

| Service    | Recommended Providers              |
| ---------- | ---------------------------------- |
| PostgreSQL | Supabase, Neon, Railway, AWS RDS   |
| Redis      | Upstash (serverless), Railway      |

> **Note:** Redis is optional. If not configured, caching and job queues degrade gracefully -- the app still works, just without background jobs and caching.

---

## Environment Variables

### Backend (`backend/.env`)

Copy the example and fill in values:

```bash
cp backend/.env.example backend/.env
```

#### Required

| Variable         | Description                           | Example                                                                |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string          | `postgresql://kisanconnect:kisanconnect@localhost:5432/kisanconnect`    |
| `JWT_SECRET`     | 64-char random string for signing JWTs | Generate with `openssl rand -hex 32`                                  |
| `PORT`           | Backend server port                   | `5000`                                                                 |
| `NODE_ENV`       | Environment mode                      | `development` or `production`                                          |

#### Optional - Server

| Variable                     | Description                              | Default                                          |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `CORS_ORIGINS`               | Comma-separated allowed origins          | `http://localhost:3000,http://localhost:8081`     |
| `REDIS_URL`                  | Redis connection string                  | Not set (features degrade gracefully)            |
| `JWT_EXPIRES_IN`             | Access token expiry                      | `15m`                                            |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token expiry in days          | `30`                                             |
| `OTP_EXPIRY_MINUTES`         | OTP validity window                      | `5`                                              |
| `UNIVERSAL_OTP`              | Bypass OTP in dev                        | `123456` (dev only, do NOT use in production)    |

#### Optional - Third-Party APIs

| Variable                | Service          | Description                       | How to Get                                                    |
| ----------------------- | ---------------- | --------------------------------- | ------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`       | Razorpay         | Payment gateway key               | https://dashboard.razorpay.com -> Settings -> API Keys        |
| `RAZORPAY_KEY_SECRET`   | Razorpay         | Payment gateway secret            | Same as above                                                 |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay       | Webhook signature verification    | Razorpay Dashboard -> Webhooks                                |
| `OPENWEATHERMAP_API_KEY`| OpenWeatherMap   | Weather data for farmers          | https://openweathermap.org/api (free tier available)          |
| `AGMARKNET_API_KEY`     | AgMarkNet        | Indian government mandi prices    | https://agmarknet.gov.in                                      |
| `MSG91_AUTH_KEY`         | MSG91            | SMS OTP delivery                  | https://msg91.com -> Dashboard -> API Keys                    |
| `MSG91_SENDER_ID`       | MSG91            | SMS sender ID                     | Default: `KISANC`                                             |
| `MSG91_OTP_TEMPLATE_ID` | MSG91            | OTP SMS template                  | MSG91 Dashboard -> Templates                                  |
| `MSG91_TPL_BOOKING_CONFIRMED`  | MSG91     | Booking confirmed SMS template    | MSG91 Dashboard -> Templates                                  |
| `MSG91_TPL_BOOKING_CANCELLED`  | MSG91     | Booking cancelled SMS template    | MSG91 Dashboard -> Templates                                  |
| `MSG91_TPL_PROVIDER_ARRIVING`  | MSG91     | Provider arriving SMS template    | MSG91 Dashboard -> Templates                                  |
| `MSG91_TPL_PAYMENT_RECEIVED`   | MSG91     | Payment received SMS template     | MSG91 Dashboard -> Templates                                  |
| `SENTRY_DSN`            | Sentry           | Error tracking                    | https://sentry.io -> Project Settings -> Client Keys          |
| `S3_BUCKET`             | AWS S3           | Image/file storage bucket         | AWS Console -> S3 -> Create Bucket                            |
| `S3_REGION`             | AWS S3           | S3 bucket region                  | Default: `ap-south-1`                                         |
| `CDN_URL`               | AWS CloudFront   | CDN URL for S3 objects            | AWS Console -> CloudFront                                     |
| `UPLOAD_DIR`            | Local fallback   | Local upload directory            | Default: `./uploads` (used when S3 not configured)            |
| `FIREBASE_PROJECT_ID`   | Firebase         | Push notifications project        | https://console.firebase.google.com -> Project Settings       |
| `FIREBASE_CLIENT_EMAIL` | Firebase         | Service account email             | Firebase Console -> Service Accounts                          |
| `FIREBASE_PRIVATE_KEY`  | Firebase         | Service account private key       | Firebase Console -> Service Accounts -> Generate Key          |

### Web App (`web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Mobile App

The mobile app connects to the backend API URL configured in its source. For local development, ensure the backend is running on `localhost:5000`.

---

## Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database (creates all tables)
npx prisma db push

# 4. Seed initial data (crops, mandis, prices)
npm run db:seed

# 5. Seed RBAC roles and permissions
npm run seed:rbac

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`

### Verify it works

```bash
curl http://localhost:5000/api/health
```

Should return database status, Redis status (if configured), uptime, and version.

---

## Web App Setup

```bash
cd web

# 1. Install dependencies
npm install

# 2. Create env file
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000' > .env.local

# 3. Start development server
npm run dev
```

The web app will be available at `http://localhost:3000`.

---

## Mobile App Setup

```bash
cd artifacts/kisan-connect

# 1. Install dependencies
npm install

# 2. Start Expo development server
npm run start

# Then press:
# 'a' for Android emulator
# 'i' for iOS simulator
# scan QR code with Expo Go app for physical device
```

---

## Docker Setup

### Full stack with Docker

```bash
# From project root
docker-compose up -d
```

This starts all three services:
- **postgres** (PostGIS 16) on port 5432
- **redis** (Redis 7) on port 6379
- **backend** on port 5000

### Database only (recommended for development)

```bash
docker-compose up -d postgres redis
```

Then run the backend and web app locally with `npm run dev` for hot-reload.

---

## Third-Party API Keys

### Required for full functionality

| Service         | Purpose                        | Free Tier? | Priority    |
| --------------- | ------------------------------ | ---------- | ----------- |
| **Razorpay**    | Payment processing             | Test mode  | High        |
| **MSG91**       | SMS OTP & notifications        | Trial      | High        |

### Optional (app works without these)

| Service            | Purpose                       | Free Tier?   | Fallback                  |
| ------------------ | ----------------------------- | ------------ | ------------------------- |
| **OpenWeatherMap** | Weather data for farmers      | Yes (60/min) | Mock/no weather data      |
| **AgMarkNet**      | Government mandi prices       | Yes          | Seeded sample prices      |
| **AWS S3**         | File/image storage            | Free tier    | Local `./uploads` folder  |
| **Sentry**         | Error tracking & monitoring   | Free tier    | Console logging only      |
| **Firebase**       | Push notifications            | Yes          | In-app notifications only |

### Getting API keys

#### Razorpay (Payments)
1. Sign up at https://dashboard.razorpay.com
2. Go to **Settings -> API Keys**
3. Generate a key pair (use **Test** mode for development)
4. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
5. For webhooks: **Settings -> Webhooks -> Add**, set the secret

#### MSG91 (SMS)
1. Sign up at https://msg91.com
2. Get your Auth Key from the dashboard
3. Create SMS templates (requires DLT registration in India)
4. Set `MSG91_AUTH_KEY` and template IDs

#### OpenWeatherMap (Weather)
1. Sign up at https://openweathermap.org/api
2. Get a free API key (60 calls/min)
3. Set `OPENWEATHERMAP_API_KEY`

#### AWS S3 (File Storage)
1. Create an S3 bucket in `ap-south-1` (or your preferred region)
2. Configure IAM credentials with S3 read/write access
3. Set `S3_BUCKET`, `S3_REGION`, and AWS credentials
4. Optionally set up CloudFront CDN and set `CDN_URL`

#### Sentry (Error Tracking)
1. Create a project at https://sentry.io
2. Get the DSN from **Project Settings -> Client Keys**
3. Set `SENTRY_DSN`

#### Firebase (Push Notifications)
1. Create a project at https://console.firebase.google.com
2. Go to **Project Settings -> Service Accounts**
3. Generate a new private key
4. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

---

## Database Reference

### Seeded Data

After running `npm run db:seed`, the database includes:

- **20 crops**: wheat, rice, maize, cotton, soybean, chili, tomato, onion, potato, sorghum, chickpea, lentil, groundnut, turmeric, coriander, millet, sunflower, sugarcane, cauliflower, brinjal
- **10 mandis** (Telangana): Warangal, Nizamabad, Karimnagar, Nalgonda, Khammam, Suryapet, Adilabad, Mahbubnagar, Medak, Hyderabad Central
- **Sample prices**: Realistic price ranges across all crop-mandi combinations

After running `npm run seed:rbac`, the database includes 10 system roles with scoped permissions.

### Prisma Studio (Database GUI)

```bash
cd backend
npm run db:studio
```

Opens a browser-based GUI at `http://localhost:5555` to view and edit database records.

---

## All Available Scripts

### Root (monorepo)

```bash
pnpm build            # Build all packages
pnpm typecheck:libs   # Type-check shared libraries
pnpm typecheck        # Full type-check
```

### Backend (`backend/`)

```bash
npm run dev            # Start dev server with hot-reload (tsx watch)
npm run build          # Compile TypeScript to dist/
npm start              # Run compiled production build
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:seed        # Seed crops, mandis, and prices
npm run db:studio      # Open Prisma Studio GUI
npm run seed:rbac      # Seed roles and permissions
npm test               # Run tests (Vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

### Web (`web/`)

```bash
npm run dev     # Start Next.js dev server (port 3000)
npm run build   # Production build
npm start       # Start production server
npm run lint    # Run ESLint
```

### Mobile (`artifacts/kisan-connect/`)

```bash
npm run start      # Start Expo dev server
npm run android    # Build and run on Android
npm run ios        # Build and run on iOS
npm run typecheck  # TypeScript check
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Route              | Description                             |
| ------------------ | --------------------------------------- |
| `/health`          | Health check (DB, Redis, uptime)        |
| `/auth`            | OTP login, register, refresh, logout    |
| `/crops`           | Crop information                        |
| `/mandis`          | Mandi/market information                |
| `/prices`          | Live crop prices                        |
| `/price-history`   | Historical price data                   |
| `/weather`         | Weather data for locations              |
| `/news`            | Agricultural news and advisories        |
| `/scanner`         | Plant disease detection                 |
| `/supply-chain`    | Supply chain tracking                   |
| `/users`           | User profiles                           |
| `/alerts`          | Price alerts                            |
| `/calendar`        | Crop calendar and tasks                 |
| `/listings`        | Buy/sell product listings               |
| `/schemes`         | Government schemes and subsidies        |
| `/inventory`       | Stock management                        |
| `/community`       | Community posts and comments            |
| `/rbac`            | Role and permission management          |
| `/upload`          | File/image uploads                      |
| `/providers`       | Service provider profiles               |
| `/services`        | Service offerings                       |
| `/bookings`        | Service bookings                        |
| `/availability`    | Provider availability                   |
| `/chat`            | Direct messaging                        |
| `/notifications`   | In-app notifications                    |
| `/devices`         | Push notification device tokens         |
| `/payments`        | Razorpay payment processing             |
| `/teams`           | Team management                         |
| `/jobs`            | Job postings                            |
| `/attendance`      | Team attendance tracking                |

### WebSocket Namespaces

| Namespace     | Purpose                    | Rooms                              |
| ------------- | -------------------------- | ---------------------------------- |
| `/`           | Connection status          | -                                  |
| `/bookings`   | Real-time booking updates  | `user:{id}`, `provider:{id}`       |
| `/chat`       | Real-time messaging        | `user:{id}`, `conversation:{id}`   |

### Rate Limiting

- General: 100 requests per 15 minutes
- Auth endpoints: Stricter limits applied

---

## Production Deployment

### Recommended hosting

| Component    | Recommended                   | Why                              |
| ------------ | ----------------------------- | -------------------------------- |
| **Backend**  | Railway / Render / Fly.io     | Easy Docker deploys, auto-scale  |
| **Web**      | Vercel                        | Native Next.js support, CDN      |
| **Database** | Supabase / Neon               | Managed Postgres with PostGIS    |
| **Redis**    | Upstash                       | Serverless, pay-per-request      |
| **Storage**  | AWS S3 + CloudFront           | Scalable file storage with CDN   |

### Production environment checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate a strong `JWT_SECRET` (`openssl rand -hex 32`)
- [ ] Set `CORS_ORIGINS` to your actual frontend domain(s)
- [ ] Configure `DATABASE_URL` for your hosted PostgreSQL
- [ ] Configure `REDIS_URL` for your hosted Redis
- [ ] Set up Razorpay **Live** keys (not test keys)
- [ ] Configure MSG91 with DLT-registered templates
- [ ] Set up S3 bucket with proper IAM permissions
- [ ] Configure Sentry for error monitoring
- [ ] Set up Firebase for push notifications
- [ ] Run database migrations: `npx prisma db push`
- [ ] Run seeds: `npm run db:seed && npm run seed:rbac`
- [ ] Set up SSL/TLS (handled by most hosting providers)
- [ ] Configure a custom domain

### Quick-start (development, all services)

```bash
# Terminal 1: Infrastructure
docker-compose up -d postgres redis

# Terminal 2: Backend
cd backend && npm install && npx prisma generate && npx prisma db push && npm run db:seed && npm run seed:rbac && npm run dev

# Terminal 3: Web
cd web && npm install && npm run dev

# Terminal 4: Mobile (optional)
cd artifacts/kisan-connect && npm install && npm run start
```

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- Backend: Type-check + Vitest tests against a Postgres service container
- Web: Type-check + Next.js build verification
