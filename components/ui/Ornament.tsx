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

/**
 * FloralDivider — elegant floral ornament for section breaks.
 */
export function FloralDivider({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="120"
      height="32"
      viewBox="0 0 120 32"
      fill="none"
      className={cn("text-brand-400", className)}
    >
      {/* Center flower */}
      <circle cx="60" cy="16" r="3" fill="currentColor" fillOpacity="0.9" />
      <circle cx="60" cy="16" r="6" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5" />
      
      {/* Petals */}
      <path d="M60 10 Q58 8, 60 6 Q62 8, 60 10" fill="currentColor" fillOpacity="0.6" />
      <path d="M60 22 Q58 24, 60 26 Q62 24, 60 22" fill="currentColor" fillOpacity="0.6" />
      <path d="M66 16 Q68 14, 70 16 Q68 18, 66 16" fill="currentColor" fillOpacity="0.6" />
      <path d="M54 16 Q52 14, 50 16 Q52 18, 54 16" fill="currentColor" fillOpacity="0.6" />
      
      {/* Side ornaments */}
      <path d="M20 16 L40 16" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.75" />
      <path d="M80 16 L100 16" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.75" />
      <circle cx="20" cy="16" r="1.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="100" cy="16" r="1.5" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
}

/**
 * QuoteMarks — decorative quotation marks for testimonials.
 */
export function QuoteMarks({ 
  className, 
  variant = "open" 
}: { 
  className?: string;
  variant?: "open" | "close";
}) {
  return (
    <svg
      aria-hidden
      width="32"
      height="24"
      viewBox="0 0 32 24"
      fill="none"
      className={cn("text-brand-400", className)}
      style={variant === "close" ? { transform: "rotate(180deg)" } : undefined}
    >
      <path
        d="M4 12 Q4 4, 10 4 Q8 8, 8 12 Q8 16, 4 16 Q0 16, 0 12 Q0 8, 4 8"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M20 12 Q20 4, 26 4 Q24 8, 24 12 Q24 16, 20 16 Q16 16, 16 12 Q16 8, 20 8"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

/**
 * ScrollIndicator — animated scroll hint arrow.
 */
export function ScrollIndicator({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="24"
      height="40"
      viewBox="0 0 24 40"
      fill="none"
      className={cn("text-brand-400 animate-bounce", className)}
    >
      <rect
        x="8"
        y="4"
        width="8"
        height="20"
        rx="4"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="10" r="2" fill="currentColor" fillOpacity="0.8" />
      <path
        d="M12 32 L8 28 M12 32 L16 28"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * BookSpine — decorative book spine ornament.
 */
export function BookSpine({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="80"
      viewBox="0 0 16 80"
      fill="none"
      className={cn("text-brand-700", className)}
    >
      <rect x="2" y="0" width="12" height="80" fill="currentColor" fillOpacity="0.12" />
      <rect x="0" y="0" width="2" height="80" fill="currentColor" fillOpacity="0.25" />
      <line x1="4" y1="10" x2="12" y2="10" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5" />
      <line x1="4" y1="20" x2="12" y2="20" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5" />
      <line x1="4" y1="30" x2="12" y2="30" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * HeritageStamp — circular stamp-like ornament for premium feel.
 */
export function HeritageStamp({ 
  className,
  text = "EST. 2018"
}: { 
  className?: string;
  text?: string;
}) {
  return (
    <svg
      aria-hidden
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className={cn("text-brand-700", className)}
    >
      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx="40" cy="40" r="32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="28" fill="currentColor" fillOpacity="0.05" />
      
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        fontFamily="var(--font-inter), sans-serif"
        fontWeight="700"
        fontSize="8"
        letterSpacing="1.5"
        fill="currentColor"
      >
        {text}
      </text>
      
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        fontFamily="var(--font-playfair), serif"
        fontWeight="500"
        fontSize="12"
        fill="currentColor"
      >
        Lifestory
      </text>
      
      {/* Top star */}
      <path
        d="M40 8 L41 11 L44 12 L41 13 L40 16 L39 13 L36 12 L39 11 Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      
      {/* Bottom star */}
      <path
        d="M40 72 L41 69 L44 68 L41 67 L40 64 L39 67 L36 68 L39 69 Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
    </svg>
  );
}
