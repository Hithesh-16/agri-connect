"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, BarChart3, Wheat, ChevronDown, ChevronUp, LayoutGrid, List, TrendingUp, TrendingDown, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANDIS } from "@/hooks/useMandis";
import { MOCK_PRICES } from "@/hooks/usePrices";
import { formatCurrency } from "@/lib/utils";

const RADIUS_OPTIONS = [
  { label: "All", value: 999 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "200 km", value: 200 },
];

export default function MarketsPage() {
  const [radius, setRadius] = useState(999);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MANDIS.filter((m) => m.distanceKm <= radius).sort((a, b) => a.distanceKm - b.distanceKm);

  function getMandiPrices(mandiId: string) {
    return MOCK_PRICES.filter((p) => p.mandiId === mandiId).slice(0, 5);
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Markets & Mandis</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("list")}
            className={cn("p-2 rounded-lg transition-colors", viewMode === "list" ? "bg-primary/10 text-primary" : "text-kisan-text-light hover:bg-kisan-bg")}>
            <List size={18} />
          </button>
          <button onClick={() => setViewMode("grid")}
            className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-kisan-text-light hover:bg-kisan-bg")}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Radius Filter */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setRadius(opt.value)}
            className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border",
              radius === opt.value ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600")}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Map Placeholder */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-kisan-border dark:border-gray-700 relative overflow-hidden">
        <div className="text-center">
          <MapPin size={32} className="text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-kisan-text dark:text-gray-100">Telangana Mandis</p>
          <p className="text-xs text-kisan-text-secondary">{filtered.length} mandis within {radius === 999 ? "all distances" : `${radius} km`}</p>
        </div>
        {/* Dots representing mandis */}
        <div className="relative h-32 mt-4">
          {filtered.slice(0, 6).map((m, i) => (
            <div key={m.id} className="absolute flex flex-col items-center"
              style={{ left: `${15 + (i * 14)}%`, top: `${20 + ((i % 3) * 25)}%` }}>
              <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30 animate-pulse" />
              <span className="text-[9px] text-kisan-text-secondary mt-1 whitespace-nowrap">{m.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mandi List / Grid */}
      <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3")}>
        {filtered.map((mandi) => {
          const isExpanded = expandedId === mandi.id;
          const mandiPrices = getMandiPrices(mandi.id);
          return (
            <div key={mandi.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : mandi.id)} className="w-full text-left p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">{mandi.name}</p>
                    <p className="text-xs text-kisan-text-secondary mt-0.5">{mandi.district}, {mandi.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{mandi.distanceKm} km</span>
                    {isExpanded ? <ChevronUp size={16} className="text-kisan-text-light" /> : <ChevronDown size={16} className="text-kisan-text-light" />}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={13} className="text-kisan-text-light" />
                    <span className="text-xs text-kisan-text-secondary">{mandi.volume}/day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wheat size={13} className="text-kisan-text-light" />
                    <span className="text-xs text-kisan-text-secondary">{mandi.activeCrops} crops</span>
                  </div>
                </div>
              </button>

              {isExpanded && mandiPrices.length > 0 && (
                <div className="border-t border-kisan-border dark:border-gray-700 p-4 bg-kisan-bg/50 dark:bg-gray-900/50 space-y-2">
                  <p className="text-xs font-semibold text-kisan-text-secondary mb-2">Today&apos;s Prices</p>
                  {mandiPrices.map((price, i) => {
                    const isUp = price.change >= 0;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-kisan-text dark:text-gray-200">{price.cropName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{formatCurrency(price.modalPrice)}</span>
                          <div className="flex items-center gap-0.5">
                            {isUp ? <TrendingUp size={11} color="#22C55E" /> : <TrendingDown size={11} color="#EF4444" />}
                            <span className="text-[11px] font-medium" style={{ color: isUp ? "#22C55E" : "#EF4444" }}>{isUp ? "+" : ""}{price.changePercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Supply Chain Banner */}
      <Link href="/supply-chain"
        className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-4 text-white hover:shadow-lg transition-shadow">
        <Link2 size={22} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Supply Chain & eNAM</p>
          <p className="text-xs text-white/75">Explore cotton chain, eNAM registration & finance</p>
        </div>
        <ChevronDown size={18} className="rotate-[-90deg]" />
      </Link>
    </div>
  );
}
