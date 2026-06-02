import Link from "next/link";
import PropellerHero from "@/components/PropellerHero";
import GlobalReach from "@/components/GlobalReach";
import Reveal from "@/components/Reveal";
import servicesData from "@/lib/content/services.json";
import aboutData from "@/lib/content/about.json";

export default function Home() {
  const buckets = servicesData.buckets;
  const company = aboutData.company;

  return (
    <main>
      {/* one crawlable H1 — the page promise */}
      <h1 className="sr-only">
        Advantage Marine Services — in-water inspection, robotic NDT and marine
        engineering for shipping and offshore, Johor, Malaysia.
      </h1>

      <PropellerHero />

      {/* ---- class-approved reach (registry components) ---- */}
      <GlobalReach />

      {/* ---- what we do — real 4 disciplines ---- */}
      <section
        id="services"
        className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto"
      >
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">What we do</p>
          <h2
            className="font-display font-bold leading-[1.08] tracking-[-0.02em] mb-[var(--space-md)] max-w-[20ch]"
            style={{ fontSize: "var(--text-h2)", overflowWrap: "anywhere" }}
          >
            End-to-end marine &amp; offshore engineering.
          </h2>
          <p className="measure leading-[1.6] mb-[var(--space-xl)]" style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}>
            Four accountable disciplines, mobilised from our Johor facility — diving,
            NDT, engineering and a broad supporting trade. Surveyed afloat, never
            dry-docked.
          </p>
        </Reveal>

        <div className="grid gap-px bg-[color:var(--color-rule)] sm:grid-cols-2 rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
          {buckets.map((b, i) => (
            <Reveal key={b.slug} delay={i * 0.05}>
              <Link
                href={`/services#${b.slug}`}
                className="group block bg-[color:var(--color-paper)] p-[var(--space-lg)] h-full transition-colors hover:bg-[color:var(--color-aqua)]"
              >
                <div className="flex items-baseline justify-between gap-3 mb-[var(--space-sm)]">
                  <h3 className="font-display font-medium" style={{ fontSize: "var(--text-card)" }}>{b.title}</h3>
                  <span className="text-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden>→</span>
                </div>
                <p className="leading-[1.55]" style={{ color: "color-mix(in oklch, var(--color-ink) 64%, transparent)" }}>
                  {b.summary}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-[var(--space-lg)]">
          <Link href="/services" className="cta-secondary">Explore all services</Link>
        </Reveal>
      </section>

      {/* ---- about teaser — real prose ---- */}
      <section
        id="about"
        className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] max-w-[min(1000px,92vw)] mx-auto border-t border-[color:var(--color-rule)]"
      >
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">About AMS</p>
          <p
            className="font-display leading-[1.3] tracking-[-0.01em] measure"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {company.legalName} has delivered best-in-class in-water services for
            marine, shipping and offshore since {company.since} — to OGP / IMCA
            standard, from a 4,630&nbsp;m² facility in Johor.
          </p>
          <div className="mt-[var(--space-lg)] flex flex-wrap gap-3">
            <Link href="/about" className="cta-secondary">More about AMS</Link>
            <Link href="/contact" className="cta-primary">Talk to AMS</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
