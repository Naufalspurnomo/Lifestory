import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
  block?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  block,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
  };

  // Luxury Warm Color Palette
  const variants: Record<string, string> = {
    // Primary: bg #82693c (gold-700) + text #ffffff
    primary:
      "bg-gold-700 text-white hover:bg-gold-800 focus:ring-gold-500 shadow-sm hover:shadow-md",
    // Secondary: bg #f2ede3 (gold-100) + text #1d1a14 + border #e6dbc7
    secondary:
      "border border-warm-200 bg-warm-100 text-warmText hover:bg-warm-200 focus:ring-gold-500",
    // Ghost: text only
    ghost:
      "text-warmMuted hover:bg-warm-100 hover:text-warmText focus:ring-gold-500",
  };

  return (
    <button
      className={cn(
        base,
        sizes[size],
        variants[variant],
        block && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
