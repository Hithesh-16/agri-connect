"use client";

import React from "react";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = [
  { label: "All", maxKm: 999 },
  { label: "50 km", maxKm: 50 },
  { label: "100 km", maxKm: 100 },
  { label: "200 km", maxKm: 200 },
];

interface RadiusFilterProps {
  value: number;
  onChange: (maxKm: number) => void;
}

export function RadiusFilter({ value, onChange }: RadiusFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {RADIUS_OPTIONS.map((r) => (
        <button
          key={r.label}
          onClick={() => onChange(r.maxKm)}
          className={cn(
            "px-3.5 py-2 rounded-full border-[1.5px] text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
            value === r.maxKm
              ? "bg-primary border-primary text-white"
              : "bg-white dark:bg-gray-800 border-kisan-border text-kisan-text-secondary hover:border-primary/30"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
