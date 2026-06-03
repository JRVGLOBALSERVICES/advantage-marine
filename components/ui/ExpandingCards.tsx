"use client";

/**
 * ExpandingCards — AM "Selected Works" accordion band.
 * Adapted from the ruixen expanding-cards pattern, reskinned to the
 * Advantage Marine design.md system (cream paper · marine-teal accent ·
 * Cinzel display). Real project photos only — no placeholders, no lucide
 * castle demo. Horizontal accordion on desktop (active = 5fr, rest = 1fr),
 * vertical stack on mobile. Grayscale → colour as a panel becomes active.
 * Reveal replays on re-entry (parent whileInView, once:false, margin 120px).
 */

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
/* ExpandingCards itself is CSS-driven (no JS motion); SelectedWorks owns the
 * reduced-motion gating for the scroll reveals. */

const EASE = [0.22, 1, 0.36, 1] as const;

export type ExpandingCardItem = {
  id: string | number;
  title: string;
  category: string;
  summary: string;
  period?: string | null;
  imgSrc: string;
};

interface ExpandingCardsProps
  extends React.HTMLAttributes<HTMLUListElement> {
  items: ExpandingCardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
  const [activeIndex, setActiveIndex] = React.useState<number>(
    defaultActiveIndex,
  );
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const gridStyle = React.useMemo<React.CSSProperties>(() => {
    const lanes = items
      .map((_, i) => (i === activeIndex ? "5fr" : "1fr"))
      .join(" ");
    return isDesktop
      ? { gridTemplateColumns: lanes, gridTemplateRows: "1fr" }
      : { gridTemplateRows: lanes, gridTemplateColumns: "1fr" };
  }, [activeIndex, items, isDesktop]);

  return (
    <ul
      ref={ref}
      className={cn(
        "grid w-full gap-2",
        "h-[600px] md:h-[500px]",
        "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
        className,
      )}
      style={gridStyle}
      {...props}
    >
      {items.map((item, index) => {
        const active = activeIndex === index;
        return (
          <li
            key={item.id}
            data-active={active}
            tabIndex={0}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            className={cn(
              // bg-card → AM paper-2 ; border → AM rule ; text-card-foreground → AM ink
              "group/expand relative min-h-0 min-w-0 cursor-pointer overflow-hidden",
              "rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] text-[color:var(--color-ink)]",
              "md:min-w-[72px]",
              "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]",
            )}
          >
            {/* Real project photo — grayscale at rest, colour when active */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imgSrc}
              alt={`${item.title} — Advantage Marine project`}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-all duration-300",
                "scale-110 grayscale group-data-[active=true]/expand:scale-100 group-data-[active=true]/expand:grayscale-0",
              )}
              loading="lazy"
              decoding="async"
            />
            {/* dark photo gradient grounding the type (white text reads on this) */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            />

            {/* Collapsed spine label — rotate-90 uppercase, desktop only, fades when active */}
            <span
              className={cn(
                "absolute bottom-5 left-1/2 hidden -translate-x-1/2 rotate-90 whitespace-nowrap font-display uppercase tracking-wider text-white/85 transition-opacity duration-300 md:block",
                "group-data-[active=true]/expand:opacity-0",
              )}
              style={{ fontSize: "var(--text-eyebrow)" }}
            >
              {item.category}
            </span>

            {/* Expanded content — staggers in (delay 75/150/225) when active */}
            <article className="absolute inset-0 flex flex-col justify-end gap-2 p-6">
              <span
                className="font-display uppercase tracking-[0.1em] text-[color:var(--color-accent-2)] opacity-0 transition-opacity delay-75 duration-300 group-data-[active=true]/expand:opacity-100"
                style={{ fontSize: "var(--text-eyebrow)" }}
              >
                {item.category}
                {item.period ? ` · ${item.period}` : ""}
              </span>
              <h3
                className="max-w-[34ch] font-display text-xl font-bold leading-[1.1] text-white opacity-0 transition-opacity delay-150 duration-300 group-data-[active=true]/expand:opacity-100"
              >
                {item.title}
              </h3>
              <p
                className="max-w-[46ch] text-white/80 opacity-0 transition-opacity delay-[225ms] duration-300 group-data-[active=true]/expand:opacity-100"
                style={{ fontSize: "var(--text-card)" }}
              >
                {item.summary}
              </p>
            </article>

            {/* active accent rule along the leading edge */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0 z-10 origin-left bg-[color:var(--color-accent)] transition-transform duration-500 ease-out",
                "h-1 w-full scale-x-0 group-data-[active=true]/expand:scale-x-100",
              )}
            />
          </li>
        );
      })}
    </ul>
  );
});
ExpandingCards.displayName = "ExpandingCards";

/**
 * SelectedWorks — wraps ExpandingCards in an AM section band with the
 * eyebrow + Cinzel heading, reveal-on-scroll (replays on re-entry).
 */
export function SelectedWorks({
  items,
}: {
  items: ExpandingCardItem[];
}) {
  const reduce = useReducedMotion();
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-[var(--space-xl)]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "120px" }}
        transition={{ duration: 0.55, ease: EASE }}
        className="mb-[var(--space-lg)]"
      >
        <span
          className="font-display uppercase tracking-[0.14em] text-[color:var(--color-accent)]"
          style={{ fontSize: "var(--text-eyebrow)" }}
        >
          Selected Works
        </span>
        <h2
          className="mt-2 max-w-[20ch] font-display leading-[1.08] text-[color:var(--color-ink)]"
          style={{ fontSize: "var(--text-display)" }}
        >
          A record under the waterline.
        </h2>
      </motion.div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "120px" }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
      >
        <ExpandingCards items={items} />
      </motion.div>
    </section>
  );
}
