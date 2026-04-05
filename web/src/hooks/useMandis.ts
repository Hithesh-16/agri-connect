"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Mandi } from "@/types";

export const MANDIS: Mandi[] = [
  { id: "m1", name: "Warangal APMC", district: "Warangal", state: "Telangana", distanceKm: 12, latitude: 17.977, longitude: 79.601, activeCrops: 18, volume: "2,400 tonnes" },
  { id: "m2", name: "Nizamabad Market", district: "Nizamabad", state: "Telangana", distanceKm: 45, latitude: 18.672, longitude: 78.094, activeCrops: 14, volume: "1,800 tonnes" },
  { id: "m3", name: "Karimnagar Mandi", district: "Karimnagar", state: "Telangana", distanceKm: 65, latitude: 18.438, longitude: 79.128, activeCrops: 12, volume: "900 tonnes" },
  { id: "m4", name: "Nalgonda APMC", district: "Nalgonda", state: "Telangana", distanceKm: 82, latitude: 17.052, longitude: 79.266, activeCrops: 10, volume: "650 tonnes" },
  { id: "m5", name: "Khammam Market", district: "Khammam", state: "Telangana", distanceKm: 98, latitude: 17.247, longitude: 80.151, activeCrops: 15, volume: "1,200 tonnes" },
  { id: "m6", name: "Suryapet Mandi", district: "Suryapet", state: "Telangana", distanceKm: 115, latitude: 17.139, longitude: 79.622, activeCrops: 8, volume: "500 tonnes" },
  { id: "m7", name: "Adilabad APMC", district: "Adilabad", state: "Telangana", distanceKm: 145, latitude: 19.664, longitude: 78.532, activeCrops: 11, volume: "750 tonnes" },
  { id: "m8", name: "Mahbubnagar Market", district: "Mahbubnagar", state: "Telangana", distanceKm: 160, latitude: 16.738, longitude: 77.987, activeCrops: 13, volume: "980 tonnes" },
  { id: "m9", name: "Medak Mandi", district: "Medak", state: "Telangana", distanceKm: 178, latitude: 17.997, longitude: 78.268, activeCrops: 9, volume: "420 tonnes" },
  { id: "m10", name: "Hyderabad Central", district: "Hyderabad", state: "Telangana", distanceKm: 190, latitude: 17.385, longitude: 78.487, activeCrops: 25, volume: "5,500 tonnes" },
];

export function useMandis() {
  return useQuery({
    queryKey: ["mandis"],
    queryFn: async (): Promise<Mandi[]> => {
      try {
        const res = await api.get<{ success: boolean; data: Mandi[] }>("/api/mandis");
        return res.data || MANDIS;
      } catch {
        return MANDIS;
      }
    },
    staleTime: 300000,
  });
}
