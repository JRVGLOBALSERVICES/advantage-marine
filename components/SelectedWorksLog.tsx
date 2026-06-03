"use client";

/**
 * SelectedWorksLog — the homepage "Selected work" record, rendered as a
 * survey logbook surfacing from under the waterline.
 *
 * Each project is one entry in the log: a ruled row carrying its sounding
 * index, title, discipline and year — read like a ship's survey register.
 * On hover (desktop / fine-pointer only) a teal marquee rises from the
 * closest edge carrying the real project photo, as if the record surfaced
 * out of the water. Touch / reduced-motion get the static ruled log, every
 * row still a live link to the real report.
 *
 * Mechanism adapted from React Bits "FlowingMenu" (MIT, David Haz) — the
 * edge-aware rising marquee — retuned to the AM cream/ink/teal system and
 * a record-row layout instead of a full-screen nav. gsap is already a site
 * dependency (SmoothScroll drives gsap.ticker through Lenis).
 */

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { motion, useReducedMotion } from "motion/react";

export type WorkRecord = {
  /** Two-digit sounding index, e.g. "03". */
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
    <div
      className="mt-[var(--space-xl)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]"
      role="list"
      aria-label="Selected Advantage Marine project records"
    >
      {/* register header — the column legend of the logbook */}
      <div
        className="hidden items-center gap-4 border-b border-[color:var(--color-rule)] px-[clamp(1rem,3vw,2rem)] py-3 sm:grid"
        style={{
          gridTemplateColumns: "3.5rem 1fr 12rem 6rem",
          color: "color-mix(in oklch, var(--color-ink) 45%, transparent)",
        }}
        aria-hidden
      >
        <span className="eyebrow !text-[0.6rem]">No.</span>
        <span className="eyebrow !text-[0.6rem]">Record</span>
        <span className="eyebrow !text-[0.6rem]">Discipline</span>
        <span className="eyebrow !text-[0.6rem] text-right">On station</span>
      </div>

      {records.map((r, i) => (
        <LogRow key={r.title} record={r} isLast={i === records.length - 1} reduce={reduce} delay={i} />
      ))}
    </div>
  );
}

function LogRow({
  record,
  isLast,
  reduce,
  delay,
}: {
  record: WorkRecord;
  isLast: boolean;
  reduce: boolean;
  delay: number;
}) {
  const { idx, title, category, year, image, href } = record;
  const rowRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [reps, setReps] = useState(6);
  const [canHover, setCanHover] = useState(false);

  const defaults = { duration: 0.55, ease: "expo" };

  const closestEdge = (mx: number, my: number, w: number, h: number): "top" | "bottom" =>
    (mx - w / 2) ** 2 + my ** 2 < (mx - w / 2) ** 2 + (my - h) ** 2 ? "top" : "bottom";

  // only wire the surfacing marquee where there's a real pointer + motion is allowed
  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setCanHover(fine);
  }, [reduce]);

  // size the repeating strip to cover the row width, then loop it
  useEffect(() => {
    if (!canHover || !innerRef.current) return;
    const part = innerRef.current.querySelector(".rec-part") as HTMLElement | null;
    if (part) {
      const need = Math.ceil(window.innerWidth / Math.max(part.offsetWidth, 1)) + 2;
      setReps(Math.max(4, need));
    }
    const t = setTimeout(() => {
      const p = innerRef.current?.querySelector(".rec-part") as HTMLElement | null;
      if (!p || p.offsetWidth === 0) return;
      tween.current?.kill();
      tween.current = gsap.to(innerRef.current, {
        x: -p.offsetWidth,
        duration: 14,
        ease: "none",
        repeat: -1,
      });
    }, 60);
    return () => {
      clearTimeout(t);
      tween.current?.kill();
    };
  }, [canHover, reps]);

  const onEnter = (e: React.MouseEvent) => {
    if (!canHover || !rowRef.current || !marqueeRef.current || !innerRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const edge = closestEdge(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(innerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, innerRef.current], { y: "0%" }, 0);
  };

  const onLeave = (e: React.MouseEvent) => {
    if (!canHover || !rowRef.current || !marqueeRef.current || !innerRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const edge = closestEdge(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(innerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const RowInner = (
    <div
      className="grid items-center gap-3 px-[clamp(1rem,3vw,2rem)] py-[clamp(1.1rem,2.4vh,1.7rem)] sm:gap-4"
      style={{ gridTemplateColumns: "2.5rem 1fr auto" }}
    >
      {/* sounding mark + index */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-6 w-px"
          style={{ background: "color-mix(in oklch, var(--color-accent) 60%, transparent)" }}
        />
        <span
          className="font-display tabular-nums"
          style={{
            fontSize: "var(--text-eyebrow)",
            letterSpacing: "0.08em",
            color: "color-mix(in oklch, var(--color-ink) 55%, transparent)",
          }}
        >
          {idx}
        </span>
      </div>

      {/* title + (mobile) discipline */}
      <div className="min-w-0">
        <h3
          className="font-display leading-[1.12] text-[color:var(--color-ink)] [text-wrap:balance]"
          style={{ fontSize: "var(--text-h3)" }}
        >
          {title}
        </h3>
        <span
          className="eyebrow mt-1 block sm:hidden"
          style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}
        >
          {category}
          {year ? ` · ${year}` : ""}
        </span>
      </div>

      {/* discipline + year + arrow (desktop register columns) */}
      <div className="flex items-center gap-4 sm:gap-6">
        <span
          className="hidden font-display sm:block sm:w-[12rem]"
          style={{
            fontSize: "var(--text-eyebrow)",
            letterSpacing: "0.06em",
            color: "color-mix(in oklch, var(--color-ink) 62%, transparent)",
          }}
        >
          {category}
        </span>
        <span
          className="hidden font-display tabular-nums sm:block sm:w-[6rem] sm:text-right"
          style={{
            fontSize: "var(--text-eyebrow)",
            letterSpacing: "0.06em",
            color: "var(--color-accent)",
          }}
        >
          {year ?? "—"}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 text-[color:var(--color-accent)] transition-transform duration-300 group-hover/row:translate-x-1"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
          aria-hidden
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );

  return (
    <motion.div
      ref={rowRef}
      role="listitem"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "120px" }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(delay, 6) * 0.05 }}
      className="group/row relative overflow-hidden"
      style={{ borderTop: isLast || delay === 0 ? undefined : undefined }}
    >
      {/* the live record link — opens the real report (or the project log) */}
      <a
        href={href ?? "/projects"}
        {...(href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={`${title} — ${category}${year ? `, ${year}` : ""}${href ? " — view report" : ""}`}
        className="relative z-10 block border-t border-[color:var(--color-rule)] transition-colors duration-300"
      >
        {RowInner}
      </a>

      {/* surfacing marquee — the record rising out of teal water on hover */}
      {canHover && (
        <div
          ref={marqueeRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 translate-y-[101%] overflow-hidden"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          <div ref={innerRef} className="flex h-full w-fit items-center">
            {Array.from({ length: reps }).map((_, k) => (
              <div className="rec-part flex flex-shrink-0 items-center" key={k}>
                <span
                  className="whitespace-nowrap px-[1.2vw] font-display uppercase leading-none"
                  style={{
                    fontSize: "var(--text-h3)",
                    letterSpacing: "0.02em",
                    color: "var(--color-accent-ink)",
                  }}
                >
                  {title}
                </span>
                <span
                  aria-hidden
                  className="px-[0.6vw] font-display"
                  style={{ color: "color-mix(in oklch, var(--color-accent-ink) 60%, transparent)" }}
                >
                  ◆
                </span>
                <span
                  className="mx-[0.6vw] h-[60%] w-[clamp(7rem,12vw,12rem)] flex-shrink-0 rounded-[var(--radius-pill,9999px)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
