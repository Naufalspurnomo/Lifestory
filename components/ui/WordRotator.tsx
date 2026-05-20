"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  words: string[];
  /** Interval between word changes (ms). Default 2400 */
  interval?: number;
  /** Optional className applied to each rotating word */
  className?: string;
  /** Optional className for the outer reservation span */
  outerClassName?: string;
  /** Auto-start delay ms */
  startDelay?: number;
};

/**
 * WordRotator — cycles between words in-place using a vertical mask transition.
 * The outer span reserves space for the longest word so layout never shifts.
 * Respects prefers-reduced-motion (shows first word statically).
 */
export function WordRotator({
  words,
  interval = 2400,
  className,
  outerClassName,
  startDelay = 1200,
}: Props) {
  const { reduced } = useMotionGuard();
  const safe = words ?? [];
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reduced || safe.length <= 1) return;
    const start = window.setTimeout(() => setStarted(true), startDelay);
    return () => window.clearTimeout(start);
  }, [reduced, startDelay, safe.length]);

  useEffect(() => {
    if (reduced || !started || safe.length <= 1) return;
    const t = window.setInterval(() => {
      setI((p) => (p + 1) % safe.length);
    }, interval);
    return () => window.clearInterval(t);
  }, [reduced, started, interval, safe.length]);

  if (!safe.length) return null;
  if (reduced || safe.length === 1) {
    return <span className={className}>{safe[0]}</span>;
  }

  // longest word for reserved width
  const longest = safe.reduce((a, b) => (a.length > b.length ? a : b), safe[0]);

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden align-baseline",
        outerClassName
      )}
      aria-live="polite"
    >
      {/* invisible reservation */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute inset-0 inline-flex items-center whitespace-nowrap",
            className
          )}
        >
          {safe[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
