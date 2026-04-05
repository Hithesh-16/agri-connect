"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceEntry } from "@/types";

interface PriceHighlightsProps {
  prices: PriceEntry[];
}

export function PriceHighlights({ prices }: PriceHighlightsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-kisan-text dark:text-gray-100">
          Today&apos;s Highlights
        </h2>
        <Link
          href="/prices"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {prices.map((p, i) => {
          const isUp = p.change >= 0;
          return (
            <div
              key={i}
              className="min-w-[150px] bg-white dark:bg-gray-800 rounded-2xl p-3.5 border border-kisan-border dark:border-gray-700 flex-shrink-0"
            >
              <p className="font-semibold text-[13px] text-kisan-text dark:text-gray-100">
                {p.cropName}
              </p>
              <p className="text-[11px] text-kisan-text-secondary truncate">
                {p.mandiName}
              </p>
              <p className="text-xl font-bold text-primary mt-1">
                &#8377;{p.modalPrice.toLocaleString("en-IN")}
              </p>
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mt-1"
                style={{
                  backgroundColor: isUp ? "#22C55E18" : "#EF444418",
                }}
              >
                {isUp ? (
                  <TrendingUp size={12} color="#22C55E" />
                ) : (
                  <TrendingDown size={12} color="#EF4444" />
                )}
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isUp ? "#22C55E" : "#EF4444" }}
                >
                  {isUp ? "+" : ""}
                  {p.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
