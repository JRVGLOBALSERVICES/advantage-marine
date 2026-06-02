"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors.
   * Re-themed for Advantage Marine — defaults to the teal accent + seafoam.
   * Pass design tokens, e.g. ["var(--color-accent)", "var(--color-accent-2)"].
   * @default teal accent ramp
   */
  shineColor?: string | string[];
}

/**
 * ShineBorder — Magic UI (re-themed cream + teal for Advantage Marine).
 *
 * An animated background border effect. Tailwind v3 safe: the `shine` keyframe
 * is self-contained in this file (Magic UI's original relied on a v4 utility
 * `motion-safe:animate-shine` + a registered keyframe). Honors
 * prefers-reduced-motion via the media query in the injected stylesheet.
 *
 * Usage: place inside a `relative` container with `overflow-hidden` + rounded
 * corners; ShineBorder absolutely fills it and draws only the border ring.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = ["var(--color-accent)", "var(--color-accent-2)"],
  className,
  style,
  ...props
}: ShineBorderProps) {
  const uid = React.useId().replace(/[:]/g, "");
  const cls = `ams-shine-${uid}`;
  return (
    <>
      <style>{`
        @keyframes ams-shine {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        .${cls} { animation: ams-shine var(--duration) infinite linear; }
        @media (prefers-reduced-motion: reduce) {
          .${cls} { animation: none; }
        }
      `}</style>
      <div
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--duration": `${duration}s`,
            backgroundImage: `radial-gradient(transparent,transparent, ${
              Array.isArray(shineColor) ? shineColor.join(",") : shineColor
            },transparent,transparent)`,
            backgroundSize: "300% 300%",
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "var(--border-width)",
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position]",
          cls,
          className,
        )}
        {...props}
      />
    </>
  );
}

export default ShineBorder;
