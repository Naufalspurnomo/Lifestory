import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Eyebrow } from "./Eyebrow";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  eyebrowIcon?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "white";
  className?: string;
  children?: ReactNode;
};

const titleSizeMap = {
  sm: "text-[clamp(1.6rem,3vw,2.2rem)]",
  md: "text-[clamp(2rem,4.4vw,3.4rem)]",
  lg: "text-[clamp(2.4rem,5.4vw,4rem)]",
};

export function SectionHeader({
  eyebrow,
  eyebrowIcon,
  title,
  lead,
  align = "left",
  size = "md",
  tone = "ink",
  className,
  children,
}: SectionHeaderProps) {
  const isWhite = tone === "white";
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className
      )}
    >
      {eyebrow && (
        <Eyebrow
          icon={eyebrowIcon}
          tone={isWhite ? "white" : "brand"}
          className="mb-4"
        >
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          "font-serif font-medium leading-[1.05] tracking-[-0.02em]",
          isWhite ? "text-white" : "text-ink-800",
          titleSizeMap[size],
          align === "center" ? "max-w-3xl" : "max-w-4xl"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed md:text-lg",
            isWhite ? "text-white/80" : "text-ink-500",
            align === "center" ? "max-w-2xl" : "max-w-2xl"
          )}
        >
          {lead}
        </p>
      )}
      {children}
    </div>
  );
}
