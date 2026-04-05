"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { WeatherData } from "@/types";

const FALLBACK_WEATHER: WeatherData = {
  condition: "partly_cloudy",
  tempC: 28,
  humidity: 72,
  windKph: 14,
  location: "Warangal, Telangana",
  forecast: [
    { day: "Today", condition: "partly_cloudy", high: 31, low: 22 },
    { day: "Wed", condition: "sunny", high: 33, low: 23 },
    { day: "Thu", condition: "rainy", high: 27, low: 21 },
    { day: "Fri", condition: "rainy", high: 26, low: 20 },
    { day: "Sat", condition: "cloudy", high: 29, low: 21 },
  ],
};

function mapApiToWeatherData(data: Record<string, unknown>): WeatherData {
  const current = data.current as Record<string, unknown> | undefined;
  const forecast = data.forecast as Array<Record<string, unknown>> | undefined;

  if (!current) return FALLBACK_WEATHER;

  return {
    condition: (current.condition || current.icon || "partly_cloudy") as WeatherData["condition"],
    tempC: (current.tempC || current.temperature || 28) as number,
    humidity: (current.humidity || 72) as number,
    windKph: (current.windKph || current.windSpeed || 14) as number,
    location: (current.location || "Warangal, Telangana") as string,
    forecast: forecast
      ? forecast.slice(0, 5).map((f) => ({
          day: (f.dayOfWeek || f.day || "") as string,
          condition: (f.icon || f.condition || "partly_cloudy") as string,
          high: (f.high || 30) as number,
          low: (f.low || 22) as number,
        }))
      : FALLBACK_WEATHER.forecast,
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ["weather"],
    queryFn: async (): Promise<WeatherData> => {
      try {
        const res = await api.get<{ success: boolean; data: Record<string, unknown> }>("/api/weather");
        return mapApiToWeatherData(res.data);
      } catch {
        return FALLBACK_WEATHER;
      }
    },
    staleTime: 300000,
  });
}

export { FALLBACK_WEATHER as MOCK_WEATHER };
