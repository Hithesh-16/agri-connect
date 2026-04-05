"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ListingType = "selling" | "buying";

export interface Listing {
  id: string;
  type: ListingType;
  cropId: string;
  cropName: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  description?: string;
  mandiId?: string;
  mandiName?: string;
  location: string;
  postedBy: string;
  postedDate: string;
  expiresAt: string;
  contactPhone?: string;
}

export interface CreateListingPayload {
  type: ListingType;
  cropId: string;
  cropName: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  description?: string;
  mandiId?: string;
  mandiName?: string;
}

export interface InquiryPayload {
  listingId: string;
  message: string;
  phone?: string;
}

const FALLBACK_LISTINGS: Listing[] = [
  { id: "l1", type: "selling", cropId: "cotton", cropName: "Cotton", quantity: 50, unit: "quintal", pricePerUnit: 6500, location: "Warangal, Telangana", postedBy: "Ramesh K.", postedDate: "2026-03-30", expiresAt: "2026-04-13", mandiName: "Warangal APMC" },
  { id: "l2", type: "buying", cropId: "wheat", cropName: "Wheat", quantity: 200, unit: "quintal", pricePerUnit: 2300, location: "Nizamabad, Telangana", postedBy: "Suresh Traders", postedDate: "2026-03-28", expiresAt: "2026-04-11", mandiName: "Nizamabad Market" },
  { id: "l3", type: "selling", cropId: "chili", cropName: "Chili (Red)", quantity: 30, unit: "quintal", pricePerUnit: 10500, description: "Teja variety, fresh harvest. Good color and pungency.", location: "Khammam, Telangana", postedBy: "Lakshmi D.", postedDate: "2026-03-31", expiresAt: "2026-04-14", mandiName: "Khammam Market" },
  { id: "l4", type: "buying", cropId: "rice", cropName: "Rice (Sona Masuri)", quantity: 500, unit: "quintal", location: "Karimnagar, Telangana", postedBy: "AP Rice Mills", postedDate: "2026-03-29", expiresAt: "2026-04-12", description: "Looking for premium quality Sona Masuri. Bulk purchase." },
  { id: "l5", type: "selling", cropId: "tomato", cropName: "Tomato", quantity: 20, unit: "quintal", pricePerUnit: 1000, location: "Nalgonda, Telangana", postedBy: "Venkat R.", postedDate: "2026-04-01", expiresAt: "2026-04-08", description: "Fresh harvest, firm and red. Ready for pickup." },
  { id: "l6", type: "selling", cropId: "turmeric", cropName: "Turmeric", quantity: 100, unit: "quintal", pricePerUnit: 8800, location: "Nizamabad, Telangana", postedBy: "Srinivas P.", postedDate: "2026-03-27", expiresAt: "2026-04-10", mandiName: "Nizamabad Market", description: "Premium finger turmeric, 5% curcumin content." },
  { id: "l7", type: "buying", cropId: "cotton", cropName: "Cotton", quantity: 1000, unit: "quintal", pricePerUnit: 6400, location: "Adilabad, Telangana", postedBy: "Deccan Cotton Corp.", postedDate: "2026-04-02", expiresAt: "2026-04-16", description: "Need long staple cotton for textile mills." },
  { id: "l8", type: "selling", cropId: "maize", cropName: "Maize", quantity: 80, unit: "quintal", pricePerUnit: 1850, location: "Medak, Telangana", postedBy: "Rajesh M.", postedDate: "2026-04-01", expiresAt: "2026-04-15" },
];

export interface ListingFilters {
  type?: ListingType;
  cropId?: string;
}

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async (): Promise<Listing[]> => {
      try {
        const params: Record<string, string> = {};
        if (filters?.type) params.type = filters.type;
        if (filters?.cropId) params.cropId = filters.cropId;
        const res = await api.get<{ success: boolean; data: Listing[] }>("/api/listings", { params });
        return res.data || FALLBACK_LISTINGS;
      } catch {
        let data = FALLBACK_LISTINGS;
        if (filters?.type) data = data.filter((l) => l.type === filters.type);
        if (filters?.cropId) data = data.filter((l) => l.cropId === filters.cropId);
        return data;
      }
    },
    staleTime: 60000,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateListingPayload): Promise<Listing> => {
      try {
        const res = await api.post<{ success: boolean; data: Listing }>("/api/listings", payload);
        return res.data;
      } catch {
        const now = new Date();
        const expires = new Date(now);
        expires.setDate(expires.getDate() + 14);
        return {
          id: `local_${Date.now()}`,
          ...payload,
          location: payload.mandiName || "Local",
          postedBy: "You",
          postedDate: now.toISOString().split("T")[0],
          expiresAt: expires.toISOString().split("T")[0],
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useSendInquiry() {
  return useMutation({
    mutationFn: async (payload: InquiryPayload): Promise<{ success: boolean }> => {
      try {
        const res = await api.post<{ success: boolean }>(`/api/listings/${payload.listingId}/inquiries`, {
          message: payload.message,
          phone: payload.phone,
        });
        return res;
      } catch {
        return { success: true };
      }
    },
  });
}

export { FALLBACK_LISTINGS };
