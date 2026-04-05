# KisanConnect: API Providers & Mobile App Strategy

## API Stack (Selected Providers)

### 1. Maps - Mapbox GL
**Why:** Best satellite imagery for rural India, offline support, polygon drawing, free tier covers startup phase.

| Platform | Package | Purpose |
|----------|---------|---------|
| Web | `mapbox-gl` + `@mapbox/mapbox-gl-draw` | Interactive maps + farm boundary drawing |
| Android/iOS | `@rnmapbox/maps` | Native Mapbox GL, vector tiles, offline maps |
| Backend | Mapbox Geocoding API | Reverse geocoding for locations |

- **Free tier:** 50K map loads/month (web), 25K MAU (mobile)
- **Satellite view:** `mapbox://styles/mapbox/satellite-streets-v12`
- **Farm drawing:** Users draw polygon boundaries → GeoJSON stored in DB
- **Cost at 10K users:** Free tier likely sufficient. Paid: ~$250/month

### 2. Satellite/NDVI - Sentinel Hub
**Why:** Free tier (30K requests/month), built for agriculture, 10m resolution, NDVI built-in.

| Detail | Value |
|--------|-------|
| API | Sentinel Hub Process API |
| Free tier | 30,000 requests/month (Exploration account) |
| Resolution | 10m (Sentinel-2), every 5 days |
| NDVI | Built-in evalscript — request NDVI as colored PNG or raw values |
| Integration | Backend API route calls Sentinel Hub → returns image to frontend |

### 3. Speech-to-Text - Bhashini + Google Cloud (fallback)
**Why:** Bhashini is free, purpose-built for Indian languages. Google for accuracy fallback.

| Provider | Telugu | Hindi | Free Tier | Cost |
|----------|--------|-------|-----------|------|
| **Bhashini (Primary)** | ✅ te-IN | ✅ hi-IN | Free (govt initiative) | Free |
| **Google Cloud Speech** | ✅ te-IN | ✅ hi-IN | 60 min/month | $0.006/15sec |
| **Browser Web Speech API** | ✅ Chrome | ✅ Chrome | Free | Free |
| **@react-native-voice/voice** | ✅ Android | ✅ Android | Free | Free |

**Strategy:** Use Bhashini as primary → fallback to Google for noisy audio → Browser/native for quick on-device commands.

### 4. SMS Gateway - MSG91 + Gupshup (WhatsApp)
**Why:** MSG91 is cheapest for Indian SMS + smart OTP. Gupshup for WhatsApp alerts.

| Provider | Use Case | Price | DLT Support |
|----------|----------|-------|-------------|
| **MSG91** | OTP delivery, SMS alerts | ₹0.16-0.20/OTP | Full (helps with registration) |
| **Gupshup** | WhatsApp price alerts, weather warnings | ₹0.50-0.70/message | Full |

- **10K users cost:** MSG91 ~₹2,000/month ($24), Gupshup WhatsApp ~₹5,000/month ($60)

### 5. Push Notifications - Firebase (Free)
| Platform | Package |
|----------|---------|
| Android/iOS | `@react-native-firebase/messaging` + `@notifee/react-native` |
| Web | Firebase Cloud Messaging + service worker |
| Backend | `firebase-admin` |

### 6. Weather - OpenWeatherMap (already integrated)
- Free tier: 1,000 calls/day
- Already integrated in `backend/src/services/weatherService.ts`

---

## Mobile App Strategy: Bare React Native (NOT Expo)

### Why Bare Workflow
- **Native module access:** Mapbox GL Native, Vision Camera, Firebase need native linking
- **Build control:** Custom Android/iOS configurations for DLT SMS templates, deep linking
- **Performance:** No Expo overhead for compute-heavy tasks (ML inference, map rendering)
- **Both platforms:** Single codebase → Android APK + iOS IPA

### Current State
The mobile app at `artifacts/kisan-connect/` was originally an Expo project. Files `MIGRATION_BARE_RN.md` and `App.tsx` indicate a migration was started but may be incomplete.

### Recommended Mobile Architecture

```
mobile/                          # New bare RN project (replace artifacts/kisan-connect)
├── android/                     # Android native project
├── ios/                         # iOS native project
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Auth stack + Main tabs
│   │   ├── AuthStack.tsx
│   │   └── MainTabs.tsx
│   ├── screens/
│   │   ├── auth/                # 7 auth screens
│   │   ├── home/
│   │   ├── prices/
│   │   ├── markets/
│   │   ├── scanner/
│   │   ├── profile/
│   │   ├── calendar/
│   │   ├── marketplace/
│   │   ├── community/
│   │   ├── schemes/
│   │   └── supply-chain/
│   ├── components/
│   ├── hooks/                   # Mirror web hooks (usePrices, useWeather, etc.)
│   ├── services/
│   │   ├── api.ts               # Backend API client
│   │   ├── voice.ts             # @react-native-voice/voice wrapper
│   │   └── location.ts          # Geolocation service
│   ├── store/                   # Zustand stores
│   ├── i18n/                    # Shared translations (en, te, hi)
│   └── types/                   # Shared with web via symlink or package
├── package.json
├── metro.config.js
├── babel.config.js
└── tsconfig.json
```

### Key Mobile Dependencies

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.x",
    "@react-navigation/native": "^7.0",
    "@react-navigation/native-stack": "^7.0",
    "@react-navigation/bottom-tabs": "^7.0",
    "@rnmapbox/maps": "^10.0",
    "react-native-vision-camera": "^4.0",
    "react-native-image-picker": "^7.0",
    "@react-native-voice/voice": "^3.0",
    "@react-native-firebase/app": "^20.0",
    "@react-native-firebase/messaging": "^20.0",
    "@notifee/react-native": "^9.0",
    "@react-native-async-storage/async-storage": "^2.0",
    "react-native-geolocation-service": "^5.0",
    "react-native-reanimated": "^3.0",
    "react-native-gesture-handler": "^2.0",
    "react-native-safe-area-context": "^5.0",
    "react-native-screens": "^4.0",
    "@tanstack/react-query": "^5.0",
    "zustand": "^4.0",
    "i18next": "^23.0",
    "react-i18next": "^14.0"
  }
}
```

### Build & Distribution
- **Android:** `./gradlew assembleRelease` → APK / AAB for Play Store
- **iOS:** Xcode archive → IPA for App Store / TestFlight
- **CI/CD:** GitHub Actions with `react-native-build-android` and Fastlane for iOS

---

## ENV Variables Summary (All Providers)

```env
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char>
PORT=5000
NODE_ENV=production
CORS_ORIGINS=https://kisanconnect.in,http://localhost:3000

# Maps
MAPBOX_ACCESS_TOKEN=<from mapbox.com>

# Satellite
SENTINEL_HUB_CLIENT_ID=<from sentinel-hub.com>
SENTINEL_HUB_CLIENT_SECRET=<from sentinel-hub.com>

# Speech
BHASHINI_API_KEY=<from bhashini.gov.in>
GOOGLE_SPEECH_API_KEY=<from cloud.google.com> (optional fallback)

# SMS
MSG91_AUTH_KEY=<from msg91.com>
MSG91_SENDER_ID=KISANC
MSG91_OTP_TEMPLATE_ID=<DLT template ID>

# WhatsApp
GUPSHUP_API_KEY=<from gupshup.io>
GUPSHUP_APP_NAME=KisanConnect

# Weather (already integrated)
OPENWEATHERMAP_API_KEY=<from openweathermap.org>

# Prices
AGMARKNET_API_KEY=<from data.gov.in>

# Push Notifications
FIREBASE_PROJECT_ID=<from Firebase console>
FIREBASE_PRIVATE_KEY=<service account>
FIREBASE_CLIENT_EMAIL=<service account>

# AI (Phase 4)
ANTHROPIC_API_KEY=<for KisanGPT chatbot>
```

---

## Cost Estimate (10,000 Users/Month)

| Service | Monthly Cost |
|---------|-------------|
| Mapbox (maps) | Free (under 25K MAU) |
| Sentinel Hub (NDVI) | Free (30K requests) |
| Bhashini (speech) | Free |
| MSG91 (SMS/OTP) | ~$24 |
| Gupshup (WhatsApp) | ~$60 |
| Firebase (push) | Free |
| OpenWeatherMap | Free (1K calls/day) |
| PostgreSQL (Neon/Supabase) | Free tier or ~$25 |
| VPS (Railway/Render) | ~$20 |
| **Total** | **~$130/month** |

At 50K users, total cost scales to ~$400-600/month. Primary cost drivers become SMS and WhatsApp messaging.
