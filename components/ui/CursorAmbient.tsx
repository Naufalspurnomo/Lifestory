"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type Props = {
  /** Tailwind size class for the orb diameter. Default ~ 480px */
  size?: string;
  /** Radial gradient color (CSS rgba) */
  color?: string;
  /** Blend mode (overlay works well on both light and dark) */
  blend?: "overlay" | "screen" | "multiply" | "plus-lighter";
  /** Z-index. Default 5 (below content, above background ornaments) */
  z?: number;
  /** Hide on touch devices (recommended) */
  hideOnTouch?: boolean;
  className?: string;
};

/**
 * CursorAmbient — soft warm gradient blob that follows the pointer with elastic delay.
 * Pure CSS gradient + transformed div. GPU-only, no canvas, no event throttling needed.
 *
 * Place this once globally (e.g. in a layout) or per-section if you want it scoped.
 */
export function CursorAmbient({
  size = "h-[440px] w-[440px]",
  color = "rgba(130,105,60,0.20)",
  blend = "overlay",
  z = 5,
  hideOnTouch = true,
  className,
}: Props) {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  const x = useMotionValue(-2000);
  const y = useMotionValue(-2000);
  const sx = useSpring(x, { stiffness: 60, damping: 16, mass: 0.9 });
  const sy = useSpring(y, { stiffness: 60, damping: 16, mass: 0.9 });

  // Detect non-touch + non-reduced motion before enabling
  useEffect(() => {
    if (reduce) return;
    if (hideOnTouch) {
      const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      if (isTouch) return;
    }
    setEnabled(true);
  }, [reduce, hideOnTouch]);

  useEffect(() => {
    if (!enabled) return;
    function move(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    function leave() {
      x.set(-2000);
      y.set(-2000);
    }
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        x: sx,
        y: sy,
        zIndex: z,
        mixBlendMode: blend,
      }}
      className={cn(
        "pointer-events-none fixed left-0 top-0 will-change-transform",
        className
      )}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div
          className={cn("rounded-full blur-3xl", size)}
          style={{
            background: `radial-gradient(circle, ${color} 0%, ${color
              .replace(/0\.\d+/, "0.06")
              .replace("0.06", "0.06")} 35%, transparent 70%)`,
          }}
        />
      </div>
    </motion.div>
  );
}
