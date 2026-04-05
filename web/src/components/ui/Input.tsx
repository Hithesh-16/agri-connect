"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  prefix,
  icon,
  className,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-kisan-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2.5 bg-white border-[1.5px] rounded-xl px-3.5 py-3 transition-colors",
          error ? "border-kisan-red" : "border-kisan-border focus-within:border-primary",
          "dark:bg-gray-800 dark:border-gray-600"
        )}
      >
        {icon && <span className="text-kisan-text-secondary">{icon}</span>}
        {prefix && (
          <span className="font-semibold text-kisan-text">{prefix}</span>
        )}
        <input
          className={cn(
            "flex-1 bg-transparent outline-none text-kisan-text placeholder:text-kisan-text-light",
            "dark:text-gray-100",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-kisan-red">{error}</p>}
    </div>
  );
}
