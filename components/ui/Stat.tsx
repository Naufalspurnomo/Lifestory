"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type StatProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
  className?: string;
  decimals?: number;
};

export function Stat({
  value,
  suffix = "",
  prefix = "",
  label,
  description,
  className,
  decimals = 0,
}: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      if (reduceMotion) setDisplay(value);
      return;
    }

    let frame: number;
    const start = performance.now();
    const duration = 1400;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduceMotion]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col", className)}
    >
      <span className="font-serif text-[clamp(2.4rem,5vw,3.8rem)] leading-none text-ink-800">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        {label}
      </span>
      {description && (
        <p className="mt-1.5 max-w-[26ch] text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      )}
    </motion.div>
  );
}
