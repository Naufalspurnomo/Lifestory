"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "dark"
  | "danger"
  | "success";

type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** When true, iconRight slides on hover (used for arrow CTAs) */
  animateRightIcon?: boolean;
  children: ReactNode;
};

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-pill font-semibold tracking-[0.04em] transition-all duration-300 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 disabled:cursor-not-allowed disabled:opacity-60";

const sizeMap: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-[11px] uppercase",
  sm: "px-4 py-2 text-xs uppercase",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-sm uppercase tracking-[0.12em]",
};

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-cta hover:shadow-cta-hover hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "border border-cream-300 bg-white/85 text-ink-700 hover:border-brand-300 hover:bg-white",
  ghost: "text-ink-600 hover:bg-cream-100 hover:text-ink-800",
  outline:
    "border border-ink-700/15 bg-transparent text-ink-700 hover:bg-cream-100 hover:border-ink-700/35",
  dark: "bg-ink-900 text-cream-50 hover:bg-ink-800 shadow-elev",
  danger: "bg-danger text-white hover:opacity-90 shadow-elev",
  success: "bg-success text-white hover:opacity-90 shadow-elev",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    block,
    loading,
    iconLeft,
    iconRight,
    animateRightIcon,
    children,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        sizeMap[size],
        variantMap[variant],
        block && "w-full",
        // shine sweep on primary on hover
        variant === "primary" &&
          "overflow-hidden before:absolute before:inset-0 before:translate-x-[-150%] before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-[150%]",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        iconLeft && <span className="relative inline-flex">{iconLeft}</span>
      )}
      <span className="relative">{children}</span>
      {iconRight && !loading && (
        <span
          className={cn(
            "relative inline-flex transition-transform duration-300",
            animateRightIcon && "group-hover/btn:translate-x-1"
          )}
        >
          {iconRight}
        </span>
      )}
    </button>
  );
});
