"use client";

import React from "react";
import { MapPin, Scale, Leaf, CheckCircle } from "lucide-react";
import type { Mandi } from "@/types";
import { MOCK_PRICES } from "@/hooks/usePrices";

interface MandiDetailProps {
  mandi: Mandi;
}

export function MandiDetail({ mandi }: MandiDetailProps) {
  const mandiPrices = MOCK_PRICES.filter((p) => p.mandiId === mandi.id);
  const prices = mandiPrices.length > 0 ? mandiPrices : MOCK_PRICES.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
            {mandi.name}
          </h3>
          <p className="text-xs text-kisan-text-secondary mt-0.5">
            {mandi.district}, {mandi.state}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-kisan-green/10 px-2 py-1 rounded-lg">
          <CheckCircle size={14} className="text-kisan-green" />
          <span className="text-xs font-medium text-kisan-green">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-kisan-bg dark:bg-gray-700 rounded-xl p-3">
        {[
          { label: "Distance", value: `${mandi.distanceKm} km`, Icon: MapPin },
          { label: "Daily Volume", value: mandi.volume, Icon: Scale },
          { label: "Active Crops", value: String(mandi.activeCrops), Icon: Leaf },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <s.Icon size={18} className="text-primary" />
            <span className="font-bold text-sm text-kisan-text dark:text-gray-100">
              {s.value}
            </span>
            <span className="text-[10px] text-kisan-text-secondary">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-semibold text-sm text-kisan-text dark:text-gray-100 mb-2">
          Today&apos;s Prices
        </h4>
        {prices.slice(0, 5).map((p, i) => {
          const isUp = p.change >= 0;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 py-2 border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isUp ? "#22C55E" : "#EF4444" }}
              />
              <span className="flex-1 text-[13px] font-medium text-kisan-text dark:text-gray-200 truncate">
                {p.cropName}
              </span>
              <span className="font-bold text-sm text-primary">
                &#8377;{p.modalPrice.toLocaleString("en-IN")}
              </span>
              <span
                className="text-xs font-medium w-12 text-right"
                style={{ color: isUp ? "#22C55E" : "#EF4444" }}
              >
                {isUp ? "+" : ""}
                {p.changePercent.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
