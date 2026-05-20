"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { reduced } = useMotionGuard();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          y: reduced ? 0 : 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: reduced ? 0 : -6,
        }}
        transition={{
          duration: reduced ? 0.01 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
