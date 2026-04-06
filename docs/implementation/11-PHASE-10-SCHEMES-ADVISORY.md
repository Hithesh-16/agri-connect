# Phase 10: Scheme Eligibility & Crop Advisory

**Timeline:** Weeks 43-45
**Priority:** HIGH — Key differentiator for farmer retention and government partnerships
**Dependencies:** Phase 0 (RBAC), Phase 7 (Farm Management, Satellite, Weather), Phase 9 (Admin Scheme Management)

---

## Objective

Build a scheme eligibility engine that matches farmer profiles against government scheme criteria, enabling one-click application preparation. Pair this with a personalized crop advisory engine that integrates soil data, weather, satellite imagery, and crop stage to deliver actionable recommendations. Together, these features make the platform indispensable for farmers navigating complex government programs and agronomic decisions.

---

## Current State

### What Exists
- `backend/src/routes/schemes.ts` — stub with hardcoded scheme list
- Farm model from Phase 7 with soil tests, crop rotation, district, state
- User profile with Aadhaar, land holding size, income bracket
- Satellite NDVI and weather data from Phase 7
- Disease detection from Phase 7

### What's Wrong
- Scheme route returns static data — no eligibility matching
- Farmers must manually search each scheme's eligibility criteria
- No application assistance — farmers must navigate multiple government portals
- No crop advisory engine — farmers rely on informal advice from input dealers
- No connection between satellite/weather data and actionable recommendations

### Competitive Landscape
| Feature | BharatAgri | Kisan Suvidha (GOI) | FarmConnect |
|---------|-----------|---------------------|-------------|
| Scheme listing | Yes | Yes | Yes |
| Eligibility matching | No | No | Yes — rule engine (UNIQUE) |
| Application assistance | No | No | Yes — pre-filled forms |
| Application tracking | No | No | Yes |
| Crop advisory | Basic | Very basic | Personalized (soil + weather + satellite) |
| Disease integration | No | No | Yes — links to Phase 7 scanner |

**Our advantage:** No platform combines personalized eligibility matching + application assistance + status tracking. BharatAgri provides crop advisory but without satellite integration or scheme assistance.

---

## Database Schema Changes

### New Models

```prisma
// ── SCHEME ELIGIBILITY ENGINE ──

model GovernmentScheme {
  id              String   @id @default(cuid())
  name            Json     // { en: "PM-KISAN", hi: "पीएम-किसान", te: "పీఎం-కిసాన్" }
  fullName        Json     // { en: "Pradhan Mantri Kisan Samman Nidhi", ... }
  description     Json     // Detailed description in multiple languages
  ministry        String   // "Agriculture", "Finance", "Rural Development"
  level           String   // "CENTRAL", "STATE"
  state           String?  // Null for central schemes
  
  // Eligibility criteria (used by rule engine)
  eligibilityCriteria Json  // {
                            //   landHolding: { max: 5 },        // acres
                            //   income: { max: 200000 },         // annual INR
                            //   states: ["ALL"] or ["AP", "TS"], 
                            //   crops: ["ALL"] or ["RICE", "WHEAT"],
                            //   farmerType: ["SMALL", "MARGINAL", "ALL"],
                            //   hasAadhaar: true,
                            //   hasBankAccount: true,
                            //   hasLandRecord: true,
                            //   minAge: 18,
                            //   maxAge: null,
                            //   gender: "ALL",
                            //   custom: [{ field, operator, value }]
                            // }
  
  // Benefits
  benefitType     String   // "CASH_TRANSFER", "SUBSIDY", "INSURANCE", "LOAN", "INPUT_SUPPLY"
  benefitAmount   Json?    // { amount: 6000, frequency: "YEARLY", installments: 3 }
  
  // Application details
  applicationUrl  String?  // Government portal URL
  applicationDocs Json     // ["AADHAAR", "LAND_RECORD", "BANK_PASSBOOK", "INCOME_CERT", "SOIL_HEALTH_CARD"]
  applicationProcess Json  // Step-by-step in multiple languages
  
  // Timeline
  applicationStart DateTime?
  applicationEnd   DateTime?
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  applications    SchemeApplication[]

  @@index([level, state])
  @@index([isActive, applicationEnd])
  @@map("government_schemes")
}

model SchemeApplication {
  id              String   @id @default(cuid())
  schemeId        String
  farmerId        String
  
  // Pre-filled data from farmer profile
  applicationData Json     // { name, aadhaar, bankAccount, landHolding, ... }
  documents       Json?    // [{ type: "AADHAAR", url: "...", verified: true }]
  
  // Status tracking
  status          String   @default("DRAFT") // "DRAFT", "SUBMITTED", "UNDER_REVIEW",
                                             // "APPROVED", "REJECTED", "DISBURSED"
  submittedAt     DateTime?
  reviewedAt      DateTime?
  reviewedBy      String?  // Government officer ID
  rejectionReason String?
  
  // Disbursement tracking
  disbursedAmount Float?
  disbursedAt     DateTime?
  disbursementRef String?  // Transaction reference
  
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  scheme          GovernmentScheme @relation(fields: [schemeId], references: [id])
  farmer          User             @relation(fields: [farmerId], references: [id])

  @@unique([schemeId, farmerId])
  @@index([farmerId, status])
  @@index([schemeId, status])
  @@map("scheme_applications")
}

model SchemeEligibilityCheck {
  id              String   @id @default(cuid())
  farmerId        String
  checkedAt       DateTime @default(now())
  eligibleSchemes Json     // [{ schemeId, matchScore, missingCriteria }]
  farmerSnapshot  Json     // Snapshot of farmer profile at check time
  
  @@index([farmerId, checkedAt])
  @@map("scheme_eligibility_checks")
}

// ── CROP ADVISORY ENGINE ──

model CropCalendar {
  id              String   @id @default(cuid())
  cropName        String
  variety         String?
  region          String   // State or agro-climatic zone
  season          String   // "KHARIF", "RABI", "ZAID"
  
  // Growth stages with dates (week ranges)
  stages          Json     // [
                           //   { name: "LAND_PREPARATION", startWeek: 1, endWeek: 2, activities: [...] },
                           //   { name: "SOWING", startWeek: 3, endWeek: 4, activities: [...] },
                           //   { name: "GERMINATION", startWeek: 5, endWeek: 6, activities: [...] },
                           //   { name: "VEGETATIVE", startWeek: 7, endWeek: 14, activities: [...] },
                           //   { name: "FLOWERING", startWeek: 15, endWeek: 18, activities: [...] },
                           //   { name: "GRAIN_FILLING", startWeek: 19, endWeek: 22, activities: [...] },
                           //   { name: "MATURITY", startWeek: 23, endWeek: 24, activities: [...] },
                           //   { name: "HARVEST", startWeek: 25, endWeek: 26, activities: [...] },
                           // ]
  
  // Standard input recommendations per stage
  inputSchedule   Json     // [{ stage, inputs: [{ type, product, quantity, timing }] }]
  
  // Pest/disease risk windows
  riskWindows     Json     // [{ pest, stage, likelihood, preventiveMeasure }]
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([cropName, region, season])
  @@index([cropName, region])
  @@map("crop_calendars")
}

model AdvisoryTemplate {
  id              String   @id @default(cuid())
  triggerType     String   // "WEATHER", "SATELLITE", "CROP_STAGE", "SOIL", "DISEASE", "MARKET"
  triggerCondition Json    // { type: "NDVI_DROP", threshold: 0.15 } or { type: "RAIN_FORECAST", days: 3 }
  cropName        String?  // Null = applies to all crops
  region          String?
  
  title           Json     // { en, hi, te, ... }
  body            Json     // { en, hi, te, ... } with placeholders like {{crop}}, {{value}}
  recommendations Json     // [{ action, product?, timing? }]
  severity        String   @default("INFO") // "INFO", "WARNING", "CRITICAL"
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  @@index([triggerType, cropName])
  @@map("advisory_templates")
}
```

### Modify Existing Models

```prisma
model User {
  // ... existing fields ...
  
  // ADD:
  schemeApplications     SchemeApplication[]
  eligibilityChecks      SchemeEligibilityCheck[]
}
```

---

## API Endpoints

### Scheme Eligibility

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/schemes` | List all active schemes (with language filter) | Public |
| GET | `/api/schemes/:id` | Scheme details with eligibility criteria | Public |
| POST | `/api/schemes/check-eligibility` | Run eligibility check for authenticated farmer | Farmer |
| GET | `/api/schemes/my-eligible` | Get farmer's eligible schemes (cached) | Farmer |
| GET | `/api/schemes/:id/eligibility-detail` | Detailed eligibility breakdown for a specific scheme | Farmer |

### Scheme Applications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/schemes/:id/apply` | Start application (pre-fills from profile) | Farmer |
| GET | `/api/schemes/applications` | List farmer's applications | Farmer |
| GET | `/api/schemes/applications/:id` | Application detail + status | Farmer |
| PUT | `/api/schemes/applications/:id` | Update draft application | Farmer |
| POST | `/api/schemes/applications/:id/submit` | Submit application | Farmer |
| POST | `/api/schemes/applications/:id/documents` | Upload supporting documents | Farmer |

### Crop Advisory

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/advisory/farm/:farmId` | Personalized advisories for a farm | Farmer |
| GET | `/api/advisory/crop-calendar/:crop` | Crop calendar for region | Authenticated |
| GET | `/api/advisory/crop-calendar/:crop/current-stage` | Current stage + recommended actions | Farmer |
| GET | `/api/advisory/regional` | Regional advisories by district | Public |
| GET | `/api/advisory/weather-based` | Weather-triggered advisories for farm | Farmer |
| POST | `/api/advisory/generate` | Force advisory generation for farm (admin/system) | Admin |

---

## Backend Implementation

### 1. Scheme Eligibility Engine

```typescript
// backend/src/services/schemeEligibilityService.ts

interface EligibilityResult {
  schemeId: string;
  schemeName: string;
  isEligible: boolean;
  matchScore: number;          // 0-100, percentage of criteria met
  metCriteria: string[];       // Criteria the farmer meets
  missingCriteria: string[];   // Criteria not met (actionable)
  partialCriteria: string[];   // Criteria partially met
}

// 20+ supported government schemes
const SUPPORTED_SCHEMES = [
  'PM-KISAN',           // Pradhan Mantri Kisan Samman Nidhi
  'PMFBY',              // Pradhan Mantri Fasal Bima Yojana
  'KCC',                // Kisan Credit Card
  'SOIL_HEALTH_CARD',   // Soil Health Card Scheme
  'RKVY',               // Rashtriya Krishi Vikas Yojana
  'NFSM',               // National Food Security Mission
  'NMSA',               // National Mission for Sustainable Agriculture
  'PMKSY',              // Pradhan Mantri Krishi Sinchayee Yojana
  'SMAM',               // Sub-Mission on Agricultural Mechanization
  'MIDH',               // Mission for Integrated Development of Horticulture
  'NMOOP',              // National Mission on Oilseeds and Oil Palm
  'NMAET',              // National Mission on Agricultural Extension and Technology
  'PKVY',               // Paramparagat Krishi Vikas Yojana (organic farming)
  'eNAM',               // National Agriculture Market
  'PMJDY',              // Pradhan Mantri Jan Dhan Yojana
  'PMJJBY',             // Pradhan Mantri Jeevan Jyoti Bima Yojana
  'PMSBY',              // Pradhan Mantri Suraksha Bima Yojana
  'APY',                // Atal Pension Yojana
  // State-specific schemes loaded dynamically
];

export class SchemeEligibilityService {
  async checkEligibility(farmerId: string): Promise<EligibilityResult[]> {
    // Fetch complete farmer profile
    const farmer = await this.getFarmerProfile(farmerId);

    // Fetch all active schemes
    const schemes = await prisma.governmentScheme.findMany({
      where: {
        isActive: true,
        OR: [
          { level: 'CENTRAL' },
          { state: farmer.state },
        ],
        OR: [
          { applicationEnd: null },
          { applicationEnd: { gte: new Date() } },
        ],
      },
    });

    const results: EligibilityResult[] = [];

    for (const scheme of schemes) {
      const result = this.evaluateScheme(farmer, scheme);
      results.push(result);
    }

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Store check for history
    await prisma.schemeEligibilityCheck.create({
      data: {
        farmerId,
        eligibleSchemes: results.filter(r => r.isEligible).map(r => ({
          schemeId: r.schemeId,
          matchScore: r.matchScore,
          missingCriteria: r.missingCriteria,
        })),
        farmerSnapshot: farmer,
      },
    });

    return results;
  }

  private evaluateScheme(farmer: FarmerProfile, scheme: any): EligibilityResult {
    const criteria = scheme.eligibilityCriteria;
    const met: string[] = [];
    const missing: string[] = [];
    const partial: string[] = [];

    // Land holding check
    if (criteria.landHolding) {
      if (criteria.landHolding.max && farmer.totalLandAcres <= criteria.landHolding.max) {
        met.push(`Land holding ≤ ${criteria.landHolding.max} acres`);
      } else if (criteria.landHolding.max) {
        missing.push(`Land holding must be ≤ ${criteria.landHolding.max} acres (yours: ${farmer.totalLandAcres})`);
      }
      if (criteria.landHolding.min && farmer.totalLandAcres >= criteria.landHolding.min) {
        met.push(`Land holding ≥ ${criteria.landHolding.min} acres`);
      }
    }

    // Income check
    if (criteria.income) {
      if (criteria.income.max && farmer.annualIncome <= criteria.income.max) {
        met.push(`Annual income ≤ INR ${criteria.income.max.toLocaleString()}`);
      } else if (criteria.income.max) {
        missing.push(`Annual income must be ≤ INR ${criteria.income.max.toLocaleString()}`);
      }
    }

    // State eligibility
    if (criteria.states && !criteria.states.includes('ALL')) {
      if (criteria.states.includes(farmer.state)) {
        met.push(`Resident of eligible state (${farmer.state})`);
      } else {
        missing.push(`Scheme is only for: ${criteria.states.join(', ')}`);
      }
    } else {
      met.push('Available in all states');
    }

    // Crop eligibility
    if (criteria.crops && !criteria.crops.includes('ALL')) {
      const farmerCrops = farmer.currentCrops.map(c => c.cropName);
      const matchingCrops = farmerCrops.filter(c => criteria.crops.includes(c));
      if (matchingCrops.length > 0) {
        met.push(`Growing eligible crop: ${matchingCrops.join(', ')}`);
      } else {
        missing.push(`Must grow one of: ${criteria.crops.join(', ')}`);
      }
    }

    // Document checks
    if (criteria.hasAadhaar) {
      if (farmer.hasAadhaar) met.push('Aadhaar verified');
      else missing.push('Aadhaar verification required');
    }
    if (criteria.hasBankAccount) {
      if (farmer.hasBankAccount) met.push('Bank account linked');
      else missing.push('Bank account required');
    }
    if (criteria.hasLandRecord) {
      if (farmer.hasLandRecord) met.push('Land record uploaded');
      else missing.push('Land record/pattadar passbook required');
    }

    // Farmer type check (SMALL, MARGINAL, etc.)
    if (criteria.farmerType && !criteria.farmerType.includes('ALL')) {
      const type = this.classifyFarmerType(farmer.totalLandAcres);
      if (criteria.farmerType.includes(type)) {
        met.push(`Farmer type: ${type}`);
      } else {
        missing.push(`Only for ${criteria.farmerType.join('/')} farmers`);
      }
    }

    // Age check
    if (criteria.minAge && farmer.age < criteria.minAge) {
      missing.push(`Minimum age: ${criteria.minAge}`);
    } else if (criteria.minAge) {
      met.push(`Age ≥ ${criteria.minAge}`);
    }

    const totalCriteria = met.length + missing.length + partial.length;
    const matchScore = totalCriteria > 0 ? Math.round((met.length / totalCriteria) * 100) : 0;

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      isEligible: missing.length === 0,
      matchScore,
      metCriteria: met,
      missingCriteria: missing,
      partialCriteria: partial,
    };
  }

  private classifyFarmerType(landAcres: number): string {
    if (landAcres <= 1) return 'MARGINAL';
    if (landAcres <= 2) return 'SMALL';
    if (landAcres <= 4) return 'SEMI_MEDIUM';
    if (landAcres <= 10) return 'MEDIUM';
    return 'LARGE';
  }

  private async getFarmerProfile(farmerId: string): Promise<FarmerProfile> {
    const user = await prisma.user.findUnique({
      where: { id: farmerId },
      include: {
        farms: {
          include: {
            soilTests: { orderBy: { testDate: 'desc' }, take: 1 },
            cropRotations: {
              where: { status: { in: ['SOWN', 'GROWING'] } },
            },
          },
        },
      },
    });

    return {
      id: user.id,
      state: user.state,
      district: user.district,
      totalLandAcres: user.farms.reduce((sum, f) => sum + f.areaAcres, 0),
      annualIncome: user.annualIncome,
      age: this.calculateAge(user.dateOfBirth),
      gender: user.gender,
      hasAadhaar: !!user.aadhaarVerified,
      hasBankAccount: !!user.bankAccountId,
      hasLandRecord: user.farms.some(f => !!f.landRecordUrl),
      currentCrops: user.farms.flatMap(f => f.cropRotations),
      latestSoilTest: user.farms[0]?.soilTests[0] || null,
    };
  }
}
```

### 2. Application Pre-fill Service

```typescript
// backend/src/services/schemeApplicationService.ts

export class SchemeApplicationService {
  async startApplication(farmerId: string, schemeId: string) {
    // Check eligibility first
    const eligibility = await schemeEligibilityService.checkEligibility(farmerId);
    const schemeResult = eligibility.find(r => r.schemeId === schemeId);

    if (!schemeResult || !schemeResult.isEligible) {
      throw new AppError(
        `You may not be eligible for this scheme. Missing: ${schemeResult?.missingCriteria.join(', ')}`,
        400
      );
    }

    // Pre-fill application data from farmer profile
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farms: true },
    });

    const scheme = await prisma.governmentScheme.findUnique({
      where: { id: schemeId },
    });

    const prefilled = {
      // Personal details
      name: farmer.name,
      fatherName: farmer.fatherName,
      dateOfBirth: farmer.dateOfBirth,
      gender: farmer.gender,
      aadhaarNumber: farmer.aadhaarNumber ? this.maskAadhaar(farmer.aadhaarNumber) : null,
      phone: farmer.phone,
      
      // Address
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
      pincode: farmer.pincode,
      
      // Bank details
      bankName: farmer.bankName,
      accountNumber: farmer.accountNumber ? this.maskAccount(farmer.accountNumber) : null,
      ifscCode: farmer.ifscCode,
      
      // Land details
      totalLandAcres: farmer.farms.reduce((sum, f) => sum + f.areaAcres, 0),
      farms: farmer.farms.map(f => ({
        name: f.name,
        areaAcres: f.areaAcres,
        surveyNumber: f.surveyNumber,
        district: f.district,
      })),
      
      // Crop details
      currentCrops: farmer.farms.flatMap(f => f.cropRotations?.filter(c => c.status === 'GROWING')),
    };

    const application = await prisma.schemeApplication.create({
      data: {
        schemeId,
        farmerId,
        applicationData: prefilled,
        status: 'DRAFT',
      },
    });

    return {
      application,
      requiredDocuments: scheme.applicationDocs,
      uploadedDocuments: await this.checkExistingDocuments(farmerId, scheme.applicationDocs),
    };
  }

  async submitApplication(applicationId: string, farmerId: string) {
    const application = await prisma.schemeApplication.findUnique({
      where: { id: applicationId },
      include: { scheme: true },
    });

    if (application.farmerId !== farmerId) {
      throw new AppError('Unauthorized', 403);
    }

    // Validate all required documents are uploaded
    const requiredDocs = application.scheme.applicationDocs as string[];
    const uploadedDocs = (application.documents as any[]) || [];
    const missingDocs = requiredDocs.filter(
      doc => !uploadedDocs.find(u => u.type === doc)
    );

    if (missingDocs.length > 0) {
      throw new AppError(
        `Missing documents: ${missingDocs.join(', ')}`,
        400
      );
    }

    return prisma.schemeApplication.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }
}
```

### 3. Crop Advisory Engine

```typescript
// backend/src/services/cropAdvisoryService.ts

export class CropAdvisoryService {
  // Generate personalized advisories for a farm
  async generateAdvisories(farmId: string): Promise<CropAdvisory[]> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        cropRotations: { where: { status: { in: ['SOWN', 'GROWING'] } } },
        soilTests: { orderBy: { testDate: 'desc' }, take: 1 },
        satelliteData: { orderBy: { captureDate: 'desc' }, take: 4 },
      },
    });

    const advisories: CropAdvisory[] = [];

    for (const crop of farm.cropRotations) {
      // 1. Crop stage-based advisory
      const stageAdvisory = await this.getCropStageAdvisory(crop, farm);
      if (stageAdvisory) advisories.push(stageAdvisory);

      // 2. Soil-based advisory
      const soilAdvisory = await this.getSoilAdvisory(farm.soilTests[0], crop);
      if (soilAdvisory) advisories.push(soilAdvisory);

      // 3. Weather-based advisory
      const weatherAdvisory = await this.getWeatherAdvisory(farm, crop);
      if (weatherAdvisory) advisories.push(weatherAdvisory);

      // 4. Satellite-based advisory
      const satelliteAdvisory = await this.getSatelliteAdvisory(farm.satelliteData, crop);
      if (satelliteAdvisory) advisories.push(satelliteAdvisory);

      // 5. Disease risk advisory (based on season + region)
      const diseaseAdvisory = await this.getDiseaseRiskAdvisory(crop, farm);
      if (diseaseAdvisory) advisories.push(diseaseAdvisory);
    }

    // Store advisories
    for (const advisory of advisories) {
      await prisma.cropAdvisory.create({
        data: {
          farmId,
          targetCrop: advisory.crop,
          targetRegion: farm.district,
          advisoryType: advisory.type,
          severity: advisory.severity,
          title: advisory.title,
          body: advisory.body,
          recommendations: advisory.recommendations,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 86400000),
          source: advisory.source,
        },
      });
    }

    return advisories;
  }

  private async getCropStageAdvisory(crop: any, farm: any) {
    const calendar = await prisma.cropCalendar.findFirst({
      where: {
        cropName: crop.cropName,
        region: farm.state,
        season: crop.season,
      },
    });

    if (!calendar) return null;

    const weeksSinceSowing = crop.sowingDate
      ? Math.floor((Date.now() - new Date(crop.sowingDate).getTime()) / (7 * 86400000))
      : null;

    if (!weeksSinceSowing) return null;

    const currentStage = (calendar.stages as any[]).find(
      s => weeksSinceSowing >= s.startWeek && weeksSinceSowing <= s.endWeek
    );

    if (!currentStage) return null;

    // Get recommended inputs for this stage
    const inputSchedule = (calendar.inputSchedule as any[]).find(
      s => s.stage === currentStage.name
    );

    return {
      crop: crop.cropName,
      type: 'CROP_STAGE',
      severity: 'INFO',
      title: {
        en: `${crop.cropName}: ${currentStage.name.replace(/_/g, ' ')} stage`,
        hi: `${crop.cropName}: ${currentStage.nameHi || currentStage.name} चरण`,
      },
      body: {
        en: `Your ${crop.cropName} is in the ${currentStage.name.toLowerCase().replace(/_/g, ' ')} stage (week ${weeksSinceSowing}). ${currentStage.activities.join('. ')}`,
      },
      recommendations: inputSchedule?.inputs || [],
      source: 'CROP_CALENDAR',
    };
  }

  private async getSoilAdvisory(soilTest: any, crop: any) {
    if (!soilTest) {
      return {
        crop: crop.cropName,
        type: 'SOIL',
        severity: 'INFO',
        title: { en: 'Get a soil test', hi: 'मिट्टी परीक्षण कराएं' },
        body: {
          en: 'No recent soil test found. A soil test helps optimize fertilizer application and can save you money. Visit your nearest soil testing lab.',
        },
        recommendations: [{ action: 'Visit nearest soil testing lab' }],
        source: 'SYSTEM',
      };
    }

    const deficiencies = [];

    // Check nitrogen
    if (soilTest.nitrogen && soilTest.nitrogen < 280) {
      deficiencies.push({
        nutrient: 'Nitrogen',
        level: soilTest.nitrogen < 140 ? 'LOW' : 'MEDIUM',
        recommendation: 'Apply urea or DAP at recommended dosage',
      });
    }

    // Check phosphorus
    if (soilTest.phosphorus && soilTest.phosphorus < 25) {
      deficiencies.push({
        nutrient: 'Phosphorus',
        level: soilTest.phosphorus < 10 ? 'LOW' : 'MEDIUM',
        recommendation: 'Apply SSP or DAP',
      });
    }

    // Check potassium
    if (soilTest.potassium && soilTest.potassium < 150) {
      deficiencies.push({
        nutrient: 'Potassium',
        level: soilTest.potassium < 110 ? 'LOW' : 'MEDIUM',
        recommendation: 'Apply MOP (Muriate of Potash)',
      });
    }

    if (deficiencies.length === 0) return null;

    return {
      crop: crop.cropName,
      type: 'NUTRIENT',
      severity: deficiencies.some(d => d.level === 'LOW') ? 'WARNING' : 'INFO',
      title: {
        en: `Nutrient deficiency detected: ${deficiencies.map(d => d.nutrient).join(', ')}`,
        hi: `पोषक तत्वों की कमी: ${deficiencies.map(d => d.nutrient).join(', ')}`,
      },
      body: {
        en: deficiencies.map(d => `${d.nutrient} is ${d.level}. ${d.recommendation}`).join('. '),
      },
      recommendations: deficiencies.map(d => ({ action: d.recommendation, nutrient: d.nutrient })),
      source: 'SOIL_TEST',
    };
  }

  private async getSatelliteAdvisory(satelliteData: any[], crop: any) {
    if (!satelliteData || satelliteData.length < 2) return null;

    const latest = satelliteData[0];
    const previous = satelliteData[1];

    if (!latest.anomaly) return null;

    const ndviDrop = previous.meanValue - latest.meanValue;

    return {
      crop: crop.cropName,
      type: 'SATELLITE',
      severity: ndviDrop > 0.25 ? 'CRITICAL' : 'WARNING',
      title: {
        en: `Crop health declining — NDVI dropped ${(ndviDrop * 100).toFixed(0)}%`,
        hi: `फसल स्वास्थ्य गिर रहा है — NDVI ${(ndviDrop * 100).toFixed(0)}% कम हुआ`,
      },
      body: {
        en: `Satellite data shows vegetation health has declined from ${previous.meanValue.toFixed(2)} to ${latest.meanValue.toFixed(2)} NDVI. Possible causes: ${latest.anomalyType === 'STRESS' ? 'water stress or nutrient deficiency' : latest.anomalyType === 'PEST_DAMAGE' ? 'pest or disease damage' : 'unknown stress'}. Inspect your field and consider uploading a photo to the disease scanner.`,
      },
      recommendations: [
        { action: 'Inspect field physically' },
        { action: 'Use disease scanner to check for pests/diseases' },
        { action: 'Check irrigation system' },
      ],
      source: 'SATELLITE',
    };
  }
}
```

---

## Scheme Seed Data

```typescript
// backend/prisma/seeds/schemes-seed.ts

const SCHEMES = [
  {
    name: { en: 'PM-KISAN', hi: 'पीएम-किसान', te: 'పీఎం-కిసాన్' },
    fullName: { en: 'Pradhan Mantri Kisan Samman Nidhi' },
    ministry: 'Agriculture',
    level: 'CENTRAL',
    eligibilityCriteria: {
      farmerType: ['ALL'],
      states: ['ALL'],
      hasAadhaar: true,
      hasBankAccount: true,
      hasLandRecord: true,
    },
    benefitType: 'CASH_TRANSFER',
    benefitAmount: { amount: 6000, frequency: 'YEARLY', installments: 3 },
    applicationDocs: ['AADHAAR', 'LAND_RECORD', 'BANK_PASSBOOK'],
  },
  {
    name: { en: 'PMFBY', hi: 'पीएमएफबीवाई', te: 'పీఎంఎఫ్‌బీవై' },
    fullName: { en: 'Pradhan Mantri Fasal Bima Yojana' },
    ministry: 'Agriculture',
    level: 'CENTRAL',
    eligibilityCriteria: {
      farmerType: ['ALL'],
      states: ['ALL'],
      crops: ['RICE', 'WHEAT', 'COTTON', 'SUGARCANE', 'MAIZE', 'SOYBEAN', 'GROUNDNUT'],
      hasAadhaar: true,
      hasBankAccount: true,
    },
    benefitType: 'INSURANCE',
    applicationDocs: ['AADHAAR', 'BANK_PASSBOOK', 'LAND_RECORD', 'SOWING_CERTIFICATE'],
  },
  {
    name: { en: 'KCC', hi: 'केसीसी', te: 'కేసీసీ' },
    fullName: { en: 'Kisan Credit Card' },
    ministry: 'Finance',
    level: 'CENTRAL',
    eligibilityCriteria: {
      farmerType: ['ALL'],
      states: ['ALL'],
      hasAadhaar: true,
      hasBankAccount: true,
      hasLandRecord: true,
      minAge: 18,
      maxAge: 75,
    },
    benefitType: 'LOAN',
    benefitAmount: { maxAmount: 300000, interestRate: 4 },
    applicationDocs: ['AADHAAR', 'LAND_RECORD', 'BANK_PASSBOOK', 'PASSPORT_PHOTO', 'INCOME_CERT'],
  },
  // ... 17+ more schemes
];
```

---

## Testing Checklist

### Scheme Eligibility Engine
- [ ] Small farmer (2 acres, income <2L) → eligible for PM-KISAN, PMFBY, KCC, NFSM
- [ ] Large farmer (15 acres, income >5L) → NOT eligible for PM-KISAN, eligible for KCC
- [ ] Farmer without Aadhaar → missing criteria clearly shown for Aadhaar-required schemes
- [ ] Farmer without land record → missing criteria shown for land-record schemes
- [ ] State-specific scheme → only shown to farmers in that state
- [ ] Crop-specific scheme → only shown to farmers growing those crops
- [ ] Eligibility check results are stored for history/audit
- [ ] Match score correctly reflects percentage of criteria met

### Application Process
- [ ] Start application → form pre-filled with farmer profile data
- [ ] Missing fields highlighted for manual entry
- [ ] Aadhaar and bank account numbers are masked in pre-fill
- [ ] Upload required documents → tracked per document type
- [ ] Submit with missing documents → 400 error listing missing docs
- [ ] Submit complete application → status changes to SUBMITTED
- [ ] Government officer can view and process application
- [ ] Farmer can track application status

### Crop Advisory Engine
- [ ] Farm with growing rice → receives rice-specific stage advisory
- [ ] Farm with low-nitrogen soil test → receives nutrient deficiency warning
- [ ] Farm with NDVI anomaly → receives satellite-based critical alert
- [ ] Farm with rain forecast + outdoor crop stage → weather advisory generated
- [ ] Advisory links to disease scanner when relevant
- [ ] Advisory recommendations include specific product names
- [ ] Advisories available in multiple languages

### Crop Calendar
- [ ] Regional crop calendar for rice in AP → correct stage dates
- [ ] Current stage detection based on sowing date → correct stage returned
- [ ] Input schedule for current stage → relevant inputs listed

---

## Files to Create/Modify

### New Files
```
backend/src/services/schemeEligibilityService.ts     # Rule engine for eligibility
backend/src/services/schemeApplicationService.ts     # Application pre-fill + submit
backend/src/services/cropAdvisoryService.ts          # Advisory generation engine
backend/src/routes/schemeEligibility.ts              # Eligibility check endpoints
backend/src/routes/schemeApplications.ts             # Application CRUD endpoints
backend/src/routes/advisory.ts                       # Advisory endpoints
backend/src/cron/advisoryGeneration.ts               # Daily advisory generation cron
backend/prisma/seeds/schemes-seed.ts                 # 20+ government schemes
backend/prisma/seeds/crop-calendars-seed.ts          # Regional crop calendars
mobile/src/screens/schemes/SchemeListScreen.tsx       # Browse schemes
mobile/src/screens/schemes/SchemeDetailScreen.tsx     # Scheme detail + eligibility
mobile/src/screens/schemes/ApplyScreen.tsx            # Application form
mobile/src/screens/schemes/MyApplicationsScreen.tsx   # Track applications
mobile/src/screens/advisory/AdvisoryListScreen.tsx    # Farm advisories
mobile/src/screens/advisory/CropCalendarScreen.tsx    # Crop calendar view
web/src/app/schemes/page.tsx                         # Scheme browser
web/src/app/schemes/[id]/page.tsx                    # Scheme detail + apply
web/src/app/schemes/applications/page.tsx            # My applications
web/src/app/advisory/page.tsx                        # Advisory dashboard
web/src/components/schemes/EligibilityBadge.tsx      # Eligible/Not eligible indicator
web/src/components/schemes/ApplicationForm.tsx       # Pre-filled application form
web/src/components/advisory/CropStageTimeline.tsx    # Visual crop stage timeline
```

### Modified Files
```
backend/prisma/schema.prisma                         # Add scheme + advisory models
backend/src/routes/schemes.ts                        # Replace stub with real implementation
backend/src/index.ts                                 # Mount new routes
mobile/src/navigation/AppNavigator.tsx               # Add scheme + advisory screens
web/src/app/layout.tsx                               # Add nav items
```

---

## Definition of Done

- [ ] Eligibility engine correctly matches farmer profiles against 20+ scheme criteria
- [ ] One-click application pre-fills all available farmer data
- [ ] Application status tracking from DRAFT to DISBURSED
- [ ] Government officers can process applications within their jurisdiction
- [ ] Crop advisory engine generates personalized recommendations from soil + weather + satellite + crop stage
- [ ] Regional crop calendars loaded for major crops in major states
- [ ] Advisory recommendations link to marketplace products where applicable
- [ ] All content available in at least en, hi, te languages
