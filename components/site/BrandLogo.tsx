"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

type Variant = "navbar" | "navbar-compact" | "footer" | "hero";

type Props = {
  variant?: Variant;
  className?: string;
  /** Disable the link wrap (e.g. when used inside another Link) */
  asPlain?: boolean;
};

const dimensionMap: Record<Variant, { height: number; className: string }> = {
  navbar: { height: 40, className: "h-10" },
  "navbar-compact": { height: 32, className: "h-8" },
  footer: { height: 48, className: "h-12" },
  hero: { height: 64, className: "h-16" },
};

/**
 * BrandLogo — Lifestory.co official logo image.
 * Uses the official logo asset in WebP format for crisp rendering at all sizes.
 */
export function BrandLogo({
  variant = "navbar",
  className,
  asPlain,
}: Props) {
  const dims = dimensionMap[variant];
  const reduce = useReducedMotion();

  const content = (
    <motion.span
      className={cn("group inline-flex items-center", className)}
      whileHover={reduce ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src="/logo/lifestory-logo.webp"
        alt="Lifestory.co — Biography Studio"
        width={3243}
        height={975}
        className={cn("w-auto object-contain", dims.className)}
        priority={variant === "navbar" || variant === "navbar-compact"}
        unoptimized={false}
      />
    </motion.span>
  );

  if (asPlain) return content;
  return (
    <Link
      href="/"
      aria-label="Lifestory.co — Biography Studio"
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-cream-100 rounded-pill"
    >
      {content}
    </Link>
  );
}
