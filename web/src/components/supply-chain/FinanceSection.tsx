"use client";

import React from "react";
import { Landmark, Coins, CheckCircle } from "lucide-react";

export function FinanceSection() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
        Financing Platforms
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-3">
        <div
          className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#3B82F615" }}
        >
          <Landmark size={28} className="text-kisan-blue" />
        </div>
        <h4 className="font-bold text-lg text-kisan-text dark:text-gray-100">
          RXIL
        </h4>
        <p className="text-[13px] text-kisan-text-secondary">
          RBI Backed &middot; Invoice Discounting
        </p>
        <p className="text-[13px] text-kisan-text-secondary leading-5">
          RXIL (Receivables Exchange of India) is backed by the Reserve Bank of
          India. It allows MSMEs &mdash; including cotton mills, traders, and
          agri-businesses &mdash; to discount unpaid invoices and receive
          immediate working capital.
        </p>
        <div className="space-y-2">
          {[
            "Instant working capital against invoices",
            "Competitive interest rates",
            "Digital onboarding - no branch visit",
            "Supports agri MSMEs across India",
            "Regulated by RBI - fully compliant",
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle
                size={16}
                className="text-kisan-green flex-shrink-0 mt-0.5"
              />
              <span className="text-[13px] text-kisan-text dark:text-gray-200">
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-3">
        <div
          className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#F5A62315" }}
        >
          <Coins size={28} className="text-accent" />
        </div>
        <h4 className="font-bold text-lg text-kisan-text dark:text-gray-100">
          Kisan Credit Card (KCC)
        </h4>
        <p className="text-[13px] text-kisan-text-secondary">
          Govt. Scheme &middot; Short Term Credit
        </p>
        <p className="text-[13px] text-kisan-text-secondary leading-5">
          Provides farmers with a revolving credit limit for crop cultivation,
          post-harvest expenses, and maintenance needs. Issued by nationalized
          banks and cooperative banks at subsidized interest rates (typically 4%
          p.a.).
        </p>
        <div className="space-y-2">
          {[
            "Credit limit up to Rs.3 lakh at 4% interest",
            "Covers crop production & allied activities",
            "Personal accident insurance included",
            "Valid for 5 years with annual renewal",
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle
                size={16}
                className="text-kisan-green flex-shrink-0 mt-0.5"
              />
              <span className="text-[13px] text-kisan-text dark:text-gray-200">
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
