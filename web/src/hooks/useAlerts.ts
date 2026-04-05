"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PriceAlert {
  id: string;
  cropId: string;
  cropName: string;
  mandiId?: string;
  mandiName?: string;
  targetPrice: number;
  direction: "above" | "below";
  status: "active" | "triggered" | "inactive";
  unit: string;
  createdAt: string;
}

interface CreateAlertInput {
  cropId: string;
  cropName: string;
  mandiId?: string;
  mandiName?: string;
  targetPrice: number;
  direction: "above" | "below";
  unit: string;
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async (): Promise<PriceAlert[]> => {
      const res = await api.get<{ success: boolean; data: PriceAlert[] }>("/api/alerts");
      return res.data || [];
    },
    retry: false,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAlertInput): Promise<PriceAlert> => {
      const res = await api.post<{ success: boolean; data: PriceAlert }>("/api/alerts", input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }): Promise<void> => {
      await api.put(`/api/alerts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
