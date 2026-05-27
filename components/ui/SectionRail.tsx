"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type Section = {
  id: string;
  label: string;
};

type Props = {
  sections: Section[];
  /** Class name for outer wrapper */
  className?: string;
};

/**
 * SectionRail — fixed editorial rail (desktop only) showing the user's
 * vertical position through the page. Each dot represents a major section,
 * with a label on hover. Click → smooth-scroll to that anchor.
 *
 * Pure scroll listener (passive) so it's cheap. Uses IntersectionObserver
 * on each section to determine the active one. Hides on tablet/mobile.
 */
export function SectionRail({ sections, className }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sections.length === 0) return;

    // Resolve targets at mount time (and refresh after a tick in case sections mount async)
    let observers: IntersectionObserver[] = [];
    let raf = 0;

    function attach() {
      observers.forEach((o) => o.disconnect());
      observers = [];

      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (!el) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
                setActive(section.id);
              }
            });
          },
          {
            // Trigger when section's top half is in view
            rootMargin: "-30% 0px -50% 0px",
            threshold: [0, 0.25, 0.5, 0.75, 1],
          }
        );

        observer.observe(el);
        observers.push(observer);
      });
    }

    // Show rail after slight scroll past hero
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.75);
    }

    raf = window.setTimeout(attach, 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", onScroll);
      if (raf) window.clearTimeout(raf);
    };
  }, [sections]);

  function go(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Page sections"
          className={cn(
            "pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:flex",
            className
          )}
        >
          <ul className="pointer-events-auto flex flex-col items-center gap-3.5 rounded-pill border border-cream-300 bg-white/85 px-2 py-3.5 shadow-soft backdrop-blur-md">
            {sections.map((section) => {
              const isActive = section.id === active;
              const isHovered = section.id === hovered;
              return (
                <li
                  key={section.id}
                  onMouseEnter={() => setHovered(section.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex items-center"
                >
                  <button
                    type="button"
                    onClick={() => go(section.id)}
                    aria-label={`Scroll to ${section.label}`}
                    aria-current={isActive ? "true" : undefined}
                    className="group flex items-center justify-center"
                  >
                    <span
                      className={cn(
                        "block rounded-full transition-all duration-300 ease-smooth",
                        isActive
                          ? "h-2.5 w-2.5 bg-brand-gradient shadow-[0_0_0_3px_rgba(230,171,47,0.18)]"
                          : "h-1.5 w-1.5 bg-cream-400 group-hover:bg-brand-400"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-pill border border-cream-300 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700 shadow-soft"
                      >
                        {section.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
