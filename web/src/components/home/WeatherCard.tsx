"use client";

import React from "react";
import { Sun, Cloud, CloudRain, CloudSun, Droplets, Wind } from "lucide-react";
import type { WeatherData } from "@/types";

function WeatherIcon({ condition, size = 28 }: { condition: string; size?: number }) {
  const iconMap: Record<string, { Icon: React.ElementType; color: string }> = {
    sunny: { Icon: Sun, color: "#F59E0B" },
    cloudy: { Icon: Cloud, color: "#9CA3AF" },
    rainy: { Icon: CloudRain, color: "#60A5FA" },
    partly_cloudy: { Icon: CloudSun, color: "#F59E0B" },
  };
  const { Icon, color } = iconMap[condition] || iconMap.sunny;
  return <Icon size={size} style={{ color }} />;
}

interface WeatherCardProps {
  weather: WeatherData;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#0D4A22] to-[#1B6B3A] rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <WeatherIcon condition={weather.condition} size={32} />
          <div>
            <p className="text-3xl font-bold">{weather.tempC}&deg;C</p>
            <p className="text-xs text-white/70">{weather.location}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-white/70" />
            <span className="text-xs text-white/75">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={14} className="text-white/70" />
            <span className="text-xs text-white/75">{weather.windKph} km/h</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weather.forecast.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 min-w-[56px] py-2"
          >
            <span className="text-[11px] text-white/65 font-medium">
              {f.day}
            </span>
            <WeatherIcon condition={f.condition} size={20} />
            <span className="text-[13px] font-semibold">{f.high}&deg;</span>
            <span className="text-[12px] text-white/55">{f.low}&deg;</span>
          </div>
        ))}
      </div>
    </div>
  );
}
