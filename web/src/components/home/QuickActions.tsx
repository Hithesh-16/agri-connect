"use client";

import React from "react";
import Link from "next/link";
import { Leaf, Store, ScanLine, ShieldCheck } from "lucide-react";

const ACTIONS = [
  { icon: Leaf, label: "My Crops", href: "/prices", color: "#1B6B3A" },
  { icon: Store, label: "Mandis", href: "/markets", color: "#1B6B3A" },
  { icon: ScanLine, label: "Scan", href: "/scanner", color: "#1B6B3A" },
  { icon: ShieldCheck, label: "eNAM", href: "/supply-chain", color: "#1B6B3A" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-[58px] h-[58px] rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center border border-kisan-border/50 hover:shadow-md transition-shadow">
            <action.icon size={24} className="text-primary" />
          </div>
          <span className="text-[11px] font-medium text-kisan-text-secondary">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
