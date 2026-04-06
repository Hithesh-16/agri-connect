# Phase 6: Voice-First, Offline & Multilingual

**Timeline:** Weeks 26–30
**Dependencies:** Phase 5 (Village Exchange, Reviews/Disputes) complete

---

## Objective

Make KisanConnect accessible to every Indian farmer regardless of literacy, language, or connectivity. Implement voice navigation in 10+ Indian languages, offline-first mobile with WatermelonDB, WhatsApp chatbot, SMS/USSD fallback for feature phones, PWA for no-install access, and complete i18n coverage.

---

## Current State

| Component | Status | Gap |
|-----------|--------|-----|
| i18n provider | Stub exists (`web/src/lib/i18n.tsx`) | Only en/te/hi with incomplete coverage |
| Voice features | None | No ASR, TTS, or voice navigation |
| Offline mode | None | WatermelonDB listed but not implemented |
| WhatsApp bot | None | Gupshup not integrated |
| PWA | None | No service worker, no manifest |
| USSD/IVR | None | No fallback for feature phones |
| APK size | Unknown | Target <15MB not validated |

---

## Technology Choices

| Technology | Purpose | Why This Over Alternatives |
|-----------|---------|---------------------------|
| **Sarvam AI ASR** | Voice input (speech-to-text) | Better accuracy for agricultural terms (crop names, pesticide names in regional languages) than Bhashini ASR. Commercial, reliable |
| **Bhashini API** | TTS + translation | Free (government-backed), supports 22 Indian languages. ULCA registration required (free). Good for TTS and text translation |
| **WatermelonDB** | Offline-first mobile DB | SQLite-based, lazy loading, built-in sync protocol. Purpose-built for React Native offline-first apps |
| **Gupshup** | WhatsApp Business API | Leading WhatsApp BSP in India. INR 0.50-0.70/msg. Supports templates, interactive messages, chatbot flows |
| **Exotel** | IVR for feature phones | Leading IVR provider in India. Supports regional languages. Pay-per-minute |

### Why NOT Alternatives
- **Google Cloud Speech** for ASR: More accurate but expensive at scale ($0.006/15s). Sarvam AI is India-focused, cheaper
- **AWS Polly** for TTS: Good quality but not free. Bhashini is free and government-supported
- **Realm** for offline: Deprecated by MongoDB in favor of Atlas Device Sync. WatermelonDB is actively maintained, lighter

---

## 6.1 Voice Features

### Voice Search
- User taps mic button → Sarvam AI ASR transcribes in detected language
- `voiceParser.ts` extracts structured data: intent + entities
- Example: "Show me tractors near Warangal" → `{ intent: "search_services", category: "machinery", subCategory: "tractor", location: "Warangal" }`
- Example: "Paddy price in Nizamabad" → `{ intent: "check_price", crop: "paddy", mandi: "Nizamabad" }`

### Voice Listing Creation
- "I have 10 quintals of paddy for sale at 2500 per quintal" → pre-fills Listing form
- Extraction: `{ item: "paddy", quantity: 10, unit: "quintal", price: 2500, priceUnit: "per quintal" }`
- User confirms pre-filled form → submit

### Voice Navigation
- "Go to prices" → navigate to prices screen
- "My bookings" → navigate to bookings list
- "Call support" → dial support number
- Intent mapping: 20+ navigation intents mapped to screen routes

### Voice Notes
- Record voice note on community posts, booking notes, dispute evidence
- Store as audio file on S3, playback in-app
- Optional: auto-transcribe for searchability

### Implementation

```
backend/src/services/bhashiniService.ts
  - registerOnULCA() — one-time API key setup
  - translateText(text, sourceLang, targetLang) → translated text
  - textToSpeech(text, lang) → audio buffer
  - speechToText(audioBuffer, lang) → transcript (fallback, use Sarvam primary)

backend/src/services/sarvamService.ts
  - transcribe(audioBuffer, lang) → { text, confidence, lang }
  - detectLanguage(audioBuffer) → lang code

backend/src/routes/voice.ts
  POST /api/voice/transcribe     — upload audio, get transcript
  POST /api/voice/translate      — translate text between languages
  POST /api/voice/tts            — text to speech audio
  POST /api/voice/parse          — transcript to structured intent

packages/shared/voice/voiceParser.ts
  - parseIntent(transcript, lang) → { intent, entities, confidence }
  - Intent types: search_services, check_price, navigate, create_listing, check_weather, check_scheme, book_service

packages/mobile-core/hooks/useVoice.ts
  - startListening(lang?) → void
  - stopListening() → { transcript, intent, entities }
  - speak(text, lang) → void (TTS)

packages/mobile-core/components/VoiceButton.tsx
  - Floating mic button with pulse animation while listening
  - Language auto-detection or manual selection
  - Visual feedback: waveform while recording, text preview while processing
```

---

## 6.2 WatermelonDB Offline-First

### Offline Strategy

| Data Type | Cache Strategy | Sync Direction | Conflict Resolution |
|-----------|---------------|----------------|-------------------|
| Mandi prices | Cache on fetch, refresh when online | Server → Client | Server wins (always latest) |
| Weather data | Cache on fetch, 30min TTL | Server → Client | Server wins |
| Vendor listings (nearby) | Cache by geo-hash, refresh on search | Server → Client | Server wins |
| Crop calendar | Cache on login | Server → Client | Server wins |
| Community posts | Cache recent 50 | Bidirectional | Last-write-wins |
| Bookings | Queue offline, sync on connect | Client → Server | Server wins (prevents double-book) |
| Listings | Queue offline, sync on connect | Client → Server | Last-write-wins |
| Attendance check-ins | Queue offline, sync on connect | Client → Server | Client wins (GPS timestamp matters) |
| Chat messages | Queue offline, sync on connect | Bidirectional | Timestamp-ordered merge |

### Database Schema (WatermelonDB)

```javascript
// packages/mobile-core/db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({ name: 'prices', columns: [
      { name: 'crop_id', type: 'string' },
      { name: 'mandi_id', type: 'string' },
      { name: 'modal_price', type: 'number' },
      { name: 'min_price', type: 'number' },
      { name: 'max_price', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'synced', type: 'boolean' },
    ]}),
    tableSchema({ name: 'bookings', columns: [
      { name: 'server_id', type: 'string', isOptional: true },
      { name: 'provider_id', type: 'string' },
      { name: 'listing_id', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'start_date', type: 'number' },
      { name: 'total_amount', type: 'number' },
      { name: 'synced', type: 'boolean' },
      { name: 'created_at', type: 'number' },
    ]}),
    tableSchema({ name: 'vendors', columns: [
      { name: 'server_id', type: 'string' },
      { name: 'business_name', type: 'string' },
      { name: 'category_id', type: 'string' },
      { name: 'rating', type: 'number' },
      { name: 'latitude', type: 'number' },
      { name: 'longitude', type: 'number' },
      { name: 'geo_hash', type: 'string' },
      { name: 'synced', type: 'boolean' },
    ]}),
    tableSchema({ name: 'sync_queue', columns: [
      { name: 'entity_type', type: 'string' },
      { name: 'entity_id', type: 'string' },
      { name: 'action', type: 'string' }, // CREATE, UPDATE, DELETE
      { name: 'payload', type: 'string' }, // JSON
      { name: 'created_at', type: 'number' },
      { name: 'retries', type: 'number' },
    ]}),
  ]
})
```

### Sync Protocol

```
backend/src/routes/sync.ts
  POST /api/sync/pull    — { lastSyncAt, tables: ['prices','vendors'] } → changed records
  POST /api/sync/push    — { changes: [{ table, action, record }] } → { conflicts: [] }

packages/mobile-core/db/sync.ts
  - syncWithServer() — called on app foreground, network reconnect, manual pull-to-refresh
  - pushPendingChanges() — flush sync_queue to server
  - pullLatestData(tables) — fetch changes since last sync
  - resolveConflicts(serverRecord, localRecord) → winner
```

---

## 6.3 WhatsApp Bot (Gupshup)

### Supported Flows

| Command | Example | Response |
|---------|---------|----------|
| Price check | "Paddy price Warangal" | Today's modal price, min, max, change % |
| Booking status | "My bookings" | List of active bookings with status |
| Weather | "Weather Hyderabad" | 3-day forecast summary |
| Scheme check | "Schemes for me" | Top 3 matching schemes based on profile |
| Help | "Help" | Menu of available commands |

### Auto-Push Notifications
- Weather alert: rain/storm predicted → push to affected farmers
- Price alert: threshold crossed → push to subscribed users
- Booking reminder: 24h before scheduled booking
- Scheme notification: new scheme matching farmer's profile

### Implementation

```
backend/src/routes/whatsapp.ts
  POST /api/whatsapp/webhook   — Gupshup webhook (incoming messages)
  POST /api/whatsapp/send      — Send message (internal use via BullMQ)

backend/src/services/whatsappService.ts
  - handleIncoming(message) → parse intent → fetch data → send response
  - sendTemplate(phone, templateName, params) → Gupshup API call
  - sendInteractive(phone, body, buttons) → interactive message
```

### Gupshup Setup
- Register WhatsApp Business Account
- Get approved message templates (booking confirmation, price alert, weather alert)
- Set webhook URL to `/api/whatsapp/webhook`
- Cost: INR 0.50-0.70 per message (business-initiated), free for user-initiated within 24h window

---

## 6.4 SMS/USSD Fallback

### USSD Flow (*123#)
```
*123# → Welcome to KisanConnect
  1. Check Price
  2. My Bookings
  3. Weather
  4. Help

Select 1 → Enter crop name: _____
  → Paddy: ₹2,450/qtl (Nizamabad) ↑3.2%
```

### IVR (Exotel)
- Toll-free number for voice-based interaction
- Language selection → menu → voice responses
- Supports: price check, booking status, scheme info, complaint registration

---

## 6.5 PWA (KisanConnect Lite)

New lightweight Next.js app in `packages/pwa/`:
- Quick price check (no login required)
- Service discovery with map
- Scheme eligibility checker
- WhatsApp-redirected booking flows
- Service worker for offline price caching
- Target: Lighthouse 90+ performance, 100 PWA score

---

## 6.6 i18n Completion

### Current: en, te, hi (incomplete)
### Target: 10 languages with full coverage

| Language | Code | Priority | Region |
|----------|------|----------|--------|
| English | en | P0 | All India |
| Telugu | te | P0 | Telangana, AP |
| Hindi | hi | P0 | North India, MP, UP |
| Tamil | ta | P1 | Tamil Nadu |
| Kannada | kn | P1 | Karnataka |
| Bengali | bn | P1 | West Bengal |
| Marathi | mr | P1 | Maharashtra |
| Gujarati | gu | P2 | Gujarat |
| Malayalam | ml | P2 | Kerala |
| Odia | or | P2 | Odisha |

### Translation Workflow
1. Extract all strings from web + mobile into shared i18n package
2. Use Bhashini API for initial machine translation
3. Human review by native speakers (crowd-sourced from farmer communities)
4. Store in `packages/shared/i18n/{lang}.json`

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/voice/transcribe` | Upload audio, get transcript | Yes |
| POST | `/api/voice/translate` | Translate text between languages | Yes |
| POST | `/api/voice/tts` | Text to speech audio | Yes |
| POST | `/api/voice/parse` | Transcript to structured intent | Yes |
| POST | `/api/sync/pull` | Pull changed records since last sync | Yes |
| POST | `/api/sync/push` | Push locally created/updated records | Yes |
| POST | `/api/whatsapp/webhook` | Gupshup incoming message webhook | Signature |
| POST | `/api/whatsapp/send` | Send WhatsApp message (internal) | Internal |

---

## Files to Create

| File | Purpose |
|------|---------|
| `backend/src/services/sarvamService.ts` | Sarvam AI ASR integration |
| `backend/src/services/bhashiniService.ts` | Bhashini TTS + translation |
| `backend/src/services/whatsappService.ts` | Gupshup WhatsApp integration |
| `backend/src/routes/voice.ts` | Voice API endpoints |
| `backend/src/routes/whatsapp.ts` | WhatsApp webhook + send |
| `backend/src/routes/sync.ts` | Offline sync pull/push |
| `packages/shared/voice/voiceParser.ts` | NLP intent extraction from transcript |
| `packages/shared/i18n/*.json` | Translation files (10 languages) |
| `packages/mobile-core/hooks/useVoice.ts` | Voice recording + TTS hook |
| `packages/mobile-core/components/VoiceButton.tsx` | Floating mic button |
| `packages/mobile-core/db/schema.ts` | WatermelonDB schema |
| `packages/mobile-core/db/sync.ts` | Sync protocol with backend |
| `packages/pwa/` | New PWA app (Next.js) |

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/index.ts` | Mount voice, whatsapp, sync routes |
| `web/src/lib/i18n.tsx` | Extend to 10 languages, add missing strings |
| `packages/mobile-core/` | Add WatermelonDB provider to app root |

---

## Testing Checklist

- [ ] Voice recognition accuracy ≥80% for Telugu and Hindi agricultural terms
- [ ] Voice search returns correct category + location results
- [ ] Voice navigation triggers correct screen transitions
- [ ] Offline: create booking in airplane mode → toggle online → booking syncs to server
- [ ] Offline: cached prices display correctly without network
- [ ] Sync conflict: booking created offline while slot taken online → server wins, user notified
- [ ] WhatsApp: send "paddy price warangal" → receive correct price response
- [ ] WhatsApp: webhook signature verification rejects tampered requests
- [ ] USSD: *123# flow returns correct price data
- [ ] PWA: Lighthouse performance ≥90, PWA score = 100
- [ ] PWA: offline price check works via service worker cache
- [ ] i18n: all 22 web pages render correctly in all 10 languages
- [ ] i18n: RTL languages not applicable (all Indian languages are LTR)
- [ ] APK size <15MB after ProGuard + resource shrinking
- [ ] TTS: Bhashini reads weather alert aloud in correct language
- [ ] Translation: Bhashini translates crop advisory from English to Telugu accurately
