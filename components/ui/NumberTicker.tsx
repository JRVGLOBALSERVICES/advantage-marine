"use client";

// GSAP count-up. Replays every time the number re-enters the viewport
// (once:false) — per the site rule that entry animations retrigger. The
// optional `start` override lets a pinned scene drive the trigger externally
// (inside a sticky hero useInView always reads true); omit it and the ticker
// uses its own IntersectionObserver.

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useInView } from "motion/react";
import { gsap } from "gsap";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  start?: boolean;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  start,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // positive margin → fires predictively as it enters (the negative-margin
  // variant fires late on iOS Safari). once:false → replays on re-entry.
  const ioInView = useInView(ref, { once: false, margin: "0px 0px 120px 0px" });
  const isInView = start ?? ioInView;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Number(n.toFixed(decimalPlaces)));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = direction === "down" ? value : startValue;
    const to = direction === "down" ? startValue : value;
    if (!isInView) {
      el.textContent = fmt(from);
      return;
    }
    const obj = { v: from };
    el.textContent = fmt(from);
    const tween = gsap.to(obj, {
      v: to,
      duration: 1.6,
      ease: "power2.out",
      delay,
      onUpdate: () => {
        el.textContent = fmt(obj.v);
      },
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, value, startValue, direction, delay, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums", className)}
      {...props}
    >
      {fmt(direction === "down" ? value : startValue)}
    </span>
  );
}
