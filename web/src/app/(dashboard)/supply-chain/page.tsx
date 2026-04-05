"use client";

import React, { useState } from "react";
import {
  TrendingUp, ArrowRight, CheckCircle2, FileText, CreditCard,
  Building2, Truck, Factory, ShoppingBag, Wheat, Award, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Cotton Chain", "eNAM", "Finance"] as const;
type Tab = (typeof TABS)[number];

const EXCHANGES = [
  { name: "NCDEX", price: "₹62,400/bale", change: "+1.2%", up: true },
  { name: "NYBOT", price: "$0.82/lb", change: "-0.5%", up: false },
  { name: "ZCE", price: "¥15,200/tonne", change: "+0.8%", up: true },
];

const QUALITY_PARAMS = [
  { param: "Staple Length", value: "28-30 mm", grade: "Good" },
  { param: "Micronaire", value: "3.5-4.9", grade: "Premium" },
  { param: "Reflectance", value: "75%+", grade: "Standard" },
  { param: "Strength", value: "28+ g/tex", grade: "Good" },
];

const PROCUREMENT_STEPS = [
  { step: 1, title: "Farmer sells cotton", desc: "MSP baseline pricing, moisture testing at procurement center. Weight and quality assessment done on-site.", Icon: Wheat },
  { step: 2, title: "Price determination", desc: "Cotton graded as A/B/C based on quality parameters. Price set based on grade, staple length, and market conditions.", Icon: Award },
  { step: 3, title: "Cotton manufacturing unit", desc: "Raw cotton processed into bales at ginning mills. Each bale weighs ~170 kg. Quality testing per CIRCOT standards.", Icon: Factory },
  { step: 4, title: "Corporate buyers", desc: "Major buyers: Vardhman, Arvind Mills, Grasim Industries. Bulk procurement through auctions and direct contracts.", Icon: Building2 },
  { step: 5, title: "Final products", desc: "Bales converted to yarn, threads, and fabrics. Supplied to textile, garment, and home furnishing industries.", Icon: ShoppingBag },
];

const ENAM_TRADER_STEPS = [
  "Register on eNAM portal with business documents",
  "Submit PAN card, GST certificate, and trade license",
  "Pay one-time registration fee (₹2,000)",
  "Complete KYC verification with APMC",
  "Get unique trader ID and start bidding",
];

const ENAM_FARMER_DOCS = [
  "Aadhaar card (mandatory)",
  "Bank passbook / cancelled cheque",
  "Land ownership documents or pattadar passbook",
  "Recent passport-size photograph",
  "Mobile number linked to Aadhaar",
];

const ENAM_BENEFITS = [
  "Access to buyers across 1,361+ mandis nationwide",
  "Transparent price discovery through online bidding",
  "Direct payment to bank account within 24 hours",
  "Real-time price information for all commodities",
  "Reduced intermediary costs by up to 15%",
];

export default function SupplyChainPage() {
  const [tab, setTab] = useState<Tab>("Cotton Chain");

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Supply Chain & Finance</h1>

      {/* Tab Selector */}
      <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t ? "bg-primary text-white shadow-sm" : "text-kisan-text-secondary hover:text-kisan-text")}>
            {t}
          </button>
        ))}
      </div>

      {/* Cotton Chain Tab */}
      {tab === "Cotton Chain" && (
        <div className="space-y-5">
          {/* Exchange Prices */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <p className="font-semibold text-kisan-text dark:text-gray-100 mb-3">Global Cotton Exchanges</p>
            <div className="grid grid-cols-3 gap-3">
              {EXCHANGES.map((ex) => (
                <div key={ex.name} className="bg-kisan-bg dark:bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-xs text-kisan-text-secondary font-medium">{ex.name}</p>
                  <p className="text-lg font-bold text-kisan-text dark:text-gray-100 mt-1">{ex.price}</p>
                  <span className={cn("text-xs font-medium", ex.up ? "text-kisan-green" : "text-kisan-red")}>{ex.change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Parameters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <p className="font-semibold text-kisan-text dark:text-gray-100 mb-3">Cotton Bale Quality Parameters</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUALITY_PARAMS.map((q) => (
                <div key={q.param} className="bg-kisan-bg dark:bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-kisan-text-secondary">{q.param}</p>
                  <p className="text-sm font-bold text-kisan-text dark:text-gray-100 mt-1">{q.value}</p>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{q.grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Procurement Flow */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <p className="font-semibold text-kisan-text dark:text-gray-100 mb-4">Procurement Flow</p>
            <div className="space-y-4">
              {PROCUREMENT_STEPS.map((s, i) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <s.Icon size={20} className="text-primary" />
                    </div>
                    {i < PROCUREMENT_STEPS.length - 1 && <div className="w-0.5 flex-1 bg-kisan-border dark:bg-gray-600 mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-sm text-kisan-text dark:text-gray-100">Step {s.step}: {s.title}</p>
                    <p className="text-xs text-kisan-text-secondary mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cotton Seeds & RXIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-kisan-green/10 to-kisan-green/5 rounded-2xl p-5 border border-kisan-green/20">
              <Wheat size={24} className="text-kisan-green mb-2" />
              <p className="font-semibold text-kisan-text dark:text-gray-100">Cotton Seeds (ENVIDA)</p>
              <p className="text-xs text-kisan-text-secondary mt-1">Premium cotton seed platform for quality-tested seeds with higher yield potential.</p>
            </div>
            <div className="bg-gradient-to-br from-kisan-blue/10 to-kisan-blue/5 rounded-2xl p-5 border border-kisan-blue/20">
              <CreditCard size={24} className="text-kisan-blue mb-2" />
              <p className="font-semibold text-kisan-text dark:text-gray-100">RXIL Invoice Financing</p>
              <p className="text-xs text-kisan-text-secondary mt-1">RBI-backed invoice discounting for traders and mills. Quick access to working capital.</p>
            </div>
          </div>
        </div>
      )}

      {/* eNAM Tab */}
      {tab === "eNAM" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <p className="font-bold text-lg text-kisan-text dark:text-gray-100">National Agriculture Market (eNAM)</p>
            <p className="text-sm text-kisan-text-secondary mt-1">A pan-India electronic trading portal networking existing APMC mandis to create a unified national market for agricultural commodities.</p>
          </div>

          {/* Trader Registration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={20} className="text-primary" />
              <p className="font-semibold text-kisan-text dark:text-gray-100">Trader Registration</p>
            </div>
            <div className="space-y-3">
              {ENAM_TRADER_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-kisan-text dark:text-gray-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seller/Farmer Registration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={20} className="text-accent" />
              <p className="font-semibold text-kisan-text dark:text-gray-100">Seller / Farmer Registration</p>
            </div>
            <p className="text-xs text-kisan-text-secondary mb-3">Required Documents:</p>
            <div className="space-y-2">
              {ENAM_FARMER_DOCS.map((doc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-kisan-green flex-shrink-0" />
                  <p className="text-sm text-kisan-text dark:text-gray-200">{doc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className="text-kisan-green" />
              <p className="font-semibold text-kisan-text dark:text-gray-100">eNAM Benefits</p>
            </div>
            <div className="space-y-2.5">
              {ENAM_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <TrendingUp size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-kisan-text dark:text-gray-200">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {tab === "Finance" && (
        <div className="space-y-5">
          {/* RXIL */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={22} className="text-kisan-blue" />
              <p className="font-bold text-lg text-kisan-text dark:text-gray-100">RXIL (TReDS Platform)</p>
            </div>
            <p className="text-sm text-kisan-text-secondary mb-4">RBI-backed Receivables Exchange of India Limited - an invoice discounting platform for MSMEs, traders, and mills.</p>

            <div className="space-y-3">
              {[
                "Discount invoices within 24-48 hours",
                "Competitive interest rates (8-12% p.a.)",
                "No collateral required for approved invoices",
                "Digital KYC and paperless onboarding",
                "Access to 50+ financiers and banks",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-kisan-blue/5 rounded-xl p-3">
                  <CheckCircle2 size={16} className="text-kisan-blue flex-shrink-0" />
                  <p className="text-sm text-kisan-text dark:text-gray-200">{f}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KCC */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={22} className="text-kisan-green" />
              <p className="font-bold text-lg text-kisan-text dark:text-gray-100">Kisan Credit Card (KCC)</p>
            </div>
            <p className="text-sm text-kisan-text-secondary mb-4">Government scheme providing short-term credit to farmers for crop production, post-harvest, and consumption needs.</p>

            <div className="bg-kisan-green/10 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-kisan-text-secondary">Credit Limit</p>
                  <p className="text-lg font-bold text-kisan-text dark:text-gray-100">up to ₹3 Lakh</p>
                </div>
                <div>
                  <p className="text-xs text-kisan-text-secondary">Interest Rate</p>
                  <p className="text-lg font-bold text-kisan-green">4% p.a.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Short-term credit for crop production expenses",
                "Flexible repayment aligned with harvest cycles",
                "Personal accident insurance cover up to ₹50,000",
                "Available at all commercial and cooperative banks",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-kisan-green/5 rounded-xl p-3">
                  <CheckCircle2 size={16} className="text-kisan-green flex-shrink-0" />
                  <p className="text-sm text-kisan-text dark:text-gray-200">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
