"use client";

/**
 * SelectedWorksLog — the homepage "Selected work" record, rendered as a survey
 * register surfacing from under the waterline.
 *
 * Each project is one ruled entry: a real project plate (thumbnail, always
 * visible — no hover dependency) carrying its plate index, then the record
 * title, discipline and on-station year laid out as a ship's survey register.
 * The plate sits under a teal "waterline" wash in its idle state; on a real
 * pointer it surfaces — the wash clears and the image lifts. Touch and
 * reduced-motion get the same readable register, every row a live link to the
 * real report. Identical structure at 390 / 768 / 1440 — the columns reflow,
 * the imagery never disappears.
 *
 * No paper-feather over the image (that cream fade read as a white halo on
 * device) — the plate is full-bleed inside a hairline ring instead.
 */

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type WorkRecord = {
  /** Two-digit plate index, e.g. "03". */
  idx: string;
  title: string;
  category: string;
  year: string | null;
  image: string;
  /** External report link, when a source PDF exists. */
  href?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function SelectedWorksLog({ records }: { records: WorkRecord[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="relative mt-[var(--space-xl)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
      {/* the waterline — records emerge from below this teal band */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-20"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklch, var(--color-accent) 13%, transparent) 0%, transparent 100%)",
        }}
      />

      {/* register legend — column headers of the logbook (desktop only) */}
      <div
        className="relative z-10 hidden grid-cols-[5.5rem_1fr_11rem_5rem_1.5rem] items-center gap-4 border-b border-[color:var(--color-rule)] px-[clamp(1rem,3vw,2rem)] py-3 sm:grid"
        style={{ color: "color-mix(in oklch, var(--color-ink) 45%, transparent)" }}
        aria-hidden
      >
        <span className="eyebrow !text-[0.6rem]">Plate</span>
        <span className="eyebrow !text-[0.6rem]">Record</span>
        <span className="eyebrow !text-[0.6rem]">Discipline</span>
        <span className="eyebrow !text-[0.6rem] text-right">On station</span>
        <span />
      </div>

      <ul role="list" className="relative z-10">
        {records.map((r, i) => (
          <LogRow key={r.title} record={r} reduce={reduce} delay={i} />
        ))}
      </ul>
    </div>
  );
}

function LogRow({
  record,
  reduce,
  delay,
}: {
  record: WorkRecord;
  reduce: boolean;
  delay: number;
}) {
  const { idx, title, category, year, image, href } = record;

  return (
    <motion.li
      role="listitem"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "120px" }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(delay, 6) * 0.06 }}
      className="group/row border-t border-[color:var(--color-rule)] first:border-t-0"
    >
      <a
        href={href ?? "/projects"}
        {...(href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={`${title} — ${category}${year ? `, ${year}` : ""}${href ? " — view report" : ""}`}
        className={cn(
          "relative grid items-center gap-4 px-[clamp(1rem,3vw,2rem)] py-[clamp(0.9rem,2vh,1.35rem)] transition-colors duration-300",
          "grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5.5rem_1fr_11rem_5rem_1.5rem]",
          "group-hover/row:bg-[color:color-mix(in_oklch,var(--color-accent)_5%,transparent)]",
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        {/* the survey plate — full-bleed real photo, no cream feather (no halo) */}
        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] ring-1 ring-[color:var(--color-rule)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-[transform,filter] duration-700",
              !reduce && "group-hover/row:scale-[1.06]",
            )}
            style={{
              filter: "saturate(0.84) brightness(0.92)",
              transitionTimingFunction: "var(--ease-out)",
            }}
          />
          {/* teal depth wash — the record sits under the waterline; clears on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-700 group-hover/row:opacity-0"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklch, var(--color-accent) 58%, transparent) 0%, color-mix(in oklch, var(--color-accent) 16%, transparent) 100%)",
              mixBlendMode: "multiply",
              transitionTimingFunction: "var(--ease-out)",
            }}
          />
          {/* plate index */}
          <span
            className="absolute left-1.5 top-1.5 rounded-[5px] px-1.5 py-0.5 font-display tabular-nums leading-none"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.06em",
              background: "color-mix(in oklch, var(--color-ink) 78%, transparent)",
              color: "var(--color-accent-ink)",
            }}
          >
            {idx}
          </span>
        </span>

        {/* record title + (mobile) discipline · year */}
        <span className="min-w-0">
          <span
            className="block font-display leading-[1.12] text-[color:var(--color-ink)] [text-wrap:balance]"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {title}
          </span>
          <span
            className="eyebrow mt-1 block sm:hidden"
            style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}
          >
            {category}
            {year ? ` · ${year}` : ""}
          </span>
        </span>

        {/* discipline (desktop register column) */}
        <span
          className="hidden font-display sm:block"
          style={{
            fontSize: "var(--text-eyebrow)",
            letterSpacing: "0.05em",
            color: "color-mix(in oklch, var(--color-ink) 62%, transparent)",
          }}
        >
          {category}
        </span>

        {/* on-station year (desktop register column) */}
        <span
          className="hidden font-display tabular-nums sm:block sm:text-right"
          style={{
            fontSize: "var(--text-eyebrow)",
            letterSpacing: "0.05em",
            color: "var(--color-accent)",
          }}
        >
          {year ?? "—"}
        </span>

        {/* surface arrow */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 justify-self-end text-[color:var(--color-accent)] transition-transform duration-300 group-hover/row:translate-x-1"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
          aria-hidden
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </a>
    </motion.li>
  );
}
