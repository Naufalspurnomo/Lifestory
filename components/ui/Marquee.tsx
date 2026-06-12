"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
};

/**
 * Marquee — duplicates children once and uses CSS keyframe to scroll.
 * Provide enough children that doubling them looks seamless.
 */
export function Marquee({
  children,
  className,
  pauseOnHover = true,
  reverse,
}: MarqueeProps) {
  const { isCoarsePointer } = useMotionGuard();

  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12",
          !isCoarsePointer && "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]"
        )}
        aria-hidden={false}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-12 pr-12",
          !isCoarsePointer && "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]"
        )}
        aria-hidden={true}
      >
        {children}
      </div>
    </div>
  );
}
