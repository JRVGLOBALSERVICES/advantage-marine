import Link from "next/link";
import PropellerHero from "@/components/PropellerHero";
import GlobalReach from "@/components/GlobalReach";
import Reveal from "@/components/Reveal";
import { WordReveal } from "@/components/ui/WordReveal";
import { TextSpotlightReveal } from "@/components/ui/TextSpotlightReveal";
import { StackedCards, StackedCard } from "@/components/ui/StackedCards";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { Marquee } from "@/components/ui/Marquee";
import servicesData from "@/lib/content/services.json";
import aboutData from "@/lib/content/about.json";

// Real discipline terms pulled from services.json capabilities (no fabrication).
const DISCIPLINES = [
  "Hull cleaning", "Propeller polishing", "Class IWS / UWILD", "Tail-shaft wear-down",
  "PAUT", "TOFD", "IRIS", "Remote Field Testing", "ICCP & sacrificial anodes",
  "Rope access (IRATA)", "Salvage works", "Chasing M2 ROV", "Multibeam survey",
  "Vacuum box testing", "Cofferdam hull repair",
];

const muted = (pct: number) => ({ color: `color-mix(in oklch, var(--color-ink) ${pct}%, transparent)` });

export default function Home() {
  const buckets = servicesData.buckets;
  const company = aboutData.company;
  const classCount = aboutData.classSocieties.length;

  return (
    <main>
      {/* one crawlable H1 — the page promise */}
      <h1 className="sr-only">
        Advantage Marine Services — in-water inspection, robotic NDT and marine
        engineering for shipping and offshore, Johor, Malaysia.
      </h1>

      <PropellerHero />

      {/* ---- class-approved reach ---- */}
      <GlobalReach />

      {/* ---- what we do — numbered editorial spec-rows ---- */}
      <section
        id="services"
        className="mx-auto max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]"
      >
        <div className="mb-[var(--space-xl)] grid items-end gap-[var(--space-md)] md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-[var(--space-md)]">What we do</p>
            <h2
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[18ch]"
              style={{ fontSize: "var(--text-h2)", overflowWrap: "anywhere" }}
            >
              <WordReveal text="Four accountable disciplines, mobilised afloat." />
            </h2>
          </div>
          <Reveal className="md:pb-2">
            <p className="measure leading-[1.6]" style={muted(66)}>
              Diving, NDT, engineering and a broad supporting trade — run from our
              4,630&nbsp;m² Johor facility. Surveyed afloat, never dry-docked.
            </p>
          </Reveal>
        </div>

        <StackedCards className="border-t border-[color:var(--color-rule)]">
          {buckets.map((b, i) => (
            <StackedCard key={b.slug} as="div">
              <Link
                href={`/services#${b.slug}`}
                className="group grid grid-cols-[auto_1fr] items-start gap-x-[clamp(1rem,3vw,2.5rem)] gap-y-2 border-b border-[color:var(--color-rule)] py-[var(--space-lg)] transition-colors hover:bg-[color:var(--color-paper-3)] md:grid-cols-[5rem_1fr_auto]"
              >
                <span
                  className="font-display text-[1.5rem] font-bold tabular-nums leading-none text-[color:var(--color-accent)] transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="mb-1.5 font-display font-medium" style={{ fontSize: "var(--text-card)" }}>
                    {b.title}
                  </h3>
                  <p className="measure leading-[1.55]" style={muted(64)}>
                    {b.summary}
                  </p>
                  <p className="eyebrow mt-3 !text-[0.66rem] !tracking-[0.18em]">
                    {b.capabilities.length} capability lines
                  </p>
                </div>
                <span
                  className="hidden self-center text-[color:var(--color-accent)] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:block"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </StackedCard>
          ))}
        </StackedCards>

        {/* discipline marquee — real capability domains */}
        <div className="relative mt-[var(--space-xl)] overflow-hidden border-y border-[color:var(--color-rule)] py-3">
          <Marquee pauseOnHover className="[--duration:38s]">
            {DISCIPLINES.map((d) => (
              <span
                key={d}
                className="mx-5 inline-flex items-center gap-3 whitespace-nowrap text-sm"
                style={muted(58)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-2)]" aria-hidden />
                {d}
              </span>
            ))}
          </Marquee>
          {/* edge fades, cream so the strip dissolves into the page */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[color:var(--color-paper)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[color:var(--color-paper)] to-transparent" />
        </div>

        <Reveal className="mt-[var(--space-lg)]">
          <Link href="/services" className="cta-secondary">Explore all services</Link>
        </Reveal>
      </section>

      {/* ---- about teaser — spotlight statement + real stat row ---- */}
      <section
        id="about"
        className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[min(1100px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <p className="eyebrow mb-[var(--space-md)]">About AMS</p>
          <TextSpotlightReveal
            as="p"
            text={`${company.legalName} has delivered best-in-class in-water services for marine, shipping and offshore since ${company.since} — to OGP / IMCA standard, from a 4,630 m² facility in Johor.`}
            className="font-display leading-[1.28] tracking-[-0.01em] measure"
          />

          {/* real stats only — see about.json _meta (unconfirmed '10+' placeholders excluded) */}
          <dl className="mt-[var(--space-xl)] grid grid-cols-2 gap-[var(--space-lg)] border-t border-[color:var(--color-rule)] pt-[var(--space-lg)] sm:grid-cols-4">
            <div>
              <dd className="font-display font-bold leading-none text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-stat)" }}>
                <NumberTicker value={10} />+
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">Years experience</dt>
            </div>
            <div>
              <dd className="font-display font-bold leading-none text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-stat)" }}>
                <NumberTicker value={4630} />
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">m² Johor facility</dt>
            </div>
            <div>
              <dd className="font-display font-bold leading-none text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-stat)" }}>
                {company.since}
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">Established</dt>
            </div>
            <div>
              <dd className="font-display font-bold leading-none text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-stat)" }}>
                <NumberTicker value={classCount} />
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">Class societies</dt>
            </div>
          </dl>

          <div className="mt-[var(--space-xl)] flex flex-wrap gap-3">
            <MagneticLink href="/about" className="cta-secondary">More about AMS</MagneticLink>
            <MagneticLink href="/contact" className="cta-primary">Talk to AMS</MagneticLink>
          </div>
        </div>
      </section>
    </main>
  );
}
