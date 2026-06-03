"use client";

/**
 * ProjectCard — the single source of truth for an AMS project record card.
 *
 * Used by both the /projects grid and the homepage "Selected projects" band so
 * the two are pixel-identical: same fixed image ratio, same uniform body
 * height (summary clamped via ClampText + read-more), same footer meta. Real
 * project image + real parsed metadata only — never a placeholder.
 */

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ClampText } from "@/components/ui/ClampText";

const EASE = [0.22, 1, 0.36, 1] as const;

export type ProjectCardData = {
  title: string;
  category: string;
  summary: string | null;
  image: string;
  /** Two-digit index marker, e.g. "03". */
  idx: string;
  client?: string | null;
  year?: string | null;
  period?: string | null;
  /** External report link, when a source PDF exists. */
  pdfHref?: string;
  /** Stagger position within its grid. */
  delayIndex?: number;
};

export function ProjectCard({
  title,
  category,
  summary,
  image,
  idx,
  client,
  year,
  period,
  pdfHref,
  delayIndex = 0,
}: ProjectCardData) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.article
      layout
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "120px" }}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(delayIndex, 5) * 0.05 }}
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-rule bg-paper-2",
        "shadow-[0_1px_2px_rgba(48,131,123,0.06)] transition-[transform,box-shadow,border-color] duration-500",
        !reduce && "hover:-translate-y-1.5",
        "hover:border-[color:color-mix(in_oklch,var(--color-accent)_40%,var(--color-rule))]",
        "hover:shadow-[0_22px_48px_-16px_rgba(48,131,123,0.30)]",
      )}
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      {/* cult-ui diagonal sheen sweep on hover */}
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 -translate-x-[120%] -skew-x-12 transition-transform duration-[1100ms] group-hover/card:translate-x-[120%]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--color-paper-2) 92%, transparent) 45%, color-mix(in oklch, var(--color-accent-2) 22%, transparent) 50%, transparent 100%)",
            transitionTimingFunction: "var(--ease-out)",
          }}
        />
      )}

      {/* Real project image — fixed ratio so every card's image is the same size */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`${title} — Advantage Marine project`}
          className={cn(
            "h-full w-full object-cover transition-transform duration-700",
            !reduce && "group-hover/card:scale-[1.04]",
          )}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
          loading="lazy"
          decoding="async"
        />
        <span
          className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 font-display uppercase tracking-[0.08em]"
          style={{
            fontSize: "var(--text-eyebrow)",
            background: "var(--color-accent)",
            color: "var(--color-accent-ink)",
          }}
        >
          {category}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(to top, var(--color-paper-2) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Project</span>
          <span
            className="font-display tabular-nums"
            style={{
              fontSize: "var(--text-eyebrow)",
              letterSpacing: "0.08em",
              color: "color-mix(in oklch, var(--color-ink) 50%, transparent)",
            }}
          >
            {idx}
          </span>
        </div>

        <h3
          className="font-display leading-[1.12] text-[color:var(--color-ink)] [text-wrap:balance]"
          style={{ fontSize: "var(--text-h3)" }}
        >
          {title}
        </h3>

        <ClampText
          text={
            summary ??
            "Project record on file — full scope and report available on request."
          }
          lines={4}
          className="leading-relaxed"
          style={{
            fontSize: "var(--text-card)",
            color: "color-mix(in oklch, var(--color-ink) 66%, transparent)",
          }}
        />

        {/* footer meta + report link — pinned to the foot so cards stay aligned */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-rule)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {client && (
              <span
                className="rounded-full border px-2.5 py-1 font-display tracking-[0.04em]"
                style={{
                  fontSize: "var(--text-eyebrow)",
                  borderColor: "var(--color-rule)",
                  color: "color-mix(in oklch, var(--color-ink) 70%, transparent)",
                }}
              >
                {client}
              </span>
            )}
            {(year || period) && (
              <span
                className="rounded-full px-2.5 py-1 font-display tabular-nums tracking-[0.06em]"
                style={{
                  fontSize: "var(--text-eyebrow)",
                  background:
                    "color-mix(in oklch, var(--color-aqua) 55%, transparent)",
                  color: "var(--color-accent)",
                }}
                title={period ?? undefined}
              >
                {year ?? period}
              </span>
            )}
          </div>

          {pdfHref && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group/pdf relative z-30 inline-flex items-center gap-1.5 font-display tracking-[0.04em] transition-colors duration-300"
              style={{
                fontSize: "var(--text-eyebrow)",
                color: "var(--color-accent)",
                transitionTimingFunction: "var(--ease-out)",
              }}
              aria-label={`View report: ${title}`}
            >
              <span className="uppercase">View report</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover/pdf:translate-x-0.5"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default ProjectCard;
