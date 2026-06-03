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
import { SelectedWorks } from "@/components/ui/ExpandingCards";
import { ProjectCard } from "@/components/ProjectCard";
import { parsePeriod, parseYear, reportHref } from "@/lib/projectMeta";

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

  // Selected Works band — one flagship job per distinct discipline, real
  // photo + parsed period. Drives the expanding-cards accordion.
  const selectedWorks = useMemo(() => {
    const pool = images.filter((s) => /\.(jpe?g|png|webp)$/i.test(s));
    const seen = new Set<string>();
    const picks: typeof projects = [];
    for (const p of projects) {
      if (seen.has(p.category)) continue;
      seen.add(p.category);
      picks.push(p);
      if (picks.length >= 6) break;
    }
    return picks.map((p, i) => ({
      id: p.title,
      title: p.title,
      category: p.category,
      summary: p.summary ?? "",
      period: parsePeriod(p.summary),
      imgSrc: pool[i % pool.length],
    }));
  }, [projects, images]);

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

      {/* ───────────────────────── SELECTED WORKS (expanding accordion) ───────────────────────── */}
      <section className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
        <SelectedWorks items={selectedWorks} />
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
              // Deep-link "View report" straight to the REAL source PDF
              // (verified 200 application/pdf), not the generic homepage.
              const pdfHref = reportHref(p.pdf) ?? undefined;

              return (
                <ProjectCard
                  key={p.title}
                  title={p.title}
                  category={p.category}
                  summary={p.summary}
                  image={img}
                  idx={String(projects.indexOf(p) + 1).padStart(2, "0")}
                  client={p.client}
                  year={parseYear(p.summary)}
                  period={parsePeriod(p.summary)}
                  pdfHref={pdfHref}
                  delayIndex={i}
                />
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
