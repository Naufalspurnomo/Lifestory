import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType;
  variant?: "soft" | "elev" | "outline" | "warm" | "dark";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
};

const variantMap = {
  soft: "border border-cream-300 bg-white/85 backdrop-blur-sm shadow-soft",
  elev: "border border-cream-300 bg-white shadow-elev",
  outline: "border border-cream-300 bg-transparent",
  warm: "border border-cream-300 bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_55%,#fff_100%)] shadow-soft",
  dark:
    "border border-ink-900/30 bg-gradient-to-br from-accent-900 via-accent-800 to-brand-800 text-white shadow-deep",
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6 md:p-7",
  lg: "p-7 md:p-9",
};

export function Card({
  as,
  variant = "soft",
  interactive,
  padding = "md",
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "relative rounded-card-lg transition duration-300 ease-smooth",
        variantMap[variant],
        paddingMap[padding],
        interactive &&
          "hover:-translate-y-1 hover:shadow-lift",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
