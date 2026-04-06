import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryDef {
  slug: string;
  name: { en: string; te: string; hi: string };
  icon: string;
  bookingType: 'SLOT' | 'DAY' | 'MULTI_DAY' | 'ON_DEMAND';
  defaultUnit: 'PER_HOUR' | 'PER_DAY' | 'PER_ACRE' | 'PER_UNIT' | 'PER_KG' | 'PER_QUINTAL' | 'PER_TRIP' | 'PER_WORKER_DAY' | 'FIXED';
  requiresLicense?: boolean;
  children?: Omit<CategoryDef, 'children'>[];
}

const CATEGORIES: CategoryDef[] = [
  {
    slug: 'machinery', icon: '🚜',
    name: { en: 'Machinery Rental', te: 'యంత్రాల అద్దె', hi: 'मशीनरी किराया' },
    bookingType: 'DAY', defaultUnit: 'PER_DAY',
    children: [
      { slug: 'tractor', name: { en: 'Tractor', te: 'ట్రాక్టర్', hi: 'ट्रैक्टर' }, icon: '🚜', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'harvester', name: { en: 'Combine Harvester', te: 'కంబైన్ హార్వెస్టర్', hi: 'कंबाइन हार्वेस्टर' }, icon: '🌾', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'rotavator', name: { en: 'Rotavator', te: 'రోటవేటర్', hi: 'रोटावेटर' }, icon: '⚙️', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'seed-drill', name: { en: 'Seed Drill', te: 'విత్తన డ్రిల్', hi: 'सीड ड्रिल' }, icon: '🌱', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'thresher', name: { en: 'Thresher', te: 'నూర్పిడి యంత్రం', hi: 'थ्रेशर' }, icon: '🔄', bookingType: 'DAY', defaultUnit: 'PER_DAY' },
      { slug: 'transplanter', name: { en: 'Transplanter', te: 'ట్రాన్స్‌ప్లాంటర్', hi: 'ट्रांसप्लांटर' }, icon: '🌿', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'laser-leveler', name: { en: 'Laser Leveler', te: 'లేజర్ లెవెలర్', hi: 'लेज़र लेवलर' }, icon: '📐', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'plough', name: { en: 'Plough', te: 'నాగలి', hi: 'हल' }, icon: '🔧', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
      { slug: 'cultivator', name: { en: 'Cultivator', te: 'కల్టివేటర్', hi: 'कल्टीवेटर' }, icon: '🔩', bookingType: 'DAY', defaultUnit: 'PER_ACRE' },
    ],
  },
  {
    slug: 'drone-services', icon: '🛸',
    name: { en: 'Drone Services', te: 'డ్రోన్ సేవలు', hi: 'ड्रोन सेवाएं' },
    bookingType: 'SLOT', defaultUnit: 'PER_ACRE', requiresLicense: true,
    children: [
      { slug: 'drone-spraying', name: { en: 'Crop Spraying', te: 'పంట పిచికారీ', hi: 'फसल छिड़काव' }, icon: '💨', bookingType: 'SLOT', defaultUnit: 'PER_ACRE', requiresLicense: true },
      { slug: 'drone-survey', name: { en: 'Aerial Survey', te: 'వైమానిక సర్వే', hi: 'हवाई सर्वेक्षण' }, icon: '📷', bookingType: 'SLOT', defaultUnit: 'PER_ACRE', requiresLicense: true },
      { slug: 'drone-ndvi', name: { en: 'NDVI Mapping', te: 'NDVI మ్యాపింగ్', hi: 'NDVI मैपिंग' }, icon: '🗺️', bookingType: 'SLOT', defaultUnit: 'PER_ACRE', requiresLicense: true },
      { slug: 'drone-seeding', name: { en: 'Drone Seeding', te: 'డ్రోన్ విత్తనం', hi: 'ड्रोन बीजारोपण' }, icon: '🌱', bookingType: 'SLOT', defaultUnit: 'PER_ACRE', requiresLicense: true },
    ],
  },
  {
    slug: 'transport', icon: '🚛',
    name: { en: 'Transport & Logistics', te: 'రవాణా', hi: 'परिवहन' },
    bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP',
    children: [
      { slug: 'mini-truck', name: { en: 'Mini Truck (1-2 ton)', te: 'మినీ ట్రక్', hi: 'मिनी ट्रक' }, icon: '🚚', bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP' },
      { slug: 'medium-truck', name: { en: 'Medium Truck (5-10 ton)', te: 'మీడియం ట్రక్', hi: 'मीडियम ट्रक' }, icon: '🚛', bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP' },
      { slug: 'tractor-trolley', name: { en: 'Tractor Trolley', te: 'ట్రాక్టర్ ట్రాలీ', hi: 'ट्रैक्टर ट्रॉली' }, icon: '🚜', bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP' },
      { slug: 'cold-chain', name: { en: 'Cold Chain Vehicle', te: 'కోల్డ్ చెయిన్', hi: 'कोल्ड चेन' }, icon: '❄️', bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP' },
      { slug: 'water-tanker', name: { en: 'Water Tanker', te: 'నీటి ట్యాంకర్', hi: 'पानी टैंकर' }, icon: '💧', bookingType: 'ON_DEMAND', defaultUnit: 'PER_TRIP' },
    ],
  },
  {
    slug: 'farm-labor', icon: '👷',
    name: { en: 'Farm Labor', te: 'వ్యవసాయ కూలీలు', hi: 'खेत मजदूर' },
    bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY',
    children: [
      { slug: 'labor-general', name: { en: 'General Labor', te: 'సాధారణ కూలీలు', hi: 'सामान्य मजदूर' }, icon: '👤', bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY' },
      { slug: 'labor-harvesting', name: { en: 'Harvesting', te: 'కోత', hi: 'कटाई' }, icon: '🌾', bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY' },
      { slug: 'labor-transplanting', name: { en: 'Transplanting', te: 'నాట్లు', hi: 'रोपाई' }, icon: '🌿', bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY' },
      { slug: 'labor-weeding', name: { en: 'Weeding', te: 'కలుపు తీయడం', hi: 'निराई' }, icon: '🌱', bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY' },
      { slug: 'labor-spraying', name: { en: 'Spraying', te: 'పిచికారీ', hi: 'छिड़काव' }, icon: '💨', bookingType: 'SLOT', defaultUnit: 'PER_WORKER_DAY' },
    ],
  },
  {
    slug: 'agri-inputs', icon: '🧪',
    name: { en: 'Agri Inputs', te: 'వ్యవసాయ ఉత్పాదకాలు', hi: 'कृषि इनपुट' },
    bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT',
    children: [
      { slug: 'pesticides', name: { en: 'Pesticides & Chemicals', te: 'పురుగు మందులు', hi: 'कीटनाशक' }, icon: '🧪', bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT', requiresLicense: true },
      { slug: 'fertilizers', name: { en: 'Fertilizers', te: 'ఎరువులు', hi: 'उर्वरक' }, icon: '🌿', bookingType: 'ON_DEMAND', defaultUnit: 'PER_KG' },
      { slug: 'seeds', name: { en: 'Seeds & Saplings', te: 'విత్తనాలు', hi: 'बीज' }, icon: '🌱', bookingType: 'ON_DEMAND', defaultUnit: 'PER_KG' },
      { slug: 'organic-inputs', name: { en: 'Organic Inputs', te: 'సేంద్రీయ ఉత్పాదకాలు', hi: 'जैविक इनपुट' }, icon: '♻️', bookingType: 'ON_DEMAND', defaultUnit: 'PER_KG' },
      { slug: 'irrigation-supplies', name: { en: 'Irrigation Supplies', te: 'సాగునీటి సామాగ్రి', hi: 'सिंचाई सामग्री' }, icon: '💧', bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT' },
    ],
  },
  {
    slug: 'livestock', icon: '🐄',
    name: { en: 'Livestock & Poultry', te: 'పశువులు & కోళ్ళు', hi: 'पशुधन' },
    bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT',
    children: [
      { slug: 'dairy-cattle', name: { en: 'Dairy Cattle', te: 'పాడి ఆవులు', hi: 'दुधारू गाय' }, icon: '🐄', bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT' },
      { slug: 'goats', name: { en: 'Goats', te: 'మేకలు', hi: 'बकरी' }, icon: '🐐', bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT' },
      { slug: 'poultry', name: { en: 'Poultry', te: 'కోళ్ళు', hi: 'मुर्गी पालन' }, icon: '🐔', bookingType: 'ON_DEMAND', defaultUnit: 'PER_UNIT' },
      { slug: 'cattle-feed', name: { en: 'Cattle Feed & Silage', te: 'పశువుల మేత', hi: 'पशु आहार' }, icon: '🌾', bookingType: 'ON_DEMAND', defaultUnit: 'PER_QUINTAL' },
      { slug: 'veterinary', name: { en: 'Veterinary Services', te: 'పశువైద్య సేవలు', hi: 'पशु चिकित्सा' }, icon: '💉', bookingType: 'SLOT', defaultUnit: 'FIXED', requiresLicense: true },
    ],
  },
  {
    slug: 'professional-services', icon: '👨‍💼',
    name: { en: 'Professional Services', te: 'వృత్తిపరమైన సేవలు', hi: 'पेशेवर सेवाएं' },
    bookingType: 'SLOT', defaultUnit: 'FIXED',
    children: [
      { slug: 'soil-testing', name: { en: 'Soil Testing', te: 'నేల పరీక్ష', hi: 'मिट्टी परीक्षण' }, icon: '🔬', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'crop-advisory', name: { en: 'Crop Advisory', te: 'పంట సలహా', hi: 'फसल सलाह' }, icon: '📋', bookingType: 'SLOT', defaultUnit: 'PER_HOUR' },
      { slug: 'insurance-help', name: { en: 'Insurance (PMFBY)', te: 'బీమా సహాయం', hi: 'बीमा सहायता' }, icon: '🛡️', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'loan-help', name: { en: 'KCC Loan Help', te: 'KCC రుణ సహాయం', hi: 'KCC ऋण सहायता' }, icon: '🏦', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'scheme-filing', name: { en: 'Govt Scheme Filing', te: 'ప్రభుత్వ పథకాలు', hi: 'सरकारी योजना' }, icon: '📄', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
    ],
  },
  {
    slug: 'post-harvest', icon: '📦',
    name: { en: 'Post-Harvest Services', te: 'పంట అనంతర సేవలు', hi: 'फसल कटाई बाद सेवाएं' },
    bookingType: 'ON_DEMAND', defaultUnit: 'PER_QUINTAL',
    children: [
      { slug: 'sorting-grading', name: { en: 'Sorting & Grading', te: 'వర్గీకరణ', hi: 'छंटाई एवं ग्रेडिंग' }, icon: '✅', bookingType: 'ON_DEMAND', defaultUnit: 'PER_QUINTAL' },
      { slug: 'packaging', name: { en: 'Packaging', te: 'ప్యాకేజింగ్', hi: 'पैकेजिंग' }, icon: '📦', bookingType: 'ON_DEMAND', defaultUnit: 'PER_QUINTAL' },
      { slug: 'cold-storage', name: { en: 'Cold Storage', te: 'కోల్డ్ స్టోరేజ్', hi: 'शीत भंडारण' }, icon: '❄️', bookingType: 'DAY', defaultUnit: 'PER_DAY' },
      { slug: 'warehousing', name: { en: 'Warehousing', te: 'గోదాము', hi: 'भंडारण' }, icon: '🏭', bookingType: 'DAY', defaultUnit: 'PER_DAY' },
      { slug: 'milling', name: { en: 'Milling & Grinding', te: 'మిల్లింగ్', hi: 'मिलिंग' }, icon: '⚙️', bookingType: 'ON_DEMAND', defaultUnit: 'PER_QUINTAL' },
    ],
  },
  {
    slug: 'farm-infrastructure', icon: '🏗️',
    name: { en: 'Farm Infrastructure', te: 'వ్యవసాయ మౌలిక సదుపాయాలు', hi: 'कृषि अवसंरचना' },
    bookingType: 'ON_DEMAND', defaultUnit: 'FIXED',
    children: [
      { slug: 'polyhouse', name: { en: 'Polyhouse Setup', te: 'పాలీహౌస్', hi: 'पॉलीहाउस' }, icon: '🏠', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'fencing', name: { en: 'Fencing', te: 'కంచె', hi: 'बाड़ लगाना' }, icon: '🔒', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'solar-pump', name: { en: 'Solar Pump Installation', te: 'సోలార్ పంపు', hi: 'सोलर पंप' }, icon: '☀️', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'borewell', name: { en: 'Borewell Drilling', te: 'బోర్‌వెల్', hi: 'बोरवेल' }, icon: '💧', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
      { slug: 'farm-shed', name: { en: 'Farm Shed Building', te: 'పొలం షెడ్', hi: 'खेत शेड' }, icon: '🏗️', bookingType: 'ON_DEMAND', defaultUnit: 'FIXED' },
    ],
  },
];

async function seedCategories() {
  console.log('Seeding service categories...');
  let count = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const parent = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, bookingType: cat.bookingType, defaultUnit: cat.defaultUnit, requiresLicense: cat.requiresLicense ?? false, sortOrder: i },
      create: { slug: cat.slug, name: cat.name, icon: cat.icon, bookingType: cat.bookingType, defaultUnit: cat.defaultUnit, requiresLicense: cat.requiresLicense ?? false, sortOrder: i },
    });
    count++;

    if (cat.children) {
      for (let j = 0; j < cat.children.length; j++) {
        const child = cat.children[j];
        await prisma.serviceCategory.upsert({
          where: { slug: child.slug },
          update: { name: child.name, icon: child.icon, parentId: parent.id, bookingType: child.bookingType, defaultUnit: child.defaultUnit, requiresLicense: child.requiresLicense ?? false, sortOrder: j },
          create: { slug: child.slug, name: child.name, icon: child.icon, parentId: parent.id, bookingType: child.bookingType, defaultUnit: child.defaultUnit, requiresLicense: child.requiresLicense ?? false, sortOrder: j },
        });
        count++;
      }
    }
  }

  console.log(`  ${count} categories seeded (9 top-level + ${count - 9} sub-categories).`);
}

seedCategories()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Category seed failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });
