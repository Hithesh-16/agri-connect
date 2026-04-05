"use client";

import React from "react";
import { Leaf, FlaskConical, ShieldCheck } from "lucide-react";

interface Treatment {
  type: "organic" | "chemical" | "preventive";
  action: string;
}

const treatmentConfig: Record<
  string,
  { Icon: React.ElementType; color: string }
> = {
  organic: { Icon: Leaf, color: "#22C55E" },
  chemical: { Icon: FlaskConical, color: "#3B82F6" },
  preventive: { Icon: ShieldCheck, color: "#F5A623" },
};

interface TreatmentCardProps {
  treatment: Treatment;
}

export function TreatmentCard({ treatment }: TreatmentCardProps) {
  const config = treatmentConfig[treatment.type] || treatmentConfig.organic;
  const { Icon, color } = config;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 flex items-start gap-3 border border-kisan-border dark:border-gray-700"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <Icon size={22} style={{ color }} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-semibold capitalize" style={{ color }}>
          {treatment.type}
        </p>
        <p className="text-[13px] text-kisan-text dark:text-gray-200 leading-[18px] mt-0.5">
          {treatment.action}
        </p>
      </div>
    </div>
  );
}
