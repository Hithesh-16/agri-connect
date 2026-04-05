"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Wheat, Leaf, Sprout, Flame, Sun, FlowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CROPS, CROP_CATEGORIES } from "@/hooks/useCrops";

const CROP_ICONS: Record<string, React.ElementType> = {
  grain: Wheat, sack: Wheat, corn: Wheat, flower: FlowerIcon, "circle-slice-8": Sprout,
  "chili-hot": Flame, "fruit-cherries": Sprout, "circle-multiple": Sprout,
  "oval-outline": Sprout, barley: Wheat, seed: Sprout, "seed-outline": Sprout,
  "seed-circle": Sprout, "flower-outline": FlowerIcon, leaf: Leaf,
  "white-balance-sunny": Sun, grass: Leaf, "dots-hexagon": FlowerIcon, circle: Sprout,
};

function CropSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [category, setCategory] = useState("all");

  const filtered = category === "all" ? CROPS : CROPS.filter((c) => c.category === category);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleContinue() {
    if (selected.length < 2) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("crops", selected.join(","));
    router.push(`/mandi-selection?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Select Crops</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-kisan-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: "65%" }} />
          </div>
          <span className="text-xs font-medium text-primary">65%</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-4">
        <div>
          <p className="font-semibold text-kisan-text dark:text-gray-100">Which crops do you deal with?</p>
          <p className="text-xs text-kisan-text-secondary mt-1">Select at least 2 crops ({selected.length} selected)</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CROP_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                category === cat.id ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600")}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {filtered.map((crop) => {
            const isSelected = selected.includes(crop.id);
            const Icon = CROP_ICONS[crop.icon] || Sprout;
            return (
              <button key={crop.id} onClick={() => toggle(crop.id)}
                className={cn("relative rounded-2xl p-3 border-2 flex flex-col items-center gap-2 transition-all",
                  isSelected ? "border-primary bg-primary/[0.06]" : "border-kisan-border bg-white dark:bg-gray-800 dark:border-gray-700")}>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: crop.color + "20" }}>
                  <Icon size={20} style={{ color: crop.color }} />
                </div>
                <span className={cn("text-xs font-medium text-center", isSelected ? "text-primary" : "text-kisan-text dark:text-gray-200")}>
                  {crop.name}
                </span>
              </button>
            );
          })}
        </div>

        <button onClick={handleContinue} disabled={selected.length < 2}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Continue ({selected.length} crops) <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default function CropSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kisan-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <CropSelectionContent />
    </Suspense>
  );
}
