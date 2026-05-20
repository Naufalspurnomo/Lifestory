"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type Target, type Transition } from "framer-motion";

/**
 * Standardizes motion handling. Touch-first devices get the reduced path too
 * because scroll-linked transforms can feel sticky on mid-range phones/tablets.
 */
export function useCoarsePointer() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");

    function update() {
      setIsCoarsePointer(media.matches || navigator.maxTouchPoints > 0);
    }

    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return isCoarsePointer;
}

export function useMotionGuard() {
  const prefersReducedMotion = useReducedMotion();
  const isCoarsePointer = useCoarsePointer();
  const reduced = Boolean(prefersReducedMotion || isCoarsePointer);

  function mInitial(target: Target | undefined): Target | undefined {
    if (!reduced || !target) return target;
    const { x: _x, y: _y, rotate: _r, scale: _s, ...rest } = target as Record<
      string,
      unknown
    >;
    void _x;
    void _y;
    void _r;
    void _s;
    return rest as Target;
  }

  function mTransition(transition: Transition | undefined): Transition {
    if (!reduced) return transition ?? {};
    return { ...(transition ?? {}), duration: 0.01, delay: 0 };
  }

  return {
    reduced,
    prefersReducedMotion: Boolean(prefersReducedMotion),
    isCoarsePointer,
    mInitial,
    mTransition,
  };
}
