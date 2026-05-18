"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Magnetic strength — how strong the pull (0..1). Default 0.28 */
  strength?: number;
  /** Activation distance in px. Default 120 */
  distance?: number;
};

/**
 * MagneticButton — wraps any element. On pointermove within `distance`, the
 * wrapped element drifts toward the cursor with elastic spring-back on leave.
 *
 * Disabled automatically on touch / reduced-motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.28,
  distance = 120,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;
    setActive(true);
  }, [reduce]);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    function onMove(e: PointerEvent) {
      const target = ref.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > distance) {
        x.set(0);
        y.set(0);
        return;
      }
      // ease: stronger pull near center
      const fall = 1 - dist / distance;
      x.set(dx * strength * fall);
      y.set(dy * strength * fall);
    }
    function onLeave() {
      x.set(0);
      y.set(0);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [active, x, y, strength, distance]);

  return (
    <motion.div
      ref={ref}
      style={active ? { x: sx, y: sy } : undefined}
      className={cn("inline-block will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
