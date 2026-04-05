"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ALL_FULL_PRICES } from "@/hooks/usePrices";

export type SoilType = "red" | "black" | "alluvial" | "laterite" | "sandy";
export type IrrigationType = "borewell" | "canal" | "rainfed" | "drip" | "sprinkler";

export interface FarmPlot {
  id: string;
  name: string;
  areaAcres: number;
  cropId?: string;
  cropName?: string;
  sowingDate?: string;
  soilType: SoilType;
  irrigation: IrrigationType;
  district: string;
  address?: string;
}

export interface PlotAnalysis {
  estimatedYieldQtl: number;
  currentMarketValue: number;
  daysSinceSowing: number | null;
  cropDurationDays: number;
  progressPercent: number;
  nearbyMandi: string;
  nearbyMandiPrice: number;
}

export const TELANGANA_YIELDS: Record<string, number> = {
  rice: 22,
  wheat: 12,
  maize: 18,
  cotton: 8,
  soybean: 10,
  chili: 6,
  tomato: 80,
  onion: 60,
  potato: 70,
  sorghum: 10,
  chickpea: 8,
  lentil: 6,
  groundnut: 10,
  turmeric: 25,
  coriander: 5,
  millet: 8,
  sunflower: 6,
  sugarcane: 350,
  cauliflower: 60,
  brinjal: 80,
};

const CROP_DURATIONS: Record<string, number> = {
  rice: 120,
  wheat: 130,
  maize: 100,
  cotton: 180,
  soybean: 100,
  chili: 150,
  tomato: 90,
  onion: 120,
  potato: 90,
  sorghum: 110,
  chickpea: 100,
  lentil: 100,
  groundnut: 110,
  turmeric: 240,
  coriander: 60,
  millet: 80,
  sunflower: 95,
  sugarcane: 360,
  cauliflower: 80,
  brinjal: 100,
};

const SAMPLE_PLOTS: FarmPlot[] = [
  {
    id: "plot-1",
    name: "Main Field - East",
    areaAcres: 4.5,
    cropId: "cotton",
    cropName: "Cotton",
    sowingDate: "2025-07-15",
    soilType: "black",
    irrigation: "borewell",
    district: "Warangal",
    address: "Hanamkonda, Warangal Rural",
  },
  {
    id: "plot-2",
    name: "West Plot",
    areaAcres: 2.0,
    cropId: "rice",
    cropName: "Rice (Basmati)",
    sowingDate: "2025-06-20",
    soilType: "alluvial",
    irrigation: "canal",
    district: "Warangal",
    address: "Near Tank Bund, Warangal",
  },
];

function computeAnalysis(plot: FarmPlot): PlotAnalysis {
  const yieldPerAcre = plot.cropId ? (TELANGANA_YIELDS[plot.cropId] ?? 10) : 0;
  const estimatedYieldQtl = yieldPerAcre * plot.areaAcres;

  const priceEntry = ALL_FULL_PRICES.find((p) => p.cropId === plot.cropId);
  const pricePerQtl = priceEntry?.mandiPrice ?? 0;
  const currentMarketValue = estimatedYieldQtl * pricePerQtl;

  let daysSinceSowing: number | null = null;
  let progressPercent = 0;
  const cropDurationDays = plot.cropId ? (CROP_DURATIONS[plot.cropId] ?? 120) : 120;

  if (plot.sowingDate) {
    const sowing = new Date(plot.sowingDate);
    const now = new Date();
    daysSinceSowing = Math.floor(
      (now.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSowing < 0) daysSinceSowing = 0;
    progressPercent = Math.min(
      100,
      Math.round((daysSinceSowing / cropDurationDays) * 100)
    );
  }

  return {
    estimatedYieldQtl: Math.round(estimatedYieldQtl * 10) / 10,
    currentMarketValue: Math.round(currentMarketValue),
    daysSinceSowing,
    cropDurationDays,
    progressPercent,
    nearbyMandi: priceEntry?.mandiName ?? "Warangal APMC",
    nearbyMandiPrice: pricePerQtl,
  };
}

export function useFarmPlots() {
  return useQuery({
    queryKey: ["farmPlots"],
    queryFn: async (): Promise<FarmPlot[]> => {
      try {
        const res = await api.get<{ success: boolean; data: FarmPlot[] }>(
          "/api/farm-plots"
        );
        if (res.data && res.data.length > 0) return res.data;
        return SAMPLE_PLOTS;
      } catch {
        return SAMPLE_PLOTS;
      }
    },
    staleTime: 120000,
  });
}

export function usePlotAnalysis(plot: FarmPlot | null) {
  return useQuery({
    queryKey: ["plotAnalysis", plot?.id],
    queryFn: async (): Promise<PlotAnalysis | null> => {
      if (!plot) return null;
      try {
        const res = await api.get<{ success: boolean; data: PlotAnalysis }>(
          `/api/farm-plots/${plot.id}/analysis`
        );
        if (res.data) return res.data;
        return computeAnalysis(plot);
      } catch {
        return computeAnalysis(plot);
      }
    },
    enabled: !!plot,
    staleTime: 120000,
  });
}

export function useCreatePlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plot: Omit<FarmPlot, "id">): Promise<FarmPlot> => {
      try {
        const res = await api.post<{ success: boolean; data: FarmPlot }>(
          "/api/farm-plots",
          plot
        );
        if (res.data) return res.data;
        throw new Error("No data");
      } catch {
        // Local fallback
        const newPlot: FarmPlot = {
          ...plot,
          id: `plot-${Date.now()}`,
        };
        return newPlot;
      }
    },
    onSuccess: (newPlot) => {
      qc.setQueryData<FarmPlot[]>(["farmPlots"], (old) =>
        old ? [...old, newPlot] : [newPlot]
      );
    },
  });
}

export function useUpdatePlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plot: FarmPlot): Promise<FarmPlot> => {
      try {
        const res = await api.put<{ success: boolean; data: FarmPlot }>(
          `/api/farm-plots/${plot.id}`,
          plot
        );
        if (res.data) return res.data;
        throw new Error("No data");
      } catch {
        return plot;
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData<FarmPlot[]>(["farmPlots"], (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
      );
    },
  });
}

export function useDeletePlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plotId: string): Promise<string> => {
      try {
        await api.delete(`/api/farm-plots/${plotId}`);
      } catch {
        // local only
      }
      return plotId;
    },
    onSuccess: (deletedId) => {
      qc.setQueryData<FarmPlot[]>(["farmPlots"], (old) =>
        old ? old.filter((p) => p.id !== deletedId) : []
      );
    },
  });
}
