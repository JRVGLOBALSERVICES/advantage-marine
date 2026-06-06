"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { WordReveal } from "@/components/ui/WordReveal";

/**
 * NewsHero — 100lvh full-bleed editorial hero for the Dispatch page.
 * Real OGA exhibition photography behind an ink scrim; Cinzel display H1
 * (the page's single <h1>), teal eyebrow, lead, and a quote CTA.
 * Parallax/zoom drift gates on prefers-reduced-motion.
 */
export default function NewsHero({
  image,
  imageAlt,
}: {
  image: string;
  imageAlt: string;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section className="relative h-[100lvh] w-full overflow-hidden">
      {/* Real photograph, full-bleed. Slow scale drift for life; static under reduced-motion. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.08 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={{ duration: 12, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </motion.div>

      {/* Ink scrim — keeps Cinzel legible over the photo, never cream text. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--color-ink) 30%, transparent) 0%, color-mix(in oklch, var(--color-ink) 16%, transparent) 38%, color-mix(in oklch, var(--color-ink) 58%, transparent) 100%)",
        }}
      />

      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[calc(var(--space-2xl)+1rem)]">
          <motion.p
            className="eyebrow mb-[var(--space-md)]"
            style={{ color: "var(--color-accent-2)" }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            News &amp; insight · Advantage Marine
          </motion.p>

          <h1
            className="font-display font-bold leading-[1.05] tracking-[-0.02em] max-w-[14ch] text-[color:var(--color-accent-ink)]"
            style={{ fontSize: "var(--text-display)", textShadow: "0 2px 30px rgba(0,0,0,0.35)" }}
          >
            <WordReveal text="Dispatch" once staggerMs={0} translate={26} />
          </h1>

          <motion.p
            className="mt-[var(--space-lg)] measure leading-[1.6] text-[color:var(--color-accent-ink)]"
            style={{ fontSize: "var(--text-lead)", textShadow: "0 1px 18px rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Where AMS shows up — exhibitions, milestones and the work that
            carries the line, &ldquo;Discover the AMS Difference.&rdquo;
          </motion.p>

          <motion.div
            className="mt-[var(--space-xl)] flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/contact" className="cta-primary">
              Talk to AMS
            </Link>
            <Link
              href="/services"
              className="cta-secondary"
              style={{ borderColor: "color-mix(in oklch, var(--color-accent-ink) 55%, transparent)", color: "var(--color-accent-ink)" }}
            >
              Explore services
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue — quiet, reduced-motion-safe. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute bottom-[var(--space-lg)] left-1/2 h-9 w-px -translate-x-1/2"
          style={{ background: "color-mix(in oklch, var(--color-accent-ink) 60%, transparent)" }}
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </section>
  );
}
