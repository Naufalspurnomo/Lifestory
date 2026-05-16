"use client";

import { cn } from "../../lib/utils";

/**
 * Ornament — small SVG decorations used across the brand.
 * All elements are aria-hidden by default; meant for visual accent only.
 */

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { w: number; h: number }> = {
  sm: { w: 24, h: 24 },
  md: { w: 40, h: 40 },
  lg: { w: 64, h: 64 },
};

type OrnamentProps = {
  className?: string;
  size?: Size;
};

/**
 * CornerFlourish — quarter-circle corner ornament.
 * Place absolute on a corner of a card.
 * Use `rotate-90 / 180 / 270` to mirror.
 */
export function CornerFlourish({ className, size = "md" }: OrnamentProps) {
  const s = sizeMap[size];
  return (
    <svg
      aria-hidden
      width={s.w}
      height={s.h}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-brand-400", className)}
    >
      <path
        d="M0 0 L0 64 C0 35 35 0 64 0 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M0 24 C 16 24, 24 16, 24 0"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="0.75"
        fill="none"
      />
      <path
        d="M0 12 C 8 12, 12 8, 12 0"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="0.5"
        fill="none"
      />
      <circle cx="3" cy="3" r="1.4" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Monogram — small "L" wordmark badge for backgrounds and section accents.
 */
export function Monogram({ className, size = "md" }: OrnamentProps) {
  const s = sizeMap[size];
  return (
    <svg
      aria-hidden
      width={s.w}
      height={s.h}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("text-brand-700", className)}
    >
      <circle
        cx="24"
        cy="24"
        r="22.5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="0.5"
      />
      <text
        x="50%"
        y="56%"
        textAnchor="middle"
        fontFamily="var(--font-playfair), serif"
        fontWeight="500"
        fontSize="22"
        fill="currentColor"
      >
        L
      </text>
      <circle cx="35" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * DividerMotif — thin horizontal divider with a centered diamond ornament.
 * Great between text-heavy sections.
 */
export function DividerMotif({
  className,
  width = 240,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      aria-hidden
      width={width}
      height="14"
      viewBox={`0 0 ${width} 14`}
      fill="none"
      className={cn("text-brand-400", className)}
    >
      <line
        x1="0"
        y1="7"
        x2={width / 2 - 14}
        y2="7"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="0.75"
      />
      <line
        x1={width / 2 + 14}
        y1="7"
        x2={width}
        y2="7"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="0.75"
      />
      <g transform={`translate(${width / 2 - 7} 0)`}>
        <path
          d="M7 1 L13 7 L7 13 L1 7 Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        <path
          d="M7 4 L10 7 L7 10 L4 7 Z"
          fill="#faf6ed"
        />
      </g>
    </svg>
  );
}

/**
 * RibbonBadge — small angled ribbon for "featured / signature" tags on cards.
 */
export function RibbonBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center bg-brand-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-cta",
        className
      )}
      style={{
        clipPath: "polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%)",
      }}
    >
      {children}
    </span>
  );
}

/**
 * GoldRule — gradient hairline used as decorative section divider.
 */
export function GoldRule({
  className,
  width = "w-16",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent",
        width,
        className
      )}
    />
  );
}

/**
 * StarBurst — small shimmer star for accents, scales by size prop.
 */
export function StarBurst({ className, size = "sm" }: OrnamentProps) {
  const s = sizeMap[size];
  return (
    <svg
      aria-hidden
      width={s.w}
      height={s.h}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-brand-400", className)}
    >
      <path
        d="M12 1 L13.6 9.4 L22 11 L13.6 12.6 L12 21 L10.4 12.6 L2 11 L10.4 9.4 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}

/**
 * FrameCorner — decorative L-shaped corner stroke (used as art-deco frame on hero).
 * Use with rotate utilities to place on each corner.
 */
export function FrameCorner({
  className,
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("text-brand-400", className)}
    >
      <path
        d="M2 18 L2 2 L18 2"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M2 26 L2 30 M2 12 L2 8"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="0.75"
      />
      <path
        d="M22 2 L26 2 M14 2 L10 2"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="0.75"
      />
      <circle cx="2" cy="2" r="1.4" fill="currentColor" />
    </svg>
  );
}
