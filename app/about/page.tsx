import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import aboutData from "@/lib/content/about.json";

export const metadata: Metadata = {
  title: "About — Advantage Marine Services (Malaysia) Sdn Bhd",
  description:
    "Established 2014, Advantage Marine Services is a Johor-based marine and offshore specialist in in-water inspection, NDT, diving and engineering. IMCA / OGP standard, 4,630 m² facility, class surveys accepted by ABS, DNV, BV, LR and ClassNK.",
};

export default function AboutPage() {
  const { company, leadership, classSocieties, certifications, awards, csr } = aboutData;

  return (
    <main>
      <PageHeader
        eyebrow="About AMS"
        title="Setting the standard in marine & offshore."
        lead={company.intro}
      />

      {/* vision / mission / commitment */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-px bg-[color:var(--color-rule)] md:grid-cols-3 rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
        {[
          { t: "Our Vision", b: company.vision },
          { t: "Our Mission", b: company.mission },
          { t: "Our Commitment", b: company.commitment },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.05}>
            <div className="bg-[color:var(--color-paper)] p-[var(--space-lg)] h-full">
              <p className="eyebrow mb-[var(--space-md)]">{c.t}</p>
              <p className="leading-[1.65] text-[0.95rem]" style={{ color: "color-mix(in oklch, var(--color-ink) 72%, transparent)" }}>{c.b}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* facts strip */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)]">
        <div className="grid gap-[var(--space-lg)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: company.since, l: "Established · Johor, Malaysia" },
            { v: "4,630 m²", l: "Warehouse facility footprint" },
            { v: "IMCA / OGP", l: "Operating standard" },
            { v: `${classSocieties.length}`, l: "Class societies accepted" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 0.05}>
              <p className="font-display font-bold leading-none text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-stat)" }}>{s.v}</p>
              <p className="eyebrow mt-[var(--space-sm)] !tracking-[0.18em] normal-case max-w-[16rem]" style={{ color: "color-mix(in oklch, var(--color-ink) 60%, transparent)" }}>{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* director quote */}
      <section className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-rule)]">
        <div className="max-w-[min(1000px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <Reveal>
            <blockquote className="font-display leading-[1.3] tracking-[-0.01em] measure" style={{ fontSize: "var(--text-h3)" }}>
              “{company.directorQuote.quote}”
            </blockquote>
            <p className="eyebrow mt-[var(--space-lg)]">{company.directorQuote.attribution}</p>
          </Reveal>
        </div>
      </section>

      {/* leadership */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">Leadership</p>
          <h2 className="font-display font-bold leading-[1.1] tracking-[-0.02em] mb-[var(--space-xl)]" style={{ fontSize: "var(--text-h2)" }}>
            The team behind the work.
          </h2>
        </Reveal>
        <div className="grid gap-[var(--space-xl)]">
          {leadership.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.05}>
              <article className="grid lg:grid-cols-[0.8fr_2fr] gap-[var(--space-lg)] border-t border-[color:var(--color-rule)] pt-[var(--space-lg)]">
                <div>
                  <h3 className="font-display font-bold" style={{ fontSize: "var(--text-h3)" }}>{p.name}</h3>
                  <p className="eyebrow mt-2 !tracking-[0.18em] normal-case">{p.role}</p>
                  {"yearsExperience" in p && p.yearsExperience && (
                    <p className="mt-3 text-sm" style={{ color: "color-mix(in oklch, var(--color-ink) 60%, transparent)" }}>{p.yearsExperience} yrs experience</p>
                  )}
                </div>
                <p className="leading-[1.7]" style={{ color: "color-mix(in oklch, var(--color-ink) 74%, transparent)" }}>{p.bio}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* class societies + certifications */}
      <section className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-rule)]">
        <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-[var(--space-md)]">Class societies accepted</p>
            <div className="flex flex-wrap gap-2">
              {classSocieties.map((c) => (
                <span key={c} className="font-display font-medium text-sm tracking-[0.06em] px-4 py-2 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] text-[color:var(--color-accent)]">{c}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow mb-[var(--space-md)]">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {certifications.map((c) => (
                <span key={c} className="font-display font-medium text-sm tracking-[0.06em] px-4 py-2 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">{c}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* awards + CSR */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">Recognition</p>
          <ul className="grid gap-px bg-[color:var(--color-rule)] rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
            {awards.map((a) => (
              <li key={a.title} className="bg-[color:var(--color-paper)] px-[var(--space-md)] py-3 font-display">{a.title}</li>
            ))}
          </ul>
        </Reveal>
        {csr && (
          <Reveal delay={0.08}>
            <p className="eyebrow mb-[var(--space-md)]">Corporate Social Responsibility</p>
            <p className="leading-[1.7]" style={{ color: "color-mix(in oklch, var(--color-ink) 72%, transparent)" }}>{csr}</p>
          </Reveal>
        )}
      </section>

      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)]">
        <Reveal className="flex flex-wrap items-center gap-4">
          <p className="font-display" style={{ fontSize: "var(--text-h3)" }}>Work with AMS.</p>
          <Link href="/contact" className="cta-primary">Talk to AMS</Link>
          <Link href="/projects" className="cta-secondary">See our work</Link>
        </Reveal>
      </section>
    </main>
  );
}
