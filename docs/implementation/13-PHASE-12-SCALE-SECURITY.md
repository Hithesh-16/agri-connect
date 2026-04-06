# Phase 12: Scale, Performance & Security

**Timeline:** Weeks 50–53
**Dependencies:** All feature phases (0–11) complete

---

## Objective

Optimize KisanConnect for 100K+ concurrent users, harden security to production-grade, and upgrade core dependencies. This phase is about resilience, not features.

---

## Performance Optimizations

### Database
- **Read replicas**: Route analytics/reporting queries to read replica, keep write traffic on primary
- **Price table partitioning**: TimescaleDB hypertable on PriceHistory, partition by month. 6 months of data = ~50M rows, partition pruning critical
- **Connection pooling**: Prisma Accelerate or PgBouncer in front of Neon. Target: 500 concurrent connections
- **Query optimization**: Add composite indexes for hot queries (crop_id + mandi_id + date, provider_id + status, userId + createdAt)
- **N+1 detection**: Add Prisma query logging in staging, flag queries >100ms

### Caching (Redis)
- **Hot data**: Prices (5-min TTL), categories (1h), provider profiles (10-min), weather (30-min)
- **Session data**: Refresh tokens, rate limit counters
- **Cache invalidation**: Pub/sub on write → invalidate relevant cache keys
- **Cache warming**: Cron job pre-fetches top 100 crop-mandi price combinations every 5 minutes

### API
- **Response compression**: gzip/brotli via `compression` middleware
- **Pagination enforcement**: Max 50 items per page, cursor-based for large datasets
- **Field selection**: `?fields=id,name,price` to reduce payload size
- **ETags**: 304 Not Modified for unchanged resources
- **API versioning**: `/api/v1/` prefix, backward-compatible changes only

### Mobile
- **Image lazy loading**: Load images only when visible in viewport
- **Infinite scroll**: Replace paginated lists with cursor-based infinite scroll
- **Skeleton screens**: Show loading skeletons instead of spinners
- **Bundle splitting**: Separate vendor code from app code, load on demand
- **Hermes**: Ensure Hermes JS engine is enabled (faster startup, less memory)

### Web
- **ISR**: Incremental Static Regeneration for public pages (prices, services, schemes)
- **Edge caching**: Vercel Edge Cache for static assets and ISR pages
- **Image optimization**: Next.js Image component with WebP, responsive sizes
- **Code splitting**: Dynamic imports for heavy components (maps, charts)

---

## Security Hardening

### OWASP Top 10 Compliance

| # | Vulnerability | Mitigation |
|---|--------------|------------|
| A01 | Broken Access Control | RBAC with permission checks on every route (Phase 0). Row-level security for own-data access |
| A02 | Cryptographic Failures | AES-256 encryption for Aadhaar/bank details at rest. TLS 1.3 in transit |
| A03 | Injection | Prisma parameterized queries (safe by default). Zod input validation on all endpoints |
| A04 | Insecure Design | Escrow model for payments, rate limiting, booking conflict detection |
| A05 | Security Misconfiguration | Helmet.js headers, CORS whitelist, no debug mode in production |
| A06 | Vulnerable Components | Dependabot alerts, `pnpm audit` in CI, Snyk integration |
| A07 | Auth Failures | Refresh token rotation, device fingerprinting, brute-force protection (5 OTP attempts/hour) |
| A08 | Data Integrity Failures | Razorpay webhook signature verification, JWT signature validation |
| A09 | Logging Failures | Pino structured logging, Sentry error tracking, audit log for all mutations |
| A10 | SSRF | Validate URLs in image upload, block internal network requests |

### Encryption
- **At rest**: Aadhaar numbers, bank account details, PAN numbers encrypted with AES-256-GCM
- **Key management**: AWS KMS or environment variable (for now), rotate keys quarterly
- **In transit**: TLS 1.3 enforced, HSTS header

### Rate Limiting (Tiered)

| Tier | Requests / 15 min | Auth Requests / 15 min |
|------|-------------------|----------------------|
| Unauthenticated | 30 | 10 |
| Free | 100 | 20 |
| Pro | 500 | 50 |
| Business | 2,000 | 200 |
| Admin | 5,000 | 500 |

### Fraud Prevention
- **Fake reviews**: Require verified booking before review, IP velocity check, device fingerprinting
- **GPS spoofing**: Compare check-in GPS with farm polygon + last known location + accelerometer data
- **Duplicate accounts**: Phone number uniqueness, Aadhaar uniqueness (when eKYC active)
- **Payment fraud**: Razorpay's built-in fraud detection + velocity checks on wallet transactions

---

## Dependency Upgrades

| Package | Current | Target | Breaking Changes |
|---------|---------|--------|-----------------|
| Next.js | 14.2.15 | 15.x | React 19, new caching defaults, Turbopack stable |
| Prisma | 5.22 | 6.x (when stable) | Query engine changes, new migration format |
| React | 18 | 19 | use() hook, Actions, improved Suspense |
| Tailwind CSS | 3.4 | 4.x | CSS-first configuration, no more JS config |
| TypeScript | 5.6 | 5.8+ | Minor type changes |

---

## Load Testing Plan

### Tools
- **k6** for API load testing
- **Lighthouse CI** for web performance regression
- **Detox** for mobile performance profiling

### Scenarios

| Scenario | Target | Method |
|----------|--------|--------|
| Homepage dashboard load | <800ms p95 | 1000 concurrent users, measure TTFB |
| Price search (cached) | <50ms p95 | 5000 req/sec burst |
| Booking creation | <500ms p95 | 100 concurrent bookings |
| Nearby vendor search (PostGIS) | <200ms p95 | 1000 concurrent geo-queries |
| File upload (5MB image) | <3s p95 | 50 concurrent uploads |
| WebSocket connection | 10K concurrent | Socket.io with Redis adapter |

---

## Penetration Testing

- Engage external security firm (CERT-In empaneled)
- Scope: API, web app, mobile app, payment flows
- Focus areas: authentication bypass, payment manipulation, data exfiltration, privilege escalation
- Timeline: 2-week engagement, 1-week remediation, 1-week retest

---

## Testing Checklist

- [ ] k6 load test passes all scenario targets
- [ ] Lighthouse CI score ≥90 for performance on all pages
- [ ] No N+1 queries in Prisma query logs (staging)
- [ ] Redis cache hit rate ≥80% for prices and weather
- [ ] Connection pool handles 500 concurrent database connections
- [ ] Rate limiting correctly enforces tier-based limits
- [ ] AES-256 encryption/decryption round-trip for Aadhaar/bank data
- [ ] OWASP ZAP scan reports zero high-severity findings
- [ ] Dependabot/Snyk reports zero critical vulnerabilities
- [ ] Penetration test remediation complete with retest pass
- [ ] Next.js 15 upgrade complete, all pages render correctly
- [ ] Mobile app Hermes startup time <2s on mid-range Android device
