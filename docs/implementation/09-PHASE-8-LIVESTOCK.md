# Phase 8: Livestock & Specialized Services

**Timeline:** Weeks 36-39
**Priority:** HIGH — Expands addressable market to 300M+ livestock-owning households
**Dependencies:** Phase 0 (RBAC), Phase 1 (Service Providers), Phase 3 (Bookings), Phase 4 (Payments)

---

## Objective

Extend the platform beyond crop agriculture to cover livestock trading, veterinary services, health tracking, drone-as-a-service, and cold chain logistics. No single competitor combines marketplace + vet + health tracking + drone + cold chain in one platform.

---

## Current State

### What Exists
- Service provider framework from Phase 1 (can be extended for vets and drone operators)
- Booking system from Phase 3 (can be extended for vet and drone bookings)
- Payment system from Phase 4 (supports new service types)
- KYC system for providers (needs extension for DGCA drone certification)

### What's Wrong
- Zero livestock features — no way to list, buy, or manage animals
- No veterinary service booking
- No drone service booking with regulatory compliance
- No cold chain monitoring for perishable transport
- No health record tracking for animals

### Competitive Landscape
| Feature | Animall | Meri Gaay | FarmConnect |
|---------|---------|-----------|-------------|
| Livestock marketplace | Yes | Yes | Yes + health records |
| Vet booking | No | No | Emergency + scheduled + follow-up |
| Health tracking | No | No | RFID tags + vaccination history |
| Drone services | No | No | DGCA-compliant booking |
| Cold chain | No | No | Temperature-monitored transport |
| Integrated with crop platform | No | No | Yes |

---

## Database Schema Changes

### New Models

```prisma
// ── LIVESTOCK MARKETPLACE ──

model LivestockListing {
  id                String   @id @default(cuid())
  sellerId          String
  category          String   // "CATTLE", "BUFFALO", "GOAT", "SHEEP", "POULTRY", "FISH", "PIG"
  breed             String
  age               Json     // { years: 3, months: 6 }
  gender            String   // "MALE", "FEMALE"
  weight            Float?   // kg
  priceInr          Float
  isNegotiable      Boolean  @default(true)
  description       String?
  descriptionLang   String   @default("en")
  images            Json     // [{ url, isPrimary }]
  videos            Json?    // [{ url, duration }]
  location          Json     // { district, state, pincode, lat, lng }
  
  // Health & Documentation
  vaccinationRecords Json?   // [{ vaccine, date, nextDue, vetName }]
  healthCertificate  String? // Uploaded PDF/image URL
  insuranceStatus    String? // "INSURED", "UNINSURED"
  insuranceProvider  String?
  lastHealthCheckDate DateTime?
  
  // For dairy animals
  milkYieldPerDay    Float?  // liters
  lactationNumber    Int?
  pregnancyStatus    String? // "NOT_PREGNANT", "PREGNANT", "RECENTLY_CALVED"
  
  // For breeding
  breedingHistory    Json?   // [{ date, method, outcome }]
  
  status            String   @default("ACTIVE") // "ACTIVE", "SOLD", "RESERVED", "EXPIRED"
  verifiedBy        String?  // Admin who verified the listing
  verifiedAt        DateTime?
  expiresAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  seller            User                  @relation(fields: [sellerId], references: [id])
  healthRecords     LivestockHealthRecord[]
  inquiries         LivestockInquiry[]

  @@index([sellerId])
  @@index([category, status])
  @@index([location(path: "$.state"), location(path: "$.district")])
  @@map("livestock_listings")
}

model LivestockInquiry {
  id          String   @id @default(cuid())
  listingId   String
  buyerId     String
  message     String?
  offerPrice  Float?
  status      String   @default("PENDING") // "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  listing     LivestockListing @relation(fields: [listingId], references: [id])
  buyer       User             @relation(fields: [buyerId], references: [id])

  @@index([listingId, status])
  @@map("livestock_inquiries")
}

model LivestockHealthRecord {
  id              String   @id @default(cuid())
  listingId       String?
  animalTagId     String?  // RFID tag identifier
  ownerId         String
  recordType      String   // "VACCINATION", "TREATMENT", "CHECKUP", "DEWORMING", "SURGERY", "LAB_TEST"
  date            DateTime
  description     String
  vetName         String?
  vetId           String?  // If booked through platform
  diagnosis       String?
  medications     Json?    // [{ name, dosage, duration }]
  labResults      Json?    // [{ test, value, normalRange }]
  nextFollowUp    DateTime?
  attachments     Json?    // [{ url, type }]
  createdAt       DateTime @default(now())

  listing         LivestockListing? @relation(fields: [listingId], references: [id])
  owner           User              @relation(fields: [ownerId], references: [id])

  @@index([ownerId, date])
  @@index([animalTagId])
  @@map("livestock_health_records")
}

// ── VET BOOKING ──

model VetBooking {
  id              String   @id @default(cuid())
  farmerId        String
  vetId           String
  bookingType     String   // "EMERGENCY", "SCHEDULED", "FOLLOW_UP"
  animalCategory  String   // "CATTLE", "BUFFALO", etc.
  animalCount     Int      @default(1)
  symptoms        String?
  urgency         String   @default("NORMAL") // "NORMAL", "URGENT", "CRITICAL"
  scheduledDate   DateTime?
  scheduledSlot   String?  // "MORNING", "AFTERNOON", "EVENING"
  visitType       String   @default("FARM_VISIT") // "FARM_VISIT", "CLINIC", "VIDEO_CALL"
  
  // Location
  farmLocation    Json     // { lat, lng, address }
  
  // Status tracking
  status          String   @default("PENDING") // "PENDING", "ACCEPTED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"
  acceptedAt      DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Prescription
  diagnosis       String?
  prescription    Json?    // [{ medicine, dosage, frequency, duration }]
  prescriptionUrl String?  // PDF
  followUpDate    DateTime?
  
  // Payment
  consultationFee Float?
  travelFee       Float?
  medicineCost    Float?
  totalAmount     Float?
  paymentStatus   String   @default("PENDING") // "PENDING", "PAID", "REFUNDED"
  paymentId       String?
  
  // Rating
  rating          Int?     // 1-5
  review          String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  farmer          User @relation("FarmerVetBookings", fields: [farmerId], references: [id])
  vet             User @relation("VetBookings", fields: [vetId], references: [id])

  @@index([farmerId, status])
  @@index([vetId, status])
  @@index([bookingType, urgency])
  @@map("vet_bookings")
}

// ── DRONE-AS-A-SERVICE ──

model DroneOperator {
  id                String   @id @default(cuid())
  userId            String   @unique
  companyName       String?
  dgcaCertNumber    String   // DGCA Remote Pilot License number
  dgcaCertExpiry    DateTime
  dgcaCertUrl       String   // Uploaded certificate
  droneModels       Json     // [{ model, regNumber, payload, sprayWidth }]
  operatingDistricts Json    // [{ district, state }]
  insuranceNumber   String?
  insuranceExpiry   DateTime?
  kycVerified       Boolean  @default(false)
  dgcaVerified      Boolean  @default(false) // Admin-verified DGCA cert
  isActive          Boolean  @default(true)
  rating            Float?
  totalFlights      Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User           @relation(fields: [userId], references: [id])
  bookings          DroneBooking[]

  @@map("drone_operators")
}

model DroneBooking {
  id              String   @id @default(cuid())
  farmerId        String
  operatorId      String
  serviceType     String   // "CROP_SPRAYING", "NDVI_MAPPING", "AERIAL_SURVEY", "SEED_SOWING", "FERTILIZER_BROADCASTING"
  farmId          String?
  areaAcres       Float
  
  // Spraying details
  chemicalType    String?  // "PESTICIDE", "HERBICIDE", "FUNGICIDE", "FERTILIZER"
  chemicalName    String?
  dosagePerAcre   String?
  
  // Pricing
  ratePerAcre     Float    // INR 400-600 typically
  totalAmount     Float
  
  // Scheduling
  scheduledDate   DateTime
  scheduledSlot   String?  // "EARLY_MORNING", "MORNING", "EVENING"
  
  // Weather check (linked to WeatherHold)
  weatherCleared  Boolean  @default(false)
  
  // Status
  status          String   @default("PENDING") // "PENDING", "CONFIRMED", "WEATHER_HOLD", "IN_PROGRESS", "COMPLETED", "CANCELLED"
  flightLogUrl    String?  // DGCA-compliant flight log
  completionPhotos Json?   // Before/after images
  
  // Payment
  paymentStatus   String   @default("PENDING")
  paymentId       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  farmer          User          @relation(fields: [farmerId], references: [id])
  operator        DroneOperator @relation(fields: [operatorId], references: [id])

  @@index([farmerId, status])
  @@index([operatorId, scheduledDate])
  @@map("drone_bookings")
}

// ── COLD CHAIN ──

model ColdChainShipment {
  id                String   @id @default(cuid())
  senderId          String
  receiverId        String?
  bookingId         String?  // Linked transport booking
  
  // Cargo
  cargoType         String   // "MILK", "VEGETABLES", "FRUITS", "MEAT", "FISH", "FLOWERS"
  cargoQuantity     Float
  cargoUnit         String   // "KG", "LT", "CRATES"
  
  // Temperature requirements
  requiredTempMin   Float    // Celsius
  requiredTempMax   Float    // Celsius
  
  // Tracking
  currentTemp       Float?
  currentLocation   Json?    // { lat, lng, updatedAt }
  gpsDeviceId       String?
  temperatureSensorId String?
  
  // Route
  originLocation    Json     // { address, lat, lng }
  destLocation      Json     // { address, lat, lng }
  estimatedDuration Int?     // minutes
  actualDuration    Int?
  
  // Temperature log
  temperatureLog    Json?    // [{ temp, lat, lng, timestamp }]
  deviationCount    Int      @default(0)
  maxDeviation      Float?   // Max degrees outside range
  
  // Insurance
  insured           Boolean  @default(false)
  insuranceAmount   Float?
  insurancePremium  Float?
  claimStatus       String?  // "NONE", "FILED", "APPROVED", "REJECTED"
  
  // Status
  status            String   @default("CREATED") // "CREATED", "PICKED_UP", "IN_TRANSIT", "DEVIATION_ALERT", "DELIVERED", "DAMAGED"
  pickedUpAt        DateTime?
  deliveredAt       DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  sender            User @relation("ColdChainSender", fields: [senderId], references: [id])

  @@index([senderId, status])
  @@index([status, createdAt])
  @@map("cold_chain_shipments")
}
```

### Modify Existing Models

```prisma
model User {
  // ... existing fields ...
  
  // ADD:
  livestockListings       LivestockListing[]
  livestockInquiries      LivestockInquiry[]
  livestockHealthRecords  LivestockHealthRecord[]
  vetBookingsAsFarmer     VetBooking[]      @relation("FarmerVetBookings")
  vetBookingsAsVet        VetBooking[]      @relation("VetBookings")
  droneOperator           DroneOperator?
  droneBookings           DroneBooking[]
  coldChainShipments      ColdChainShipment[] @relation("ColdChainSender")
}
```

---

## API Endpoints

### Livestock Marketplace

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/livestock` | Create livestock listing | Farmer |
| GET | `/api/livestock` | Browse listings (filter by category, breed, location, price) | Public |
| GET | `/api/livestock/:id` | Listing detail with health records | Public |
| PUT | `/api/livestock/:id` | Update listing | Owner |
| DELETE | `/api/livestock/:id` | Remove listing | Owner |
| POST | `/api/livestock/:id/inquire` | Send inquiry/offer to seller | Authenticated |
| GET | `/api/livestock/my-listings` | Seller's own listings | Authenticated |
| GET | `/api/livestock/my-inquiries` | Buyer's sent inquiries | Authenticated |
| PUT | `/api/livestock/inquiries/:id` | Accept/reject inquiry | Seller |

### Livestock Health Records

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/livestock/:id/health-records` | Add health record | Owner/Vet |
| GET | `/api/livestock/:id/health-records` | Get all health records for animal | Owner |
| GET | `/api/health-records/tag/:tagId` | Look up by RFID tag | Owner/Vet |
| PUT | `/api/health-records/:id` | Update record | Owner/Vet |

### Vet Booking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vets` | List available vets (filter by location, specialty, availability) | Authenticated |
| GET | `/api/vets/:id` | Vet profile with ratings | Public |
| POST | `/api/vet-bookings` | Book a vet (emergency/scheduled/follow-up) | Farmer |
| GET | `/api/vet-bookings` | List user's vet bookings | Authenticated |
| GET | `/api/vet-bookings/:id` | Booking detail | Farmer/Vet |
| PUT | `/api/vet-bookings/:id/status` | Update status (accept, start, complete) | Vet |
| POST | `/api/vet-bookings/:id/prescription` | Add prescription | Vet |
| POST | `/api/vet-bookings/:id/rate` | Rate completed booking | Farmer |

### Drone-as-a-Service

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/drone-operators/register` | Register as drone operator | Authenticated |
| GET | `/api/drone-operators` | List operators (filter by district, service type) | Authenticated |
| GET | `/api/drone-operators/:id` | Operator profile + certifications | Public |
| PUT | `/api/drone-operators/:id/verify` | Admin verify DGCA certification | Admin |
| POST | `/api/drone-bookings` | Book drone service | Farmer |
| GET | `/api/drone-bookings` | List user's drone bookings | Authenticated |
| GET | `/api/drone-bookings/:id` | Booking detail | Farmer/Operator |
| PUT | `/api/drone-bookings/:id/status` | Update status | Operator |
| POST | `/api/drone-bookings/:id/flight-log` | Upload flight log | Operator |
| GET | `/api/drone-bookings/:id/weather-check` | Check weather clearance | Farmer/Operator |

### Cold Chain

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/cold-chain/shipments` | Create cold chain shipment | Authenticated |
| GET | `/api/cold-chain/shipments` | List user's shipments | Authenticated |
| GET | `/api/cold-chain/shipments/:id` | Shipment detail + temperature log | Authenticated |
| PUT | `/api/cold-chain/shipments/:id/status` | Update shipment status | Driver/Admin |
| POST | `/api/cold-chain/shipments/:id/temperature` | Log temperature reading (IoT device) | System |
| GET | `/api/cold-chain/shipments/:id/track` | Real-time GPS tracking | Authenticated |
| POST | `/api/cold-chain/shipments/:id/insurance-claim` | File insurance claim for deviation | Sender |

---

## Backend Implementation

### 1. Livestock Service

```typescript
// backend/src/services/livestockService.ts

export class LivestockService {
  async createListing(data: CreateListingInput, sellerId: string) {
    // Validate category-specific fields
    this.validateCategoryFields(data);

    const listing = await prisma.livestockListing.create({
      data: {
        sellerId,
        category: data.category,
        breed: data.breed,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        priceInr: data.priceInr,
        isNegotiable: data.isNegotiable ?? true,
        description: data.description,
        images: data.images,
        location: data.location,
        vaccinationRecords: data.vaccinationRecords,
        healthCertificate: data.healthCertificateUrl,
        milkYieldPerDay: data.milkYieldPerDay,
        lactationNumber: data.lactationNumber,
        pregnancyStatus: data.pregnancyStatus,
        expiresAt: new Date(Date.now() + 30 * 86400000), // 30-day listing
      },
    });

    return listing;
  }

  async searchListings(filters: ListingFilters) {
    const where: any = { status: 'ACTIVE' };

    if (filters.category) where.category = filters.category;
    if (filters.breed) where.breed = { contains: filters.breed, mode: 'insensitive' };
    if (filters.minPrice || filters.maxPrice) {
      where.priceInr = {};
      if (filters.minPrice) where.priceInr.gte = filters.minPrice;
      if (filters.maxPrice) where.priceInr.lte = filters.maxPrice;
    }
    if (filters.state) where.location = { path: '$.state', equals: filters.state };
    if (filters.district) where.location = { path: '$.district', equals: filters.district };

    return prisma.livestockListing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: filters.offset || 0,
      take: filters.limit || 20,
    });
  }

  private validateCategoryFields(data: CreateListingInput) {
    if (['CATTLE', 'BUFFALO'].includes(data.category)) {
      // Dairy animals should have milk yield if female
      if (data.gender === 'FEMALE' && !data.milkYieldPerDay) {
        // Not required, but recommended — log warning
      }
    }
    if (data.category === 'POULTRY') {
      // Poultry typically sold in batches
      if (!data.weight) {
        throw new AppError('Weight is required for poultry listings', 400);
      }
    }
  }
}
```

### 2. Vet Booking Service

```typescript
// backend/src/services/vetBookingService.ts

export class VetBookingService {
  async createBooking(data: CreateVetBookingInput, farmerId: string) {
    // For emergencies, find nearest available vet
    if (data.bookingType === 'EMERGENCY') {
      return this.handleEmergencyBooking(data, farmerId);
    }

    const booking = await prisma.vetBooking.create({
      data: {
        farmerId,
        vetId: data.vetId,
        bookingType: data.bookingType,
        animalCategory: data.animalCategory,
        animalCount: data.animalCount || 1,
        symptoms: data.symptoms,
        urgency: data.urgency || 'NORMAL',
        scheduledDate: data.scheduledDate,
        scheduledSlot: data.scheduledSlot,
        visitType: data.visitType || 'FARM_VISIT',
        farmLocation: data.farmLocation,
        status: 'PENDING',
      },
    });

    // Notify vet
    await notificationService.send({
      userId: data.vetId,
      type: 'VET_BOOKING_NEW',
      title: { en: 'New vet booking request', hi: 'नई पशु चिकित्सा बुकिंग' },
      body: {
        en: `${data.bookingType} booking for ${data.animalCategory}. ${data.symptoms || ''}`,
      },
      data: { bookingId: booking.id },
    });

    return booking;
  }

  private async handleEmergencyBooking(data: CreateVetBookingInput, farmerId: string) {
    // Find nearest available vets within 25km radius
    const nearbyVets = await this.findNearbyVets(data.farmLocation, 25);

    if (nearbyVets.length === 0) {
      throw new AppError('No vets available in your area. Try video consultation.', 404);
    }

    // Auto-assign to nearest available vet
    const assignedVet = nearbyVets[0];

    const booking = await prisma.vetBooking.create({
      data: {
        farmerId,
        vetId: assignedVet.id,
        bookingType: 'EMERGENCY',
        animalCategory: data.animalCategory,
        animalCount: data.animalCount || 1,
        symptoms: data.symptoms,
        urgency: 'CRITICAL',
        visitType: 'FARM_VISIT',
        farmLocation: data.farmLocation,
        status: 'PENDING',
      },
    });

    // Send urgent notification to all nearby vets
    for (const vet of nearbyVets.slice(0, 3)) {
      await notificationService.send({
        userId: vet.id,
        type: 'VET_EMERGENCY',
        title: { en: 'EMERGENCY vet call', hi: 'आपातकालीन पशु चिकित्सा' },
        body: { en: `Emergency: ${data.animalCategory}, ${data.symptoms}` },
        data: { bookingId: booking.id },
        priority: 'HIGH',
      });
    }

    return booking;
  }

  async addPrescription(bookingId: string, vetId: string, prescription: PrescriptionInput) {
    const booking = await prisma.vetBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.vetId !== vetId) {
      throw new AppError('Booking not found or unauthorized', 404);
    }

    const updated = await prisma.vetBooking.update({
      where: { id: bookingId },
      data: {
        diagnosis: prescription.diagnosis,
        prescription: prescription.medicines,
        prescriptionUrl: prescription.pdfUrl,
        followUpDate: prescription.followUpDate,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Auto-create health record for the animal
    if (booking.animalCategory) {
      await prisma.livestockHealthRecord.create({
        data: {
          ownerId: booking.farmerId,
          recordType: 'TREATMENT',
          date: new Date(),
          description: prescription.diagnosis,
          vetId: vetId,
          diagnosis: prescription.diagnosis,
          medications: prescription.medicines,
          nextFollowUp: prescription.followUpDate,
        },
      });
    }

    return updated;
  }
}
```

### 3. Drone Booking Service

```typescript
// backend/src/services/droneBookingService.ts

const DRONE_RATES = {
  CROP_SPRAYING: { min: 400, max: 600 },         // INR per acre
  NDVI_MAPPING: { min: 200, max: 350 },
  AERIAL_SURVEY: { min: 300, max: 500 },
  SEED_SOWING: { min: 350, max: 550 },
  FERTILIZER_BROADCASTING: { min: 400, max: 600 },
};

export class DroneBookingService {
  async createBooking(data: CreateDroneBookingInput, farmerId: string) {
    // Verify operator is DGCA certified
    const operator = await prisma.droneOperator.findUnique({
      where: { id: data.operatorId },
    });

    if (!operator || !operator.dgcaVerified) {
      throw new AppError('Drone operator not DGCA verified', 400);
    }

    if (new Date(operator.dgcaCertExpiry) < new Date()) {
      throw new AppError('Drone operator DGCA certification has expired', 400);
    }

    // Check weather clearance for scheduled date
    const weatherCheck = await weatherHoldService.checkBookingWeather({
      location: data.farmLocation,
      date: data.scheduledDate,
      serviceType: 'DRONE_SPRAYING',
    });

    const totalAmount = data.areaAcres * data.ratePerAcre;

    const booking = await prisma.droneBooking.create({
      data: {
        farmerId,
        operatorId: data.operatorId,
        serviceType: data.serviceType,
        farmId: data.farmId,
        areaAcres: data.areaAcres,
        chemicalType: data.chemicalType,
        chemicalName: data.chemicalName,
        dosagePerAcre: data.dosagePerAcre,
        ratePerAcre: data.ratePerAcre,
        totalAmount,
        scheduledDate: data.scheduledDate,
        scheduledSlot: data.scheduledSlot,
        weatherCleared: !weatherCheck.shouldHold,
        status: weatherCheck.shouldHold ? 'WEATHER_HOLD' : 'PENDING',
      },
    });

    if (weatherCheck.shouldHold) {
      await notificationService.send({
        userId: farmerId,
        type: 'DRONE_WEATHER_HOLD',
        title: { en: 'Drone booking on weather hold', hi: 'ड्रोन बुकिंग मौसम होल्ड पर' },
        body: { en: weatherCheck.reason },
        data: { bookingId: booking.id },
      });
    }

    return booking;
  }

  async registerOperator(data: RegisterOperatorInput, userId: string) {
    // Validate DGCA certificate number format: XXXX-XXXX-XXXX
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(data.dgcaCertNumber)) {
      throw new AppError('Invalid DGCA certificate number format', 400);
    }

    return prisma.droneOperator.create({
      data: {
        userId,
        companyName: data.companyName,
        dgcaCertNumber: data.dgcaCertNumber,
        dgcaCertExpiry: data.dgcaCertExpiry,
        dgcaCertUrl: data.dgcaCertUrl,
        droneModels: data.droneModels,
        operatingDistricts: data.operatingDistricts,
        insuranceNumber: data.insuranceNumber,
        insuranceExpiry: data.insuranceExpiry,
        kycVerified: false,
        dgcaVerified: false, // Requires admin verification
      },
    });
  }
}
```

### 4. Cold Chain Monitoring Service

```typescript
// backend/src/services/coldChainService.ts

const TEMP_THRESHOLDS = {
  MILK: { min: 2, max: 6 },
  VEGETABLES: { min: 1, max: 10 },
  FRUITS: { min: 5, max: 13 },
  MEAT: { min: -2, max: 4 },
  FISH: { min: -1, max: 2 },
  FLOWERS: { min: 2, max: 8 },
};

export class ColdChainService {
  // Called by IoT temperature sensor via webhook
  async logTemperature(shipmentId: string, reading: TemperatureReading) {
    const shipment = await prisma.coldChainShipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) throw new AppError('Shipment not found', 404);

    const isDeviation =
      reading.temperature < shipment.requiredTempMin ||
      reading.temperature > shipment.requiredTempMax;

    // Append to temperature log
    const currentLog = (shipment.temperatureLog as any[]) || [];
    currentLog.push({
      temp: reading.temperature,
      lat: reading.lat,
      lng: reading.lng,
      timestamp: new Date().toISOString(),
      isDeviation,
    });

    const deviation = isDeviation
      ? Math.max(
          Math.abs(reading.temperature - shipment.requiredTempMin),
          Math.abs(reading.temperature - shipment.requiredTempMax)
        )
      : 0;

    await prisma.coldChainShipment.update({
      where: { id: shipmentId },
      data: {
        currentTemp: reading.temperature,
        currentLocation: { lat: reading.lat, lng: reading.lng, updatedAt: new Date() },
        temperatureLog: currentLog,
        deviationCount: isDeviation ? { increment: 1 } : undefined,
        maxDeviation: deviation > (shipment.maxDeviation || 0) ? deviation : undefined,
        status: isDeviation ? 'DEVIATION_ALERT' : undefined,
      },
    });

    // Auto-escalation on temperature deviation
    if (isDeviation) {
      await this.handleDeviation(shipment, reading);
    }
  }

  private async handleDeviation(shipment: any, reading: TemperatureReading) {
    // Notify sender
    await notificationService.send({
      userId: shipment.senderId,
      type: 'COLD_CHAIN_DEVIATION',
      title: { en: 'Temperature deviation alert!', hi: 'तापमान विचलन चेतावनी!' },
      body: {
        en: `Shipment ${shipment.id}: Temperature ${reading.temperature}°C is outside required range (${shipment.requiredTempMin}°C - ${shipment.requiredTempMax}°C)`,
      },
      priority: 'HIGH',
      data: { shipmentId: shipment.id },
    });

    // If >3 deviations, escalate to admin
    if (shipment.deviationCount >= 3) {
      await notificationService.notifyAdmins({
        type: 'COLD_CHAIN_CRITICAL',
        message: `Shipment ${shipment.id} has ${shipment.deviationCount + 1} temperature deviations`,
      });
    }
  }
}
```

### 5. Livestock Transport with Permits

```typescript
// backend/src/services/livestockTransportService.ts

export class LivestockTransportService {
  async createTransportBooking(data: TransportBookingInput) {
    // Validate health certificate is present and not expired
    if (!data.healthCertificateUrl) {
      throw new AppError('Health certificate is required for livestock transport', 400);
    }

    // Check if interstate transport requires permit
    const isInterstate = data.originState !== data.destState;
    if (isInterstate && !data.interstatePermitUrl) {
      throw new AppError(
        'Interstate livestock transport requires a transit permit. Apply at your district veterinary office.',
        400
      );
    }

    const booking = await prisma.transportBooking.create({
      data: {
        ...data,
        isInterstate,
        documents: {
          healthCertificate: data.healthCertificateUrl,
          interstatePermit: data.interstatePermitUrl,
          ownershipProof: data.ownershipProofUrl,
        },
      },
    });

    return booking;
  }
}
```

---

## Testing Checklist

### Livestock Marketplace
- [ ] Create livestock listing with all fields (cattle with dairy info) → listing visible in search
- [ ] Search by category (CATTLE, GOAT, etc.) → correct results
- [ ] Search by location (state + district) → geo-filtered results
- [ ] Search by price range → correct filtering
- [ ] Send inquiry with offer price → seller receives notification
- [ ] Accept inquiry → buyer notified, listing status updated
- [ ] Listing expires after 30 days → status changes to EXPIRED
- [ ] Upload vaccination records and health certificate → persisted correctly

### Livestock Health Records
- [ ] Add vaccination record → stored with date + next due reminder
- [ ] Add treatment record from vet booking → auto-linked
- [ ] Look up animal by RFID tag → returns full health history
- [ ] Health record timeline displays in chronological order

### Vet Booking
- [ ] Book scheduled vet visit → vet receives notification
- [ ] Book emergency → nearest 3 vets notified with HIGH priority
- [ ] Vet accepts booking → farmer notified, status updates to ACCEPTED
- [ ] Vet adds prescription → health record auto-created for animal
- [ ] Follow-up booking → linked to original booking
- [ ] Video call booking type → generates video link
- [ ] Rate completed booking → rating reflected on vet profile
- [ ] Payment flow: consultation + travel + medicine fees → correct total

### Drone-as-a-Service
- [ ] Register drone operator with DGCA cert → pending admin verification
- [ ] Admin verifies DGCA cert → operator can accept bookings
- [ ] Expired DGCA cert → operator blocked from new bookings
- [ ] Book crop spraying at INR 500/acre for 10 acres → total INR 5000
- [ ] Booking with wind >15 km/h → auto-WEATHER_HOLD
- [ ] Weather clears → booking status moves to PENDING
- [ ] Operator completes with flight log upload → status COMPLETED
- [ ] Invalid DGCA number format → 400 error

### Cold Chain
- [ ] Create cold chain shipment for milk (2-6°C) → tracking active
- [ ] Temperature reading within range → no alert
- [ ] Temperature reading outside range → DEVIATION_ALERT + notification
- [ ] 3+ deviations → admin escalation
- [ ] GPS tracking returns real-time location
- [ ] File insurance claim on deviation → claim status tracked

### Livestock Transport
- [ ] Intra-state transport with health certificate → booking created
- [ ] Interstate transport without permit → 400 error with guidance
- [ ] Interstate transport with both documents → booking created

---

## Files to Create/Modify

### New Files
```
backend/src/services/livestockService.ts           # Livestock marketplace CRUD
backend/src/services/vetBookingService.ts          # Vet booking + prescription
backend/src/services/droneBookingService.ts        # Drone booking + DGCA verification
backend/src/services/coldChainService.ts           # Cold chain monitoring
backend/src/services/livestockTransportService.ts  # Transport with permits
backend/src/routes/livestock.ts                    # Livestock marketplace endpoints
backend/src/routes/vetBookings.ts                  # Vet booking endpoints
backend/src/routes/droneBookings.ts                # Drone booking endpoints
backend/src/routes/coldChain.ts                    # Cold chain endpoints
mobile/src/screens/livestock/ListingListScreen.tsx # Browse livestock
mobile/src/screens/livestock/ListingDetailScreen.tsx # Listing detail
mobile/src/screens/livestock/CreateListingScreen.tsx # Create listing
mobile/src/screens/livestock/HealthRecordsScreen.tsx # Animal health records
mobile/src/screens/vet/VetListScreen.tsx           # Browse vets
mobile/src/screens/vet/BookVetScreen.tsx           # Book vet visit
mobile/src/screens/drone/DroneOperatorsScreen.tsx  # Browse operators
mobile/src/screens/drone/BookDroneScreen.tsx       # Book drone service
web/src/app/livestock/page.tsx                     # Livestock marketplace
web/src/app/livestock/[id]/page.tsx                # Listing detail
web/src/app/vet/page.tsx                           # Vet booking page
web/src/app/drone/page.tsx                         # Drone services page
web/src/app/cold-chain/page.tsx                    # Cold chain tracking
```

### Modified Files
```
backend/prisma/schema.prisma                       # Add livestock, vet, drone, cold chain models
backend/src/index.ts                               # Mount new routes
backend/src/middleware/permissions.ts               # Add livestock/vet/drone permissions
mobile/src/navigation/AppNavigator.tsx             # Add livestock + vet + drone screens
web/src/app/layout.tsx                             # Add nav items
```

---

## Definition of Done

- [ ] Livestock marketplace supports all 7 animal categories with breed-specific fields
- [ ] Vet booking supports emergency, scheduled, and follow-up types
- [ ] Prescriptions auto-create health records for animals
- [ ] Drone operators require admin-verified DGCA certification
- [ ] Drone bookings integrate with WeatherHold (wind >15 km/h blocks spraying)
- [ ] Cold chain temperature monitoring triggers real-time alerts on deviation
- [ ] Interstate livestock transport validates health certificates and permits
- [ ] All payment flows integrated with Phase 4 payment system
