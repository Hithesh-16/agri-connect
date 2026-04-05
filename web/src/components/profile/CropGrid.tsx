"use client";

import React from "react";
import { CROPS } from "@/hooks/useCrops";

interface CropGridProps {
  cropIds: string[];
}

export function CropGrid({ cropIds }: CropGridProps) {
  const userCrops = CROPS.filter((c) => cropIds.includes(c.id));

  if (userCrops.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-3">
      <h3 className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">
        My Crops
      </h3>
      <div className="flex flex-wrap gap-2">
        {userCrops.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-kisan-border dark:border-gray-600 bg-kisan-bg dark:bg-gray-700"
          >
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-xs font-medium text-kisan-text dark:text-gray-200">
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
