"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-light shadow-md shadow-primary/25",
    secondary:
      "bg-kisan-bg text-primary border-2 border-kisan-border hover:border-primary hover:bg-primary/5",
    outline:
      "border-2 border-primary text-primary hover:bg-primary/5",
    ghost: "text-kisan-text-secondary hover:bg-kisan-bg hover:text-kisan-text",
    danger: "bg-kisan-red text-white hover:bg-red-600 shadow-md shadow-red-500/25",
    accent:
      "bg-accent text-white hover:bg-accent-light shadow-md shadow-accent/40",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
