import { prisma } from '../config';

export class PriceService {
  static async getAllPrices(filters: {
    cropId?: string;
    mandiId?: string;
    type?: string;
    search?: string;
    myCrops?: boolean;
    userId?: string;
    page: number;
    limit: number;
    skip: number;
  }) {
    const where: any = {};

    if (filters.cropId) {
      where.cropId = filters.cropId;
    }

    if (filters.mandiId) {
      where.mandiId = filters.mandiId;
    }

    if (filters.search) {
      where.crop = {
        name: { contains: filters.search, mode: 'insensitive' },
      };
    }

    if (filters.myCrops && filters.userId) {
      const userCrops = await prisma.userCrop.findMany({
        where: { userId: filters.userId },
        select: { cropId: true },
      });
      where.cropId = { in: userCrops.map((uc) => uc.cropId) };
    }

    const [prices, total] = await Promise.all([
      prisma.price.findMany({
        where,
        include: { crop: true, mandi: true },
        skip: filters.skip,
        take: filters.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.price.count({ where }),
    ]);

    // Filter by price type if specified
    if (filters.type) {
      const mapped = prices.map((p) => {
        let displayPrice: number;
        switch (filters.type) {
          case 'farmGate':
            displayPrice = p.farmGatePrice;
            break;
          case 'dealer':
            displayPrice = p.dealerPrice;
            break;
          case 'retail':
            displayPrice = p.retailPrice;
            break;
          case 'mandi':
          default:
            displayPrice = p.modalPrice;
            break;
        }
        return { ...p, displayPrice, priceType: filters.type };
      });
      return { prices: mapped, total };
    }

    return { prices, total };
  }

  static async getPriceChain(cropId: string) {
    const prices = await prisma.price.findMany({
      where: { cropId },
      include: { crop: true, mandi: true },
    });

    if (prices.length === 0) return null;

    // Aggregate across all mandis for the crop
    const avgFarmGate = prices.reduce((sum, p) => sum + p.farmGatePrice, 0) / prices.length;
    const avgDealer = prices.reduce((sum, p) => sum + p.dealerPrice, 0) / prices.length;
    const avgMandi = prices.reduce((sum, p) => sum + p.modalPrice, 0) / prices.length;
    const avgRetail = prices.reduce((sum, p) => sum + p.retailPrice, 0) / prices.length;

    return {
      crop: prices[0].crop,
      chain: [
        { stage: 'Farm Gate', price: Math.round(avgFarmGate), description: 'Price at which farmers sell to local aggregators' },
        { stage: 'Dealer', price: Math.round(avgDealer), description: 'Price at dealer/wholesaler level' },
        { stage: 'Mandi', price: Math.round(avgMandi), description: 'APMC regulated market price' },
        { stage: 'Retail', price: Math.round(avgRetail), description: 'Final consumer price at retail shops' },
      ],
      margins: {
        farmToDealer: `${(((avgDealer - avgFarmGate) / avgFarmGate) * 100).toFixed(1)}%`,
        dealerToMandi: `${(((avgMandi - avgDealer) / avgDealer) * 100).toFixed(1)}%`,
        mandiToRetail: `${(((avgRetail - avgMandi) / avgMandi) * 100).toFixed(1)}%`,
        farmToRetail: `${(((avgRetail - avgFarmGate) / avgFarmGate) * 100).toFixed(1)}%`,
      },
      mandiPrices: prices.map((p) => ({
        mandi: p.mandi,
        min: p.minPrice,
        max: p.maxPrice,
        modal: p.modalPrice,
        farmGate: p.farmGatePrice,
        dealer: p.dealerPrice,
        retail: p.retailPrice,
        dealerMargin: p.dealerMargin,
        change: p.change,
        changePercent: p.changePercent,
        volume: p.volume,
      })),
    };
  }

  static async getHighlights() {
    const prices = await prisma.price.findMany({
      include: { crop: true, mandi: true },
      orderBy: { changePercent: 'desc' },
    });

    const gainers = prices
      .filter((p) => p.changePercent > 0)
      .slice(0, 5)
      .map((p) => ({
        crop: p.crop.name,
        mandi: p.mandi.name,
        price: p.modalPrice,
        change: p.change,
        changePercent: p.changePercent,
      }));

    const losers = prices
      .filter((p) => p.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
      .map((p) => ({
        crop: p.crop.name,
        mandi: p.mandi.name,
        price: p.modalPrice,
        change: p.change,
        changePercent: p.changePercent,
      }));

    return { gainers, losers };
  }
}
