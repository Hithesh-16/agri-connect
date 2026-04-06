1# Phase 1: Service Provider Platform

**Timeline:** Weeks 4-7
**Priority:** HIGH — Builds supply side before demand
**Dependencies:** Phase 0 (RBAC system)

---

## Objective

Build the vendor/service provider onboarding, KYC verification, service listing management, and discovery engine. This creates the supply side of the marketplace — vendors list their services, and the platform verifies them.

---

## Current State

### What Exists
- `Listing` model supports categories: crop, machinery, resource, tool, seed, labor, irrigation, animal, postharvest
- `InventoryCategory` and `InventoryItem` for item catalogues (100+ items seeded)
- Listing CRUD in `backend/src/routes/listings.ts`
- Nearby listings via `POST /api/listings/nearby` (Haversine distance)
- Images array field on Listing (but no upload handler)

### What's Missing
- No vendor-specific profile (KYC, verification, service area, ratings)
- No service listing (different from product listing — has pricing per hour/day, calendar, availability)
- No KYC/verification flow
- No image upload implementation (S3/CDN)
- No service categories hierarchy (tractor → tractor with rotavator → 35HP tractor with rotavator)

---

## Database Schema

```prisma
model ServiceProvider {
  id              String   @id @default(cuid())
  userId          String
  type            String   // "MACHINERY_OWNER" | "INPUT_DEALER" | "DRONE_OPERATOR" | "TRANSPORTER" | "PROFESSIONAL" | "LABOR_INDIVIDUAL" | "LABOR_TEAM_LEADER"
  businessName    String?
  businessType    String?  // "individual" | "proprietorship" | "partnership" | "company" | "fpo"
  description     Json?    // { "en": "...", "te": "...", "hi": "..." }
  serviceRadius   Int      @default(25) // km
  baseLocation    Json     // { lat, lng, village, mandal, district, state }
  languages       String[] // ["te", "hi", "en"]
  
  // KYC
  kycStatus       String   @default("PENDING") // "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED"
  aadhaarNumber   String?  // Encrypted
  aadhaarVerified Boolean  @default(false)
  panNumber       String?
  gstNumber       String?
  bankAccountNumber String? // Encrypted
  bankIfsc        String?
  bankVerified    Boolean  @default(false)
  
  // Licenses (for regulated services)
  pesticideLicense    String?  // Image URL
  seedDealerLicense   String?
  dronePilotLicense   String?  // DGCA license for drone operators
  veterinaryLicense   String?
  
  // Profile
  profilePhoto    String?
  coverPhoto      String?
  documents       Json?    // Array of { type, url, verified }
  
  // Stats
  rating          Float    @default(0)
  totalRatings    Int      @default(0)
  totalBookings   Int      @default(0)
  completionRate  Float    @default(0)
  responseTime    Int?     // Average response time in minutes
  memberSince     DateTime @default(now())
  
  // Verification
  isVerified      Boolean  @default(false)
  verifiedAt      DateTime?
  verifiedBy      String?
  isActive        Boolean  @default(true)
  isSuspended     Boolean  @default(false)
  suspensionReason String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  services        ServiceListing[]
  bookings        Booking[]
  reviews         Review[]
  availability    AvailabilitySlot[]

  @@unique([userId, type])
  @@index([baseLocation], type: BTree)
  @@map("service_providers")
}

model ServiceCategory {
  id              String   @id @default(cuid())
  name            Json     // { "en": "Machinery", "te": "యంత్రాలు", "hi": "मशीनरी" }
  slug            String   @unique
  parentId        String?
  icon            String   // Emoji or icon name
  image           String?  // Category image URL
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  
  // Booking configuration
  bookingType     String   @default("SLOT") // "SLOT" | "DAY" | "MULTI_DAY" | "ON_DEMAND"
  minBookingDuration Int?  // In hours or days depending on bookingType
  requiresLicense Boolean  @default(false)
  licenseType     String?  // "pesticide" | "seed" | "drone" | "veterinary"
  
  // Pricing defaults
  defaultPricingUnit String? // "PER_HOUR" | "PER_DAY" | "PER_ACRE" | "PER_UNIT"
  
  parent          ServiceCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        ServiceCategory[] @relation("CategoryHierarchy")
  services        ServiceListing[]

  @@map("service_categories")
}

model ServiceListing {
  id              String   @id @default(cuid())
  providerId      String
  categoryId      String
  
  // Service details
  title           Json     // { "en": "Tractor with Rotavator", "te": "రోటవేటర్‌తో ట్రాక్టర్" }
  description     Json?    // { "en": "...", "te": "..." }
  images          String[] // Up to 10 images
  videos          String[] // Up to 3 videos
  
  // Equipment details (for machinery)
  equipmentMake   String?  // "Mahindra", "John Deere"
  equipmentModel  String?  // "575 DI"
  equipmentYear   Int?     // 2022
  equipmentHP     Int?     // 45
  attachments     String[] // ["rotavator", "trolley", "plough"]
  fuelType        String?  // "diesel" | "electric" | "petrol"
  
  // Pricing
  pricingType     String   // "FIXED" | "NEGOTIABLE" | "BID_BASED" | "QUOTE_REQUIRED"
  pricePerUnit    Float?
  pricingUnit     String   // "PER_HOUR" | "PER_DAY" | "PER_ACRE" | "PER_UNIT" | "PER_KG" | "PER_TRIP" | "PER_WORKER_DAY"
  minimumCharge   Float?   // Minimum booking amount
  
  // Service area
  serviceRadius   Int?     // Override provider's default radius
  
  // Booking config
  minBookingDuration Int   @default(1) // Minimum booking duration
  maxBookingDuration Int?  // Maximum booking duration
  advanceBookingDays Int   @default(1) // How many days in advance to book
  cancellationHours  Int   @default(24) // Free cancellation window
  
  // Availability
  seasonalAvailability Json? // { "months": [6,7,8,9,10], "note": "Kharif season only" }
  
  // Status
  isActive        Boolean  @default(true)
  isPaused        Boolean  @default(false) // Temporarily unavailable
  totalBookings   Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  provider        ServiceProvider  @relation(fields: [providerId], references: [id])
  category        ServiceCategory  @relation(fields: [categoryId], references: [id])
  bookings        Booking[]

  @@index([categoryId, isActive])
  @@map("service_listings")
}
```

---

## API Endpoints

### Provider Registration & Profile

```
POST   /api/providers
  Body: { type, businessName?, businessType?, description, serviceRadius, baseLocation, languages }
  Auth: Any authenticated user
  Action: Creates ServiceProvider record, assigns VENDOR role via RBAC

GET    /api/providers/me
  Auth: VENDOR role
  Returns: Current user's provider profile

PUT    /api/providers/me
  Auth: VENDOR role
  Body: { businessName?, description?, serviceRadius?, ... }

GET    /api/providers/:id
  Auth: Any authenticated user
  Returns: Public provider profile (no sensitive KYC data)

GET    /api/providers/:id/stats
  Auth: Provider or Admin
  Returns: Booking stats, ratings breakdown, earnings summary
```

### KYC Verification

```
POST   /api/providers/me/kyc
  Auth: VENDOR role
  Body: FormData { aadhaarFront, aadhaarBack, panCard, bankDetails, licenses[] }
  Action: Upload docs to S3, update kycStatus to "SUBMITTED"

GET    /api/providers/me/kyc
  Auth: VENDOR role
  Returns: Current KYC status and documents

PUT    /api/admin/providers/:id/kyc
  Auth: PLATFORM_ADMIN
  Body: { status: "VERIFIED" | "REJECTED", rejectionReason? }
  Action: Verify/reject KYC, assign "Verified" badge
```

### Service Listings

```
GET    /api/services/categories
  Auth: Public
  Returns: Category tree (hierarchical)

GET    /api/services
  Auth: Public
  Query: { categoryId?, lat?, lng?, radius?, minPrice?, maxPrice?, sortBy?, page?, limit? }
  Returns: Paginated service listings with provider info

POST   /api/services
  Auth: VENDOR role (services:create)
  Body: { categoryId, title, description, images, pricing, equipment?, ... }
  Validation: Check category requires license → verify provider has license

GET    /api/services/:id
  Auth: Public
  Returns: Full service details + provider profile + reviews summary

PUT    /api/services/:id
  Auth: Owner only (services:update:own)
  Body: Partial update

DELETE /api/services/:id
  Auth: Owner only (services:delete:own)
  Action: Soft delete (isActive = false)

POST   /api/services/:id/pause
  Auth: Owner only
  Action: Toggle isPaused

GET    /api/services/nearby
  Auth: Any authenticated
  Query: { lat, lng, radius, categoryId? }
  Returns: Services within radius, sorted by distance
```

### Image Upload

```
POST   /api/upload
  Auth: Any authenticated
  Body: FormData { file, type: "service" | "profile" | "kyc" | "review" }
  Returns: { url: "https://cdn.kisanconnect.in/..." }
  Action: Upload to S3, return CDN URL
  Limits: 5MB per image, 10 images per listing, JPEG/PNG/WebP only
```

---

## Service Category Seed Data

```typescript
const SERVICE_CATEGORIES = [
  {
    slug: 'machinery',
    name: { en: 'Machinery', te: 'యంత్రాలు', hi: 'मशीनरी' },
    icon: '🚜',
    bookingType: 'DAY',
    defaultPricingUnit: 'PER_HOUR',
    children: [
      { slug: 'tractor', name: { en: 'Tractor', te: 'ట్రాక్టర్', hi: 'ट्रैक्टर' }, icon: '🚜', bookingType: 'DAY', defaultPricingUnit: 'PER_HOUR' },
      { slug: 'harvester', name: { en: 'Combine Harvester', te: 'కంబైన్ హార్వెస్టర్', hi: 'कंबाइन हार्वेस्टर' }, icon: '🌾', bookingType: 'MULTI_DAY', defaultPricingUnit: 'PER_ACRE', minBookingDuration: 1 },
      { slug: 'rotavator', name: { en: 'Rotavator', te: 'రోటవేటర్', hi: 'रोटावेटर' }, icon: '⚙️', bookingType: 'DAY', defaultPricingUnit: 'PER_HOUR' },
      { slug: 'seed-drill', name: { en: 'Seed Drill', te: 'సీడ్ డ్రిల్', hi: 'सीड ड्रिल' }, icon: '🌱', bookingType: 'DAY', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'thresher', name: { en: 'Thresher', te: 'థ్రెషర్', hi: 'थ्रेशर' }, icon: '🌾', bookingType: 'DAY', defaultPricingUnit: 'PER_HOUR' },
      { slug: 'transplanter', name: { en: 'Transplanter', te: 'ట్రాన్స్‌ప్లాంటర్', hi: 'ट्रांसप्लांटर' }, icon: '🌿', bookingType: 'DAY', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'laser-leveler', name: { en: 'Laser Land Leveler', te: 'లేజర్ లెవలర్', hi: 'लेजर लेवलर' }, icon: '📐', bookingType: 'DAY', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'plough', name: { en: 'Plough', te: 'నాగలి', hi: 'हल' }, icon: '🔧', bookingType: 'DAY', defaultPricingUnit: 'PER_HOUR' },
      { slug: 'cultivator', name: { en: 'Cultivator', te: 'కల్టివేటర్', hi: 'कल्टीवेटर' }, icon: '⚙️', bookingType: 'DAY', defaultPricingUnit: 'PER_HOUR' },
    ]
  },
  {
    slug: 'drone-services',
    name: { en: 'Drone Services', te: 'డ్రోన్ సేవలు', hi: 'ड्रोन सेवाएं' },
    icon: '🛸',
    bookingType: 'SLOT',
    defaultPricingUnit: 'PER_ACRE',
    requiresLicense: true,
    licenseType: 'drone',
    children: [
      { slug: 'drone-spray', name: { en: 'Crop Spraying', te: 'పంట పిచికారి', hi: 'फसल छिड़काव' }, icon: '💨', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'drone-survey', name: { en: 'Aerial Survey', te: 'ఏరియల్ సర్వే', hi: 'हवाई सर्वे' }, icon: '📸', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'drone-ndvi', name: { en: 'NDVI Mapping', te: 'NDVI మ్యాపింగ్', hi: 'NDVI मैपिंग' }, icon: '🗺️', defaultPricingUnit: 'PER_ACRE' },
      { slug: 'drone-seed', name: { en: 'Drone Seeding', te: 'డ్రోన్ సీడింగ్', hi: 'ड्रोन सीडिंग' }, icon: '🌱', defaultPricingUnit: 'PER_ACRE' },
    ]
  },
  {
    slug: 'transport',
    name: { en: 'Transport', te: 'రవాణా', hi: 'परिवहन' },
    icon: '🚛',
    bookingType: 'ON_DEMAND',
    defaultPricingUnit: 'PER_TRIP',
    children: [
      { slug: 'mini-truck', name: { en: 'Mini Truck (1-2 ton)', te: 'మినీ ట్రక్', hi: 'मिनी ट्रक' }, icon: '🚐' },
      { slug: 'medium-truck', name: { en: 'Medium Truck (5-10 ton)', te: 'మీడియం ట్రక్', hi: 'मीडियम ट्रक' }, icon: '🚛' },
      { slug: 'tractor-trolley', name: { en: 'Tractor Trolley', te: 'ట్రాక్టర్ ట్రాలీ', hi: 'ट्रैक्टर ट्रॉली' }, icon: '🚜' },
      { slug: 'cold-chain', name: { en: 'Cold Chain Vehicle', te: 'కోల్డ్ చైన్', hi: 'कोल्ड चेन' }, icon: '❄️' },
      { slug: 'water-tanker', name: { en: 'Water Tanker', te: 'వాటర్ ట్యాంకర్', hi: 'पानी टैंकर' }, icon: '💧' },
    ]
  },
  {
    slug: 'labor',
    name: { en: 'Farm Labor', te: 'వ్యవసాయ కూలీలు', hi: 'खेत मजदूर' },
    icon: '💪',
    bookingType: 'SLOT',
    defaultPricingUnit: 'PER_WORKER_DAY',
    children: [
      { slug: 'labor-general', name: { en: 'General Labor', te: 'సాధారణ కూలీలు', hi: 'सामान्य मजदूर' }, icon: '👷' },
      { slug: 'labor-harvesting', name: { en: 'Harvesting Team', te: 'కోత జట్టు', hi: 'कटाई टीम' }, icon: '🌾' },
      { slug: 'labor-transplanting', name: { en: 'Transplanting Crew', te: 'నాట్లు జట్టు', hi: 'रोपाई टीम' }, icon: '🌱' },
      { slug: 'labor-weeding', name: { en: 'Weeding Workers', te: 'కలుపు తీసేవారు', hi: 'निराई मजदूर' }, icon: '🌿' },
      { slug: 'labor-spraying', name: { en: 'Spray Operators', te: 'పిచికారీ ఆపరేటర్లు', hi: 'स्प्रे ऑपरेटर' }, icon: '💨' },
      { slug: 'labor-specialist', name: { en: 'Specialist (Grafting/Pruning)', te: 'నిపుణులు', hi: 'विशेषज्ञ' }, icon: '✂️' },
      { slug: 'labor-loading', name: { en: 'Loading/Unloading', te: 'లోడింగ్/అన్‌లోడింగ్', hi: 'लोडिंग/अनलोडिंग' }, icon: '📦' },
    ]
  },
  {
    slug: 'inputs',
    name: { en: 'Agri Inputs', te: 'వ్యవసాయ ఇన్‌పుట్లు', hi: 'कृषि इनपुट' },
    icon: '🧪',
    bookingType: 'ON_DEMAND',
    defaultPricingUnit: 'PER_UNIT',
    children: [
      { slug: 'pesticides', name: { en: 'Pesticides', te: 'పురుగు మందులు', hi: 'कीटनाशक' }, icon: '🧪', requiresLicense: true, licenseType: 'pesticide' },
      { slug: 'fertilizers', name: { en: 'Fertilizers', te: 'ఎరువులు', hi: 'उर्वरक' }, icon: '🌿' },
      { slug: 'seeds', name: { en: 'Seeds', te: 'విత్తనాలు', hi: 'बीज' }, icon: '🌱', requiresLicense: true, licenseType: 'seed' },
      { slug: 'organic-inputs', name: { en: 'Organic Inputs', te: 'సేంద్రీయ ఇన్‌పుట్లు', hi: 'जैविक इनपुट' }, icon: '♻️' },
      { slug: 'irrigation-supplies', name: { en: 'Irrigation Supplies', te: 'నీటిపారుదల సామగ్రి', hi: 'सिंचाई सामग्री' }, icon: '💧' },
    ]
  },
  {
    slug: 'livestock',
    name: { en: 'Livestock', te: 'పశువులు', hi: 'पशुधन' },
    icon: '🐄',
    bookingType: 'ON_DEMAND',
    defaultPricingUnit: 'PER_UNIT',
    children: [
      { slug: 'dairy-cattle', name: { en: 'Dairy Cattle', te: 'పాడి పశువులు', hi: 'दुधारू पशु' }, icon: '🐄' },
      { slug: 'goats', name: { en: 'Goats', te: 'మేకలు', hi: 'बकरी' }, icon: '🐐' },
      { slug: 'poultry', name: { en: 'Poultry', te: 'కోళ్లు', hi: 'मुर्गी' }, icon: '🐔' },
      { slug: 'fish', name: { en: 'Fish/Aquaculture', te: 'చేపలు', hi: 'मछली' }, icon: '🐟' },
      { slug: 'cattle-feed', name: { en: 'Cattle Feed', te: 'పశు ఆహారం', hi: 'पशु आहार' }, icon: '🌾' },
      { slug: 'veterinary', name: { en: 'Veterinary Services', te: 'పశువైద్య సేవలు', hi: 'पशु चिकित्सा' }, icon: '🏥', requiresLicense: true, licenseType: 'veterinary' },
    ]
  },
  {
    slug: 'professional',
    name: { en: 'Professional Services', te: 'ప్రొఫెషనల్ సేవలు', hi: 'पेशेवर सेवाएं' },
    icon: '🎓',
    bookingType: 'SLOT',
    defaultPricingUnit: 'PER_UNIT',
    children: [
      { slug: 'soil-testing', name: { en: 'Soil Testing', te: 'మట్టి పరీక్ష', hi: 'मृदा परीक्षण' }, icon: '🔬' },
      { slug: 'crop-advisory', name: { en: 'Crop Advisory', te: 'పంట సలహా', hi: 'फसल सलाह' }, icon: '📋' },
      { slug: 'insurance-help', name: { en: 'Insurance (PMFBY)', te: 'బీమా సహాయం', hi: 'बीमा सहायता' }, icon: '🛡️' },
      { slug: 'loan-help', name: { en: 'KCC/Loan Help', te: 'రుణ సహాయం', hi: 'ऋण सहायता' }, icon: '🏦' },
      { slug: 'scheme-filing', name: { en: 'Scheme Application', te: 'పథకం దరఖాస్తు', hi: 'योजना आवेदन' }, icon: '📝' },
      { slug: 'legal', name: { en: 'Legal (Land)', te: 'చట్ట సేవలు', hi: 'कानूनी सेवा' }, icon: '⚖️' },
    ]
  },
  {
    slug: 'post-harvest',
    name: { en: 'Post-Harvest', te: 'పంట తర్వాత', hi: 'कटाई के बाद' },
    icon: '📦',
    bookingType: 'ON_DEMAND',
    defaultPricingUnit: 'PER_UNIT',
    children: [
      { slug: 'sorting-grading', name: { en: 'Sorting & Grading', te: 'వడపోత', hi: 'छंटाई' }, icon: '📊' },
      { slug: 'packaging', name: { en: 'Packaging', te: 'ప్యాకేజింగ్', hi: 'पैकेजिंग' }, icon: '📦' },
      { slug: 'cold-storage', name: { en: 'Cold Storage', te: 'కోల్డ్ స్టోరేజ్', hi: 'शीत भंडार' }, icon: '❄️' },
      { slug: 'warehousing', name: { en: 'Warehousing', te: 'గోదాం', hi: 'गोदाम' }, icon: '🏭' },
      { slug: 'milling', name: { en: 'Milling/Processing', te: 'మిల్లింగ్', hi: 'पिसाई' }, icon: '⚙️' },
    ]
  },
  {
    slug: 'infrastructure',
    name: { en: 'Farm Infrastructure', te: 'వ్యవసాయ మౌలిక సదుపాయాలు', hi: 'कृषि बुनियादी ढांचा' },
    icon: '🏗️',
    bookingType: 'ON_DEMAND',
    defaultPricingUnit: 'PER_UNIT',
    children: [
      { slug: 'polyhouse', name: { en: 'Polyhouse Setup', te: 'పాలీహౌస్', hi: 'पॉलीहाउस' }, icon: '🏠' },
      { slug: 'fencing', name: { en: 'Fencing', te: 'ఫెన్సింగ్', hi: 'बाड़ लगाना' }, icon: '🔒' },
      { slug: 'solar-panel', name: { en: 'Solar Installation', te: 'సోలార్ ఇన్‌స్టాలేషన్', hi: 'सोलर स्थापना' }, icon: '☀️' },
      { slug: 'borewell', name: { en: 'Borewell Drilling', te: 'బోర్‌వెల్', hi: 'बोरवेल' }, icon: '💧' },
      { slug: 'farm-shed', name: { en: 'Farm Shed', te: 'ఫార్మ్ షెడ్', hi: 'फार्म शेड' }, icon: '🏚️' },
    ]
  },
];
```

---

## KYC Verification Flow

### Step 1: Provider submits KYC
```
POST /api/providers/me/kyc
FormData: {
  aadhaarFront: File,
  aadhaarBack: File,
  panCard: File,
  bankAccountNumber: "xxxx",
  bankIfsc: "SBIN0001234",
  // Optional based on type:
  pesticideLicense: File,
  dronePilotLicense: File,
}
```

### Step 2: Aadhaar Verification (DigiLocker API)
```typescript
// Verify Aadhaar via DigiLocker/UIDAI API
// 1. Send OTP to Aadhaar-linked mobile
// 2. User enters OTP
// 3. Verify and get Aadhaar data (name, DOB, address)
// 4. Match with submitted details
```

### Step 3: Bank Account Verification (Penny Drop)
```typescript
// Via Razorpay Fund Account Validation API
// 1. Create fund account with bank details
// 2. Razorpay sends INR 1 and verifies
// 3. Mark bank as verified
```

### Step 4: Admin Review
- Admin dashboard shows KYC queue
- Admin reviews documents visually
- Admin approves or rejects with reason
- On approval: `isVerified = true`, "Verified" badge appears on profile

### Step 5: License Verification (Manual for now)
- For pesticide/seed/drone/vet licenses
- Admin verifies against government databases
- Future: Automate via government APIs

---

## Image Upload Implementation

### S3 Configuration
```typescript
// backend/src/services/uploadService.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(file: Buffer, type: string): Promise<string> {
  // Resize and optimize
  const optimized = await sharp(file)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `${type}/${uuid()}.webp`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: optimized,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000',
  }));

  return `${process.env.CDN_URL}/${key}`;
}
```

### Upload Route
```typescript
// backend/src/routes/upload.ts
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP images allowed'));
    }
  },
});

router.post('/upload',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    const type = req.body.type || 'general'; // service, profile, kyc, review
    const url = await uploadImage(req.file!.buffer, type);
    res.json({ url });
  }
);
```

---

## Geo-Search Implementation

### PostGIS Extension (Preferred)
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to service_providers
ALTER TABLE service_providers ADD COLUMN location geography(Point, 4326);

-- Create spatial index
CREATE INDEX idx_providers_location ON service_providers USING GIST(location);

-- Query nearby providers
SELECT *, ST_Distance(location, ST_MakePoint($lng, $lat)::geography) AS distance
FROM service_providers
WHERE ST_DWithin(location, ST_MakePoint($lng, $lat)::geography, $radiusMeters)
ORDER BY distance;
```

### Haversine Fallback (No PostGIS)
```typescript
// If PostGIS not available, use raw SQL with Haversine
const nearbyServices = await prisma.$queryRaw`
  SELECT s.*, p.*,
    (6371 * acos(cos(radians(${lat})) * cos(radians((p."baseLocation"->>'lat')::float)) 
    * cos(radians((p."baseLocation"->>'lng')::float) - radians(${lng})) 
    + sin(radians(${lat})) * sin(radians((p."baseLocation"->>'lat')::float)))) AS distance
  FROM service_listings s
  JOIN service_providers p ON s."providerId" = p.id
  WHERE s."isActive" = true AND p."isActive" = true
  HAVING distance < ${radiusKm}
  ORDER BY distance
  LIMIT ${limit} OFFSET ${offset}
`;
```

---

## Files to Create/Modify

### New Files
```
backend/src/routes/providers.ts            # Provider CRUD + KYC
backend/src/routes/services.ts             # Service listing CRUD  
backend/src/routes/upload.ts               # Image upload
backend/src/services/uploadService.ts      # S3 upload logic
backend/src/services/kycService.ts         # KYC verification logic
backend/prisma/seeds/service-categories.ts # Category seed data
packages/shared/types/services.ts          # TypeScript types
```

### Modified Files
```
backend/prisma/schema.prisma              # Add new models
backend/src/index.ts                      # Mount new routes
```

---

## Testing Checklist

- [ ] Register as vendor → verify ServiceProvider created + VENDOR role assigned
- [ ] Submit KYC documents → verify uploaded to S3
- [ ] Admin approve KYC → verify isVerified = true
- [ ] Create service listing → verify appears in search
- [ ] Search by location → verify distance-based results
- [ ] Search by category → verify hierarchy works
- [ ] Upload image → verify resized, optimized, CDN URL returned
- [ ] Vendor with no pesticide license → verify can't list pesticides
- [ ] Pause service listing → verify hidden from search
- [ ] Seasonal availability → verify listing hidden outside season
