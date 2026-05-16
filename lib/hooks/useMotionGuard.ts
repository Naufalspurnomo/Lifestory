"use client";

import { useReducedMotion, type Transition, type Target } from "framer-motion";

/**
 * useMotionGuard — small helper to standardize prefers-reduced-motion handling
 * across framer-motion call sites.
 *
 * Returns:
 *   - reduced: boolean
 *   - mInitial(target): collapses y/x/rotate/scale away when reduce-motion is on
 *   - mTransition(transition): clamps duration to ~0 when reduce-motion is on
 */
export function useMotionGuard() {
  const reduced = useReducedMotion();

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

  return { reduced, mInitial, mTransition };
}
