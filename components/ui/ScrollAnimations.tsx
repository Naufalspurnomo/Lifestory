"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
import { cn } from "../../lib/utils";

const TOUCH_TRANSITION = {
  duration: 0.58,
  ease: [0.22, 1, 0.36, 1] as const,
};

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  offset?: number;
  scale?: [number, number];
};

export function ParallaxLayer(props: ParallaxProps) {
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();

  if (reduced) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  if (shouldReduceScrollMotion) {
    return <TouchParallaxLayer {...props} />;
  }

  return <ParallaxLayerMotion {...props} />;
}

function TouchParallaxLayer({ children, className, offset = 60 }: ParallaxProps) {
  const y = Math.max(-18, Math.min(18, offset * 0.18));

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={TOUCH_TRANSITION}
    >
      {children}
    </motion.div>
  );
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
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();

  if (reduced) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  if (shouldReduceScrollMotion) {
    return <TouchScrollScale {...props} />;
  }

  return <ScrollScaleMotion {...props} />;
}

function TouchScrollScale({
  children,
  className,
  from = 0.97,
}: ScrollScaleProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0.72, scale: Math.max(0.96, from) }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={TOUCH_TRANSITION}
    >
      {children}
    </motion.div>
  );
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
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();

  if (reduced) {
    return <div className={cn(props.className)}>{props.children}</div>;
  }

  if (shouldReduceScrollMotion) {
    return <TouchScrollFadeIn {...props} />;
  }

  return <ScrollFadeInMotion {...props} />;
}

function TouchScrollFadeIn({
  children,
  className,
  y: yOffset = 40,
}: ScrollFadeProps) {
  const y = Math.min(28, yOffset);

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={TOUCH_TRANSITION}
    >
      {children}
    </motion.div>
  );
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
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();

  if (reduced) {
    return <section className={cn(props.className)}>{props.children}</section>;
  }

  if (shouldReduceScrollMotion) {
    return <TouchSectionZoom {...props} />;
  }

  return <SectionZoomMotion {...props} />;
}

function TouchSectionZoom({
  children,
  className,
  from = 0.98,
}: SectionZoomProps) {
  return (
    <motion.section
      className={cn(className)}
      initial={{ opacity: 0.78, y: 18, scale: Math.max(0.97, from) }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={TOUCH_TRANSITION}
    >
      {children}
    </motion.section>
  );
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
