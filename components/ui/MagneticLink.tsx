"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { LinkProps } from "next/link";

type Props = Omit<LinkProps, "href"> & {
  href: string;
  className?: string;
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

/**
 * Magnetic link/CTA — the wrapper eases toward the pointer when it's within
 * `radius`, falling off to centre beyond it. Pointer-fine + motion-OK only.
 * Ported from jrv-systems-new.
 */
export function MagneticLink({
  href,
  className,
  children,
  strength = 0.2,
  radius = 130,
  target,
  rel,
  "aria-label": ariaLabel,
  ...rest
}: Props) {
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !hover) return;

    let tx = 0, ty = 0, targetX = 0, targetY = 0, raf = 0;

    const tick = () => {
      tx += (targetX - tx) * 0.18;
      ty += (targetY - ty) * 0.18;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        targetX = 0;
        targetY = 0;
      } else {
        const falloff = 1 - dist / radius;
        targetX = dx * strength * falloff;
        targetY = dy * strength * falloff;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.style.transform = "";
    };
  }, [radius, strength]);

  return (
    <span ref={wrapperRef} className="inline-flex will-change-transform">
      <Link href={href} className={className} target={target} rel={rel} aria-label={ariaLabel} {...rest}>
        {children}
      </Link>
    </span>
  );
}
