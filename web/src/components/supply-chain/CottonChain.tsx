"use client";

import React from "react";
import { TrendingUp, TrendingDown, Ruler, CircleDot, Lightbulb, Dumbbell, UserCircle, Scale, Factory, Building2, Shirt, Sprout, Landmark } from "lucide-react";

const COTTON_PRICES = [
  { exchange: "NCDEX (India)", code: "COCUDAKL", price: "Rs.6,485", change: "+Rs.120", isUp: true },
  { exchange: "NYBOT (New York)", code: "CT1!", price: "$0.748/lb", change: "-$0.003", isUp: false },
  { exchange: "ZCE (Zhengzhou)", code: "CF", price: "CNY15,220", change: "+CNY85", isUp: true },
];

const QUALITY_PARAMS = [
  { param: "Staple Length", value: "130.5 mm", Icon: Ruler },
  { param: "Micronaire", value: "4 mm", Icon: CircleDot },
  { param: "Reflectance (RD)", value: "77", Icon: Lightbulb },
  { param: "Strength", value: "23+ GTEX", Icon: Dumbbell },
];

const CHAIN_STEPS = [
  { step: 1, title: "Farmer Sells Cotton", color: "#16A34A", Icon: UserCircle, buyers: ["CCI (Cotton Corporation of India)", "Private Dealers"], note: "MSP set by government. Moisture content and quality parameters determine final price." },
  { step: 2, title: "Price Determination", color: "#F59E0B", Icon: Scale, buyers: ["MSP baseline", "Moisture content testing", "Quality grade A/B/C"], note: "Staple: 130.5mm · Micronaire: 4mm · RD: 77 · Strength: 23+ GTEX" },
  { step: 3, title: "Cotton Manufacturing Unit", color: "#8B5CF6", Icon: Factory, buyers: ["Raw cotton to Cotton Bales", "Cotton separation", "Seed separation"], note: "Mills run 24/7 and need constant cotton supply. Example: Chityala Mill, Telangana." },
  { step: 4, title: "Corporate Buyers", color: "#3B82F6", Icon: Building2, buyers: ["Vardaman Textiles", "Arvind Textiles", "Gima"], note: "Cotton bales mostly sold to Rajasthan and Gujarat textile hubs." },
  { step: 5, title: "Final Products", color: "#EC4899", Icon: Shirt, buyers: ["Threads", "Fabrics", "Cloth"], note: "Corporates convert bales into finished textiles for retail and export." },
];

export function CottonChain() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
          Global Cotton Exchanges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {COTTON_PRICES.map((e) => (
            <div
              key={e.exchange}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-kisan-border dark:border-gray-700 space-y-1"
            >
              <p className="text-[10px] font-medium text-kisan-text-secondary">
                {e.exchange}
              </p>
              <p className="text-[11px] font-semibold text-kisan-text dark:text-gray-200">
                {e.code}
              </p>
              <p className="text-sm font-bold text-kisan-text dark:text-gray-100">
                {e.price}
              </p>
              <div
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: e.isUp ? "#22C55E18" : "#EF444418",
                }}
              >
                {e.isUp ? (
                  <TrendingUp size={12} color="#22C55E" />
                ) : (
                  <TrendingDown size={12} color="#EF4444" />
                )}
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: e.isUp ? "#22C55E" : "#EF4444" }}
                >
                  {e.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
          Cotton Bale Quality Parameters
        </h3>
        <p className="text-[13px] text-kisan-text-secondary">
          Standard parameters per Chityala Mill specifications
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_PARAMS.map((q) => (
            <div
              key={q.param}
              className="bg-white dark:bg-gray-800 rounded-xl p-3.5 flex flex-col items-center gap-1.5 border border-kisan-border dark:border-gray-700"
            >
              <q.Icon size={22} className="text-primary" />
              <p className="font-bold text-base text-kisan-text dark:text-gray-100">
                {q.value}
              </p>
              <p className="text-[11px] text-kisan-text-secondary text-center">
                {q.param}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
          Cotton Procurement Flow
        </h3>
        {CHAIN_STEPS.map((s, idx) => (
          <div key={s.step} className="flex gap-3">
            <div className="flex flex-col items-center w-8 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: s.color }}
              >
                {s.step}
              </div>
              {idx < CHAIN_STEPS.length - 1 && (
                <div
                  className="w-0.5 flex-1 min-h-[20px] mt-1"
                  style={{ backgroundColor: s.color + "40" }}
                />
              )}
            </div>
            <div className="flex-1 pb-5 space-y-2">
              <div className="flex items-center gap-2">
                <s.Icon size={18} style={{ color: s.color }} />
                <span className="font-bold text-sm text-kisan-text dark:text-gray-100">
                  {s.title}
                </span>
              </div>
              {s.buyers.map((b, bi) => (
                <div key={bi} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[13px] text-kisan-text-secondary">
                    {b}
                  </span>
                </div>
              ))}
              <div
                className="rounded-xl p-2.5"
                style={{ backgroundColor: s.color + "10" }}
              >
                <p
                  className="text-xs font-medium leading-[18px]"
                  style={{ color: s.color }}
                >
                  {s.note}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent/[0.06] border border-accent/30 rounded-2xl p-4 space-y-2">
        <Sprout size={24} className="text-accent" />
        <p className="font-bold text-[15px] text-kisan-text dark:text-gray-100">
          Cotton Seeds Business
        </p>
        <p className="text-[13px] text-kisan-text-secondary leading-5">
          Cotton seeds separated during processing are sold separately to oil
          manufacturers via auction on the{" "}
          <span className="font-semibold text-accent">ENVIDA platform</span>.
          This generates additional revenue for mills.
        </p>
      </div>

      <div className="bg-kisan-blue/[0.06] border border-kisan-blue/30 rounded-2xl p-4 space-y-2">
        <Landmark size={24} className="text-kisan-blue" />
        <p className="font-bold text-[15px] text-kisan-blue">
          RXIL &mdash; Invoice Financing
        </p>
        <p className="text-[13px] text-kisan-text-secondary leading-5">
          RXIL is an RBI-backed MSME invoice discounting platform. Mills and
          traders can use it to get working capital by discounting unpaid
          invoices. Helps solve payment delay issues in the cotton supply chain.
        </p>
      </div>
    </div>
  );
}
