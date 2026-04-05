"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, TrendingUp, TrendingDown, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFullPrices, ALL_FULL_PRICES } from "@/hooks/usePrices";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import { ShareButton } from "@/components/ui/ShareButton";
import type { FullPriceEntry } from "@/types";

const PRICE_TYPES = [
  { id: "mandi", label: "Mandi" },
  { id: "farmGate", label: "Farm Gate" },
  { id: "dealer", label: "Dealer" },
  { id: "retail", label: "Retail" },
] as const;

type PriceType = (typeof PRICE_TYPES)[number]["id"];

function getPriceForType(entry: FullPriceEntry, type: PriceType): number {
  switch (type) {
    case "farmGate": return entry.farmGatePrice;
    case "dealer": return entry.dealerPrice;
    case "retail": return entry.retailPrice;
    default: return entry.mandiPrice;
  }
}

export default function PricesPage() {
  const user = useAuthStore((s) => s.user);
  const [priceType, setPriceType] = useState<PriceType>("mandi");
  const [search, setSearch] = useState("");
  const [filterMyCrops, setFilterMyCrops] = useState(false);

  const userCropIds = user?.selectedCropIds || [];

  const filtered = ALL_FULL_PRICES.filter((p) => {
    const matchesSearch = p.cropName.toLowerCase().includes(search.toLowerCase()) ||
      p.mandiName.toLowerCase().includes(search.toLowerCase());
    const matchesMyCrops = !filterMyCrops || userCropIds.includes(p.cropId);
    return matchesSearch && matchesMyCrops;
  }).sort((a, b) => getPriceForType(b, priceType) - getPriceForType(a, priceType));

  const topGainer = [...ALL_FULL_PRICES].sort((a, b) => b.changePercent - a.changePercent)[0];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Market Prices</h1>
      </div>

      {/* Price Type Selector */}
      <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700">
        {PRICE_TYPES.map((t) => (
          <button key={t.id} onClick={() => setPriceType(t.id)}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              priceType === t.id ? "bg-primary text-white shadow-sm" : "text-kisan-text-secondary hover:text-kisan-text")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Price Chain Visualization */}
      {topGainer && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-4 border border-kisan-border dark:border-gray-700">
          <p className="text-xs font-medium text-kisan-text-secondary mb-3">Price Chain: {topGainer.cropName}</p>
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {[
              { label: "Farm Gate", price: topGainer.farmGatePrice, color: "#22C55E" },
              { label: "Dealer", price: topGainer.dealerPrice, color: "#3B82F6" },
              { label: "Mandi", price: topGainer.mandiPrice, color: "#F59E0B" },
              { label: "Retail", price: topGainer.retailPrice, color: "#EF4444" },
            ].map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center min-w-[70px]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: step.color + "20" }}>
                    <span className="text-xs font-bold" style={{ color: step.color }}>{formatCurrency(step.price).replace("\u20B9", "")}</span>
                  </div>
                  <span className="text-[10px] text-kisan-text-secondary font-medium">{step.label}</span>
                </div>
                {i < 3 && <ArrowRight size={16} className="text-kisan-text-light flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-kisan-text-secondary">Dealer Margin:</span>
            <span className="text-xs font-semibold text-kisan-blue">{formatCurrency(topGainer.dealerMargin)}/{topGainer.unit}</span>
          </div>
        </div>
      )}

      {/* Top Gainer Highlight */}
      {topGainer && (
        <div className="bg-kisan-green/10 rounded-2xl p-3 flex items-center gap-3 border border-kisan-green/20">
          <TrendingUp size={20} className="text-kisan-green" />
          <div>
            <p className="text-sm font-semibold text-kisan-text dark:text-gray-100">Top Gainer: {topGainer.cropName}</p>
            <p className="text-xs text-kisan-green font-medium">+{topGainer.changePercent.toFixed(1)}% at {topGainer.mandiName}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 border border-kisan-border dark:border-gray-600">
          <Search size={18} className="text-kisan-text-light" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crop or mandi..."
            className="flex-1 bg-transparent outline-none text-sm text-kisan-text dark:text-gray-100 placeholder:text-kisan-text-light" />
        </div>
        <button onClick={() => setFilterMyCrops(!filterMyCrops)}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
            filterMyCrops ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600")}>
          <Filter size={16} /> My Crops
        </button>
      </div>

      {/* Price Table (Desktop) */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-kisan-border dark:border-gray-700">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-kisan-text-secondary uppercase">Crop</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-kisan-text-secondary uppercase">Mandi</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-kisan-text-secondary uppercase">{PRICE_TYPES.find(t => t.id === priceType)?.label} Price</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-kisan-text-secondary uppercase">Change</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-kisan-text-secondary uppercase">Volume</th>
              <th className="w-10 px-2 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const isUp = p.change >= 0;
              const price = getPriceForType(p, priceType);
              return (
                <tr key={i} className="border-b border-kisan-border/50 dark:border-gray-700/50 hover:bg-kisan-bg/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/prices/${p.cropId}`} className="hover:underline">
                      <p className="font-semibold text-sm text-kisan-text dark:text-gray-100">{p.cropName}</p>
                      <p className="text-xs text-kisan-text-light">per {p.unit}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-kisan-text-secondary">{p.mandiName}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/prices/${p.cropId}`}>
                      <p className="font-bold text-primary">{formatCurrency(price)}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ backgroundColor: isUp ? "#22C55E18" : "#EF444418" }}>
                      {isUp ? <TrendingUp size={12} color="#22C55E" /> : <TrendingDown size={12} color="#EF4444" />}
                      <span className="text-xs font-medium" style={{ color: isUp ? "#22C55E" : "#EF4444" }}>{isUp ? "+" : ""}{p.changePercent.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-kisan-text-secondary">{p.volume}</td>
                  <td className="px-2 py-3.5">
                    <ShareButton
                      cropName={p.cropName}
                      mandiName={p.mandiName}
                      price={price}
                      change={p.change}
                      changePercent={p.changePercent}
                      unit={p.unit}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Price Cards (Mobile) */}
      <div className="lg:hidden space-y-2.5">
        {filtered.map((p, i) => {
          const isUp = p.change >= 0;
          const price = getPriceForType(p, priceType);
          return (
            <Link key={i} href={`/prices/${p.cropId}`} className="block">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-kisan-text dark:text-gray-100">{p.cropName}</p>
                    <p className="text-xs text-kisan-text-secondary">{p.mandiName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{formatCurrency(price)}</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ backgroundColor: isUp ? "#22C55E18" : "#EF444418" }}>
                      {isUp ? <TrendingUp size={12} color="#22C55E" /> : <TrendingDown size={12} color="#EF4444" />}
                      <span className="text-xs font-medium" style={{ color: isUp ? "#22C55E" : "#EF4444" }}>{isUp ? "+" : ""}{p.changePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-kisan-border/50 dark:border-gray-700/50">
                  <span className="text-[11px] text-kisan-text-light">Vol: {p.volume}</span>
                  <span className="text-[11px] text-kisan-text-light">per {p.unit}</span>
                  <span className="text-[11px] text-kisan-text-light ml-auto">{p.updatedAt}</span>
                  <ShareButton
                    cropName={p.cropName}
                    mandiName={p.mandiName}
                    price={price}
                    change={p.change}
                    changePercent={p.changePercent}
                    unit={p.unit}
                    className="w-7 h-7 -mr-1"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-kisan-text-secondary">No prices found</p>
        </div>
      )}
    </div>
  );
}
