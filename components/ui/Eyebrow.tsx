import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  tone?: "brand" | "ink" | "white";
};

export function Eyebrow({
  children,
  className,
  icon,
  tone = "brand",
}: EyebrowProps) {
  const toneClass =
    tone === "white"
      ? "text-white/80 border-white/25 bg-white/10"
      : tone === "ink"
      ? "text-ink-500 border-cream-300 bg-cream-50/75"
      : "text-brand-700 border-cream-300 bg-cream-50/85";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm",
        toneClass,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
