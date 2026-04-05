# AgriConnect Community & Marketplace - Implementation Plan

## PRD Review & Gap Analysis

### What Already Exists in KisanConnect

| PRD Feature | Current Status | Gap |
|------------|---------------|-----|
| P2P Marketplace | ✅ Buy/sell listings with inquiries | Only crops, no machinery/labor/resources |
| Telugu Translation | ⚠️ Partial (nav, core pages) | Marketplace strings missing |
| Image Uploads | ✅ Scanner has multer setup | No listing images |
| Location Data | ⚠️ Mandis have lat/lon | No GPS auto-detection |
| Voice Interface | ❌ None | Full build needed |
| Community Forum | ❌ None | Full build needed |
| Knowledge Bank | ❌ None | Full build needed |
| Call Now | ❌ Only message inquiries | Phone integration needed |

### Architecture Decision: Extend, Don't Rebuild

KisanConnect already has a working marketplace, i18n system, image upload infrastructure, and Telugu translations. We extend these rather than building AgriConnect as a separate module.

---

## Implementation Phases

### Phase A: Extended Marketplace (Backend + Web)

#### A1. Database Schema Changes

**Extend Listing model:**
```prisma
model Listing {
  // ... existing fields ...
  category    String    @default("crop")  // "crop" | "machinery" | "resource" | "labor" | "tool" | "seed"
  itemName    String?                     // For non-crop listings (e.g., "Tractor", "Neem Oil")
  images      String[]                    // Array of image URLs
  phone       String?                     // Direct contact number
  condition   String?                     // "new" | "used" | "half-used"
  rentalBasis String?                     // "per_day" | "per_hour" | "per_acre" | null (for sale/exchange)
}
```

**Add new model for Community:**
```prisma
model CommunityPost {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "question" | "success_story" | "tip" | "pest_help"
  title       String
  content     String
  images      String[]
  cropId      String?
  location    String?
  voiceUrl    String?  // Voice note URL
  upvotes     Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User              @relation(fields: [userId], references: [id])
  crop     Crop?             @relation(fields: [cropId], references: [id])
  comments CommunityComment[]

  @@map("community_posts")
}

model CommunityComment {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  content   String
  images    String[]
  voiceUrl  String?
  isAnswer  Boolean  @default(false)  // Marked as accepted answer
  upvotes   Int      @default(0)
  createdAt DateTime @default(now())

  post CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User          @relation(fields: [userId], references: [id])

  @@map("community_comments")
}
```

#### A2. Inventory Categories (Seeded Data)

```typescript
export const LISTING_CATEGORIES = [
  {
    id: "crop",
    name: "Crops",
    nameTE: "పంటలు",
    nameHI: "फ़सलें",
    icon: "Wheat",
    items: [] // Uses existing Crop model
  },
  {
    id: "machinery",
    name: "Machinery",
    nameTE: "యంత్రాలు",
    nameHI: "मशीनरी",
    icon: "Tractor",
    items: [
      { id: "tractor", name: "Tractor", nameTE: "ట్రాక్టర్" },
      { id: "plough", name: "Plough", nameTE: "నాగలి" },
      { id: "harvester", name: "Harvester", nameTE: "కోతయంత్రం" },
      { id: "weeder", name: "Weeder", nameTE: "కలుపు తీసే యంత్రం" },
      { id: "rotavator", name: "Rotavator", nameTE: "రోటావేటర్" },
      { id: "seed_drill", name: "Seed Drill", nameTE: "విత్తన డ్రిల్" },
      { id: "thresher", name: "Thresher", nameTE: "నూర్పిడి యంత్రం" }
    ]
  },
  {
    id: "resource",
    name: "Resources",
    nameTE: "వనరులు",
    nameHI: "संसाधन",
    icon: "Package",
    items: [
      { id: "pesticide", name: "Pesticides", nameTE: "పురుగుమందులు" },
      { id: "fertilizer", name: "Fertilizers", nameTE: "ఎరువులు" },
      { id: "organic", name: "Organic Inputs", nameTE: "సేంద్రియ మందులు" }
    ]
  },
  {
    id: "tool",
    name: "Tools",
    nameTE: "పనిముట్లు",
    nameHI: "औज़ार",
    icon: "Wrench",
    items: [
      { id: "sprayer", name: "Sprayer", nameTE: "స్ప్రేయర్" },
      { id: "spade", name: "Spade", nameTE: "పార" },
      { id: "axe", name: "Axe", nameTE: "గొడ్డలి" },
      { id: "sickle", name: "Sickle", nameTE: "కొడవలి" },
      { id: "pump", name: "Water Pump", nameTE: "నీటి పంపు" }
    ]
  },
  {
    id: "seed",
    name: "Seeds",
    nameTE: "విత్తనాలు",
    nameHI: "बीज",
    icon: "Sprout",
    items: [
      { id: "leftover_seeds", name: "Leftover Seeds", nameTE: "మిగిలిన విత్తనాలు" },
      { id: "hybrid_seeds", name: "Hybrid Seeds", nameTE: "హైబ్రిడ్ విత్తనాలు" }
    ]
  },
  {
    id: "labor",
    name: "Labor",
    nameTE: "కూలీలు",
    nameHI: "मज़दूरी",
    icon: "Users",
    items: [
      { id: "harvesting", name: "Harvesting Help", nameTE: "కోత సహాయం" },
      { id: "sowing", name: "Sowing Help", nameTE: "విత్తనం సహాయం" },
      { id: "spraying", name: "Spraying Help", nameTE: "స్ప్రే సహాయం" }
    ]
  }
];
```

#### A3. Backend Routes

**Extend `/api/listings`:**
- Add `category` filter: `GET /api/listings?category=machinery&type=rent`
- Add listing types: `sell | buy | rent | exchange`
- Add image upload: `POST /api/listings` accepts multipart/form-data with up to 5 images
- Add `GET /api/listings/nearby?lat=&lon=&radius=20` for GPS-based discovery

**New `/api/community`:**
- `GET /api/community` - List posts with filters (type, cropId)
- `POST /api/community` - Create post (with image/voice upload)
- `GET /api/community/:id` - Single post with comments
- `POST /api/community/:id/comments` - Add comment
- `POST /api/community/:id/upvote` - Upvote post
- `PATCH /api/community/comments/:id/answer` - Mark as accepted answer

#### A4. Web Pages

**Updated `/marketplace`:**
- Category tabs at top: All | Crops | Machinery | Resources | Tools | Seeds | Labor
- "Rent" tab alongside Buy/Sell
- Listing cards show images, category badge, condition
- "Call Now" button (tel: link) + "Message" button
- GPS-based "Near Me" toggle
- Image upload in create listing modal (up to 5 photos)

**New `/community`:**
- Feed of posts (questions, success stories, tips)
- Post type filter tabs
- Create post with title, content, optional image/voice
- Comment thread on each post
- Upvote system
- "Accepted Answer" badge for pest/disease questions
- Crop tag filtering

**Voice integration (progressive):**
- Mic icon on search bars → Web Speech API (`SpeechRecognition`)
- Mic icon on create listing → voice-to-text for description
- Mic icon on community post → voice note recording
- Language detection based on user's i18n locale setting

---

### Phase B: Voice-First Features

#### B1. Web Speech API Integration

```typescript
// src/lib/voice.ts
export function useSpeechToText(locale: string) {
  // Uses browser's SpeechRecognition API
  // Supported locales: 'te-IN' (Telugu), 'hi-IN' (Hindi), 'en-IN' (English)
  // Returns: { transcript, isListening, startListening, stopListening }
}
```

#### B2. Voice-to-Structured Data (AI Processing)

For the "smart extraction" from voice (e.g., "I have a half bottle of Neem Oil available for exchange in Nalgonda"):

**Backend endpoint:** `POST /api/voice/parse`
- Accepts text transcript
- Uses structured prompting to extract: category, item, type (sell/rent/exchange), location, quantity
- Returns structured JSON for listing preview

#### B3. Voice Note Recording

- Record audio blob in browser → upload to backend
- Store as URL in `voiceUrl` field on posts/comments
- Playback component in community thread

---

### Phase C: Location & Discovery

#### C1. Geolocation

```typescript
// src/hooks/useLocation.ts
export function useLocation() {
  // Uses navigator.geolocation
  // Returns: { latitude, longitude, isLoading, error, requestLocation }
}
```

#### C2. Nearby Listings

- Backend: Haversine formula for distance calculation
- `GET /api/listings/nearby?lat=17.977&lon=79.601&radius=20`
- UI: "Near Me" toggle on marketplace that auto-detects location
- Show distance on each listing card

---

## File Changes Summary

### Backend Files to Create
| File | Purpose |
|------|---------|
| `src/routes/community.ts` | Community CRUD + comments + upvotes |
| `src/routes/voice.ts` | Voice transcript parsing endpoint |
| `src/data/listingCategories.ts` | Category + item seed data with Telugu/Hindi names |

### Backend Files to Modify
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add CommunityPost, CommunityComment; extend Listing model |
| `src/routes/listings.ts` | Add category filter, image upload, nearby endpoint |
| `src/index.ts` | Mount new routes |
| `prisma/seed.ts` | Seed listing categories |

### Web Files to Create
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/community/page.tsx` | Community feed + create post |
| `src/hooks/useCommunity.ts` | Community CRUD hooks |
| `src/hooks/useLocation.ts` | GPS geolocation hook |
| `src/lib/voice.ts` | Speech-to-text hook |
| `src/components/ui/VoiceButton.tsx` | Mic button with recording animation |
| `src/components/ui/VoiceNotePlayer.tsx` | Audio playback component |
| `src/components/marketplace/CategoryFilter.tsx` | Category tab component |
| `src/components/community/PostCard.tsx` | Community post card |
| `src/components/community/CommentThread.tsx` | Comment thread component |

### Web Files to Modify
| File | Change |
|------|--------|
| `src/app/(dashboard)/marketplace/page.tsx` | Add categories, images, call now, voice |
| `src/hooks/useListings.ts` | Add category filter, nearby listings |
| `src/components/layout/Sidebar.tsx` | Add Community nav item |
| `src/lib/translations/te.json` | Add marketplace + community Telugu strings |
| `src/lib/translations/hi.json` | Add marketplace + community Hindi strings |
| `src/lib/translations/en.json` | Add marketplace + community English strings |

---

## KPI Tracking Implementation

| KPI | How to Track |
|-----|-------------|
| Voice Adoption | Log `voice_search` events in analytics, compare vs text searches |
| Listing Liquidity | Track `listing_call_clicked` and `listing_inquiry_sent` events |
| Community Engagement | Count comments with `isAnswer=true` per question post |

---

## Integration with Existing Phase 4 Plan

The AgriConnect PRD features should be implemented as **Phase 3.5** (between current Phase 3 and Phase 4), since they extend the existing marketplace and add the community layer before we build the AI intelligence features:

```
Phase 1 ✅ Foundation Fix
Phase 2 ✅ Core Differentiators (i18n, alerts, charts)
Phase 3 ✅ Growth Features (calendar, marketplace, schemes, admin)
Phase 3.5 NEW: AgriConnect (extended marketplace, community, voice, GPS)
Phase 4: Intelligence Layer (AI predictions, scanner ML, chatbot, satellite)
Phase 5: Scale & Monetize (payments, e-commerce, ONDC)
```

The AI features in Phase 4 (KisanGPT chatbot, ML disease scanner) will directly enhance the community's Knowledge Bank and voice features.
