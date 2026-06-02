"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** ms between words. */
  staggerMs?: number;
  /** ms initial delay before the first word. */
  startDelayMs?: number;
  /** Add a soft blur lift on the way in. */
  blur?: boolean;
  /** Pixels of upward translation in the from-state. */
  translate?: number;
  /** IO threshold. */
  threshold?: number;
  /** When true, the reveal only plays once and stays revealed. */
  once?: boolean;
};

/**
 * Word-by-word scroll reveal. Splits on whitespace, wraps each word in an
 * inline-block span, fires a stagger when the container enters the viewport.
 * Whitespace preserved. Ported to the AMS cream system from jrv-systems-new.
 */
export function WordReveal({
  text,
  className,
  staggerMs = 55,
  startDelayMs = 0,
  blur = true,
  translate = 22,
  threshold = 0.2,
  once = false,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const parts = text.split(/(\s+)/);
  let wordIndex = 0;

  return (
    <span ref={ref} className={cn("inline", className)}>
      {parts.map((part, i) => {
        if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
        const idx = wordIndex++;
        const delay = startDelayMs + idx * staggerMs;
        return (
          <span
            key={i}
            className="inline-block transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]"
            style={{
              transitionDelay: `${delay}ms`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translate3d(0,0,0)" : `translate3d(0, ${translate}px, 0)`,
              filter: blur ? (visible ? "blur(0)" : "blur(8px)") : undefined,
            }}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
