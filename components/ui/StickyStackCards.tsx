"use client";

/* Hallmark · component: sticky-stack · genre: modern-minimal · theme: design.md
 * states: rest · in-view · stacked · reduced-motion
 * Vertical scroll-stack: each card pins, the next slides up and rests on top,
 * earlier cards recede (scale + dim) so the group "piles" as you scroll. The
 * AMS disciplines read as a measured deck dealt one at a time — restraint, not
 * a carousel. Built on motion (already in repo), Lenis-driven scroll, iOS-safe
 * (position:sticky, never ScrollTrigger pin), reduced-motion → plain list.
 */

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/* local muted helper — this is a Client Component, so it owns its own token
 * helper rather than receiving a function across the server→client boundary
 * (Next forbids passing functions as props into client components). */
const muted = (pct: number) => ({
  color: `color-mix(in oklch, var(--color-ink) ${pct}%, transparent)`,
});

export type StickyStackItem = {
  key: string;
  eyebrow: string;
  title: string;
  summary: string;
  meta?: string;
  href?: string;
  image: string;
  imageAlt: string;
  icon?: ReactNode;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/* One pinned card. It sticks at an offset that steps down per index (so the
 * stack's top edges fan ~18px each), and as the NEXT card scrolls over it this
 * card eases back (scale ↓, brightness ↓) — the classic deck-recede. */
function Card({
  item,
  index,
  total,
}: {
  item: StickyStackItem;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // progress of THIS card scrolling up to its sticky rest, then past it
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  // recede as the next card covers it
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 - (total - index) * 0.04]);

  const Inner = item.href ? motion.a : motion.div;

  return (
    <div
      ref={ref}
      className="sticky"
      style={{ top: `calc(var(--stack-top) + ${index * 18}px)` }}
    >
      <Inner
        href={item.href}
        style={{ scale, transformOrigin: "center top" }}
        className="group relative block overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] shadow-[0_24px_60px_-32px_rgba(20,40,40,0.45)]"
      >
        <div className="grid items-stretch md:grid-cols-[1.1fr_0.9fr]">
          {/* copy side */}
          <div className="flex flex-col justify-between gap-[var(--space-lg)] p-[clamp(1.5rem,3.5vw,2.75rem)]">
            <div>
              <div className="flex items-center gap-3">
                {item.icon ? (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-paper-3)] text-[color:var(--color-accent)]">
                    {item.icon}
                  </span>
                ) : null}
                <p className="eyebrow">{item.eyebrow}</p>
              </div>
              <h3
                className="font-display font-bold leading-[1.1] tracking-[-0.01em] mt-[var(--space-md)]"
                style={{ fontSize: "var(--text-h3)", overflowWrap: "anywhere" }}
              >
                {item.title}
              </h3>
              <p
                className="measure mt-[var(--space-md)] leading-[1.6]"
                style={muted(66)}
              >
                {item.summary}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              {item.meta ? (
                <span className="eyebrow !text-[0.66rem]" style={muted(50)}>
                  {item.meta}
                </span>
              ) : (
                <span />
              )}
              {item.href ? (
                <span className="inline-flex items-center gap-1.5 font-display text-sm tracking-[0.04em] text-[color:var(--color-accent)] transition-transform duration-[160ms] ease-[var(--ease-out)] group-hover:translate-x-1">
                  View discipline
                  <span aria-hidden>→</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* image side */}
          <div className="relative min-h-[200px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.imageAlt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-[var(--ease-out)] group-hover:scale-[1.04]"
            />
            <span
              aria-hidden
              className="absolute right-4 top-4 font-display text-sm tracking-[0.18em] text-[color:var(--color-accent-ink)] mix-blend-difference"
            >
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>
      </Inner>
    </div>
  );
}

export function StickyStackCards({ items }: { items: StickyStackItem[] }) {
  const reduce = useReducedMotion();

  // reduced-motion / no-JS-friendly: a plain measured vertical list, no pin
  if (reduce) {
    return (
      <ul className="grid gap-[var(--space-lg)]">
        {items.map((item) => (
          <li key={item.key}>
            <a
              href={item.href}
              className="group block overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
            >
              <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="p-[clamp(1.5rem,3.5vw,2.75rem)]">
                  <p className="eyebrow">{item.eyebrow}</p>
                  <h3
                    className="font-display font-bold leading-[1.1] mt-[var(--space-md)]"
                    style={{ fontSize: "var(--text-h3)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="measure mt-[var(--space-md)] leading-[1.6]" style={muted(66)}>
                    {item.summary}
                  </p>
                </div>
                <div className="relative min-h-[180px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="relative"
      style={
        {
          // pin offset below the sticky nav; cards rest here and pile
          ["--stack-top" as string]: "clamp(5rem, 12vh, 9rem)",
        } as React.CSSProperties
      }
    >
      <motion.div
        className="flex flex-col gap-[clamp(2rem,6vh,5rem)] pb-[clamp(2rem,8vh,6rem)]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "0px 0px -120px 0px" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {items.map((item, i) => (
          <Card key={item.key} item={item} index={i} total={items.length} />
        ))}
      </motion.div>
    </div>
  );
}
