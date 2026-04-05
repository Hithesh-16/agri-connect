"use client";

import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { FullPriceEntry } from "@/types";

type PriceType = "mandi" | "farmGate" | "dealer" | "retail";

interface PriceTableProps {
  data: FullPriceEntry[];
  priceType: PriceType;
}

const PRICE_TYPE_COLORS: Record<PriceType, string> = {
  mandi: "#1B6B3A",
  farmGate: "#16A34A",
  dealer: "#F59E0B",
  retail: "#3B82F6",
};

function getPriceForType(item: FullPriceEntry, type: PriceType): number {
  switch (type) {
    case "farmGate": return item.farmGatePrice;
    case "dealer": return item.dealerPrice;
    case "retail": return item.retailPrice;
    default: return item.mandiPrice;
  }
}

export function PriceTable({ data, priceType }: PriceTableProps) {
  const isMobile = useIsMobile();
  const color = PRICE_TYPE_COLORS[priceType];

  if (isMobile) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => {
          const isUp = item.change >= 0;
          const price = getPriceForType(item, priceType);
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-3.5 flex items-center justify-between border border-kisan-border/50"
            >
              <div className="flex items-start gap-2.5 flex-1">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: isUp ? "#22C55E" : "#EF4444" }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-kisan-text dark:text-gray-100">
                    {item.cropName}
                  </p>
                  <p className="text-[11px] text-kisan-text-secondary truncate">
                    {item.mandiName}
                  </p>
                  <p className="text-[10px] text-kisan-text-light mt-0.5">
                    {item.volume} traded today
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="font-bold text-lg" style={{ color }}>
                  &#8377;{price.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-kisan-text-secondary">
                  /{item.unit}
                </p>
                <div
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md mt-0.5"
                  style={{
                    backgroundColor: isUp ? "#22C55E18" : "#EF444418",
                  }}
                >
                  {isUp ? (
                    <ArrowUp size={11} color="#22C55E" />
                  ) : (
                    <ArrowDown size={11} color="#EF4444" />
                  )}
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: isUp ? "#22C55E" : "#EF4444" }}
                  >
                    {Math.abs(item.changePercent).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-kisan-border dark:border-gray-700">
            <th className="text-left px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Crop
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Mandi
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Price (&#8377;)
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Change
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Volume
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-kisan-text-secondary">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => {
            const isUp = item.change >= 0;
            const price = getPriceForType(item, priceType);
            return (
              <tr
                key={i}
                className="border-b border-kisan-border/50 dark:border-gray-700/50 hover:bg-kisan-bg/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isUp ? "#22C55E" : "#EF4444",
                      }}
                    />
                    <span className="font-semibold text-sm text-kisan-text dark:text-gray-100">
                      {item.cropName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-kisan-text-secondary">
                  {item.mandiName}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-base" style={{ color }}>
                    &#8377;{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-kisan-text-secondary ml-0.5">
                    /{item.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isUp ? "#22C55E18" : "#EF444418",
                    }}
                  >
                    {isUp ? (
                      <ArrowUp size={11} color="#22C55E" />
                    ) : (
                      <ArrowDown size={11} color="#EF4444" />
                    )}
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: isUp ? "#22C55E" : "#EF4444" }}
                    >
                      {Math.abs(item.changePercent).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-kisan-text-secondary">
                  {item.volume}
                </td>
                <td className="px-4 py-3 text-right text-xs text-kisan-text-light">
                  {item.updatedAt}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
