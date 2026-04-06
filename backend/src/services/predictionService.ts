import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config';

const n = (d: Decimal | number): number => typeof d === 'number' ? d : Number(d);

export interface PredictionPoint {
  date: string;
  predicted: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

export interface PredictionResult {
  cropId: string;
  cropName: string;
  mandiId?: string;
  mandiName?: string;
  currentPrice: number;
  predictions: PredictionPoint[];
  trend: 'rising' | 'falling' | 'stable';
  trendPercent: number;
  methodology: string;
}

export class PredictionService {
  /**
   * Generates price predictions for a crop at a mandi.
   * Uses historical data to compute:
   * 1. Weighted moving average (recent prices weighted more)
   * 2. Linear trend (slope from regression)
   * 3. Seasonal adjustment (compare to same period last year if data exists)
   * Returns predicted prices with confidence bands (+/- std deviation)
   */
  static async predict(cropId: string, mandiId?: string, days: number = 7): Promise<PredictionResult> {
    // Fetch crop info
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      throw new Error(`Crop not found: ${cropId}`);
    }

    // Fetch mandi info if provided
    let mandiName: string | undefined;
    if (mandiId) {
      const mandi = await prisma.mandi.findUnique({ where: { id: mandiId } });
      if (mandi) mandiName = mandi.name;
    }

    // Fetch last 90 days of price history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const whereClause: any = {
      cropId,
      date: { gte: ninetyDaysAgo },
    };
    if (mandiId) {
      whereClause.mandiId = mandiId;
    }

    const history = await prisma.priceHistory.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    // Get current price from Price table
    const currentPriceWhere: any = { cropId };
    if (mandiId) currentPriceWhere.mandiId = mandiId;

    const currentPriceRecord = await prisma.price.findFirst({
      where: currentPriceWhere,
      orderBy: { updatedAt: 'desc' },
    });

    const currentPrice = currentPriceRecord ? n(currentPriceRecord.modalPrice) : (history.length > 0 ? n(history[history.length - 1].modalPrice) : 0);

    // If insufficient data, return flat prediction
    if (history.length < 7) {
      return this.buildInsufficientDataResult(cropId, crop.name, mandiId, mandiName, currentPrice, days);
    }

    // Extract modal prices sorted by date
    const prices = history.map(h => n(h.modalPrice));
    const dates = history.map(h => h.date);

    // 1. Weighted Moving Average
    const wma = this.calculateWeightedMovingAverage(prices);

    // 2. Linear regression on last 30 data points (or all if fewer)
    const recentPrices = prices.slice(-30);
    const { slope, intercept } = this.linearRegression(recentPrices);

    // 3. Standard deviation of price changes over last 30 days
    const priceChanges = this.calculatePriceChanges(recentPrices);
    const stdDev = this.standardDeviation(priceChanges);

    // 4. Seasonal adjustment: compare to same period last year
    const seasonalFactor = await this.getSeasonalFactor(cropId, mandiId);

    // Generate predictions
    const predictions: PredictionPoint[] = [];
    const baseValue = wma;
    const dailySlope = slope; // slope per data point (approx per day)

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Projected price: WMA + (slope * days_ahead) with seasonal adjustment
      let predicted = baseValue + (dailySlope * i) * seasonalFactor;

      // Ensure predicted price is not negative
      predicted = Math.max(predicted, currentPrice * 0.5);

      // Confidence decreases over time: 85% for day 1, -3% per day
      const confidence = Math.max(30, 85 - (i - 1) * 3);

      // Confidence bands: +/- 1 standard deviation, widening over time
      const bandWidth = stdDev * Math.sqrt(i);
      const upperBound = predicted + bandWidth;
      const lowerBound = Math.max(0, predicted - bandWidth);

      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.round(predicted * 100) / 100,
        upperBound: Math.round(upperBound * 100) / 100,
        lowerBound: Math.round(lowerBound * 100) / 100,
        confidence,
      });
    }

    // Determine trend
    const firstPredicted = predictions[0].predicted;
    const lastPredicted = predictions[predictions.length - 1].predicted;
    const trendPercent = currentPrice > 0 ? ((lastPredicted - currentPrice) / currentPrice) * 100 : 0;

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (trendPercent > 0.5) trend = 'rising';
    else if (trendPercent < -0.5) trend = 'falling';

    return {
      cropId,
      cropName: crop.name,
      mandiId,
      mandiName,
      currentPrice,
      predictions,
      trend,
      trendPercent: Math.round(trendPercent * 100) / 100,
      methodology: 'weighted_moving_average_linear_regression',
    };
  }

  /**
   * Calculates weighted moving average.
   * Weights: last 7 days = 3x, 8-14 days = 2x, 15-30 days = 1x
   */
  private static calculateWeightedMovingAverage(prices: number[]): number {
    const n = prices.length;
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < n; i++) {
      const daysFromEnd = n - 1 - i;
      let weight: number;

      if (daysFromEnd < 7) {
        weight = 3;
      } else if (daysFromEnd < 14) {
        weight = 2;
      } else if (daysFromEnd < 30) {
        weight = 1;
      } else {
        weight = 0.5;
      }

      weightedSum += prices[i] * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : prices[n - 1];
  }

  /**
   * Simple linear regression.
   * Returns slope and intercept for y = slope * x + intercept
   */
  private static linearRegression(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { slope: 0, intercept: sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculates day-over-day price changes
   */
  private static calculatePriceChanges(prices: number[]): number[] {
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    return changes;
  }

  /**
   * Calculates standard deviation of an array
   */
  private static standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => (v - mean) * (v - mean));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Gets seasonal adjustment factor by comparing current period to same period last year.
   * Returns a multiplier (e.g., 1.05 means prices are typically 5% higher this time of year).
   */
  private static async getSeasonalFactor(cropId: string, mandiId?: string): Promise<number> {
    try {
      const now = new Date();
      const lastYearStart = new Date(now);
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
      lastYearStart.setDate(lastYearStart.getDate() - 15);

      const lastYearEnd = new Date(now);
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
      lastYearEnd.setDate(lastYearEnd.getDate() + 15);

      const whereClause: any = {
        cropId,
        date: { gte: lastYearStart, lte: lastYearEnd },
      };
      if (mandiId) whereClause.mandiId = mandiId;

      const lastYearData = await prisma.priceHistory.findMany({ where: whereClause });

      if (lastYearData.length < 3) return 1.0; // No seasonal data available

      const lastYearAvg = lastYearData.reduce((s, d) => s + n(d.modalPrice), 0) / lastYearData.length;

      // Get current month's data
      const thisMonthStart = new Date(now);
      thisMonthStart.setDate(thisMonthStart.getDate() - 15);

      const currentWhereClause: any = {
        cropId,
        date: { gte: thisMonthStart },
      };
      if (mandiId) currentWhereClause.mandiId = mandiId;

      const currentData = await prisma.priceHistory.findMany({ where: currentWhereClause });

      if (currentData.length < 3 || lastYearAvg === 0) return 1.0;

      const currentAvg = currentData.reduce((s, d) => s + n(d.modalPrice), 0) / currentData.length;

      // Seasonal factor dampened to prevent extreme adjustments
      const rawFactor = currentAvg / lastYearAvg;
      // Clamp between 0.8 and 1.2 to avoid extreme seasonal swings
      return Math.max(0.8, Math.min(1.2, rawFactor));
    } catch {
      return 1.0;
    }
  }

  /**
   * Builds a result for insufficient data scenarios
   */
  private static buildInsufficientDataResult(
    cropId: string,
    cropName: string,
    mandiId: string | undefined,
    mandiName: string | undefined,
    currentPrice: number,
    days: number,
  ): PredictionResult {
    const predictions: PredictionPoint[] = [];

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted: currentPrice,
        upperBound: currentPrice * 1.1,
        lowerBound: currentPrice * 0.9,
        confidence: Math.max(20, 50 - (i - 1) * 3),
      });
    }

    return {
      cropId,
      cropName,
      mandiId,
      mandiName,
      currentPrice,
      predictions,
      trend: 'stable',
      trendPercent: 0,
      methodology: 'insufficient_data',
    };
  }
}
