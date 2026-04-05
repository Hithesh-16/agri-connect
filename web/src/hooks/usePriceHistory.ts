"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ALL_FULL_PRICES } from "@/hooks/usePrices";

export interface PriceHistoryPoint {
  date: string;
  farmGate: number;
  dealer: number;
  mandi: number;
  retail: number;
}

function generateMockHistory(cropId: string, period: number): PriceHistoryPoint[] {
  const entry = ALL_FULL_PRICES.find((p) => p.cropId === cropId);
  if (!entry) return [];

  const basePrices = {
    farmGate: entry.farmGatePrice,
    dealer: entry.dealerPrice,
    mandi: entry.mandiPrice,
    retail: entry.retailPrice,
  };

  const points: PriceHistoryPoint[] = [];
  const now = new Date();

  // Use a seed based on cropId for deterministic randomness
  let seed = 0;
  for (let i = 0; i < cropId.length; i++) {
    seed += cropId.charCodeAt(i);
  }
  function pseudoRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed % 10000) / 10000;
  }

  const current = { ...basePrices };

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (i < period - 1) {
      // Vary each price by up to +/-3% from previous day
      current.farmGate = Math.round(current.farmGate * (1 + (pseudoRandom() - 0.5) * 0.06));
      current.dealer = Math.round(current.dealer * (1 + (pseudoRandom() - 0.5) * 0.06));
      current.mandi = Math.round(current.mandi * (1 + (pseudoRandom() - 0.5) * 0.06));
      current.retail = Math.round(current.retail * (1 + (pseudoRandom() - 0.5) * 0.06));
    }

    points.push({
      date: dateStr,
      farmGate: current.farmGate,
      dealer: current.dealer,
      mandi: current.mandi,
      retail: current.retail,
    });
  }

  return points;
}

export function usePriceHistory(cropId: string, period: number) {
  return useQuery({
    queryKey: ["priceHistory", cropId, period],
    queryFn: async (): Promise<PriceHistoryPoint[]> => {
      try {
        const res = await api.get<{ success: boolean; data: PriceHistoryPoint[] }>(
          `/api/prices/history/${cropId}`,
          { params: { period: String(period) } }
        );
        if (res.data && res.data.length > 0) return res.data;
        return generateMockHistory(cropId, period);
      } catch {
        return generateMockHistory(cropId, period);
      }
    },
    staleTime: 120000,
  });
}
