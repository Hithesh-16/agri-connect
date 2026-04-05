"use client";

import React from "react";
import Link from "next/link";
import { Wheat, MapPin, ScanLine, ExternalLink, Sprout, Bell, Moon, Sun, CalendarDays, ShoppingBag, Award } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePrices } from "@/hooks/usePrices";
import { useMandis, MANDIS } from "@/hooks/useMandis";
import { useWeather } from "@/hooks/useWeather";
import { useNews } from "@/hooks/useNews";
import { WeatherCard } from "@/components/home/WeatherCard";
import { PriceHighlights } from "@/components/home/PriceHighlights";
import { getGreeting, getCurrentDate } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  market: "#3B82F6",
  policy: "#8B5CF6",
  weather: "#F59E0B",
  advisory: "#22C55E",
};

const QUICK_ACTIONS = [
  { href: "/prices", label: "My Crops", Icon: Wheat, color: "#22C55E" },
  { href: "/markets", label: "Mandis", Icon: MapPin, color: "#3B82F6" },
  { href: "/scanner", label: "Scan", Icon: ScanLine, color: "#F97316" },
  { href: "/supply-chain", label: "eNAM", Icon: ExternalLink, color: "#8B5CF6" },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays, color: "#0EA5E9" },
  { href: "/marketplace", label: "Market", Icon: ShoppingBag, color: "#F59E0B" },
  { href: "/schemes", label: "Schemes", Icon: Award, color: "#A855F7" },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: prices } = usePrices();
  const { data: weather } = useWeather();
  const { data: news } = useNews();

  const userMandis = MANDIS.filter((m) => user?.selectedMandiIds?.includes(m.id)).slice(0, 3);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
            <Sprout size={22} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-kisan-text dark:text-gray-100">Jai Kisan, {user?.firstName || "Farmer"}</p>
            <p className="text-xs text-kisan-text-secondary">{getCurrentDate()}</p>
          </div>
        </div>
        <button className="relative p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-kisan-border dark:border-gray-700">
          <Bell size={20} className="text-kisan-text-secondary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
        </button>
      </div>

      {/* Desktop greeting */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-kisan-text dark:text-gray-100">Jai Kisan, {user?.firstName || "Farmer"}</h1>
        <p className="text-sm text-kisan-text-secondary">{getCurrentDate()}</p>
      </div>

      {/* Weather */}
      {weather && <WeatherCard weather={weather} />}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href}
            className="flex flex-col items-center gap-2 py-4 bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 hover:border-primary/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: a.color + "18" }}>
              <a.Icon size={22} style={{ color: a.color }} />
            </div>
            <span className="text-xs font-medium text-kisan-text dark:text-gray-200">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Price Highlights */}
      {prices && <PriceHighlights prices={prices.slice(0, 8)} />}

      {/* Your Mandis */}
      {userMandis.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-kisan-text dark:text-gray-100">Your Mandis</h2>
            <Link href="/markets" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {userMandis.map((m) => (
              <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700">
                <p className="font-semibold text-kisan-text dark:text-gray-100">{m.name}</p>
                <p className="text-xs text-kisan-text-secondary mt-0.5">{m.district}, {m.state}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">{m.distanceKm} km</span>
                  <span className="text-xs text-kisan-text-secondary">{m.volume}/day</span>
                  <span className="text-xs text-kisan-text-secondary">{m.activeCrops} crops</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News */}
      {news && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-kisan-text dark:text-gray-100">Agricultural News</h2>
          </div>
          <div className="space-y-3">
            {news.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#6B7280" }}>
                        {item.category}
                      </span>
                      <span className="text-[11px] text-kisan-text-light">{item.date}</span>
                    </div>
                    <p className="font-semibold text-sm text-kisan-text dark:text-gray-100 leading-snug">{item.title}</p>
                    <p className="text-xs text-kisan-text-secondary mt-1 line-clamp-2">{item.summary}</p>
                  </div>
                  <span className="text-[10px] text-kisan-text-light whitespace-nowrap">{item.readTime} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
