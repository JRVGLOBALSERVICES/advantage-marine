"use client";

import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

type AsProp = React.ElementType;

export interface MovingBorderButtonProps {
  /** Outer corner radius. Mirrors the original API. */
  borderRadius?: string;
  children: React.ReactNode;
  /** Element to render as (e.g. "button", "a", Link). */
  as?: AsProp;
  /** ms for one full lap of the teal beam around the border. */
  duration?: number;
  /** Classes for the inner content surface (the cream pill). */
  className?: string;
  /** Classes for the outer container. */
  containerClassName?: string;
  /** Classes for the moving beam element (size/color overrides). */
  borderClassName?: string;
  [key: string]: unknown;
}

export function MovingBorderButton({
  borderRadius = "var(--radius-pill)",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: MovingBorderButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Component
      className={cn(
        "relative inline-flex h-14 w-auto min-w-[10rem] overflow-hidden bg-transparent p-[1.5px]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-paper)]",
        containerClassName,
      )}
      style={{ borderRadius }}
      {...otherProps}
    >
      {/* Moving teal beam layer — frozen as a soft static glow under reduced motion */}
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} - 1.5px)` }}
        aria-hidden="true"
      >
        {reduceMotion ? (
          <div
            className={cn(
              "absolute inset-0 rounded-[inherit] opacity-90",
              borderClassName,
            )}
            style={{
              background:
                "linear-gradient(120deg, var(--color-accent), var(--color-accent-2), var(--color-accent))",
            }}
          />
        ) : (
          <MovingBorder duration={duration} rx="30%" ry="30%">
            <div
              className={cn(
                "h-24 w-24 opacity-90 blur-[1px]",
                borderClassName,
              )}
              style={{
                background:
                  "radial-gradient(var(--color-accent-2) 38%, transparent 62%)",
              }}
            />
          </MovingBorder>
        )}
      </div>

      {/* Cream content surface */}
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center gap-2 whitespace-nowrap border border-rule bg-paper px-7 font-display text-sm font-medium tracking-wide text-ink antialiased transition-colors duration-200",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} - 1.5px)` }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 3200,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: unknown;
}) => {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x ?? 0,
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y ?? 0,
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
