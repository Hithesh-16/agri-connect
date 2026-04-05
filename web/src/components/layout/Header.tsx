"use client";

import React from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggleDarkMode() {
    const newDark = !dark;
    setDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-kisan-border dark:border-gray-700 sticky top-0 z-30">
      <div>
        <p className="text-sm text-kisan-text-secondary dark:text-gray-400">
          Jai Kisan, {user?.firstName || "Farmer"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors"
        >
          {dark ? (
            <Sun className="w-5 h-5 text-kisan-text-secondary" />
          ) : (
            <Moon className="w-5 h-5 text-kisan-text-secondary" />
          )}
        </button>
        <button className="relative p-2.5 rounded-xl hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors">
          <Bell className="w-5 h-5 text-kisan-text-secondary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
          {(user?.firstName?.[0] || "F").toUpperCase()}
        </div>
      </div>
    </header>
  );
}
