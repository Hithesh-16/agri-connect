"use client";

import React from "react";
import { Store, MapPin, Leaf, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mandi } from "@/types";

interface MandiGridProps {
  mandis: Mandi[];
  selectedId: string | null;
  onSelect: (mandi: Mandi) => void;
  viewMode: "list" | "grid";
}

export function MandiGrid({ mandis, selectedId, onSelect, viewMode }: MandiGridProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {mandis.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-gradient-to-br from-primary to-primary-light text-white"
                  : "border-kisan-border bg-white dark:bg-gray-800 hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    isSelected ? "bg-white/20" : "bg-primary/10"
                  )}
                >
                  <Store
                    size={18}
                    className={isSelected ? "text-white" : "text-primary"}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <MapPin
                    size={11}
                    className={
                      isSelected ? "text-white/80" : "text-kisan-text-secondary"
                    }
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isSelected
                        ? "text-white/80"
                        : "text-kisan-text-secondary"
                    )}
                  >
                    {m.distanceKm} km
                  </span>
                </div>
              </div>
              <p
                className={cn(
                  "font-semibold text-[13px] truncate",
                  isSelected ? "text-white" : "text-kisan-text dark:text-gray-100"
                )}
              >
                {m.name}
              </p>
              <p
                className={cn(
                  "text-[11px]",
                  isSelected ? "text-white/70" : "text-kisan-text-secondary"
                )}
              >
                {m.district}
              </p>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Leaf
                    size={11}
                    className={
                      isSelected ? "text-white/70" : "text-kisan-text-secondary"
                    }
                  />
                  <span
                    className={cn(
                      "text-[11px]",
                      isSelected
                        ? "text-white/70"
                        : "text-kisan-text-secondary"
                    )}
                  >
                    {m.activeCrops} crops
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Scale
                    size={11}
                    className={
                      isSelected ? "text-white/70" : "text-kisan-text-secondary"
                    }
                  />
                  <span
                    className={cn(
                      "text-[11px]",
                      isSelected
                        ? "text-white/70"
                        : "text-kisan-text-secondary"
                    )}
                  >
                    {m.volume}/day
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {mandis.map((m) => {
        const isSelected = selectedId === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className={cn(
              "w-full flex items-center gap-3 rounded-2xl p-3.5 border-[1.5px] text-left transition-all",
              isSelected
                ? "border-primary bg-primary/[0.04]"
                : "border-kisan-border bg-white dark:bg-gray-800 hover:border-primary/30"
            )}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-primary" : "bg-primary/10"
              )}
            >
              <Store
                size={22}
                className={isSelected ? "text-white" : "text-primary"}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p
                className={cn(
                  "font-semibold text-sm",
                  isSelected
                    ? "text-primary"
                    : "text-kisan-text dark:text-gray-100"
                )}
              >
                {m.name}
              </p>
              <p className="text-xs text-kisan-text-secondary">
                {m.district}, {m.state}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-kisan-text-light">
                  {m.distanceKm} km
                </span>
                <span className="w-1 h-1 rounded-full bg-kisan-text-light" />
                <span className="text-[11px] text-kisan-text-light">
                  {m.activeCrops} crops
                </span>
                <span className="w-1 h-1 rounded-full bg-kisan-text-light" />
                <span className="text-[11px] text-kisan-text-light">
                  {m.volume}/day
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
