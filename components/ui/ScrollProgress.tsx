"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

/**
 * Top-of-viewport scroll progress indicator.
 * Mounted once in root layout; thin gold line that grows as you scroll.
 */
export function ScrollProgress() {
  const { shouldReduceScrollMotion } = useMotionGuard();

  if (shouldReduceScrollMotion) return null;

  return <ScrollProgressMotion />;
}

function ScrollProgressMotion() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 22,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-brand-gradient"
      style={{ scaleX }}
    />
  );
}
