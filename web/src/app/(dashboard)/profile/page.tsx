"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, MapPin, Globe, Wheat, BarChart3, Bell, ChevronRight,
  TrendingUp, ScanLine, Newspaper, ExternalLink, LogOut, HelpCircle,
  MessageCircle, Info, Palette, Languages, BellRing, Sprout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CROPS } from "@/hooks/useCrops";
import { MANDIS } from "@/hooks/useMandis";
import { useI18n, LOCALE_LABELS, type Locale } from "@/lib/i18n";

const ROLE_COLORS: Record<string, string> = {
  farmer: "#22C55E",
  trader: "#3B82F6",
  dealer: "#F59E0B",
  corporate: "#8B5CF6",
};

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { locale, setLocale } = useI18n();

  if (!user) return null;

  const userCrops = CROPS.filter((c) => user.selectedCropIds?.includes(c.id));
  const userMandis = MANDIS.filter((m) => user.selectedMandiIds?.includes(m.id));
  const initials = `${user.firstName?.[0] || ""}${user.surname?.[0] || ""}`.toUpperCase();
  const roleColor = ROLE_COLORS[user.role] || "#6B7280";

  function handleSignOut() {
    signOut();
    router.replace("/welcome");
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      {/* User Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-kisan-text dark:text-gray-100">{user.firstName} {user.surname}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white" style={{ backgroundColor: roleColor }}>
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-kisan-text-secondary">
              {user.mobile && <span className="flex items-center gap-1"><Phone size={12} /> +91 {user.mobile}</span>}
              {user.village && <span className="flex items-center gap-1"><MapPin size={12} /> {user.village}{user.district ? `, ${user.district}` : ""}</span>}
              {user.language && <span className="flex items-center gap-1"><Globe size={12} /> {user.language}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 text-center">
          <Wheat size={22} className="text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-kisan-text dark:text-gray-100">{userCrops.length}</p>
          <p className="text-xs text-kisan-text-secondary">Crops</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 text-center">
          <MapPin size={22} className="text-kisan-blue mx-auto mb-1" />
          <p className="text-xl font-bold text-kisan-text dark:text-gray-100">{userMandis.length}</p>
          <p className="text-xs text-kisan-text-secondary">Mandis</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 text-center">
          <Bell size={22} className="text-accent mx-auto mb-1" />
          <p className="text-xl font-bold text-kisan-text dark:text-gray-100">5</p>
          <p className="text-xs text-kisan-text-secondary">Alerts</p>
        </div>
      </div>

      {/* My Crops */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
        <p className="font-semibold text-kisan-text dark:text-gray-100 mb-3">My Crops</p>
        <div className="flex flex-wrap gap-2">
          {userCrops.map((crop) => (
            <span key={crop.id} className="px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ borderColor: crop.color + "40", backgroundColor: crop.color + "10", color: crop.color }}>
              {crop.name}
            </span>
          ))}
        </div>
      </div>

      {/* My Mandis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
        <p className="font-semibold text-kisan-text dark:text-gray-100 mb-3">My Mandis</p>
        <div className="space-y-2">
          {userMandis.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-kisan-text dark:text-gray-200">{m.name}</p>
                <p className="text-xs text-kisan-text-secondary">{m.district}</p>
              </div>
              <span className="text-xs text-primary font-medium">{m.distanceKm} km</span>
            </div>
          ))}
        </div>
      </div>

      {/* Market Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        <p className="font-semibold text-kisan-text dark:text-gray-100 p-5 pb-0">Market Activity</p>
        {[
          { label: "Price Watchlist", Icon: TrendingUp, href: "/prices" },
          { label: "Nearby Mandis", Icon: MapPin, href: "/markets" },
          { label: "Disease Scanner", Icon: ScanLine, href: "/scanner" },
          { label: "Market News", Icon: Newspaper, href: "/home" },
        ].map((item) => (
          <button key={item.label} onClick={() => router.push(item.href)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0">
            <item.Icon size={18} className="text-kisan-text-light" />
            <span className="text-sm text-kisan-text dark:text-gray-200 flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-kisan-text-light" />
          </button>
        ))}
      </div>

      {/* eNAM Portal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        <p className="font-semibold text-kisan-text dark:text-gray-100 p-5 pb-0">eNAM Portal</p>
        {[
          { label: "eNAM Registration", desc: "Register on National Agriculture Market" },
          { label: "Trader Registration", desc: "Guide for trader onboarding" },
          { label: "Seller Certification FAQ", desc: "Documents and requirements" },
        ].map((item) => (
          <button key={item.label} onClick={() => router.push("/supply-chain")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0">
            <ExternalLink size={18} className="text-kisan-text-light" />
            <div className="flex-1 text-left">
              <p className="text-sm text-kisan-text dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-kisan-text-light">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-kisan-text-light" />
          </button>
        ))}
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        <p className="font-semibold text-kisan-text dark:text-gray-100 p-5 pb-0">Preferences</p>
        {/* Language Selector */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-kisan-border/50 dark:border-gray-700/50">
          <Languages size={18} className="text-kisan-text-light" />
          <span className="text-sm text-kisan-text dark:text-gray-200 flex-1">Language</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-kisan-bg dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-kisan-text dark:text-gray-200 border border-kisan-border dark:border-gray-600 outline-none cursor-pointer"
          >
            {(["en", "te", "hi"] as Locale[]).map((loc) => (
              <option key={loc} value={loc}>{LOCALE_LABELS[loc]}</option>
            ))}
          </select>
        </div>
        {/* Other preferences */}
        {[
          { label: "Notifications", Icon: BellRing, value: "Enabled" },
          { label: "Appearance", Icon: Palette, value: "Light" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0">
            <item.Icon size={18} className="text-kisan-text-light" />
            <span className="text-sm text-kisan-text dark:text-gray-200 flex-1">{item.label}</span>
            <span className="text-xs text-kisan-text-secondary">{item.value}</span>
            <ChevronRight size={16} className="text-kisan-text-light" />
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        <p className="font-semibold text-kisan-text dark:text-gray-100 p-5 pb-0">Support</p>
        {[
          { label: "Help & FAQ", Icon: HelpCircle },
          { label: "WhatsApp Support", Icon: MessageCircle },
          { label: "About KisanConnect", Icon: Info },
        ].map((item) => (
          <button key={item.label} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors border-b border-kisan-border/50 dark:border-gray-700/50 last:border-0">
            <item.Icon size={18} className="text-kisan-text-light" />
            <span className="text-sm text-kisan-text dark:text-gray-200 flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-kisan-text-light" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button onClick={() => setShowSignOutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-kisan-red/10 text-kisan-red rounded-2xl font-semibold text-sm border border-kisan-red/20 hover:bg-kisan-red/20 transition-colors">
        <LogOut size={18} /> Sign Out
      </button>

      {/* Sign Out Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-kisan-text dark:text-gray-100 mb-2">Sign Out?</h3>
            <p className="text-sm text-kisan-text-secondary mb-5">Are you sure you want to sign out of KisanConnect?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-kisan-border dark:border-gray-600 text-kisan-text-secondary font-semibold text-sm">
                Cancel
              </button>
              <button onClick={handleSignOut}
                className="flex-1 py-3 rounded-xl bg-kisan-red text-white font-semibold text-sm">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
