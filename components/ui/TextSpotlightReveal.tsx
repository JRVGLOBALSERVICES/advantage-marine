"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Char-by-char spotlight reveal: each char enters opacity 0.12 → 1, scale
 * 0.85 → 1, blur 4px → 0, staggered from centre. GSAP + ScrollTrigger.
 * Ported from seagull-group, rewired off @gsap/react (uses plain useEffect +
 * gsap.context cleanup) so AMS doesn't take a new dependency.
 */
export function TextSpotlightReveal({
  as: TagName = "h2",
  text,
  className,
  startOffset = "top 86%",
}: {
  as?: Tag;
  text: string;
  className?: string;
  startOffset?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll<HTMLSpanElement>(".tsr-char");
      if (!chars.length) return;
      gsap.fromTo(
        chars,
        { opacity: 0.12, scale: 0.85, filter: "blur(4px)" },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          stagger: { each: 0.035, from: "center" },
          scrollTrigger: { trigger: el, start: startOffset, toggleActions: "play none none reverse" },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text, startOffset]);

  const Tag = TagName as "h2";

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className} aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap mr-[0.3em] last:mr-0">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} aria-hidden className="tsr-char inline-block will-change-transform">
              {ch}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
