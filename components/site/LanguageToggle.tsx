"use client";

import { useLanguage, type Locale } from "../providers/LanguageProvider";

type Props = {
  className?: string;
};

const labels: Record<Locale, string> = {
  id: "ID",
  en: "EN",
};

export function LanguageToggle({ className = "" }: Props) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-pill border border-cream-300 bg-white/85 p-1 shadow-soft ${className}`.trim()}
      aria-label="Language switcher"
    >
      {(["id", "en"] as Locale[]).map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={`relative rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
              active
                ? "bg-brand-gradient text-white shadow-cta"
                : "text-ink-500 hover:text-ink-800"
            }`}
            aria-pressed={active}
          >
            {labels[item]}
          </button>
        );
      })}
    </div>
  );
}
