# KisanConnect — AgriMarket Mobile App

## Overview
A full-featured React Native (Expo) mobile application for India's agricultural ecosystem — connecting farmers, traders, dealers, and corporates with live crop prices, mandi information, weather alerts, and AI-powered plant disease detection.

## Stack
- **Frontend**: Expo / React Native (Expo Router file-based routing)
- **State**: React Context (AuthContext) + AsyncStorage for persistence
- **UI**: Inter font, LinearGradient, @expo/vector-icons, react-native-reanimated
- **Backend**: Shared Express API server in `artifacts/api-server`

## Artifact
- **Path**: `artifacts/kisan-connect`
- **Preview**: `/` (root)
- **Kind**: Mobile (Expo)

## App Structure
```
app/
  _layout.tsx          # Root layout: AuthProvider, QueryClient, GestureHandler
  index.tsx            # Redirect to auth or tabs based on auth state
  (auth)/
    welcome.tsx        # Landing screen with animated floating tags
    register.tsx       # Role selection + Aadhaar/Mobile auth
    otp.tsx            # OTP verification with shake animation
    personal-info.tsx  # Full profile form (name, address, gender, language)
    crop-selection.tsx # Grid crop picker (min 2 required)
    mandi-selection.tsx # Mandi picker with radius filter
  (tabs)/
    index.tsx          # Dashboard: weather, price highlights, news
    prices.tsx         # Live market prices with search + sort
    scanner.tsx        # AI plant disease scanner (camera + gallery)
    markets.tsx        # Mandi map + list/grid view with price drill-down
    profile.tsx        # User profile, crops, mandis, eNAM, settings
```

## Key Features
1. **Multi-role registration** — Farmer, Trader, Dealer, Corporate
2. **Dual auth** — Aadhaar scan or Mobile OTP (20-day session)
3. **Dashboard** — Live weather, crop price highlights, news feed
4. **Live Prices** — Search, sort, real-time mock data for 12+ crops
5. **Plant Disease Scanner** — Camera/gallery upload, AI analysis, treatment recs
6. **Markets** — List + grid view, mandi detail with crop prices, map pins
7. **Profile** — Role badge, crop/mandi management, eNAM portal, settings

## Color Theme
- Primary: `#1B6B3A` (deep agricultural green)
- Accent: `#F5A623` (amber/gold)
- Background: `#F6F8F4` (warm off-white)

## Data
- Mock data in `data/` directory (crops, mandis, prices, weather, news)
- Real device camera/gallery via expo-image-picker (scanner screen)
- AsyncStorage for user session (20-day expiry)
