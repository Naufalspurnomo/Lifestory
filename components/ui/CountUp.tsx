"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  /** Display string with optional prefix/suffix, e.g. "100+", "100%", "1.5k". */
  value: string;
  duration?: number;
  className?: string;
};

/** Splits "100+" into prefix, numeric value, suffix, and decimal count. */
function parseValue(value: string) {
  const match = value.match(/^(\D*?)([\d.,]+)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const numeric = parseFloat(numStr.replace(/,/g, ""));
  if (Number.isNaN(numeric)) return null;
  const decimals = numStr.includes(".")
    ? numStr.split(".")[1]?.length ?? 0
    : 0;
  return { prefix, numeric, suffix, decimals };
}

/**
 * CountUp animates a number from 0 to its target once it scrolls into view.
 * It falls back to the final value when motion is reduced or the string is not
 * numeric.
 */
export function CountUp({ value, duration = 1.8, className }: Props) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const { reduced, isCoarsePointer } = useMotionGuard();
  const [display, setDisplay] = useState(() =>
    parsed ? `${parsed.prefix}0${parsed.suffix}` : value
  );

  useEffect(() => {
    if (!parsed) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    const controls = animate(0, parsed.numeric, {
      duration: isCoarsePointer ? Math.min(duration, 1.1) : duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        const num = parsed.decimals
          ? latest.toFixed(parsed.decimals)
          : Math.round(latest).toString();
        setDisplay(`${parsed.prefix}${num}${parsed.suffix}`);
      },
    });
    return () => controls.stop();
  }, [inView, parsed, reduced, isCoarsePointer, duration, value]);

  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={value}
    >
      <span aria-hidden>{display}</span>
    </span>
  );
}
