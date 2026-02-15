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
      className={`inline-flex items-center rounded-full border border-[#dfcfb4] bg-white/88 p-1 ${className}`.trim()}
      aria-label="Language switcher"
    >
      {(["id", "en"] as Locale[]).map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
              active
                ? "bg-[#e4a429] text-white shadow-sm"
                : "text-[#6f6358] hover:bg-[#f8f2e7]"
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
