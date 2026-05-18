"use client";

import Link from "next/link";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

type Variant = "navbar" | "navbar-compact" | "footer" | "hero";

type Props = {
  variant?: Variant;
  className?: string;
  /** Disable the link wrap (e.g. when used inside another Link) */
  asPlain?: boolean;
};

const dimensionMap: Record<Variant, {
  seal: string;
  letter: string;
  word: string;
  tag: string;
  gap: string;
  showTag: boolean;
}> = {
  navbar: {
    seal: "h-10 w-10",
    letter: "text-[19px]",
    word: "text-[clamp(1.45rem,2.2vw,1.75rem)]",
    tag: "text-[8px]",
    gap: "gap-2.5",
    showTag: true,
  },
  "navbar-compact": {
    seal: "h-8 w-8",
    letter: "text-[16px]",
    word: "text-[clamp(1.25rem,2vw,1.5rem)]",
    tag: "text-[7px]",
    gap: "gap-2",
    showTag: false,
  },
  footer: {
    seal: "h-12 w-12",
    letter: "text-[22px]",
    word: "text-[clamp(1.7rem,2.6vw,2rem)]",
    tag: "text-[9px]",
    gap: "gap-3",
    showTag: true,
  },
  hero: {
    seal: "h-16 w-16",
    letter: "text-[28px]",
    word: "text-[clamp(2rem,3vw,2.4rem)]",
    tag: "text-[10px]",
    gap: "gap-4",
    showTag: true,
  },
};

/**
 * BrandLogo — Lifestory.co identity lockup.
 *
 * Seal monogram (SVG) + Playfair wordmark.
 * Designed to read as a heritage publishing colophon, not a tech logo.
 */
export function BrandLogo({
  variant = "navbar",
  className,
  asPlain,
}: Props) {
  const dims = dimensionMap[variant];
  const gradId = useId();
  const innerGradId = useId();
  const reduce = useReducedMotion();

  const content = (
    <motion.span
      className={cn(
        "group inline-flex items-center",
        dims.gap,
        className
      )}
      whileHover={reduce ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* === Monogram seal === */}
      <span
        className={cn(
          "relative inline-flex flex-none items-center justify-center",
          dims.seal
        )}
        aria-hidden
      >
        {/* Outer rotating ring */}
        <motion.svg
          viewBox="0 0 48 48"
          className="absolute inset-0 h-full w-full"
          fill="none"
          whileHover={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="4"
              y1="4"
              x2="44"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#f3d791" />
              <stop offset="40%" stopColor="#e6ab2f" />
              <stop offset="100%" stopColor="#82693c" />
            </linearGradient>
            <linearGradient
              id={innerGradId}
              x1="0"
              y1="0"
              x2="48"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fdf8eb" />
              <stop offset="100%" stopColor="#faedca" />
            </linearGradient>
          </defs>

          {/* Filled background */}
          <circle cx="24" cy="24" r="21.5" fill={`url(#${innerGradId})`} />
          {/* Outer ring */}
          <circle
            cx="24"
            cy="24"
            r="21.5"
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
          />
          {/* Inner dashed ring */}
          <circle
            cx="24"
            cy="24"
            r="17.5"
            stroke="#cc8a12"
            strokeWidth="0.5"
            strokeOpacity="0.5"
            strokeDasharray="1.5 2"
          />
          {/* Top fleuron */}
          <g transform="translate(24 7.5)">
            <path
              d="M0 -2.4 L0.7 -0.4 L2.7 0 L0.7 0.4 L0 2.4 L-0.7 0.4 L-2.7 0 L-0.7 -0.4 Z"
              fill={`url(#${gradId})`}
            />
          </g>
          {/* Bottom fleuron */}
          <g transform="translate(24 40.5)">
            <path
              d="M0 -2.4 L0.7 -0.4 L2.7 0 L0.7 0.4 L0 2.4 L-0.7 0.4 L-2.7 0 L-0.7 -0.4 Z"
              fill={`url(#${gradId})`}
            />
          </g>
          {/* Side dots */}
          <circle cx="6.5" cy="24" r="0.9" fill="#cc8a12" fillOpacity="0.7" />
          <circle cx="41.5" cy="24" r="0.9" fill="#cc8a12" fillOpacity="0.7" />
        </motion.svg>

        {/* Subtle hover gleam */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-1 overflow-hidden rounded-full"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-smooth group-hover:translate-x-full" />
        </span>

        {/* Center "L" letter */}
        <motion.span
          className={cn(
            "relative z-10 font-serif font-semibold leading-none text-ink-800 transition-colors duration-300 group-hover:text-brand-700",
            dims.letter
          )}
          whileHover={reduce ? {} : { scale: 1.1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          L
        </motion.span>
      </span>

      {/* === Wordmark === */}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif font-medium leading-[1] tracking-[-0.025em] text-ink-800",
            dims.word
          )}
        >
          Lifestory<span className="text-brand-500 transition-colors duration-300 group-hover:text-brand-600">.co</span>
        </span>
        {dims.showTag && (
          <span
            className={cn(
              "mt-1 hidden font-bold uppercase leading-none tracking-[0.32em] text-brand-700/65 transition-colors duration-300 group-hover:text-brand-700 sm:inline",
              dims.tag
            )}
          >
            Biography Studio
          </span>
        )}
      </span>
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
