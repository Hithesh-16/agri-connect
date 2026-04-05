import { PrismaClient } from '@prisma/client';
import { CALENDAR_TEMPLATES } from '../src/data/calendarTemplates';
import { INVENTORY_CATEGORIES } from '../src/data/inventoryData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- Crops ---
  const crops = [
    { id: 'wheat', name: 'Wheat', category: 'cereal' as const, icon: 'grain', color: '#D97706', unit: 'quintal' },
    { id: 'rice', name: 'Rice', category: 'cereal' as const, icon: 'sack', color: '#A16207', unit: 'quintal' },
    { id: 'maize', name: 'Maize', category: 'cereal' as const, icon: 'corn', color: '#CA8A04', unit: 'quintal' },
    { id: 'cotton', name: 'Cotton', category: 'cash' as const, icon: 'flower', color: '#9CA3AF', unit: 'quintal' },
    { id: 'soybean', name: 'Soybean', category: 'pulse' as const, icon: 'circle-slice-8', color: '#65A30D', unit: 'quintal' },
    { id: 'chili', name: 'Chili', category: 'spice' as const, icon: 'chili-hot', color: '#DC2626', unit: 'quintal' },
    { id: 'tomato', name: 'Tomato', category: 'vegetable' as const, icon: 'fruit-cherries', color: '#EF4444', unit: 'quintal' },
    { id: 'onion', name: 'Onion', category: 'vegetable' as const, icon: 'circle-multiple', color: '#7C3AED', unit: 'quintal' },
    { id: 'potato', name: 'Potato', category: 'vegetable' as const, icon: 'oval-outline', color: '#92400E', unit: 'quintal' },
    { id: 'sorghum', name: 'Sorghum', category: 'cereal' as const, icon: 'barley', color: '#B45309', unit: 'quintal' },
    { id: 'chickpea', name: 'Chickpea', category: 'pulse' as const, icon: 'seed', color: '#D97706', unit: 'quintal' },
    { id: 'lentil', name: 'Lentil', category: 'pulse' as const, icon: 'seed-outline', color: '#A16207', unit: 'quintal' },
    { id: 'groundnut', name: 'Groundnut', category: 'cash' as const, icon: 'seed-circle', color: '#C2410C', unit: 'quintal' },
    { id: 'turmeric', name: 'Turmeric', category: 'spice' as const, icon: 'flower-outline', color: '#F59E0B', unit: 'quintal' },
    { id: 'coriander', name: 'Coriander', category: 'spice' as const, icon: 'leaf', color: '#16A34A', unit: 'quintal' },
    { id: 'millet', name: 'Millet', category: 'cereal' as const, icon: 'barley', color: '#B45309', unit: 'quintal' },
    { id: 'sunflower', name: 'Sunflower', category: 'cash' as const, icon: 'white-balance-sunny', color: '#F59E0B', unit: 'quintal' },
    { id: 'sugarcane', name: 'Sugarcane', category: 'cash' as const, icon: 'grass', color: '#15803D', unit: 'tonne' },
    { id: 'cauliflower', name: 'Cauliflower', category: 'vegetable' as const, icon: 'dots-hexagon', color: '#F5F5DC', unit: 'quintal' },
    { id: 'brinjal', name: 'Brinjal', category: 'vegetable' as const, icon: 'circle', color: '#6D28D9', unit: 'quintal' },
  ];

  for (const crop of crops) {
    await prisma.crop.upsert({
      where: { id: crop.id },
      update: crop,
      create: crop,
    });
  }
  console.log(`Seeded ${crops.length} crops.`);

  // --- Mandis ---
  const mandis = [
    { id: 'm1', name: 'Warangal APMC', district: 'Warangal', state: 'Telangana', distanceKm: 12, latitude: 17.977, longitude: 79.601, activeCrops: 18, volume: '2,400 tonnes' },
    { id: 'm2', name: 'Nizamabad Market', district: 'Nizamabad', state: 'Telangana', distanceKm: 45, latitude: 18.672, longitude: 78.094, activeCrops: 14, volume: '1,800 tonnes' },
    { id: 'm3', name: 'Karimnagar Mandi', district: 'Karimnagar', state: 'Telangana', distanceKm: 65, latitude: 18.438, longitude: 79.128, activeCrops: 12, volume: '900 tonnes' },
    { id: 'm4', name: 'Nalgonda APMC', district: 'Nalgonda', state: 'Telangana', distanceKm: 82, latitude: 17.052, longitude: 79.266, activeCrops: 10, volume: '650 tonnes' },
    { id: 'm5', name: 'Khammam Market', district: 'Khammam', state: 'Telangana', distanceKm: 98, latitude: 17.247, longitude: 80.151, activeCrops: 15, volume: '1,200 tonnes' },
    { id: 'm6', name: 'Suryapet Mandi', district: 'Suryapet', state: 'Telangana', distanceKm: 115, latitude: 17.139, longitude: 79.622, activeCrops: 8, volume: '500 tonnes' },
    { id: 'm7', name: 'Adilabad APMC', district: 'Adilabad', state: 'Telangana', distanceKm: 145, latitude: 19.664, longitude: 78.532, activeCrops: 11, volume: '750 tonnes' },
    { id: 'm8', name: 'Mahbubnagar Market', district: 'Mahbubnagar', state: 'Telangana', distanceKm: 160, latitude: 16.738, longitude: 77.987, activeCrops: 13, volume: '980 tonnes' },
    { id: 'm9', name: 'Medak Mandi', district: 'Medak', state: 'Telangana', distanceKm: 178, latitude: 17.997, longitude: 78.268, activeCrops: 9, volume: '420 tonnes' },
    { id: 'm10', name: 'Hyderabad Central', district: 'Hyderabad', state: 'Telangana', distanceKm: 190, latitude: 17.385, longitude: 78.487, activeCrops: 25, volume: '5,500 tonnes' },
  ];

  for (const mandi of mandis) {
    await prisma.mandi.upsert({
      where: { id: mandi.id },
      update: mandi,
      create: mandi,
    });
  }
  console.log(`Seeded ${mandis.length} mandis.`);

  // --- Prices ---
  const prices = [
    { cropId: 'wheat', mandiId: 'm1', minPrice: 2100, maxPrice: 2350, modalPrice: 2250, farmGatePrice: 1950, dealerPrice: 2100, retailPrice: 2600, dealerMargin: 7.7, change: 45, changePercent: 2.04, volume: '420 qtl' },
    { cropId: 'rice', mandiId: 'm1', minPrice: 3200, maxPrice: 3800, modalPrice: 3500, farmGatePrice: 3100, dealerPrice: 3350, retailPrice: 4200, dealerMargin: 8.1, change: -80, changePercent: -2.23, volume: '850 qtl' },
    { cropId: 'cotton', mandiId: 'm1', minPrice: 6200, maxPrice: 6800, modalPrice: 6500, farmGatePrice: 6000, dealerPrice: 6350, retailPrice: 7200, dealerMargin: 5.5, change: 120, changePercent: 1.88, volume: '310 qtl' },
    { cropId: 'chili', mandiId: 'm2', minPrice: 9500, maxPrice: 11200, modalPrice: 10400, farmGatePrice: 9200, dealerPrice: 9800, retailPrice: 12500, dealerMargin: 6.1, change: 350, changePercent: 3.49, volume: '180 qtl' },
    { cropId: 'maize', mandiId: 'm1', minPrice: 1750, maxPrice: 1900, modalPrice: 1820, farmGatePrice: 1600, dealerPrice: 1720, retailPrice: 2100, dealerMargin: 7.5, change: -20, changePercent: -1.09, volume: '560 qtl' },
    { cropId: 'soybean', mandiId: 'm2', minPrice: 4100, maxPrice: 4450, modalPrice: 4280, farmGatePrice: 3900, dealerPrice: 4150, retailPrice: 5000, dealerMargin: 6.4, change: 60, changePercent: 1.42, volume: '290 qtl' },
    { cropId: 'onion', mandiId: 'm3', minPrice: 1800, maxPrice: 2200, modalPrice: 1950, farmGatePrice: 1500, dealerPrice: 1750, retailPrice: 2800, dealerMargin: 14.3, change: -150, changePercent: -7.14, volume: '1200 qtl' },
    { cropId: 'tomato', mandiId: 'm1', minPrice: 600, maxPrice: 1400, modalPrice: 950, farmGatePrice: 500, dealerPrice: 750, retailPrice: 1800, dealerMargin: 50, change: 200, changePercent: 26.67, volume: '780 qtl' },
    { cropId: 'chickpea', mandiId: 'm4', minPrice: 4800, maxPrice: 5200, modalPrice: 5000, farmGatePrice: 4500, dealerPrice: 4800, retailPrice: 5800, dealerMargin: 6.7, change: 80, changePercent: 1.63, volume: '150 qtl' },
    { cropId: 'groundnut', mandiId: 'm2', minPrice: 5200, maxPrice: 5800, modalPrice: 5500, farmGatePrice: 4900, dealerPrice: 5300, retailPrice: 6500, dealerMargin: 8.2, change: -100, changePercent: -1.79, volume: '220 qtl' },
    { cropId: 'turmeric', mandiId: 'm3', minPrice: 7800, maxPrice: 9200, modalPrice: 8500, farmGatePrice: 7200, dealerPrice: 8000, retailPrice: 10500, dealerMargin: 11.1, change: 450, changePercent: 5.59, volume: '95 qtl' },
    { cropId: 'potato', mandiId: 'm5', minPrice: 900, maxPrice: 1200, modalPrice: 1050, farmGatePrice: 750, dealerPrice: 950, retailPrice: 1500, dealerMargin: 26.7, change: 30, changePercent: 2.94, volume: '900 qtl' },
  ];

  // Delete existing prices and recreate
  await prisma.price.deleteMany();
  for (const price of prices) {
    await prisma.price.create({ data: price });
  }
  console.log(`Seeded ${prices.length} prices.`);

  // --- News ---
  const news = [
    { id: 'n1', title: 'Government raises MSP for Kharif crops by 5-7%', summary: 'The Cabinet Committee on Economic Affairs (CCEA) has approved an increase of 5-7% in Minimum Support Prices for all Kharif crops for the 2026-27 season, benefiting millions of farmers across the country.', category: 'policy' as const, date: 'Mar 11, 2026', readTime: '3 min' },
    { id: 'n2', title: 'Cotton prices surge as exports to China rise', summary: 'Indian cotton prices have seen a significant surge of 8-10% over the past month as export demand from China increases due to supply shortages in other producing nations.', category: 'market' as const, date: 'Mar 10, 2026', readTime: '2 min' },
    { id: 'n3', title: 'Pre-monsoon showers expected in Telangana by March 20', summary: 'IMD forecasts pre-monsoon showers across Telangana starting March 20, which could benefit rabi crops in their final stages and help prepare land for the upcoming Kharif season.', category: 'weather' as const, date: 'Mar 9, 2026', readTime: '2 min' },
    { id: 'n4', title: 'eNAM integration now live in 1,361 mandis nationwide', summary: 'The electronic National Agriculture Market (eNAM) platform has reached a milestone with 1,361 mandis now integrated, allowing farmers to sell produce transparently across state borders.', category: 'policy' as const, date: 'Mar 8, 2026', readTime: '4 min' },
    { id: 'n5', title: 'Chili prices hit 3-year high on short supply', summary: 'Chili prices in Telangana and Andhra Pradesh have touched a 3-year high due to reduced acreage and crop damage from unseasonal rains, with prices crossing Rs 10,000 per quintal.', category: 'market' as const, date: 'Mar 7, 2026', readTime: '3 min' },
    { id: 'n6', title: 'Use drip irrigation to save 50% water — advisory', summary: 'The State Agriculture Department advises farmers to adopt drip irrigation systems which can save up to 50% water while improving crop yields by 20-30%. Subsidies of up to 90% available under PMKSY.', category: 'advisory' as const, date: 'Mar 6, 2026', readTime: '2 min' },
  ];

  for (const item of news) {
    await prisma.news.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${news.length} news items.`);

  // --- Disease Results ---
  await prisma.diseaseResult.deleteMany();
  const diseaseResults = [
    {
      cropName: 'Cotton',
      diseaseName: 'Cotton Leaf Curl Disease',
      confidence: 0.91,
      severity: 'Moderate',
      affectedArea: 35,
      weatherNote: 'High humidity and warm temperatures favor whitefly populations that spread this virus.',
      treatments: {
        organic: 'Apply neem oil spray (5ml/L) every 7 days. Use yellow sticky traps to monitor and reduce whitefly populations. Introduce natural predators like Encarsia formosa.',
        chemical: 'Spray imidacloprid 17.8% SL @ 0.5ml/L or thiamethoxam 25% WG @ 0.5g/L at 15-day intervals. Rotate between different chemical groups to prevent resistance.',
        preventive: 'Use Bt cotton varieties resistant to CLCuD. Maintain field hygiene by removing infected plants. Avoid late sowing. Use reflective mulches to repel whiteflies.',
      },
      nearbyAdvisory: 'Cotton Leaf Curl Disease has been reported in 3 nearby mandis. Early intervention recommended.',
    },
    {
      cropName: 'Tomato',
      diseaseName: 'Tomato Early Blight',
      confidence: 0.87,
      severity: 'Mild',
      affectedArea: 15,
      weatherNote: 'Warm days (24-29C) with cool nights and morning dew create ideal conditions for Alternaria solani.',
      treatments: {
        organic: 'Apply Trichoderma viride (5g/L) as foliar spray. Use compost tea to boost plant immunity. Mulch around plants to prevent soil splash.',
        chemical: 'Spray mancozeb 75% WP @ 2.5g/L or chlorothalonil 75% WP @ 2g/L. For severe cases, use azoxystrobin 23% SC @ 1ml/L. Apply at 10-14 day intervals.',
        preventive: 'Ensure proper spacing (60x45cm) for air circulation. Remove lower leaves touching soil. Practice 3-year crop rotation. Use disease-free transplants. Stake plants to keep foliage off ground.',
      },
      nearbyAdvisory: 'Early Blight conditions are favorable in the region. Monitor crops closely, especially after recent rains.',
    },
  ];

  for (const result of diseaseResults) {
    await prisma.diseaseResult.create({ data: result });
  }
  console.log(`Seeded ${diseaseResults.length} disease results.`);

  // --- Price History ---
  await prisma.priceHistory.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Deterministic seed-based random for reproducibility
  function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  let seedCounter = 42;
  function nextRandom(): number {
    seedCounter++;
    return seededRandom(seedCounter);
  }

  const priceHistoryRecords: Array<{
    cropId: string;
    mandiId: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    farmGatePrice: number;
    dealerPrice: number;
    retailPrice: number;
    change: number;
    changePercent: number;
    volume: string;
    source: string;
    date: Date;
  }> = [];

  for (const price of prices) {
    let prevModal = price.modalPrice;

    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      // Random daily variation between -3% and +3%
      const variation = (nextRandom() * 6 - 3) / 100; // -0.03 to +0.03
      const dayModal = Math.round(price.modalPrice * (1 + variation));

      // Maintain price tier ratios from the seed price
      const farmGateRatio = price.farmGatePrice / price.modalPrice;
      const dealerRatio = price.dealerPrice / price.modalPrice;
      const retailRatio = price.retailPrice / price.modalPrice;
      const minRatio = price.minPrice / price.modalPrice;
      const maxRatio = price.maxPrice / price.modalPrice;

      const dayFarmGate = Math.round(dayModal * farmGateRatio);
      const dayDealer = Math.round(dayModal * dealerRatio);
      const dayRetail = Math.round(dayModal * retailRatio);
      const dayMin = Math.round(dayModal * minRatio);
      const dayMax = Math.round(dayModal * maxRatio);

      const change = dayModal - prevModal;
      const changePercent = prevModal !== 0 ? parseFloat(((change / prevModal) * 100).toFixed(2)) : 0;

      priceHistoryRecords.push({
        cropId: price.cropId,
        mandiId: price.mandiId,
        minPrice: dayMin,
        maxPrice: dayMax,
        modalPrice: dayModal,
        farmGatePrice: dayFarmGate,
        dealerPrice: dayDealer,
        retailPrice: dayRetail,
        change,
        changePercent,
        volume: price.volume,
        source: 'seed',
        date,
      });

      prevModal = dayModal;
    }
  }

  // Batch insert for performance
  await prisma.priceHistory.createMany({ data: priceHistoryRecords });
  console.log(`Seeded ${priceHistoryRecords.length} price history records (${prices.length} crops x 31 days).`);

  // --- Crop Calendar Templates ---
  // Delete existing calendar entries and recreate
  await prisma.cropCalendar.deleteMany();

  let calendarCount = 0;
  for (const [cropId, templates] of Object.entries(CALENDAR_TEMPLATES)) {
    // Verify crop exists before creating calendar
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      console.warn(`Skipping calendar for unknown crop: ${cropId}`);
      continue;
    }

    for (const template of templates) {
      await prisma.cropCalendar.create({
        data: {
          cropId,
          region: template.region,
          activities: template.activities as any,
        },
      });
      calendarCount++;
    }
  }
  console.log(`Seeded ${calendarCount} crop calendar templates.`);

  // --- Inventory Categories & Items ---
  // Delete existing items first (due to FK), then categories
  await prisma.inventoryItem.deleteMany();
  await prisma.inventoryCategory.deleteMany();

  let totalItems = 0;
  for (const cat of INVENTORY_CATEGORIES) {
    await prisma.inventoryCategory.create({
      data: {
        id: cat.id,
        names: cat.names,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });

    if (cat.items.length > 0) {
      const itemData = cat.items.map((item, idx) => ({
        id: item.id,
        categoryId: cat.id,
        names: item.names,
        descriptions: item.descriptions || undefined,
        defaultUnit: item.defaultUnit,
        unitLabels: item.unitLabels,
        transactionTypes: item.transactionTypes,
        tags: item.tags || [],
        brand: item.brand || null,
        isActive: true,
        sortOrder: idx,
      }));

      await prisma.inventoryItem.createMany({ data: itemData });
      totalItems += itemData.length;
    }
  }
  console.log(`Seeded ${INVENTORY_CATEGORIES.length} inventory categories and ${totalItems} inventory items.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
