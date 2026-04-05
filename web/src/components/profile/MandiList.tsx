"use client";

import React from "react";
import { Store } from "lucide-react";
import { MANDIS } from "@/hooks/useMandis";

interface ProfileMandiListProps {
  mandiIds: string[];
}

export function ProfileMandiList({ mandiIds }: ProfileMandiListProps) {
  const userMandis = MANDIS.filter((m) => mandiIds.includes(m.id));

  if (userMandis.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-3">
      <h3 className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">
        My Mandis
      </h3>
      <div className="space-y-2">
        {userMandis.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <Store size={18} className="text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-kisan-text dark:text-gray-200">
                {m.name}
              </p>
              <p className="text-[11px] text-kisan-text-secondary">
                {m.district} &middot; {m.distanceKm} km
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
