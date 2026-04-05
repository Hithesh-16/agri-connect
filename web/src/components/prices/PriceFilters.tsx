"use client";

import React from "react";
import { cn } from "@/lib/utils";

type PriceType = "mandi" | "farmGate" | "dealer" | "retail";

const PRICE_TYPES: { id: PriceType; label: string; desc: string; color: string }[] = [
  { id: "mandi", label: "Mandi Price", desc: "Market rate at APMC", color: "#1B6B3A" },
  { id: "farmGate", label: "Farm Gate", desc: "Price at farm level", color: "#16A34A" },
  { id: "dealer", label: "Dealer", desc: "Cost + margin", color: "#F59E0B" },
  { id: "retail", label: "Retail", desc: "Consumer price", color: "#3B82F6" },
];

interface PriceFiltersProps {
  activeType: PriceType;
  onTypeChange: (type: PriceType) => void;
}

export function PriceFilters({ activeType, onTypeChange }: PriceFiltersProps) {
  return (
    <div>
      <p className="text-xs font-medium text-kisan-text-secondary mb-2">
        Price Type
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRICE_TYPES.map((t) => {
          const isActive = activeType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTypeChange(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border-[1.5px] min-w-[110px] transition-all flex-shrink-0",
                isActive
                  ? "bg-opacity-10 border-opacity-100"
                  : "bg-white dark:bg-gray-800 border-kisan-border dark:border-gray-700 hover:border-gray-300"
              )}
              style={
                isActive
                  ? {
                      borderColor: t.color,
                      backgroundColor: t.color + "10",
                    }
                  : undefined
              }
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <div className="text-left">
                <p
                  className="text-xs font-semibold"
                  style={isActive ? { color: t.color } : undefined}
                >
                  {t.label}
                </p>
                <p className="text-[10px] text-kisan-text-secondary">
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { PriceType };
