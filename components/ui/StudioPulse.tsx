"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type Props = {
  city?: string;
  timeZone?: string;
  /** Light pill (default) or dark for dark backgrounds */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * StudioPulse — small live indicator chip showing local time + pulsing dot.
 * Mimics editorial / studio websites that signal "we're real, here, now".
 * Hydration-safe: renders a stable placeholder on first paint, then upgrades.
 */
export function StudioPulse({
  city = "Jakarta",
  timeZone = "Asia/Jakarta",
  tone = "light",
  className,
}: Props) {
  const [now, setNow] = useState<string>("--:--");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function tick() {
      const d = new Date();
      const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      });
      setNow(time);
    }
    tick();
    setMounted(true);
    const id = window.setInterval(tick, 30 * 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  const isDark = tone === "dark";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-pill border px-3.5 py-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.18em] backdrop-blur-sm",
        isDark
          ? "border-white/15 bg-white/5 text-white/80"
          : "border-cream-300 bg-white/80 text-ink-500",
        className
      )}
      aria-label={`Studio time in ${city}: ${now}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5 flex-none items-center justify-center">
        <span className="absolute inline-block h-1.5 w-1.5 animate-ping rounded-full bg-success/75" />
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(58,110,68,0.7)]" />
      </span>
      <span>
        {city} <span className="opacity-50">·</span> {mounted ? now : "—:—"} WIB
      </span>
    </span>
  );
}
