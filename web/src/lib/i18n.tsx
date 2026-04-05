"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import en from "@/lib/translations/en.json";
import te from "@/lib/translations/te.json";
import hi from "@/lib/translations/hi.json";

export type Locale = "en" | "te" | "hi";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

type Translations = Record<string, unknown>;

const translationMap: Record<Locale, Translations> = { en, te, hi };

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = "kisan_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "en" || stored === "te" || stored === "hi")) {
      setLocaleState(stored as Locale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const value = getNestedValue(translationMap[locale], key);
      if (value === key) {
        // Fallback to English
        return getNestedValue(translationMap.en, key);
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
