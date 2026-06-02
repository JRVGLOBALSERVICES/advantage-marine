"use client";

import { motion, MotionStyle, Transition } from "motion/react";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /** The size (length) of the travelling beam segment. */
  size?: number;
  /** The duration of one full lap, in seconds. */
  duration?: number;
  /** Animation delay, in seconds. */
  delay?: number;
  /** Beam gradient start color. Defaults to the teal accent. */
  colorFrom?: string;
  /** Beam gradient end color. Defaults to the seafoam accent-2. */
  colorTo?: string;
  /** Motion transition override. */
  transition?: Transition;
  /** Extra classes on the moving beam element. */
  className?: string;
  /** Inline style on the moving beam element. */
  style?: React.CSSProperties;
  /** Reverse the travel direction. */
  reverse?: boolean;
  /** Initial offset along the path (0-100). */
  initialOffset?: number;
  /** Border ring width, in pixels. */
  borderWidth?: number;
}

/**
 * BorderBeam — Magic UI (re-themed cream + teal for Advantage Marine).
 *
 * A beam of light that travels along the border of its container. Magic UI's
 * source used Tailwind v4 utilities (`border-(length:…)`, `mask-intersect`,
 * `bg-linear-to-l`, arbitrary `mask-[…]`). This port expresses the ring mask +
 * gradient as inline styles so it compiles on Tailwind v3 with no config.
 *
 * Place inside a `relative` rounded container. Default teal palette keeps the
 * accent budget tiny — best on a single credential / cert / featured card.
 * Linear, infinite motion is gentle; for prefers-reduced-motion, conditionally
 * skip rendering this component from the parent (it is purely decorative).
 */
export const BorderBeam = ({
  className,
  size = 60,
  delay = 0,
  duration = 8,
  colorFrom = "var(--color-accent)",
  colorTo = "var(--color-accent-2)",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: BorderBeamProps) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-transparent"
      style={{
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        WebkitMask:
          "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        mask: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
        WebkitMaskComposite: "source-in, xor",
        maskComposite: "intersect",
        WebkitMaskClip: "padding-box, border-box",
        maskClip: "padding-box, border-box",
      }}
    >
      <motion.div
        className={cn("absolute aspect-square", className)}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};

export default BorderBeam;
