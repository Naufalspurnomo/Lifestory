"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
import { cn } from "../../lib/utils";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  offset?: number;
  scale?: [number, number];
};

export function ParallaxLayer(props: ParallaxProps) {
  const { shouldReduceScrollMotion } = useMotionGuard();

  if (shouldReduceScrollMotion) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  return <ParallaxLayerMotion {...props} />;
}

function ParallaxLayerMotion({
  children,
  className,
  offset = 60,
  scale,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  const smoothY = useSpring(y, { stiffness: 80, damping: 20, mass: 0.5 });
  const scaleVal = useTransform(scrollYProgress, [0, 0.5, 1], [
    scale?.[0] ?? 1,
    1,
    scale?.[1] ?? 1,
  ]);

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ y: smoothY, scale: scale ? scaleVal : undefined }}
    >
      {children}
    </motion.div>
  );
}

type ScrollScaleProps = {
  children: ReactNode;
  className?: string;
  from?: number;
  to?: number;
};

export function ScrollScale(props: ScrollScaleProps) {
  const { shouldReduceScrollMotion } = useMotionGuard();

  if (shouldReduceScrollMotion) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  return <ScrollScaleMotion {...props} />;
}

function ScrollScaleMotion({
  children,
  className,
  from = 0.92,
  to = 1,
}: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.6, 1]);
  const smoothScale = useSpring(scale, {
    stiffness: 100,
    damping: 20,
    mass: 0.4,
  });

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ scale: smoothScale, opacity }}
    >
      {children}
    </motion.div>
  );
}

type ScrollFadeProps = {
  children: ReactNode;
  className?: string;
  y?: number;
};

export function ScrollFadeIn(props: ScrollFadeProps) {
  const { shouldReduceScrollMotion } = useMotionGuard();

  if (shouldReduceScrollMotion) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  return <ScrollFadeInMotion {...props} />;
}

function ScrollFadeInMotion({
  children,
  className,
  y: yOffset = 40,
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.5"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const translateY = useTransform(scrollYProgress, [0, 1], [yOffset, 0]);
  const smoothOpacity = useSpring(opacity, { stiffness: 80, damping: 18 });
  const smoothY = useSpring(translateY, { stiffness: 80, damping: 18 });

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ opacity: smoothOpacity, y: smoothY }}
    >
      {children}
    </motion.div>
  );
}

type SectionZoomProps = {
  children: ReactNode;
  className?: string;
  from?: number;
};

export function SectionZoom(props: SectionZoomProps) {
  const { shouldReduceScrollMotion } = useMotionGuard();

  if (shouldReduceScrollMotion) {
    return <section className={cn(props.className)}>{props.children}</section>;
  }

  return <SectionZoomMotion {...props} />;
}

function SectionZoomMotion({
  children,
  className,
  from = 0.97,
}: SectionZoomProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.3"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [from, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.7, 1]);

  return (
    <motion.section
      ref={ref}
      className={cn(className)}
      style={{ scale, opacity }}
    >
      {children}
    </motion.section>
  );
}
