"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  cropName: string;
  mandiName: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  className?: string;
}

export function ShareButton({
  cropName,
  mandiName,
  price,
  change,
  changePercent,
  unit,
  className,
}: ShareButtonProps) {
  function handleShare() {
    const sign = changePercent > 0 ? "+" : "";
    const text = `${cropName} @ ${mandiName}: \u20B9${price}/${unit} (${sign}${changePercent.toFixed(1)}%) -- KisanConnect`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      title="Share on WhatsApp"
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors text-kisan-text-secondary hover:text-primary",
        className
      )}
    >
      <Share2 size={15} />
    </button>
  );
}
