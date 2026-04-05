"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import type { FullPriceEntry } from "@/types";

interface PriceChainProps {
  item: FullPriceEntry;
}

export function PriceChain({ item }: PriceChainProps) {
  const nodes = [
    { label: "Farm Gate", price: item.farmGatePrice, color: "#16A34A" },
    { label: "Dealer", price: item.dealerPrice, color: "#F59E0B" },
    { label: "Mandi", price: item.mandiPrice, color: "#1B6B3A" },
    { label: "Retail", price: item.retailPrice, color: "#3B82F6" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700">
      <p className="text-xs font-medium text-kisan-text-secondary mb-3">
        Price Chain &mdash; {item.cropName}
      </p>
      <div className="flex items-start justify-between gap-1">
        {nodes.map((node, i) => (
          <React.Fragment key={node.label}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: node.color }}
              />
              <p className="text-[10px] text-kisan-text-secondary text-center">
                {node.label}
              </p>
              <p
                className="text-[13px] font-bold text-center"
                style={{ color: node.color }}
              >
                &#8377;{node.price.toLocaleString("en-IN")}
              </p>
            </div>
            {i < nodes.length - 1 && (
              <ArrowRight
                size={14}
                className="text-kisan-text-light mt-3 flex-shrink-0"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 text-center text-[11px] bg-kisan-orange/10 text-kisan-text-secondary rounded-lg py-1.5 px-3">
        Dealer margin: &#8377;{item.dealerMargin}/{item.unit} &middot;{" "}
        {((item.dealerMargin / item.farmGatePrice) * 100).toFixed(1)}%
      </div>
    </div>
  );
}
