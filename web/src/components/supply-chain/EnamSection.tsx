"use client";

import React from "react";
import { Info, UserPlus, UserCheck, CheckCircle2 } from "lucide-react";

const ENAM_CONTENT = [
  {
    title: "Trader Registration on eNAM",
    Icon: UserPlus,
    color: "#1B6B3A",
    items: [
      { label: "Step 1", text: "Visit enam.gov.in and click 'Trader Registration'" },
      { label: "Step 2", text: "Upload valid trade license issued by local authority" },
      { label: "Step 3", text: "Provide PAN card, Aadhaar card, bank account details" },
      { label: "Step 4", text: "Register under the mandi/APMC where you operate" },
      { label: "Step 5", text: "Pay registration fee (varies by state, typically Rs.1,000-Rs.5,000)" },
      { label: "Note", text: "A valid mandi license (Arhat license) is mandatory for traders" },
    ],
  },
  {
    title: "Seller Registration on eNAM",
    Icon: UserCheck,
    color: "#3B82F6",
    items: [
      { label: "Login", text: "Use your Aadhaar-linked mobile number on enam.gov.in" },
      { label: "Cert 1", text: "Kisan Credit Card (KCC) or PM Kisan registration recommended" },
      { label: "Cert 2", text: "Land ownership documents / Patta / Passbook" },
      { label: "Cert 3", text: "Bank account with IFSC code (for direct payment)" },
      { label: "Process", text: "Upload crop details, grade, and quantity before bringing to mandi" },
      { label: "Benefit", text: "Payments credited directly to bank account within 24 hours of sale" },
    ],
  },
  {
    title: "eNAM Benefits",
    Icon: CheckCircle2,
    color: "#16A34A",
    items: [
      { label: "Price", text: "Transparent online bidding - farmers get best market price" },
      { label: "Reach", text: "Sell to buyers across India, not just local traders" },
      { label: "Payment", text: "Secure online payment - no cash handling" },
      { label: "Grade", text: "Standardized assaying and grading before bidding" },
      { label: "Mobile", text: "Available via eNAM mobile app on Android and iOS" },
    ],
  },
];

export function EnamSection() {
  return (
    <div className="space-y-4">
      <div className="bg-primary/[0.08] border border-primary/20 rounded-2xl p-4 space-y-2">
        <Info size={22} className="text-primary" />
        <h3 className="font-bold text-base text-kisan-text dark:text-gray-100">
          National Agriculture Market
        </h3>
        <p className="text-[13px] text-kisan-text-secondary leading-5">
          eNAM (Electronic National Agriculture Market) is an online trading
          platform that enables farmers, traders, and buyers to trade
          agricultural commodities transparently. Managed by the Ministry of
          Agriculture, Government of India.
        </p>
      </div>

      {ENAM_CONTENT.map((section) => (
        <div
          key={section.title}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: section.color + "15" }}
            >
              <section.Icon size={22} style={{ color: section.color }} />
            </div>
            <h4 className="font-bold text-[15px] text-kisan-text dark:text-gray-100 flex-1">
              {section.title}
            </h4>
          </div>
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md min-w-[56px] text-center flex-shrink-0"
                style={{
                  backgroundColor: section.color + "15",
                  color: section.color,
                }}
              >
                {item.label}
              </span>
              <p className="text-[13px] text-kisan-text-secondary leading-[18px]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
