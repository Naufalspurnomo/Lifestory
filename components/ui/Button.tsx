"use client";

import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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
    "bg-brand-gradient text-white shadow-cta hover:shadow-cta-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
  secondary:
    "border border-cream-300 bg-cream-50/90 text-ink-700 hover:border-brand-300 hover:bg-cream-50 hover:shadow-soft active:scale-[0.98]",
  ghost: "text-ink-600 hover:bg-cream-100 hover:text-ink-800 active:scale-[0.98]",
  outline:
    "border border-ink-700/15 bg-transparent text-ink-700 hover:bg-cream-100 hover:border-ink-700/35 active:scale-[0.98]",
  dark: "bg-ink-900 text-cream-50 hover:bg-ink-800 shadow-elev active:scale-[0.98]",
  danger: "bg-danger text-white hover:opacity-90 shadow-elev active:scale-[0.98]",
  success: "bg-success text-white hover:opacity-90 shadow-elev active:scale-[0.98]",
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
    onClick,
    ...rest
  },
  ref
) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
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
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: variant === "primary" ? "rgba(255,255,255,0.6)" : "rgba(130,105,60,0.24)",
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

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
