"use client";

import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================================
// ParallaxLayer — element moves at a different rate than scroll
// Great for background blobs, decorative elements, images
// ============================================================
type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** How much to offset in px. Positive = moves up slower (lags). Negative = moves down. */
  offset?: number;
  /** Scale range: [start, end]. E.g. [0.95, 1.05] for subtle zoom */
  scale?: [number, number];
};

export function ParallaxLayer({
  children,
  className,
  offset = 60,
  scale,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [offset, -offset]
  );
  const smoothY = useSpring(y, { stiffness: 80, damping: 20, mass: 0.5 });

  const scaleVal = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduce ? [1, 1, 1] : [scale?.[0] ?? 1, 1, scale?.[1] ?? 1]
  );

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ y: smoothY, scale: scale ? scaleVal : undefined }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// ScrollScale — element scales up/down as it enters viewport
// Used for hero images, CTA cards, featured sections
// ============================================================
type ScrollScaleProps = {
  children: ReactNode;
  className?: string;
  /** Scale when element is just entering view */
  from?: number;
  /** Scale when element is centered in view */
  to?: number;
};

export function ScrollScale({
  children,
  className,
  from = 0.92,
  to = 1,
}: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [from, to]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.4],
    reduce ? [1, 1] : [0.6, 1]
  );
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 20, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ scale: smoothScale, opacity }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// ScrollFadeIn — progressive opacity+translateY tied to scroll position
// Smoother than threshold-based whileInView for continuous feel
// ============================================================
type ScrollFadeProps = {
  children: ReactNode;
  className?: string;
  /** Y offset in px when starting (default 40) */
  y?: number;
};

export function ScrollFadeIn({
  children,
  className,
  y: yOffset = 40,
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.5"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);
  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [yOffset, 0]
  );
  const smoothOpacity = useSpring(opacity, { stiffness: 80, damping: 18 });
  const smoothY = useSpring(translateY, { stiffness: 80, damping: 18 });

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ opacity: smoothOpacity, y: smoothY }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// SectionZoom — entire section subtly scales as you scroll into it
// Creates a "diving into content" feel
// ============================================================
type SectionZoomProps = {
  children: ReactNode;
  className?: string;
  /** Scale start (default 0.97) */
  from?: number;
};

export function SectionZoom({
  children,
  className,
  from = 0.97,
}: SectionZoomProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.3"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [from, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], reduce ? [1, 1] : [0.7, 1]);

  return (
    <motion.section
      ref={ref}
      className={cn(className)}
      style={{ scale, opacity }}
    >
      {children}
    </motion.section>
  );
}
