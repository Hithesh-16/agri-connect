"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PriceEntry, FullPriceEntry } from "@/types";

// Fallback data used when backend is unreachable
const FALLBACK_PRICES: PriceEntry[] = [
  { cropId: "wheat", cropName: "Wheat", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 2100, maxPrice: 2350, modalPrice: 2250, change: 45, changePercent: 2.04, unit: "quintal", updatedAt: "10:30 AM" },
  { cropId: "rice", cropName: "Rice (Basmati)", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 3200, maxPrice: 3800, modalPrice: 3500, change: -80, changePercent: -2.23, unit: "quintal", updatedAt: "10:30 AM" },
  { cropId: "cotton", cropName: "Cotton", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 6200, maxPrice: 6800, modalPrice: 6500, change: 120, changePercent: 1.88, unit: "quintal", updatedAt: "11:00 AM" },
  { cropId: "chili", cropName: "Chili (Red)", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 9500, maxPrice: 11200, modalPrice: 10400, change: 350, changePercent: 3.49, unit: "quintal", updatedAt: "10:15 AM" },
  { cropId: "maize", cropName: "Maize", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 1750, maxPrice: 1900, modalPrice: 1820, change: -20, changePercent: -1.09, unit: "quintal", updatedAt: "09:45 AM" },
  { cropId: "soybean", cropName: "Soybean", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 4100, maxPrice: 4450, modalPrice: 4280, change: 60, changePercent: 1.42, unit: "quintal", updatedAt: "10:00 AM" },
  { cropId: "onion", cropName: "Onion", mandiId: "m3", mandiName: "Karimnagar Mandi", minPrice: 1800, maxPrice: 2200, modalPrice: 1950, change: -150, changePercent: -7.14, unit: "quintal", updatedAt: "09:30 AM" },
  { cropId: "tomato", cropName: "Tomato", mandiId: "m1", mandiName: "Warangal APMC", minPrice: 600, maxPrice: 1400, modalPrice: 950, change: 200, changePercent: 26.67, unit: "quintal", updatedAt: "11:15 AM" },
  { cropId: "chickpea", cropName: "Chickpea", mandiId: "m4", mandiName: "Nalgonda APMC", minPrice: 4800, maxPrice: 5200, modalPrice: 5000, change: 80, changePercent: 1.63, unit: "quintal", updatedAt: "10:45 AM" },
  { cropId: "groundnut", cropName: "Groundnut", mandiId: "m2", mandiName: "Nizamabad Market", minPrice: 5200, maxPrice: 5800, modalPrice: 5500, change: -100, changePercent: -1.79, unit: "quintal", updatedAt: "10:20 AM" },
  { cropId: "turmeric", cropName: "Turmeric", mandiId: "m3", mandiName: "Karimnagar Mandi", minPrice: 7800, maxPrice: 9200, modalPrice: 8500, change: 450, changePercent: 5.59, unit: "quintal", updatedAt: "09:50 AM" },
  { cropId: "potato", cropName: "Potato", mandiId: "m5", mandiName: "Khammam Market", minPrice: 900, maxPrice: 1200, modalPrice: 1050, change: 30, changePercent: 2.94, unit: "quintal", updatedAt: "10:30 AM" },
];

const FALLBACK_FULL_PRICES: FullPriceEntry[] = [
  { cropId: "wheat", cropName: "Wheat", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 1950, dealerPrice: 2100, mandiPrice: 2250, retailPrice: 2600, dealerMargin: 150, change: 45, changePercent: 2.04, unit: "quintal", volume: "420 qtl", updatedAt: "10:30 AM" },
  { cropId: "rice", cropName: "Rice (Basmati)", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 3000, dealerPrice: 3200, mandiPrice: 3500, retailPrice: 4200, dealerMargin: 200, change: -80, changePercent: -2.23, unit: "quintal", volume: "310 qtl", updatedAt: "10:30 AM" },
  { cropId: "cotton", cropName: "Cotton", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 5800, dealerPrice: 6200, mandiPrice: 6500, retailPrice: 7800, dealerMargin: 400, change: 120, changePercent: 1.88, unit: "quintal", volume: "680 qtl", updatedAt: "11:00 AM" },
  { cropId: "chili", cropName: "Chili (Red)", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 8800, dealerPrice: 9500, mandiPrice: 10400, retailPrice: 13000, dealerMargin: 700, change: 350, changePercent: 3.49, unit: "quintal", volume: "180 qtl", updatedAt: "10:15 AM" },
  { cropId: "maize", cropName: "Maize", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 1600, dealerPrice: 1750, mandiPrice: 1820, retailPrice: 2100, dealerMargin: 150, change: -20, changePercent: -1.09, unit: "quintal", volume: "560 qtl", updatedAt: "09:45 AM" },
  { cropId: "soybean", cropName: "Soybean", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 3800, dealerPrice: 4100, mandiPrice: 4280, retailPrice: 5100, dealerMargin: 300, change: 60, changePercent: 1.42, unit: "quintal", volume: "240 qtl", updatedAt: "10:00 AM" },
  { cropId: "onion", cropName: "Onion", mandiId: "m3", mandiName: "Karimnagar Mandi", farmGatePrice: 1500, dealerPrice: 1800, mandiPrice: 1950, retailPrice: 2800, dealerMargin: 300, change: -150, changePercent: -7.14, unit: "quintal", volume: "920 qtl", updatedAt: "09:30 AM" },
  { cropId: "tomato", cropName: "Tomato", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 500, dealerPrice: 700, mandiPrice: 950, retailPrice: 1600, dealerMargin: 200, change: 200, changePercent: 26.67, unit: "quintal", volume: "340 qtl", updatedAt: "11:15 AM" },
  { cropId: "chickpea", cropName: "Chickpea", mandiId: "m4", mandiName: "Nalgonda APMC", farmGatePrice: 4400, dealerPrice: 4800, mandiPrice: 5000, retailPrice: 6200, dealerMargin: 400, change: 80, changePercent: 1.63, unit: "quintal", volume: "190 qtl", updatedAt: "10:45 AM" },
  { cropId: "groundnut", cropName: "Groundnut", mandiId: "m2", mandiName: "Nizamabad Market", farmGatePrice: 4800, dealerPrice: 5200, mandiPrice: 5500, retailPrice: 7000, dealerMargin: 400, change: -100, changePercent: -1.79, unit: "quintal", volume: "280 qtl", updatedAt: "10:20 AM" },
  { cropId: "turmeric", cropName: "Turmeric", mandiId: "m3", mandiName: "Karimnagar Mandi", farmGatePrice: 7200, dealerPrice: 7800, mandiPrice: 8500, retailPrice: 11000, dealerMargin: 600, change: 450, changePercent: 5.59, unit: "quintal", volume: "95 qtl", updatedAt: "09:50 AM" },
  { cropId: "potato", cropName: "Potato", mandiId: "m5", mandiName: "Khammam Market", farmGatePrice: 800, dealerPrice: 900, mandiPrice: 1050, retailPrice: 1500, dealerMargin: 100, change: 30, changePercent: 2.94, unit: "quintal", volume: "480 qtl", updatedAt: "10:30 AM" },
  { cropId: "sorghum", cropName: "Sorghum", mandiId: "m1", mandiName: "Warangal APMC", farmGatePrice: 2100, dealerPrice: 2300, mandiPrice: 2450, retailPrice: 2900, dealerMargin: 200, change: 15, changePercent: 0.62, unit: "quintal", volume: "310 qtl", updatedAt: "10:00 AM" },
  { cropId: "lentil", cropName: "Lentil (Masoor)", mandiId: "m4", mandiName: "Nalgonda APMC", farmGatePrice: 5500, dealerPrice: 5900, mandiPrice: 6200, retailPrice: 7800, dealerMargin: 400, change: 120, changePercent: 1.97, unit: "quintal", volume: "145 qtl", updatedAt: "11:00 AM" },
];

export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: async (): Promise<PriceEntry[]> => {
      try {
        const res = await api.get<{ success: boolean; data: PriceEntry[] }>("/api/prices");
        return res.data || FALLBACK_PRICES;
      } catch {
        return FALLBACK_PRICES;
      }
    },
    staleTime: 60000,
  });
}

export function useFullPrices() {
  return useQuery({
    queryKey: ["fullPrices"],
    queryFn: async (): Promise<FullPriceEntry[]> => {
      try {
        const res = await api.get<{ success: boolean; data: FullPriceEntry[] }>("/api/prices", {
          params: { includeChain: "true" },
        });
        return res.data || FALLBACK_FULL_PRICES;
      } catch {
        return FALLBACK_FULL_PRICES;
      }
    },
    staleTime: 60000,
  });
}

export { FALLBACK_PRICES as MOCK_PRICES, FALLBACK_FULL_PRICES as ALL_FULL_PRICES };
