"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NewsItem } from "@/types";

const FALLBACK_NEWS: NewsItem[] = [
  { id: "n1", title: "Government raises MSP for Kharif crops by 5-7%", summary: "Cabinet approves minimum support price hike for 14 Kharif crops, benefiting over 11 crore farmers across India.", category: "policy", date: "Mar 11, 2026", readTime: 3 },
  { id: "n2", title: "Cotton prices surge as exports to China rise", summary: "Indian cotton exports see a 23% jump this quarter driven by high demand from Chinese textile mills. Prices expected to stay firm.", category: "market", date: "Mar 10, 2026", readTime: 2 },
  { id: "n3", title: "Pre-monsoon showers expected in Telangana by March 20", summary: "IMD forecasts early pre-monsoon activity over Telangana and Andhra Pradesh. Farmers advised to complete rabi harvesting before this date.", category: "weather", date: "Mar 9, 2026", readTime: 2 },
  { id: "n4", title: "eNAM integration now live in 1,361 mandis nationwide", summary: "National Agriculture Market now connects buyers and sellers across India with transparent pricing. Register today to access lakhs of buyers.", category: "policy", date: "Mar 8, 2026", readTime: 4 },
  { id: "n5", title: "Chili prices hit 3-year high on short supply", summary: "Poor rainfall in key chili growing regions has tightened supply. Prices in Guntur and Warangal mandis are up 28% over last year.", category: "market", date: "Mar 7, 2026", readTime: 3 },
  { id: "n6", title: "Use drip irrigation to save 50% water — advisory", summary: "Agriculture department urges farmers to adopt drip and sprinkler irrigation to conserve water ahead of predicted dry spell.", category: "advisory", date: "Mar 6, 2026", readTime: 2 },
];

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: async (): Promise<NewsItem[]> => {
      try {
        const res = await api.get<{ success: boolean; data: NewsItem[] }>("/api/news");
        return res.data || FALLBACK_NEWS;
      } catch {
        return FALLBACK_NEWS;
      }
    },
    staleTime: 300000,
  });
}

export { FALLBACK_NEWS as NEWS_ITEMS };
