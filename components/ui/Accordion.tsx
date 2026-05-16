"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type AccordionItem = {
  q: ReactNode;
  a: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number | null;
};

export function Accordion({
  items,
  className,
  defaultOpen = 0,
}: AccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpen);
  const reduce = useReducedMotion();

  return (
    <div className={cn("divide-y divide-cream-300", className)}>
      {items.map((item, idx) => {
        const open = openIdx === idx;
        return (
          <div key={idx} className="py-2">
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-serif text-lg leading-snug text-ink-800 md:text-xl">
                {item.q}
              </span>
              <span
                className={cn(
                  "inline-flex h-9 w-9 flex-none items-center justify-center rounded-pill border border-cream-300 bg-white text-brand-700 transition-transform duration-300",
                  open && "rotate-45 bg-brand-gradient text-white border-transparent shadow-cta"
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduce ? 0.01 : 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pb-5 pr-12 text-sm leading-relaxed text-ink-500 md:text-base">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
