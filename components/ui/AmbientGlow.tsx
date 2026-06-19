"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  className?: string;
  /** CSS color used at the glow's center. */
  color?: string;
  /** Diameter in pixels. */
  size?: number;
  duration?: number;
  delay?: number;
};

/**
 * AmbientGlow adds a soft radial light that drifts slowly. It renders a still
 * glow when motion is reduced or on coarse-pointer touch devices.
 */
export function AmbientGlow({
  className,
  color = "rgba(176,141,87,0.16)",
  size = 460,
  duration = 15,
  delay = 0,
}: Props) {
  const { reduced, isCoarsePointer } = useMotionGuard();
  const still = reduced || isCoarsePointer;

  const style = {
    width: size,
    height: size,
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
  } as const;

  const baseClass = "pointer-events-none absolute rounded-full blur-3xl";

  if (still) {
    return <div aria-hidden className={cn(baseClass, className)} style={style} />;
  }

  return (
    <motion.div
      aria-hidden
      className={cn(baseClass, className)}
      style={style}
      animate={{
        x: [0, 26, -16, 0],
        y: [0, -20, 14, 0],
        scale: [1, 1.12, 0.94, 1],
        opacity: [0.7, 1, 0.82, 0.7],
      }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  );
}
