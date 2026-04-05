"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "solid" | "soft";
  className?: string;
}

export function Badge({
  children,
  color = "#1B6B3A",
  variant = "soft",
  className,
}: BadgeProps) {
  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white",
          className
        )}
        style={{ backgroundColor: color }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold",
        className
      )}
      style={{
        backgroundColor: color + "18",
        color: color,
      }}
    >
      {children}
    </span>
  );
}
