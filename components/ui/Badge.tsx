import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral" | "accent";
  icon?: ReactNode;
  size?: "sm" | "md";
};

const toneMap = {
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  success: "border-[#cfe3d2] bg-[#f1faef] text-success",
  warning: "border-[#e9d4a3] bg-[#fff7e3] text-warning",
  danger: "border-[#e7c9c9] bg-[#fff4f4] text-danger",
  neutral: "border-cream-300 bg-white/80 text-ink-500",
  accent: "border-accent-200 bg-accent-50 text-accent-700",
};

const sizeMap = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-[11px]",
};

export function Badge({
  children,
  className,
  tone = "neutral",
  icon,
  size = "md",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border font-semibold uppercase tracking-[0.1em]",
        toneMap[tone],
        sizeMap[size],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
