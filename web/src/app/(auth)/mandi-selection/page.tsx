"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, MapPin, BarChart3, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANDIS } from "@/hooks/useMandis";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

const RADIUS_OPTIONS = [
  { label: "All", value: 999 },
  { label: "< 50 km", value: 50 },
  { label: "< 100 km", value: 100 },
  { label: "< 200 km", value: 200 },
];

function MandiSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);
  const [selected, setSelected] = useState<string[]>([]);
  const [radius, setRadius] = useState(999);

  const filtered = MANDIS.filter((m) => m.distanceKm <= radius).sort((a, b) => a.distanceKm - b.distanceKm);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleComplete() {
    if (selected.length < 1) return;
    const crops = (searchParams.get("crops") || "wheat,rice").split(",");
    signIn({
      mobile: searchParams.get("mobile") || "",
      aadhaar: searchParams.get("aadhaar") || undefined,
      firstName: searchParams.get("firstName") || "Farmer",
      surname: searchParams.get("surname") || "",
      role: (searchParams.get("role") || "farmer") as UserRole,
      village: searchParams.get("village") || "",
      district: searchParams.get("district") || "",
      state: searchParams.get("state") || "Telangana",
      gender: (searchParams.get("gender") || undefined) as "male" | "female" | "other" | undefined,
      language: searchParams.get("language") || "English",
      updatesConsent: searchParams.get("consent") !== "0",
      selectedCropIds: crops,
      selectedMandiIds: selected,
      lastActive: Date.now(),
    });
    router.replace("/home");
  }

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Select Mandis</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-kisan-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: "90%" }} />
          </div>
          <span className="text-xs font-medium text-primary">90%</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-4">
        <div>
          <p className="font-semibold text-kisan-text dark:text-gray-100">Select your nearby mandis</p>
          <p className="text-xs text-kisan-text-secondary mt-1">Select at least 1 mandi ({selected.length} selected)</p>
        </div>

        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRadius(opt.value)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                radius === opt.value ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600")}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filtered.map((mandi) => {
            const isSelected = selected.includes(mandi.id);
            return (
              <button key={mandi.id} onClick={() => toggle(mandi.id)}
                className={cn("w-full text-left rounded-2xl p-4 border-2 transition-all",
                  isSelected ? "border-primary bg-primary/[0.04]" : "border-kisan-border bg-white dark:bg-gray-800 dark:border-gray-700")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-semibold text-[15px]", isSelected ? "text-primary" : "text-kisan-text dark:text-gray-100")}>{mandi.name}</p>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-kisan-text-secondary mt-0.5">{mandi.district}, {mandi.state}</p>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{mandi.distanceKm} km</span>
                </div>
                <div className="flex items-center gap-4 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={13} className="text-kisan-text-light" />
                    <span className="text-xs text-kisan-text-secondary">{mandi.volume}/day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wheat size={13} className="text-kisan-text-light" />
                    <span className="text-xs text-kisan-text-secondary">{mandi.activeCrops} crops</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-kisan-text-light" />
                    <span className="text-xs text-kisan-text-secondary">{mandi.district}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={handleComplete} disabled={selected.length < 1}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-accent/40 hover:bg-accent-light transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Complete Registration
        </button>
      </div>
    </div>
  );
}

export default function MandiSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kisan-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <MandiSelectionContent />
    </Suspense>
  );
}
