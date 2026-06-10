"use client";

import { useLanguage, type Locale } from "../providers/LanguageProvider";
import { Globe } from "lucide-react";

type Props = {
  className?: string;
  compact?: boolean;
};

const labels: Record<Locale, string> = {
  id: "Indonesia",
  en: "English",
};

export function LanguageToggle({ className = "", compact = false }: Props) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`flex items-center rounded-full border border-ink-200/60 bg-cream-50/50 p-1 backdrop-blur-sm ${className}`.trim()} aria-label="Language switcher">
      <div className="flex items-center">
        {(["id", "en"] as Locale[]).map((item) => {
          const active = item === locale;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setLocale(item)}
              className={`relative px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                active ? "bg-ink-900 text-cream-50 shadow-sm" : "text-ink-400 hover:text-ink-900 hover:bg-cream-200/50"
              }`}
              aria-pressed={active}
            >
              {active && <Globe className="h-3 w-3" />}
              {compact ? item.toUpperCase() : labels[item]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
