"use client";

import React from "react";
import Link from "next/link";
import { Store, MapPin } from "lucide-react";
import type { Mandi } from "@/types";

interface MandiListProps {
  mandis: Mandi[];
}

export function MandiList({ mandis }: MandiListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-kisan-text dark:text-gray-100">
          Your Mandis
        </h2>
        <Link
          href="/markets"
          className="text-sm font-medium text-primary hover:underline"
        >
          See Map
        </Link>
      </div>
      <div className="space-y-2">
        {mandis.slice(0, 3).map((m) => (
          <Link
            key={m.id}
            href="/markets"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-kisan-border dark:border-gray-700 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-kisan-text dark:text-gray-100">
                {m.name}
              </p>
              <p className="text-xs text-kisan-text-secondary flex items-center gap-1">
                <MapPin size={10} />
                {m.district} &middot; {m.distanceKm} km away
              </p>
            </div>
            <span className="text-xs font-medium text-primary">
              {m.activeCrops} crops
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
