"use client";

/* Scroll-parallax full-bleed image. Drop-in for the `absolute inset-0` hero
   <img>: the picture sits slightly oversized and drifts vertically as the
   section scrolls, for depth. Static under reduced-motion. */

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function ParallaxImage({
  src,
  alt,
  className,
  amount = 12,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  amount?: number;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-amount / 2}%`, `${amount / 2}%`]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={src}
        alt={alt}
        className={className}
        style={reduce ? { scale: 1.06 } : { y, scale: 1.2 }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
      />
    </div>
  );
}
