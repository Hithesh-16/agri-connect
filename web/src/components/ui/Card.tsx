"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  hover = false,
  padding = "md",
  className,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-kisan-border",
        hover && "hover:border-primary/30 hover:shadow-md transition-all cursor-pointer",
        paddings[padding],
        "dark:bg-gray-800 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
