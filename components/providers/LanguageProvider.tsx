"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "id" | "en";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isHydrated: boolean;
};

const STORAGE_KEY = "lifestory-locale";
const DEFAULT_LOCALE: Locale = "id";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") {
      setLocaleState(stored);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (isHydrated) {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale, isHydrated]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, isHydrated }),
    [locale, setLocale, isHydrated]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
