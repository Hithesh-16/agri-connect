"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sprout, Store, Handshake, Building2, Smartphone, CreditCard, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAadhaar } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLES: { id: UserRole; label: string; Icon: React.ElementType; desc: string }[] = [
  { id: "farmer", label: "Farmer", Icon: Sprout, desc: "Sell crops directly" },
  { id: "trader", label: "Trader", Icon: Store, desc: "Buy & sell in bulk" },
  { id: "dealer", label: "Dealer", Icon: Handshake, desc: "Connect farmers & mills" },
  { id: "corporate", label: "Corporate", Icon: Building2, desc: "Source at scale" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("farmer");
  const [method, setMethod] = useState<"mobile" | "aadhaar">("mobile");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (method === "aadhaar") {
      if (aadhaar.replace(/\s/g, "").length !== 12)
        e.aadhaar = "Enter valid 12-digit Aadhaar number";
    } else {
      if (mobile.length !== 10 || !/^\d+$/.test(mobile))
        e.mobile = "Enter valid 10-digit mobile number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    const params = new URLSearchParams({
      mobile: method === "mobile" ? mobile : "",
      aadhaar: method === "aadhaar" ? aadhaar.replace(/\s/g, "") : "",
      role,
    });
    router.push(`/otp?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Create Account</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-5">
        <p className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">
          I am a
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "rounded-2xl p-4 border-2 text-left transition-all space-y-1.5",
                role === r.id
                  ? "border-primary bg-primary/[0.04]"
                  : "border-kisan-border bg-white dark:bg-gray-800 dark:border-gray-700"
              )}
            >
              <r.Icon
                size={26}
                className={
                  role === r.id
                    ? "text-primary"
                    : "text-kisan-text-secondary"
                }
              />
              <p
                className={cn(
                  "font-semibold text-[15px]",
                  role === r.id ? "text-primary" : "text-kisan-text-secondary"
                )}
              >
                {r.label}
              </p>
              <p className="text-xs text-kisan-text-light">{r.desc}</p>
            </button>
          ))}
        </div>

        <p className="font-semibold text-[15px] text-kisan-text dark:text-gray-100">
          Verify Identity
        </p>
        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700">
          <button
            onClick={() => setMethod("mobile")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
              method === "mobile"
                ? "bg-primary/15 text-primary"
                : "text-kisan-text-secondary"
            )}
          >
            <Smartphone size={18} />
            Mobile
          </button>
          <button
            onClick={() => setMethod("aadhaar")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
              method === "aadhaar"
                ? "bg-primary/15 text-primary"
                : "text-kisan-text-secondary"
            )}
          >
            <CreditCard size={18} />
            Aadhaar
          </button>
        </div>

        {method === "mobile" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">
              Mobile Number
            </label>
            <div
              className={cn(
                "flex items-center gap-2.5 bg-white dark:bg-gray-800 border-[1.5px] rounded-xl px-3.5 py-3.5",
                errors.mobile ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"
              )}
            >
              <span className="font-semibold text-[15px] text-kisan-text dark:text-gray-200">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ""));
                  setErrors({});
                }}
                placeholder="Enter 10-digit number"
                className="flex-1 bg-transparent outline-none text-base text-kisan-text dark:text-gray-100 placeholder:text-kisan-text-light"
              />
            </div>
            {errors.mobile && (
              <p className="text-xs text-kisan-red">{errors.mobile}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">
              Aadhaar Number
            </label>
            <div
              className={cn(
                "flex items-center gap-2.5 bg-white dark:bg-gray-800 border-[1.5px] rounded-xl px-3.5 py-3.5",
                errors.aadhaar ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"
              )}
            >
              <CreditCard size={20} className="text-kisan-text-secondary" />
              <input
                type="text"
                maxLength={14}
                value={aadhaar}
                onChange={(e) => {
                  setAadhaar(formatAadhaar(e.target.value));
                  setErrors({});
                }}
                placeholder="XXXX XXXX XXXX"
                className="flex-1 bg-transparent outline-none text-base text-kisan-text dark:text-gray-100 placeholder:text-kisan-text-light"
              />
            </div>
            {errors.aadhaar && (
              <p className="text-xs text-kisan-red">{errors.aadhaar}</p>
            )}
            <button className="flex items-center gap-1.5 text-primary text-[13px] font-medium py-1">
              <ScanLine size={18} />
              Scan Aadhaar Card
            </button>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors active:scale-[0.98]"
        >
          Continue
          <ArrowRight size={20} />
        </button>

        <p className="text-center text-xs text-kisan-text-light">
          By continuing, you agree to our{" "}
          <span className="text-primary cursor-pointer">Terms of Service</span>{" "}
          and{" "}
          <span className="text-primary cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
