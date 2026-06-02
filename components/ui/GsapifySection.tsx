"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GsapifySection — scroll-scrubbed horizontal discipline ticker.
 *
 * A single row of inscriptional-caps discipline labels translates left as the
 * band scrolls through the viewport (X scrubbed to scroll progress, NO pin —
 * iOS-safe). On enter the whole row fades up (opacity 0 → 1, y 24 → 0) with the
 * locked --ease-out curve. prefers-reduced-motion skips both and shows static.
 *
 * Lenis already drives gsap.ticker globally (see SmoothScroll.tsx), so this
 * component only registers ScrollTrigger and builds its scenes — the ticker
 * sync and ScrollTrigger.update() are handled at the layout root.
 *
 * Provenance: structural intent (scroll-scrubbed horizontal ticker + enter
 * fade-up) seeded by a gsapify.com generation; the returned code was vanilla
 * DOM/innerHTML boilerplate with a bounce ease + infinite yoyo and was NOT
 * usable, so this is a clean reimplementation to the brief + locked tokens.
 */

// Real disciplines, drawn from lib/content/services.json (no invented copy).
const DISCIPLINES = [
  "Commercial Diving",
  "In-Water Survey",
  "NDT Inspection",
  "Steel Fabrication",
  "Rope Access",
  "ICCP",
  "Salvage Works",
  "Hydrographic Survey",
];

export default function GsapifySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // static — respect the user, no scrub, no fade

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    void ease; // documented; gsap uses the array form below

    const ctx = gsap.context(() => {
      const row = rowRef.current;
      const section = sectionRef.current;
      if (!row || !section) return;

      // Enter fade-up — replays on re-entry (toggleActions both directions).
      gsap.fromTo(
        row,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out", // ≈ cubic-bezier(0.22,1,0.36,1), no overshoot
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      // Horizontal scrub — translate the row left as the band passes through.
      // Distance = how much wider the row is than its viewport, so the tail
      // edge lands flush. No pin (iOS-safe); scrub eases the tie to scroll.
      const overflow = () =>
        Math.max(0, row.scrollWidth - row.parentElement!.clientWidth);

      gsap.to(row, {
        x: () => -overflow(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Disciplines"
      className="relative overflow-hidden border-y py-[var(--space-xl)]"
      style={{ borderColor: "var(--color-rule)", background: "var(--color-paper-2)" }}
    >
      <div className="mx-auto mb-[var(--space-lg)] max-w-[1280px] px-[var(--space-lg)]">
        <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
          Capabilities
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          ref={rowRef}
          className="font-display flex w-max items-center gap-[var(--space-lg)] whitespace-nowrap px-[var(--space-lg)] will-change-transform"
          style={{
            fontSize: "var(--text-h2)",
            lineHeight: 1.1,
            color: "var(--color-ink)",
          }}
        >
          {DISCIPLINES.map((label, i) => (
            <span key={label} className="flex items-center gap-[var(--space-lg)]">
              <span className="uppercase tracking-[0.01em]">{label}</span>
              {i < DISCIPLINES.length - 1 && (
                <span
                  aria-hidden
                  className="inline-block shrink-0 rotate-45"
                  style={{
                    width: "0.42em",
                    height: "0.42em",
                    background: "var(--color-accent)",
                  }}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
