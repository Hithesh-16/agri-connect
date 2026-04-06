# Phase 7: Intelligence — AI, ML & Satellite

**Timeline:** Weeks 31-35
**Priority:** HIGH — Core differentiator, ties together multiple platform features
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers), Phase 2 (Marketplace), Phase 4 (Payments)

---

## Objective

Build the intelligence layer that transforms FarmConnect from a transactional platform into a decision-support system. Disease detection, satellite monitoring, weather-aware scheduling, farm management, and price prediction create a moat no competitor currently offers as an integrated package.

---

## Current State

### What Exists
- `backend/src/routes/scanner.ts` — stub route returning mock disease results
- `DiseaseResult` model — basic schema, no ML integration
- `backend/src/services/predictionService.ts` — stub returning random price data
- `/farm` route — placeholder with no implementation
- `PriceHistory` model — stores historical prices but no forecasting logic

### What's Wrong
- Scanner has no actual ML inference — returns hardcoded results
- No satellite integration — farms have no geographic boundaries
- No weather-aware scheduling — outdoor bookings proceed regardless of conditions
- Farm management is non-existent — farmers cannot track their operations
- Price predictions are random numbers, not model-driven forecasts
- No connection between intelligence features and transactional features (bookings, marketplace, input purchases)

### Competitive Landscape
| Feature | Plantix (20M downloads) | CropIn (Enterprise) | FarmConnect |
|---------|------------------------|---------------------|-------------|
| Disease ID | Photo-based, standalone | Enterprise only | Integrated with treatment + input purchase + dealer |
| Satellite | No | NDVI enterprise | Free tier Sentinel Hub, anomaly alerts |
| Weather scheduling | No | No | WeatherHold auto-reschedule (UNIQUE) |
| Price prediction | No | Limited | Prophet/LSTM 7-day & 30-day |
| Farm management | No | Yes (enterprise) | Free for all farmers |

**Our advantage:** No competitor combines disease detection + satellite + weather scheduling + farm management + price prediction in a single farmer-facing platform.

---

## Database Schema Changes

### New Models

```prisma
// ── FARM MANAGEMENT ──

model Farm {
  id              String   @id @default(cuid())
  ownerId         String
  name            String
  boundary        Json     // GeoJSON Polygon from Mapbox GL Draw
  centroid        Json?    // { lat, lng } computed from boundary
  areaAcres       Float
  soilType        String?  // "BLACK_COTTON", "RED", "ALLUVIAL", "LATERITE", etc.
  irrigationType  String?  // "BOREWELL", "CANAL", "RAINFED", "DRIP", "SPRINKLER"
  district        String
  state           String
  pincode         String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  owner           User              @relation(fields: [ownerId], references: [id])
  soilTests       SoilTest[]
  cropRotations   CropRotation[]
  inputUsages     InputUsage[]
  yieldRecords    YieldRecord[]
  costRecords     CostRecord[]
  satelliteData   SatelliteData[]
  advisories      CropAdvisory[]
  weatherHolds    WeatherHold[]

  @@index([ownerId])
  @@index([district, state])
  @@map("farms")
}

model SoilTest {
  id          String   @id @default(cuid())
  farmId      String
  testDate    DateTime
  labName     String?
  ph          Float?
  nitrogen    Float?   // kg/ha
  phosphorus  Float?   // kg/ha
  potassium   Float?   // kg/ha
  organicCarbon Float?
  micronutrients Json? // { zinc, iron, manganese, copper, boron }
  reportUrl   String?  // Uploaded lab report
  createdAt   DateTime @default(now())

  farm        Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, testDate])
  @@map("soil_tests")
}

model CropRotation {
  id          String   @id @default(cuid())
  farmId      String
  cropName    String
  variety     String?
  season      String   // "KHARIF", "RABI", "ZAID"
  year        Int
  sowingDate  DateTime?
  harvestDate DateTime?
  status      String   @default("PLANNED") // "PLANNED", "SOWN", "GROWING", "HARVESTED"
  createdAt   DateTime @default(now())

  farm        Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, year, season])
  @@map("crop_rotations")
}

model InputUsage {
  id          String   @id @default(cuid())
  farmId      String
  cropRotationId String?
  inputType   String   // "SEED", "FERTILIZER", "PESTICIDE", "HERBICIDE", "GROWTH_REGULATOR"
  productName String
  brand       String?
  quantity    Float
  unit        String   // "KG", "LT", "ML", "GM"
  costInr     Float
  appliedDate DateTime
  notes       String?
  createdAt   DateTime @default(now())

  farm        Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, appliedDate])
  @@map("input_usages")
}

model YieldRecord {
  id              String   @id @default(cuid())
  farmId          String
  cropRotationId  String?
  cropName        String
  season          String
  year            Int
  yieldQuantity   Float
  yieldUnit       String   // "QUINTAL", "TON", "KG"
  pricePerUnit    Float?
  totalRevenue    Float?
  harvestDate     DateTime?
  createdAt       DateTime @default(now())

  farm            Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, year])
  @@map("yield_records")
}

model CostRecord {
  id          String   @id @default(cuid())
  farmId      String
  season      String
  year        Int
  category    String   // "SEED", "FERTILIZER", "PESTICIDE", "LABOR", "MACHINERY", "IRRIGATION", "TRANSPORT", "OTHER"
  description String?
  amount      Float
  date        DateTime
  createdAt   DateTime @default(now())

  farm        Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, year, season])
  @@map("cost_records")
}

// ── SATELLITE & NDVI ──

model SatelliteData {
  id          String   @id @default(cuid())
  farmId      String
  captureDate DateTime
  dataType    String   // "NDVI", "EVI", "NDWI", "TRUE_COLOR"
  source      String   @default("SENTINEL_2") // "SENTINEL_2", "LANDSAT_8"
  meanValue   Float?   // Mean NDVI value for the farm polygon
  minValue    Float?
  maxValue    Float?
  tileUrl     String?  // URL to rendered tile image
  rawData     Json?    // Full pixel data or statistics
  anomaly     Boolean  @default(false)
  anomalyType String?  // "STRESS", "WATERLOGGING", "PEST_DAMAGE"
  createdAt   DateTime @default(now())

  farm        Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)

  @@index([farmId, captureDate])
  @@index([anomaly, captureDate])
  @@map("satellite_data")
}

// ── WEATHER HOLD (UNIQUE FEATURE) ──

model WeatherHold {
  id              String   @id @default(cuid())
  farmId          String?
  bookingId       String   @unique
  originalDate    DateTime
  rescheduledDate DateTime?
  holdReason      String   // "RAIN_FORECAST", "STORM_WARNING", "HIGH_WIND", "EXTREME_HEAT"
  weatherData     Json     // { temperature, humidity, windSpeed, rainfall, source }
  status          String   @default("PENDING") // "PENDING", "RESCHEDULED", "OVERRIDDEN", "EXPIRED"
  autoRescheduled Boolean  @default(false)
  notifiedAt      DateTime?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  farm            Farm?   @relation(fields: [farmId], references: [id])
  booking         Booking @relation(fields: [bookingId], references: [id])

  @@index([status, originalDate])
  @@map("weather_holds")
}

// ── PRICE PREDICTION ──

model PricePrediction {
  id              String   @id @default(cuid())
  cropId          String
  market          String   // Mandi name
  district        String
  state           String
  predictionDate  DateTime // Date prediction was made
  targetDate      DateTime // Date being predicted
  predictedPrice  Float
  confidenceLow   Float    // Lower bound (95% CI)
  confidenceHigh  Float    // Upper bound (95% CI)
  modelVersion    String   // "prophet_v1", "lstm_v2"
  actualPrice     Float?   // Filled in when actual price arrives
  mape            Float?   // Mean Absolute Percentage Error (computed post-facto)
  createdAt       DateTime @default(now())

  @@index([cropId, market, targetDate])
  @@index([predictionDate])
  @@map("price_predictions")
}

// ── CROP ADVISORY ──

model CropAdvisory {
  id              String   @id @default(cuid())
  farmId          String?
  targetCrop      String
  targetRegion    String?  // district or state
  advisoryType    String   // "DISEASE_ALERT", "PEST_ALERT", "WEATHER_ADVISORY", "NUTRIENT", "IRRIGATION", "HARVEST"
  severity        String   @default("INFO") // "INFO", "WARNING", "CRITICAL"
  title           Json     // { en, te, hi, ... }
  body            Json     // { en, te, hi, ... }
  recommendations Json?    // [{ action, product?, dealerLink? }]
  validFrom       DateTime
  validUntil      DateTime?
  source          String   // "ML_MODEL", "SATELLITE", "WEATHER", "EXPERT", "GOVERNMENT"
  isRead          Boolean  @default(false)
  createdAt       DateTime @default(now())

  farm            Farm? @relation(fields: [farmId], references: [id])

  @@index([farmId, createdAt])
  @@index([targetCrop, targetRegion, validFrom])
  @@map("crop_advisories")
}

// ── DISEASE DETECTION (enhance existing) ──

model DiseaseDetection {
  id              String   @id @default(cuid())
  userId          String
  farmId          String?
  imageUrl        String
  cropType        String
  detectedDisease String?
  confidence      Float?
  severity        String?  // "MILD", "MODERATE", "SEVERE"
  treatments      Json?    // [{ method, product, dosage, applicationMethod }]
  languages       Json?    // Treatments available in these languages
  linkedAdvisory  String?  // CropAdvisory.id if advisory was triggered
  linkedProducts  Json?    // [{ productId, dealerId, distance }] recommended inputs
  modelVersion    String   @default("tflite_v1")
  inferenceTimeMs Int?
  createdAt       DateTime @default(now())

  user            User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([cropType, detectedDisease])
  @@map("disease_detections")
}
```

### Modify Existing Models

```prisma
model User {
  // ... existing fields ...
  
  // ADD:
  farms              Farm[]
  diseaseDetections  DiseaseDetection[]
}

model Booking {
  // ... existing fields ...
  
  // ADD:
  weatherHold  WeatherHold?
}
```

---

## API Endpoints

### Disease Scanner

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/scanner/analyze` | Upload image, run disease detection | Farmer |
| GET | `/api/scanner/history` | Get user's scan history | Farmer |
| GET | `/api/scanner/diseases` | List all detectable diseases (filterable by crop) | Public |
| GET | `/api/scanner/diseases/:id` | Disease details with treatments in all languages | Public |

### Farm Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/farms` | Register a new farm with polygon boundary | Farmer |
| GET | `/api/farms` | List user's farms | Farmer |
| GET | `/api/farms/:id` | Farm details with latest soil test, current crop | Farmer |
| PUT | `/api/farms/:id` | Update farm info or boundary | Farmer |
| DELETE | `/api/farms/:id` | Soft-delete farm | Farmer |
| POST | `/api/farms/:id/soil-tests` | Add soil test record | Farmer |
| POST | `/api/farms/:id/crops` | Add crop rotation entry | Farmer |
| POST | `/api/farms/:id/inputs` | Log input usage | Farmer |
| POST | `/api/farms/:id/yields` | Record yield | Farmer |
| POST | `/api/farms/:id/costs` | Record cost | Farmer |
| GET | `/api/farms/:id/summary` | Season summary: costs vs revenue | Farmer |

### Satellite & NDVI

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/farms/:id/ndvi` | Latest NDVI data + historical trend | Farmer |
| GET | `/api/farms/:id/ndvi/history` | NDVI time series for date range | Farmer |
| POST | `/api/farms/:id/ndvi/refresh` | Force re-fetch from Sentinel Hub | Farmer |
| GET | `/api/farms/:id/satellite/tiles/:date` | Rendered satellite tile image | Farmer |

### Crop Advisory

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/farms/:id/advisory` | Active advisories for this farm | Farmer |
| GET | `/api/advisory/regional` | Regional advisories by crop + district | Public |
| PUT | `/api/advisory/:id/read` | Mark advisory as read | Farmer |

### Price Prediction

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/predictions/:cropId` | 7-day and 30-day price forecast | Authenticated |
| GET | `/api/predictions/:cropId/accuracy` | Model accuracy metrics | Authenticated |
| GET | `/api/predictions/markets/:market` | All crop predictions for a market | Authenticated |

### WeatherHold

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/weather-hold/check` | Check weather for a booking date + location | System/Farmer |
| GET | `/api/weather-hold/booking/:bookingId` | Get hold status for a booking | Farmer/Vendor |
| PUT | `/api/weather-hold/:id` | Override or confirm reschedule | Farmer |
| GET | `/api/weather-hold/upcoming` | Upcoming holds for user's bookings | Farmer |

---

## Backend Implementation

### 1. Disease Detection Service

```typescript
// backend/src/services/diseaseDetectionService.ts

import * as ort from 'onnxruntime-node';

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  treatments: Treatment[];
  nearbyDealers: Dealer[];
  recommendedProducts: Product[];
}

const SUPPORTED_CROPS = [
  'rice', 'wheat', 'cotton', 'tomato', 'potato', 'maize',
  'sugarcane', 'chilli', 'groundnut', 'soybean', 'grape',
  'mango', 'banana', 'onion', 'turmeric',
];

const DISEASE_COUNT = 100; // 100+ diseases across all crops

export class DiseaseDetectionService {
  private session: ort.InferenceSession | null = null;
  private modelPath = 'models/crop_disease_v1.onnx';

  async initialize() {
    this.session = await ort.InferenceSession.create(this.modelPath);
  }

  async detect(imageBuffer: Buffer, cropType: string): Promise<DetectionResult> {
    const startTime = Date.now();

    // Preprocess: resize to 224x224, normalize
    const tensor = await this.preprocessImage(imageBuffer);

    // Run inference
    const feeds = { input: tensor };
    const results = await this.session!.run(feeds);
    const predictions = results.output.data as Float32Array;

    // Map to disease labels
    const topPrediction = this.getTopPrediction(predictions, cropType);
    const inferenceTime = Date.now() - startTime;

    // Fetch treatments in all supported languages
    const treatments = await this.getTreatments(topPrediction.diseaseId);

    // Find nearby dealers selling recommended products
    const dealers = await this.findNearbyDealers(
      topPrediction.recommendedProducts
    );

    return {
      disease: topPrediction.name,
      confidence: topPrediction.confidence,
      severity: this.classifySeverity(topPrediction.confidence),
      treatments,
      nearbyDealers: dealers,
      recommendedProducts: topPrediction.recommendedProducts,
    };
  }

  private async getTreatments(diseaseId: string) {
    // Treatments stored in 10 languages:
    // en, hi, te, ta, kn, mr, gu, bn, pa, ml
    return prisma.diseaseTreatment.findMany({
      where: { diseaseId },
      select: {
        method: true,          // Chemical, Biological, Cultural
        description: true,     // Json { en, hi, te, ... }
        products: true,        // Recommended products
        dosage: true,          // Json { en, hi, te, ... }
        applicationMethod: true,
      },
    });
  }

  private async findNearbyDealers(products: string[]) {
    // Cross-reference with dealer listings from marketplace
    // Return dealers sorted by distance who stock these products
  }
}
```

### 2. Mobile TFLite Integration

```typescript
// mobile/src/services/diseaseDetection.ts

import { TensorFlowLite } from 'react-native-tflite';

export class MobileDiseaseDetector {
  private model: TensorFlowLite | null = null;

  async loadModel() {
    this.model = await TensorFlowLite.loadModel({
      model: 'crop_disease_v1.tflite',  // Bundled with app (~15MB)
      labels: 'disease_labels.txt',
    });
  }

  async detectOffline(imageUri: string): Promise<LocalDetectionResult> {
    // On-device inference — works without internet
    const results = await this.model!.runModelOnImage({
      path: imageUri,
      imageMean: 127.5,
      imageStd: 127.5,
      numResults: 5,
      threshold: 0.3,
    });

    return {
      topResult: results[0],
      allResults: results,
      isOffline: true,
      // Full treatment data fetched when connectivity returns
    };
  }

  async detectOnline(imageUri: string, cropType: string) {
    // Upload to backend for ONNX inference + full response
    const formData = new FormData();
    formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'scan.jpg' });
    formData.append('cropType', cropType);

    const response = await api.post('/scanner/analyze', formData);
    return response.data;
  }
}
```

### 3. Sentinel Hub NDVI Service

```typescript
// backend/src/services/satelliteService.ts

import axios from 'axios';

const SENTINEL_HUB_BASE = 'https://services.sentinel-hub.com';
const FREE_TIER_LIMIT = 30000; // requests per month

interface NDVIResult {
  meanNDVI: number;
  minNDVI: number;
  maxNDVI: number;
  tileUrl: string;
  anomalyDetected: boolean;
  anomalyType?: string;
}

export class SatelliteService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async authenticate() {
    const response = await axios.post(
      `${SENTINEL_HUB_BASE}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.SENTINEL_CLIENT_ID!,
        client_secret: process.env.SENTINEL_CLIENT_SECRET!,
      })
    );
    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  }

  async fetchNDVI(farmBoundary: GeoJSON.Polygon, date?: string): Promise<NDVIResult> {
    await this.ensureAuthenticated();

    const evalscript = `
      //VERSION=3
      function setup() {
        return { input: ["B04", "B08"], output: { bands: 1, sampleType: "FLOAT32" } };
      }
      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return [ndvi];
      }
    `;

    const response = await axios.post(
      `${SENTINEL_HUB_BASE}/api/v1/process`,
      {
        input: {
          bounds: { geometry: farmBoundary, properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } },
          data: [{
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: {
                from: date || new Date(Date.now() - 7 * 86400000).toISOString(),
                to: date || new Date().toISOString(),
              },
              maxCloudCoverage: 30,
            },
          }],
        },
        evalscript,
        output: { responses: [{ identifier: 'default', format: { type: 'image/tiff' } }] },
      },
      { headers: { Authorization: `Bearer ${this.accessToken}` }, responseType: 'arraybuffer' }
    );

    const stats = this.computeStatistics(response.data);
    const anomaly = this.detectAnomaly(stats);

    return {
      meanNDVI: stats.mean,
      minNDVI: stats.min,
      maxNDVI: stats.max,
      tileUrl: await this.storeTile(response.data),
      anomalyDetected: anomaly.detected,
      anomalyType: anomaly.type,
    };
  }

  private detectAnomaly(stats: NDVIStats): { detected: boolean; type?: string } {
    // Compare against rolling 4-week average for this farm
    // NDVI drop >0.15 in one week → stress alert
    // NDVI <0.2 during growing season → possible crop failure
    // Sudden NDVI increase during dry spell → possible waterlogging
    if (stats.weeklyDrop > 0.15) {
      return { detected: true, type: 'STRESS' };
    }
    if (stats.mean < 0.2 && stats.isGrowingSeason) {
      return { detected: true, type: 'CROP_FAILURE_RISK' };
    }
    return { detected: false };
  }

  // Weekly cron job: fetch NDVI for all registered farms
  async weeklyNDVIFetch() {
    const farms = await prisma.farm.findMany({
      where: { isActive: true, boundary: { not: null } },
    });

    for (const farm of farms) {
      try {
        const result = await this.fetchNDVI(farm.boundary as GeoJSON.Polygon);

        await prisma.satelliteData.create({
          data: {
            farmId: farm.id,
            captureDate: new Date(),
            dataType: 'NDVI',
            source: 'SENTINEL_2',
            meanValue: result.meanNDVI,
            minValue: result.minNDVI,
            maxValue: result.maxNDVI,
            tileUrl: result.tileUrl,
            anomaly: result.anomalyDetected,
            anomalyType: result.anomalyType,
          },
        });

        // Trigger advisory if anomaly detected
        if (result.anomalyDetected) {
          await this.createAnomalyAdvisory(farm, result);
        }
      } catch (error) {
        logger.error(`NDVI fetch failed for farm ${farm.id}`, error);
      }
    }
  }
}
```

### 4. WeatherHold Service

```typescript
// backend/src/services/weatherHoldService.ts

import axios from 'axios';

const IMD_API_BASE = process.env.IMD_API_URL; // Requires formal license (apply Phase 5)
const OPENWEATHER_FALLBACK = 'https://api.openweathermap.org/data/2.5';

interface WeatherCheckResult {
  shouldHold: boolean;
  reason?: string;
  weatherData: WeatherData;
  suggestedDate?: Date;
}

// Thresholds for different service types
const HOLD_THRESHOLDS = {
  DRONE_SPRAYING: { maxWindKmh: 15, maxRainfallMm: 0, minVisibilityKm: 2 },
  MACHINERY_OUTDOOR: { maxRainfallMm: 5, maxWindKmh: 40 },
  LABOR_OUTDOOR: { maxRainfallMm: 10, maxTempC: 45, maxWindKmh: 50 },
  TRANSPORT: { maxRainfallMm: 20, maxWindKmh: 60 },
};

export class WeatherHoldService {

  async checkBookingWeather(bookingId: string): Promise<WeatherCheckResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, farm: true },
    });

    const location = booking.farm?.centroid || booking.location;
    const weather = await this.getForecast(location, booking.scheduledDate);
    const serviceType = this.mapServiceType(booking.service.category);
    const thresholds = HOLD_THRESHOLDS[serviceType];

    const violations = [];

    if (weather.rainfall > thresholds.maxRainfallMm) {
      violations.push(`Rain forecast: ${weather.rainfall}mm (max ${thresholds.maxRainfallMm}mm)`);
    }
    if (weather.windSpeed > (thresholds.maxWindKmh || 999)) {
      violations.push(`Wind: ${weather.windSpeed} km/h (max ${thresholds.maxWindKmh} km/h)`);
    }
    if (serviceType === 'DRONE_SPRAYING' && weather.windSpeed > 15) {
      violations.push(`Drone ops blocked: wind ${weather.windSpeed} km/h exceeds 15 km/h safety limit`);
    }

    if (violations.length > 0) {
      const suggestedDate = await this.findNextClearDay(location, booking.scheduledDate);

      return {
        shouldHold: true,
        reason: violations.join('; '),
        weatherData: weather,
        suggestedDate,
      };
    }

    return { shouldHold: false, weatherData: weather };
  }

  // Runs daily via cron for bookings in next 48 hours
  async dailyWeatherCheck() {
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 48 * 3600000),
        },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
        weatherHold: null, // Not already on hold
      },
      include: { service: true, farm: true },
    });

    for (const booking of upcomingBookings) {
      const result = await this.checkBookingWeather(booking.id);

      if (result.shouldHold) {
        const hold = await prisma.weatherHold.create({
          data: {
            bookingId: booking.id,
            farmId: booking.farmId,
            originalDate: booking.scheduledDate,
            rescheduledDate: result.suggestedDate,
            holdReason: this.classifyReason(result.reason!),
            weatherData: result.weatherData,
            status: 'PENDING',
            autoRescheduled: !!result.suggestedDate,
          },
        });

        // Notify farmer and provider
        await notificationService.send({
          userId: booking.farmerId,
          type: 'WEATHER_HOLD',
          title: { en: 'Booking held due to weather', hi: 'मौसम के कारण बुकिंग रोकी गई' },
          body: {
            en: `Your ${booking.service.name} booking on ${booking.scheduledDate.toLocaleDateString()} has been held. ${result.reason}`,
          },
          data: { holdId: hold.id, bookingId: booking.id },
        });
      }
    }
  }

  private async findNextClearDay(location: any, fromDate: Date): Promise<Date | undefined> {
    // Check next 7 days for first clear window
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(fromDate.getTime() + i * 86400000);
      const weather = await this.getForecast(location, checkDate);
      if (weather.rainfall < 2 && weather.windSpeed < 15) {
        return checkDate;
      }
    }
    return undefined;
  }
}
```

### 5. Price Prediction Service

```typescript
// backend/src/services/predictionService.ts (enhanced)

import { spawn } from 'child_process';

export class PricePredictionService {
  // Python subprocess for Prophet/LSTM models
  private pythonProcess: any;

  async predict(cropId: string, market: string, days: 7 | 30): Promise<PredictionResult> {
    // Fetch historical prices
    const history = await prisma.priceHistory.findMany({
      where: { cropId, market },
      orderBy: { date: 'asc' },
      take: 365, // Last year of data
    });

    if (history.length < 30) {
      throw new AppError('Insufficient historical data for prediction', 400);
    }

    // Run Prophet model via Python subprocess
    const prophetResult = await this.runProphetModel(history, days);

    // Run LSTM model via Python subprocess
    const lstmResult = await this.runLSTMModel(history, days);

    // Ensemble: weighted average (Prophet 0.6, LSTM 0.4)
    const ensemble = this.ensemblePredictions(prophetResult, lstmResult);

    // Store predictions
    for (const prediction of ensemble.predictions) {
      await prisma.pricePrediction.create({
        data: {
          cropId,
          market,
          district: history[0].district,
          state: history[0].state,
          predictionDate: new Date(),
          targetDate: prediction.date,
          predictedPrice: prediction.price,
          confidenceLow: prediction.lower,
          confidenceHigh: prediction.upper,
          modelVersion: 'ensemble_v1',
        },
      });
    }

    return ensemble;
  }

  private runProphetModel(history: PriceRecord[], days: number): Promise<ModelResult> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['models/prophet_predict.py']);
      python.stdin.write(JSON.stringify({ history, days }));
      python.stdin.end();

      let output = '';
      python.stdout.on('data', (data: Buffer) => { output += data.toString(); });
      python.on('close', (code: number) => {
        if (code === 0) resolve(JSON.parse(output));
        else reject(new Error(`Prophet model failed with code ${code}`));
      });
    });
  }
}
```

### 6. Farm Boundary with Mapbox GL

```typescript
// web/src/components/farms/FarmBoundaryEditor.tsx

import Map, { Source, Layer } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';

export function FarmBoundaryEditor({ onBoundaryComplete }: Props) {
  const drawRef = useRef<MapboxDraw>(null);

  const handleDrawCreate = (e: any) => {
    const polygon = e.features[0];
    const area = turf.area(polygon); // square meters
    const areaAcres = area / 4046.86; // convert to acres
    const centroid = turf.centroid(polygon);

    onBoundaryComplete({
      boundary: polygon.geometry, // GeoJSON Polygon
      areaAcres: Math.round(areaAcres * 100) / 100,
      centroid: {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0],
      },
    });
  };

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: 17.385, longitude: 78.4867, zoom: 14 }}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
    >
      <DrawControl
        position="top-right"
        displayControlsDefault={false}
        controls={{ polygon: true, trash: true }}
        onCreate={handleDrawCreate}
      />
    </Map>
  );
}
```

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Weekly (Sunday 2 AM) | `ndvi-fetch` | Fetch NDVI for all active farms from Sentinel Hub |
| Daily (6 AM) | `weather-hold-check` | Check weather for bookings in next 48 hours |
| Daily (midnight) | `price-prediction-run` | Run Prophet + LSTM for all tracked crop-market pairs |
| Daily (7 AM) | `advisory-generation` | Generate crop advisories based on weather + satellite + season |

---

## Environment Variables

```env
# Sentinel Hub
SENTINEL_CLIENT_ID=your_client_id
SENTINEL_CLIENT_SECRET=your_client_secret

# IMD Weather API (formal license required)
IMD_API_URL=https://api.imd.gov.in/v1
IMD_API_KEY=your_api_key

# Fallback weather
OPENWEATHER_API_KEY=your_openweather_key

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# ML Models
ML_MODEL_PATH=./models
PYTHON_PATH=/usr/bin/python3
```

---

## Testing Checklist

### Disease Detection
- [ ] Upload image of healthy crop → returns "healthy" with high confidence
- [ ] Upload image of diseased crop → returns correct disease + treatments
- [ ] Verify treatments returned in all 10 supported languages
- [ ] Verify recommended products link to actual marketplace listings
- [ ] Verify nearby dealers returned sorted by distance
- [ ] Test TFLite on-device inference (mobile) works offline
- [ ] Test ONNX inference (web/backend) accuracy benchmarks
- [ ] Model accuracy: >85% on test set of 100+ diseases
- [ ] Inference time: <2 seconds on-device, <1 second backend

### Satellite & NDVI
- [ ] Farm with valid polygon → weekly NDVI data stored
- [ ] NDVI anomaly (drop >0.15) → triggers alert + advisory
- [ ] Verify Sentinel Hub free tier usage tracking (30K req/month)
- [ ] NDVI history endpoint returns correct time series
- [ ] Farm without polygon → graceful skip, no errors

### WeatherHold
- [ ] Booking with rain forecast → auto-hold created + notifications sent
- [ ] Drone booking with wind >15 km/h → blocked with explanation
- [ ] Farmer can override hold and keep original date
- [ ] Auto-reschedule suggests next clear day correctly
- [ ] Hold expires if booking date passes without resolution
- [ ] WeatherHold integrates with booking status flow

### Farm Management
- [ ] Create farm with Mapbox polygon → area auto-calculated
- [ ] Add soil test → data persisted, visible in farm detail
- [ ] Log crop rotation → season history maintained
- [ ] Record inputs + costs → season cost summary correct
- [ ] Record yield + revenue → profit/loss calculation correct

### Price Prediction
- [ ] Prophet model produces 7-day forecast with confidence intervals
- [ ] LSTM model produces 30-day forecast with confidence intervals
- [ ] Ensemble prediction accuracy: MAPE <15% on held-out test data
- [ ] Insufficient data (<30 days) → returns 400 error, not crash
- [ ] Predictions stored and compared against actuals for tracking

---

## Files to Create/Modify

### New Files
```
backend/src/services/diseaseDetectionService.ts    # Disease detection with ONNX runtime
backend/src/services/satelliteService.ts           # Sentinel Hub NDVI integration
backend/src/services/weatherHoldService.ts         # Weather-aware booking holds
backend/src/services/farmService.ts                # Farm CRUD + boundary management
backend/src/services/advisoryService.ts            # Crop advisory generation
backend/src/routes/farms.ts                        # Farm management endpoints
backend/src/routes/satellite.ts                    # NDVI endpoints
backend/src/routes/advisory.ts                     # Advisory endpoints
backend/src/routes/weatherHold.ts                  # WeatherHold endpoints
backend/src/cron/ndviFetch.ts                      # Weekly NDVI cron
backend/src/cron/weatherCheck.ts                   # Daily weather check cron
backend/src/cron/pricePrediction.ts                # Daily price prediction cron
backend/src/cron/advisoryGeneration.ts             # Daily advisory generation
backend/models/prophet_predict.py                  # Prophet prediction script
backend/models/lstm_predict.py                     # LSTM prediction script
mobile/src/services/diseaseDetection.ts            # TFLite on-device inference
mobile/src/screens/scanner/ScannerScreen.tsx       # Camera + scan UI
mobile/src/screens/farms/FarmListScreen.tsx         # Farm list
mobile/src/screens/farms/FarmDetailScreen.tsx       # Farm detail with NDVI map
mobile/src/screens/farms/FarmBoundaryScreen.tsx     # Mapbox polygon drawing
web/src/components/farms/FarmBoundaryEditor.tsx     # Web farm boundary editor
web/src/components/farms/NDVIViewer.tsx             # NDVI visualization
web/src/components/scanner/DiseaseScanner.tsx       # Web disease scanner
web/src/app/farms/page.tsx                         # Farms dashboard
web/src/app/farms/[id]/page.tsx                    # Farm detail page
```

### Modified Files
```
backend/prisma/schema.prisma                       # Add Farm, SatelliteData, WeatherHold, etc.
backend/src/routes/scanner.ts                      # Replace stub with real ML integration
backend/src/services/predictionService.ts          # Replace random data with Prophet/LSTM
backend/src/routes/predictions.ts                  # Enhance with confidence intervals
backend/src/index.ts                               # Mount new routes + cron jobs
mobile/src/navigation/AppNavigator.tsx             # Add farm + scanner screens
web/src/app/layout.tsx                             # Add farms nav item
```

---

## Definition of Done

- [ ] Disease detection returns correct results for top 100 crop diseases
- [ ] Treatments available in 10 languages: en, hi, te, ta, kn, mr, gu, bn, pa, ml
- [ ] Detection triggers advisory + product recommendation + nearby dealer listing
- [ ] Farm registration with Mapbox polygon boundary works on web and mobile
- [ ] Weekly NDVI fetch running for all farms with boundaries
- [ ] NDVI anomaly detection triggers alerts within 24 hours
- [ ] WeatherHold auto-reschedules outdoor bookings on rain/storm
- [ ] Drone spraying blocked when wind exceeds 15 km/h
- [ ] Price predictions achieve MAPE <15% on test data
- [ ] All cron jobs running reliably with error recovery
- [ ] Sentinel Hub free tier usage monitored and not exceeded
