"use client";

import React from "react";
import { AlertCircle, CloudSun, Store, RefreshCw } from "lucide-react";
import type { DiseaseResult } from "@/types";
import { TreatmentCard } from "./TreatmentCard";

interface ScanResultsProps {
  result: DiseaseResult;
  imageUrl: string | null;
  onReset: () => void;
}

const severityColors: Record<string, string> = {
  Mild: "#22C55E",
  Moderate: "#F97316",
  Severe: "#EF4444",
};

export function ScanResults({ result, imageUrl, onReset }: ScanResultsProps) {
  const sevColor = severityColors[result.severity] || "#F97316";

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border-l-4 border border-kisan-border dark:border-gray-700 flex items-start justify-between"
        style={{ borderLeftColor: "#1B6B3A" }}
      >
        <div>
          <p className="text-[13px] text-kisan-text-secondary">
            {result.cropName}
          </p>
          <p className="text-xl font-bold text-kisan-text dark:text-gray-100 mt-0.5">
            {result.diseaseName}
          </p>
        </div>
        <div className="flex flex-col items-center bg-primary/10 rounded-xl p-2.5">
          <span className="text-[22px] font-bold text-primary">
            {result.confidence}%
          </span>
          <span className="text-[10px] text-kisan-text-secondary">
            confidence
          </span>
        </div>
      </div>

      {imageUrl && (
        <div className="rounded-2xl overflow-hidden h-[180px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Scanned plant"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div
        className="flex items-center gap-2 rounded-xl p-3"
        style={{ backgroundColor: sevColor + "18" }}
      >
        <AlertCircle size={18} style={{ color: sevColor }} />
        <span className="text-sm font-semibold" style={{ color: sevColor }}>
          Severity: {result.severity}
        </span>
        <span className="text-[13px] text-kisan-text-secondary">
          &middot; {result.affectedArea}
        </span>
      </div>

      <div className="flex items-start gap-2.5 bg-kisan-blue/10 rounded-xl p-3">
        <CloudSun size={18} className="text-kisan-blue flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-kisan-text-secondary leading-[18px]">
          {result.weatherNote}
        </p>
      </div>

      <h3 className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">
        Treatment Recommendations
      </h3>
      {result.treatments.map((t, i) => (
        <TreatmentCard key={i} treatment={t} />
      ))}

      <div className="flex items-start gap-2.5 bg-primary/10 rounded-xl p-3">
        <Store size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-kisan-text-secondary leading-[18px]">
          {result.nearbyAdvisory}
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 border-[1.5px] border-primary rounded-xl py-3.5 text-primary font-semibold text-[15px] hover:bg-primary/5 transition-colors"
      >
        <RefreshCw size={20} />
        Scan Another Plant
      </button>
    </div>
  );
}
