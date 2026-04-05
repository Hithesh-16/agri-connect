"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, TrendingUp, ScanLine, MapPin, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/prices", label: "Prices", icon: TrendingUp },
  { href: "/scanner", label: "Scan", icon: ScanLine },
  { href: "/markets", label: "Markets", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-kisan-border dark:border-gray-700 pb-safe">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isCenter = item.href === "/scanner";

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    isActive
                      ? "bg-primary shadow-primary/30"
                      : "bg-primary/90 shadow-primary/20"
                  )}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium",
                    isActive ? "text-primary" : "text-kisan-text-light"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[56px]"
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-primary" : "text-kisan-text-light"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-kisan-text-light"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
