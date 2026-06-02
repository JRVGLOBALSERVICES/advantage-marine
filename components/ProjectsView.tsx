"use client";

/**
 * ProjectsView — the interactive body of /projects.
 * 100lvh full-bleed hero (real projects image) + Cinzel H1 + eyebrow + CTA,
 * then a category-filtered editorial grid of REAL AMS project records.
 * Each card: real projects image, title, category, summary, client/year (parsed
 * from the real summary), and a "View report" link out to the live company site
 * (the source PDFs are not bundled in the repo, so we never 404 a /media path).
 * Tokens + harvested components only. Reveals replay (once:false, margin 120px).
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { SlideFillButton } from "@/components/ui/uiverse/SlideFillButton";
import { ExpandIconButton } from "@/components/ui/uiverse/ExpandIconButton";

const EASE = [0.22, 1, 0.36, 1] as const;

export type Project = {
  title: string;
  client: string | null;
  category: string;
  summary: string | null;
  summaryFromFilenameOnly?: boolean;
  pdf?: string;
};

type Props = {
  projects: Project[];
  images: string[];
  heroImage: string;
};

const ALL = "All work" as const;

// Parse a trailing date phrase out of the real summary so cards can surface a
// "year" chip without inventing anything. Returns the matched span text or null.
function parsePeriod(summary: string | null): string | null {
  if (!summary) return null;
  // matches "..., September 2016." / "...; 18 January to 14 March 2021" / "2017"
  const m = summary.match(
    /((?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:to\s+(?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?\d{4})\b\.?\s*$/,
  );
  if (!m) return null;
  return m[1].replace(/\.$/, "").trim();
}

// Extract the year(s) only, for a compact chip.
function parseYear(summary: string | null): string | null {
  if (!summary) return null;
  const years = Array.from(summary.matchAll(/\b(20\d{2})\b/g)).map((x) => x[1]);
  if (years.length === 0) return null;
  const unique = Array.from(new Set(years));
  return unique.length > 1
    ? `${unique[0]}–${unique[unique.length - 1]}`
    : unique[0];
}

export default function ProjectsView({ projects, images, heroImage }: Props) {
  const reduce = useReducedMotion() ?? false;
  const router = useRouter();

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of projects) if (!seen.includes(p.category)) seen.push(p.category);
    return [ALL, ...seen];
  }, [projects]);

  const [active, setActive] = useState<string>(ALL);

  // Photo pool cycles so every card gets a REAL image even if there are fewer
  // photos than projects.
  const photos = images.filter((s) => /\.(jpe?g|png|webp)$/i.test(s));

  const filtered = useMemo(
    () => projects.filter((p) => active === ALL || p.category === active),
    [projects, active],
  );

  return (
    <main>
      {/* ───────────────────────── HERO (100lvh, full-bleed real image) ───────────────────────── */}
      <section className="relative isolate flex min-h-[100lvh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt="Advantage Marine divers and steelwork crew on a jack-up rig offshore Malaysia"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          decoding="async"
        />
        {/* paper grounding scrim — keeps ink type legible, no dark surface introduced */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, var(--color-paper) 4%, color-mix(in oklch, var(--color-paper) 55%, transparent) 38%, color-mix(in oklch, var(--color-paper) 14%, transparent) 72%, color-mix(in oklch, var(--color-paper) 30%, transparent) 100%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)] pt-[calc(var(--space-2xl)+4rem)]">
          <motion.p
            className="eyebrow mb-[var(--space-md)]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            Selected work · Offshore Malaysia
          </motion.p>

          <motion.h1
            className="font-display font-bold tracking-[-0.02em] leading-[1.05] max-w-[16ch]"
            style={{ fontSize: "var(--text-display)", overflowWrap: "anywhere" }}
            initial={reduce ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
            animate={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
          >
            Proven below the waterline.
          </motion.h1>

          <motion.p
            className="mt-[var(--space-lg)] measure leading-[1.6]"
            style={{
              fontSize: "var(--text-lead)",
              color: "color-mix(in oklch, var(--color-ink) 70%, transparent)",
            }}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.22 }}
          >
            Real AMS project records — jack-up rig in-water surveys, structural steel
            repairs, NDT and drop surveys, seawater piping change-outs and refinery
            composite repairs delivered across Malaysia&rsquo;s offshore and industrial sites.
          </motion.p>

          <motion.div
            className="mt-[var(--space-xl)] flex flex-wrap items-center gap-4"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.34 }}
          >
            <SlideFillButton
              label="Request a quote"
              icon="shield"
              onClick={() => router.push("/contact")}
            />
            <ExpandIconButton
              label="Explore services"
              icon="anchor"
              onClick={() => router.push("/services")}
            />
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────── FILTER + GRID ───────────────────────── */}
      <section className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
        <div className="mx-auto max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          {/* Section masthead */}
          <div className="mb-[var(--space-xl)] flex flex-col gap-[var(--space-lg)] border-b border-[color:var(--color-rule)] pb-[var(--space-lg)] md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-[var(--space-sm)]">The record</p>
              <h2
                className="font-display font-bold leading-[1.08] tracking-[-0.01em]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                Fifteen jobs, on file.
              </h2>
            </div>
            <p
              className="measure leading-[1.6]"
              style={{
                fontSize: "var(--text-card)",
                color: "color-mix(in oklch, var(--color-ink) 64%, transparent)",
              }}
            >
              Every entry below is a delivered scope with a report on file. Filter by
              discipline, or read any report in full.
            </p>
          </div>

          {/* Category filter chips */}
          <div
            className="mb-[var(--space-xl)] flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter projects by discipline"
          >
            {categories.map((cat) => {
              const isActive = cat === active;
              const count =
                cat === ALL
                  ? projects.length
                  : projects.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(cat)}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors duration-300",
                    "font-display tracking-[0.04em]",
                  )}
                  style={{
                    fontSize: "var(--text-eyebrow)",
                    transitionTimingFunction: "var(--ease-out)",
                    borderColor: isActive ? "var(--color-accent)" : "var(--color-rule)",
                    background: isActive
                      ? "var(--color-accent)"
                      : "var(--color-paper-2)",
                    color: isActive ? "var(--color-accent-ink)" : "var(--color-ink)",
                  }}
                >
                  <span className="uppercase">{cat}</span>
                  <span
                    className="tabular-nums"
                    style={{
                      color: isActive
                        ? "color-mix(in oklch, var(--color-accent-ink) 78%, transparent)"
                        : "color-mix(in oklch, var(--color-ink) 50%, transparent)",
                    }}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Editorial grid */}
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((p, i) => {
              const img = photos[i % photos.length];
              const period = parsePeriod(p.summary);
              const year = parseYear(p.summary);
              const idx = String(projects.indexOf(p) + 1).padStart(2, "0");
              // Report PDFs are not bundled in the repo — they are filenames from
              // the source site. Link out to the live company site (honest, no 404).
              const pdfHref = p.pdf ? "https://advantagemarine.com.my/" : undefined;

              return (
                <motion.article
                  key={p.title}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 26 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "120px" }}
                  transition={{
                    duration: 0.55,
                    ease: EASE,
                    delay: Math.min(i, 5) * 0.05,
                  }}
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

                  {/* Real project image — never a placeholder */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${p.title} — Advantage Marine project`}
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-700",
                        !reduce && "group-hover/card:scale-[1.04]",
                      )}
                      style={{ transitionTimingFunction: "var(--ease-out)" }}
                      loading="lazy"
                      decoding="async"
                    />
                    {/* category overlay chip on the image */}
                    <span
                      className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 font-display uppercase tracking-[0.08em]"
                      style={{
                        fontSize: "var(--text-eyebrow)",
                        background: "var(--color-accent)",
                        color: "var(--color-accent-ink)",
                      }}
                    >
                      {p.category}
                    </span>
                    {/* paper feather grounding the image into the panel */}
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
                      {p.title}
                    </h3>

                    <p
                      className="leading-relaxed"
                      style={{
                        fontSize: "var(--text-card)",
                        color: "color-mix(in oklch, var(--color-ink) 66%, transparent)",
                      }}
                    >
                      {p.summary ??
                        "Project record on file — full scope and report available on request."}
                    </p>

                    {/* footer meta + report link */}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-rule)] pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.client && (
                          <span
                            className="rounded-full border px-2.5 py-1 font-display tracking-[0.04em]"
                            style={{
                              fontSize: "var(--text-eyebrow)",
                              borderColor: "var(--color-rule)",
                              color: "color-mix(in oklch, var(--color-ink) 70%, transparent)",
                            }}
                          >
                            {p.client}
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
                          aria-label={`View report (PDF): ${p.title}`}
                        >
                          <span className="uppercase">View report</span>
                          <DocArrow />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {/* Closing CTA band */}
          <motion.div
            className="mt-[var(--space-2xl)] flex flex-col items-start gap-[var(--space-lg)] border-t border-[color:var(--color-rule)] pt-[var(--space-2xl)] md:flex-row md:items-center md:justify-between"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p
              className="font-display font-bold leading-[1.1] tracking-[-0.01em] max-w-[14ch]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Have a scope in mind?
            </p>
            <SlideFillButton
              label="Request a quote"
              icon="anchor"
              onClick={() => router.push("/contact")}
            />
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function DocArrow() {
  return (
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
  );
}
