"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  ArrowLeft,
  Sprout,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && user) {
      if (user.role !== "corporate" && user.role !== "dealer") {
        router.replace("/home");
      }
    }
    if (hydrated && !user) {
      router.replace("/welcome");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || (user.role !== "corporate" && user.role !== "dealer")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kisan-bg dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-kisan-bg dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-gray-800 border-r border-kisan-border dark:border-gray-700 h-screen sticky top-0">
        <div className="p-5 border-b border-kisan-border dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-kisan-text dark:text-gray-100">Admin</h1>
              <p className="text-[10px] text-kisan-text-light">KisanConnect</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-kisan-text-secondary hover:bg-kisan-bg hover:text-kisan-text dark:hover:bg-gray-700 dark:text-gray-400"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-kisan-text-light")} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-kisan-border dark:border-gray-700">
          <Link
            href="/home"
            className="flex items-center gap-2 text-sm text-kisan-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile header for admin */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-kisan-border dark:border-gray-700">
          <Link href="/home" className="flex items-center gap-2 text-sm text-kisan-text-secondary">
            <ArrowLeft className="w-4 h-4" />
            App
          </Link>
          <h1 className="font-bold text-kisan-text dark:text-gray-100">Admin Panel</h1>
          <div className="w-14" />
        </header>

        {/* Mobile nav tabs */}
        <div className="lg:hidden flex border-b border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-kisan-text-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
