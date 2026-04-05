"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  TrendingUp,
  MapPin,
  ScanLine,
  User,
  Link2,
  Sprout,
  Bell,
  Globe,
  CalendarDays,
  ShoppingBag,
  Award,
  MessagesSquare,
} from "lucide-react";
import { useI18n, LOCALE_LABELS, type Locale } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/prices", labelKey: "nav.prices", icon: TrendingUp },
  { href: "/markets", labelKey: "nav.markets", icon: MapPin },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/scanner", labelKey: "nav.scanner", icon: ScanLine },
  { href: "/supply-chain", labelKey: "nav.supplyChain", icon: Link2 },
  { href: "/marketplace", labelKey: "nav.marketplace", icon: ShoppingBag },
  { href: "/community", labelKey: "nav.community", icon: MessagesSquare },
  { href: "/schemes", labelKey: "nav.schemes", icon: Award },
  { href: "/alerts", labelKey: "nav.alerts", icon: Bell },
  { href: "/profile", labelKey: "nav.profile", icon: User },
];

const LOCALES: Locale[] = ["en", "te", "hi"];

export function Sidebar() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-gray-800 border-r border-kisan-border dark:border-gray-700 h-screen sticky top-0">
      <div className="p-5 border-b border-kisan-border dark:border-gray-700">
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-kisan-text dark:text-gray-100">
              {t("app.name")}
            </h1>
            <p className="text-[10px] text-kisan-text-light">
              {t("app.tagline")}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-kisan-text-secondary hover:bg-kisan-bg hover:text-kisan-text dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-kisan-text-light"
                )}
              />
              {t(item.labelKey)}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 px-2 py-2">
          <Globe size={14} className="text-kisan-text-light" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="flex-1 bg-transparent text-xs text-kisan-text-secondary outline-none cursor-pointer"
          >
            {LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 border-t border-kisan-border dark:border-gray-700">
        <p className="text-[10px] text-kisan-text-light text-center">
          KisanConnect v1.0.0
        </p>
      </div>
    </aside>
  );
}
