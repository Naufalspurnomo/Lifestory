"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type Props = {
  /** When to show button — fraction of first viewport scrolled. Default 1.5 */
  showAfterScreens?: number;
  className?: string;
};

/**
 * BackToTop — circular floating button bottom-right, shows after the user
 * has scrolled past the first viewport. Includes a circular progress ring
 * tracking total page scroll to reinforce position.
 */
export function BackToTop({ showAfterScreens = 1.2, className }: Props) {
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  // The ring fills from 0..1 over the entire page scroll
  const dashoffset = useTransform(scrollYProgress, [0, 1], [113, 0]);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > window.innerHeight * showAfterScreens);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfterScreens]);

  function toTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={toTop}
          aria-label="Scroll back to top"
          className={cn(
            "group fixed bottom-6 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-pill border border-cream-300 bg-white/95 text-ink-700 shadow-elev backdrop-blur-md transition-colors hover:bg-cream-50 sm:bottom-8 sm:right-7 sm:h-14 sm:w-14",
            className
          )}
        >
          {/* Progress ring */}
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 40 40"
            aria-hidden
          >
            <defs>
              <linearGradient id="back-to-top-grad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stopColor="#e6ab2f" />
                <stop offset="100%" stopColor="#cc8a12" />
              </linearGradient>
            </defs>
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="rgba(58,40,16,0.06)"
              strokeWidth="1.4"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="url(#back-to-top-grad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray={113}
              style={{ strokeDashoffset: dashoffset }}
            />
          </svg>
          <ArrowUp className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-5 sm:w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
