"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Max tilt angle in degrees. Default 8 */
  max?: number;
  /** Lift Z when hovered (px). Default 0 (no lift) */
  lift?: number;
  /** Inner glare highlight overlay */
  glare?: boolean;
};

/**
 * TiltCard — 3D pointer-tracking tilt. GPU-only transform.
 * Disabled on touch / reduced-motion automatically.
 */
export function TiltCard({
  children,
  className,
  max = 8,
  lift = 0,
  glare = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  const px = useMotionValue(0); // -0.5..0.5
  const py = useMotionValue(0); // -0.5..0.5
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.6 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const z = useTransform(sx, [-0.5, 0.5], [lift, lift]);

  // glare position
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["20%", "80%"]);

  useEffect(() => {
    if (reduce) return;
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;
    setActive(true);
  }, [reduce]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    px.set(x);
    py.set(y);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{
        rotateX,
        rotateY,
        z,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative will-change-transform", className)}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          style={{
            background: `radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.32), transparent 55%)`,
            // @ts-expect-error custom CSS vars
            "--gx": glareX,
            "--gy": glareY,
            mixBlendMode: "overlay",
          }}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
    </motion.div>
  );
}
