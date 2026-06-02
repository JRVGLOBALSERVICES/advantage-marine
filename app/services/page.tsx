import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import servicesData from "@/lib/content/services.json";

export const metadata: Metadata = {
  title: "Services — Diving, NDT, Engineering & Steelwork | Advantage Marine Services",
  description:
    "Commercial diving and in-water inspection, conventional & advanced NDT, engineering and steel fabrication, plus rope access, salvage, ICCP and ROV services. IMCA / OGP standard, Johor, Malaysia.",
};

export default function ServicesPage() {
  const { buckets, specialty } = servicesData;

  return (
    <main>
      <PageHeader
        eyebrow="What we do"
        title="Four disciplines, one accountable team."
        lead="From IMCA-standard commercial diving and robotic NDT to engineering, steel fabrication and a broad supporting trade — the full marine and offshore scope, mobilised from our 4,630 m² Johor facility."
      />

      {/* the 4 real discipline buckets */}
      <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)]">
        {buckets.map((b, i) => (
          <section
            key={b.slug}
            id={b.slug}
            className="scroll-mt-28 py-[var(--space-2xl)] border-b border-[color:var(--color-rule)] grid lg:grid-cols-[0.9fr_1.1fr] gap-[var(--space-xl)]"
          >
            <Reveal>
              <p className="eyebrow mb-[var(--space-sm)]">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="font-display font-bold leading-[1.1] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2)" }}>
                {b.title}
              </h2>
              <p className="mt-[var(--space-md)] leading-[1.6]" style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}>
                {b.summary}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="leading-[1.7] mb-[var(--space-lg)]">{b.body}</p>
              {"capabilities" in b && b.capabilities && b.capabilities.length > 0 && (
                <ul className="grid gap-px bg-[color:var(--color-rule)] rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
                  {b.capabilities.map((c) => (
                    <li key={c} className="bg-[color:var(--color-paper)] px-[var(--space-md)] py-3 leading-[1.5] flex gap-3">
                      <span className="text-[color:var(--color-accent)] shrink-0" aria-hidden>—</span>
                      <span style={{ color: "color-mix(in oklch, var(--color-ink) 78%, transparent)" }}>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </section>
        ))}
      </div>

      {/* specialty services */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">Specialty capabilities</p>
          <h2 className="font-display font-bold leading-[1.1] tracking-[-0.02em] mb-[var(--space-xl)]" style={{ fontSize: "var(--text-h3)" }}>
            Supporting scope, in-house.
          </h2>
        </Reveal>
        <div className="grid gap-px bg-[color:var(--color-rule)] sm:grid-cols-2 lg:grid-cols-3 rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
          {specialty.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 0.05}>
              <div className="bg-[color:var(--color-paper)] p-[var(--space-lg)] h-full">
                <h3 className="font-display font-medium mb-[var(--space-sm)]" style={{ fontSize: "1.05rem" }}>{s.title}</h3>
                <p className="leading-[1.55] text-[0.95rem]" style={{ color: "color-mix(in oklch, var(--color-ink) 64%, transparent)" }}>
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center gap-4">
          <p className="font-display" style={{ fontSize: "var(--text-h3)" }}>Need a scope priced?</p>
          <Link href="/contact" className="cta-primary">Request a quote</Link>
        </Reveal>
      </section>
    </main>
  );
}
