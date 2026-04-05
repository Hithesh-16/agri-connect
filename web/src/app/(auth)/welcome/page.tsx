"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, CloudSun, MapPin, Sprout } from "lucide-react";

const FLOATING_TAGS = [
  { label: "Farmer", color: "#22C55E", top: "15%", left: "5%", delay: "0s" },
  { label: "Trader", color: "#60A5FA", top: "22%", right: "5%", delay: "0.5s" },
  { label: "Cotton", color: "#F5A623", top: "18%", right: "25%", delay: "1s" },
  { label: "Rice", color: "#FCD34D", top: "28%", left: "10%", delay: "1.5s" },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4A22] via-[#1B6B3A] to-[#2D8A50] flex flex-col relative overflow-hidden">
      {FLOATING_TAGS.map((tag) => (
        <div
          key={tag.label}
          className="absolute animate-float hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border"
          style={{
            top: tag.top,
            left: tag.left,
            right: tag.right,
            backgroundColor: tag.color + "22",
            borderColor: tag.color + "44",
            animationDelay: tag.delay,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span
            className="text-[11px] font-medium"
            style={{ color: tag.color }}
          >
            {tag.label}
          </span>
        </div>
      ))}

      <div className="flex-1 flex flex-col items-center justify-between px-7 py-12 max-w-md mx-auto w-full animate-fade-in-up">
        <div className="flex flex-col items-center gap-3 pt-10">
          <div className="w-[88px] h-[88px] rounded-full bg-white/[0.18] flex items-center justify-center border-2 border-white/30">
            <Sprout size={44} className="text-white" />
          </div>
          <h1 className="text-[34px] font-bold text-white tracking-tight">
            KisanConnect
          </h1>
          <p className="text-sm text-white/65 text-center">
            India&apos;s Agricultural Marketplace
          </p>
        </div>

        <div className="flex justify-center gap-7">
          {[
            { Icon: TrendingUp, label: "Live Prices" },
            { Icon: CloudSun, label: "Weather" },
            { Icon: MapPin, label: "Mandis" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5">
              <f.Icon size={22} className="text-accent-light" />
              <span className="text-xs font-medium text-white/75">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full bg-white/10 rounded-2xl py-4 px-3 flex">
          {[
            { value: "1,200+", label: "Mandis" },
            { value: "50L+", label: "Farmers" },
            { value: "200+", label: "Crops" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center">
              <p className="text-[22px] font-bold text-accent-light">
                {s.value}
              </p>
              <p className="text-[11px] text-white/60">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full bg-accent rounded-2xl py-4 text-white font-bold text-[17px] shadow-lg shadow-accent/40 hover:bg-accent-light transition-colors active:scale-[0.98]"
          >
            Get Started
            <ArrowRight size={20} />
          </Link>

          <Link
            href="/login"
            className="block w-full text-center py-3 text-white/70 font-medium text-sm hover:text-white/90 transition-colors"
          >
            Already registered? Login
          </Link>
        </div>

        <p className="text-[11px] text-white/40 text-center">
          Trusted by farmers across India
        </p>
      </div>
    </div>
  );
}
