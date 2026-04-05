"use client";

import React, { useState, useMemo } from "react";
import { Award, ExternalLink, ChevronDown, ChevronUp, Shield, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  useSchemes,
  checkEligibility,
  SCHEME_CATEGORIES,
  type SchemeCategory,
  type EligibilityStatus,
  type GovernmentScheme,
} from "@/hooks/useSchemes";

const ELIGIBILITY_CONFIG: Record<
  EligibilityStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  eligible: {
    label: "Eligible",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle2,
  },
  maybe: {
    label: "May be eligible",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: AlertCircle,
  },
  not_eligible: {
    label: "Not eligible",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
};

export default function SchemesPage() {
  const user = useAuthStore((s) => s.user);
  const { data: schemes, isLoading } = useSchemes();
  const [categoryFilter, setCategoryFilter] = useState<SchemeCategory | "all">("all");
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const userRole = user?.role || "farmer";
  const userState = user?.state || "Telangana";

  const filteredSchemes = useMemo(() => {
    if (!schemes) return [];
    let result = schemes;
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }
    return result;
  }, [schemes, categoryFilter]);

  const eligibleCount = useMemo(() => {
    if (!schemes) return 0;
    return schemes.filter((s) => checkEligibility(s, userRole, userState) === "eligible").length;
  }, [schemes, userRole, userState]);

  const toggleDocs = (schemeId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(schemeId)) next.delete(schemeId);
      else next.add(schemeId);
      return next;
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Government Schemes</h1>
          <p className="text-xs text-kisan-text-secondary">Financial support and benefits for farmers</p>
        </div>
      </div>

      {/* Eligibility Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-kisan-text dark:text-gray-100">
              Based on your profile ({userRole === "farmer" ? "Farmer" : userRole === "trader" ? "Trader" : userRole === "dealer" ? "Dealer" : "Corporate"} in {userState})
            </p>
            <p className="text-xs text-kisan-text-secondary mt-0.5">
              You are eligible for <span className="font-bold text-primary">{eligibleCount} schemes</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {SCHEME_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id as SchemeCategory | "all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              categoryFilter === cat.id
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700 hover:border-primary/40"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Scheme Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              eligibility={checkEligibility(scheme, userRole, userState)}
              docsExpanded={expandedDocs.has(scheme.id)}
              onToggleDocs={() => toggleDocs(scheme.id)}
            />
          ))}
          {filteredSchemes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-kisan-text-secondary text-sm">No schemes found for this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SchemeCard({
  scheme,
  eligibility,
  docsExpanded,
  onToggleDocs,
}: {
  scheme: GovernmentScheme;
  eligibility: EligibilityStatus;
  docsExpanded: boolean;
  onToggleDocs: () => void;
}) {
  const config = ELIGIBILITY_CONFIG[eligibility];
  const EligIcon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Title + Eligibility */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-kisan-text dark:text-gray-100">{scheme.name}</h3>
            {scheme.nameLocal && (
              <p className="text-xs text-kisan-text-light mt-0.5">{scheme.nameLocal}</p>
            )}
          </div>
          <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", config.bg, config.color)}>
            <EligIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-kisan-text-secondary leading-relaxed">{scheme.description}</p>

        {/* Benefit */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
          <p className="text-xs text-kisan-text-light mb-0.5">Benefit</p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">{scheme.benefit}</p>
        </div>

        {/* Documents */}
        <button
          onClick={onToggleDocs}
          className="flex items-center gap-2 text-sm font-medium text-kisan-text-secondary hover:text-kisan-text dark:hover:text-gray-200 transition-colors"
        >
          {docsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Required Documents ({scheme.documents.length})
        </button>
        {docsExpanded && (
          <ul className="space-y-1.5 pl-2">
            {scheme.documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-kisan-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-kisan-text-light flex-shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        )}

        {/* Apply Button */}
        <a
          href={scheme.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            eligibility === "not_eligible"
              ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          )}
          onClick={(e) => {
            if (eligibility === "not_eligible") e.preventDefault();
          }}
        >
          <ExternalLink className="w-4 h-4" />
          Apply Now
        </a>
      </div>
    </div>
  );
}
