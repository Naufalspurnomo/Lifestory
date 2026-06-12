"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  variant?: "up" | "left" | "right" | "scale" | "image";
};

/**
 * Reveal — declarative fade-up wrapper that respects prefers-reduced-motion.
 * Use instead of repeating `initial whileInView transition` boilerplate.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
  amount = 0.2,
  variant = "up",
}: RevealProps) {
  const { reduced, isCoarsePointer } = useMotionGuard();

  if (reduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  const touchDistance = Math.min(14, y);
  const desktopDistance = y;
  const distance = isCoarsePointer ? touchDistance : desktopDistance;
  const adaptiveDuration = isCoarsePointer ? Math.min(duration, 0.48) : duration;
  const adaptiveDelay = isCoarsePointer ? Math.min(delay, 0.12) : delay;

  const hiddenByVariant: Record<NonNullable<RevealProps["variant"]>, Variants["hidden"]> = {
    up: { opacity: 0, y: distance },
    left: { opacity: 0, x: isCoarsePointer ? -touchDistance : -desktopDistance },
    right: { opacity: 0, x: isCoarsePointer ? touchDistance : desktopDistance },
    scale: { opacity: 0, scale: isCoarsePointer ? 0.985 : 0.965, y: isCoarsePointer ? 8 : 16 },
    image: isCoarsePointer
      ? { opacity: 0, y: touchDistance }
      : { opacity: 0, scale: 1.025, clipPath: "inset(0 0 12% 0)" },
  };

  const variants: Variants = {
    hidden: hiddenByVariant[variant],
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      clipPath: "inset(0 0 0% 0)",
      transition: {
        duration: adaptiveDuration,
        delay: adaptiveDelay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: isCoarsePointer ? Math.min(amount, 0.12) : amount }}
    >
      {children}
    </motion.div>
  );
}
