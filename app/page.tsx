import Link from "next/link";
import RigHero from "@/components/RigHero";
import SceneBuildLoader from "@/components/SceneBuildLoader";
import GlobalReach from "@/components/GlobalReach";
import Reveal from "@/components/Reveal";
import { WordReveal } from "@/components/ui/WordReveal";
import { FanCardDeck, type FanCard } from "@/components/ui/aceternity/FanCardDeck";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/magic/ScrollBasedVelocity";
import { SheenCard } from "@/components/ui/cult/SheenCard";
import { LottieIcon } from "@/components/ui/LottieIcon";
import GsapifySection from "@/components/ui/GsapifySection";
import { SlideFillButton } from "@/components/ui/uiverse/SlideFillButton";
import { NumberTicker } from "@/components/ui/NumberTicker";
import servicesData from "@/lib/content/services.json";
import aboutData from "@/lib/content/about.json";
import projectsData from "@/lib/content/projects.json";
import certsData from "@/lib/content/media-manifest.json";

/* ── token helpers ─────────────────────────────────────────────────────── */
const muted = (pct: number) => ({
  color: `color-mix(in oklch, var(--color-ink) ${pct}%, transparent)`,
});

/* ── real bucket → real photo + real Lottie discipline icon (no stock) ──── */
const BUCKET_MEDIA: Record<
  string,
  { image: string; lottie: string; alt: string }
> = {
  "marine-diving": {
    image: "/media/service_diving/bluestream-offshore-1920-2-1.1920x0.jpg",
    lottie: "/lottie/diving-helmet.json",
    alt: "AMS commercial diver descending on an offshore in-water survey",
  },
  ndt: {
    image: "/media/service_ndt/ndt1.jpg",
    lottie: "/lottie/ndt-scan.json",
    alt: "Technician performing non-destructive testing on a weld",
  },
  "engineering-steelwork": {
    image: "/media/service_steelwork/ES1.jpg",
    lottie: "/lottie/engineering-gear.json",
    alt: "Structural steel fabrication work at the AMS Johor facility",
  },
  "trading-others": {
    image: "/media/service_rope/ra1.jpg",
    lottie: "/lottie/rov-sonar.json",
    alt: "Rope-access and hydrographic survey supporting works",
  },
};

/* ── 12 real class-society + ISO/OHSAS credential logos ─────────────────── */
const CERTS = certsData.certs;

/* ── three selected, fully-documented projects (real images + real copy) ── */
const FEATURED = [
  {
    p: projectsData.projects.find((x) => x.title.startsWith("Span Breaker"))!,
    image: "/media/projects/Photo-1.jpeg",
  },
  {
    p: projectsData.projects.find((x) =>
      x.title.startsWith("Perisai Pacific 101 - Seawater"),
    )!,
    image: "/media/projects/Photo-5.jpeg",
  },
  {
    p: projectsData.projects.find((x) =>
      x.title.startsWith("Borr Drilling"),
    )!,
    image: "/media/projects/Photo-3.jpeg",
  },
];

export default function Home() {
  const buckets = servicesData.buckets;
  const company = aboutData.company;
  const classCount = aboutData.classSocieties.length;

  /* fan deck items — the four accountable disciplines, real images + summaries */
  const fanCategory: Record<string, string> = {
    "marine-diving": "Air & mixed-gas diving",
    ndt: "Inspection & integrity",
    "engineering-steelwork": "Design & fabrication",
    "trading-others": "Survey & supporting works",
  };
  const fanItems: FanCard[] = buckets.map((b) => ({
    title: b.title,
    src: BUCKET_MEDIA[b.slug].image,
    category: fanCategory[b.slug],
    summary: b.summary,
  }));

  return (
    <main>
      {/* branded scene-build loader — holds the frame while the vessel hydrates */}
      <SceneBuildLoader />
      {/* one crawlable H1 — the page promise */}
      <h1 className="sr-only">
        Advantage Marine Services — in-water inspection, robotic NDT and marine
        engineering for shipping and offshore, Johor, Malaysia.
      </h1>

      {/* (1) ── rig assembly hero, 100lvh ───────────────────────────────── */}
      <RigHero />

      {/* (2) ── class-approved reach (kept) ─────────────────────────────── */}
      <GlobalReach />

      {/* (3) ── what we do — fanned deck + lottie-iconed sheen tiles ─────── */}
      <section
        id="services"
        className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]"
      >
        <div className="grid items-end gap-[var(--space-xl)] lg:grid-cols-[1.05fr_0.95fr]">
          {/* left — editorial header + the literal fanned deck */}
          <div>
            <p className="eyebrow mb-[var(--space-md)]">What we do</p>
            <h2
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[16ch]"
              style={{ fontSize: "var(--text-h2)", overflowWrap: "anywhere" }}
            >
              <WordReveal text="Four accountable disciplines, mobilised afloat." />
            </h2>
            <Reveal>
              <p
                className="measure mt-[var(--space-lg)] leading-[1.6]"
                style={muted(66)}
              >
                Diving, NDT, engineering and a broad supporting trade — run from
                our 4,630&nbsp;m² Johor facility to OGP / IMCA standard.
                Surveyed afloat, never dry-docked.
              </p>
            </Reveal>

            <div className="mt-[var(--space-xl)] flex justify-center lg:justify-start">
              <FanCardDeck items={fanItems} rotate={6} interval={6000} />
            </div>
          </div>

          {/* right — the four buckets as real-image sheen cards w/ Lottie icons */}
          <ul className="grid gap-[var(--space-lg)] sm:grid-cols-2">
            {buckets.map((b, i) => {
              const m = BUCKET_MEDIA[b.slug];
              return (
                <li key={b.slug}>
                  <SheenCard
                    eyebrow={`Discipline ${String(i + 1).padStart(2, "0")}`}
                    title={b.title}
                    description={b.summary}
                    imageSrc={m.image}
                    imageAlt={m.alt}
                    href={`/services#${b.slug}`}
                    icon={
                      <LottieIcon
                        src={m.lottie}
                        size={26}
                        label={`${b.title} icon`}
                      />
                    }
                    className="h-full"
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <Reveal className="mt-[var(--space-xl)]">
          <Link href="/services" className="cta-secondary">
            Explore all services
          </Link>
        </Reveal>
      </section>

      {/* (4) ── honest stat band ────────────────────────────────────────── */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <p className="eyebrow mb-[var(--space-lg)]">By the numbers</p>
          {/* real stats only — about.json _meta flags the repeated "10+" labels
              as placeholders; only these four are supported by source prose. */}
          <dl className="grid grid-cols-2 gap-[var(--space-lg)] sm:grid-cols-4">
            <div>
              <dd
                className="font-display font-bold leading-[1.05] text-[color:var(--color-accent)]"
                style={{ fontSize: "var(--text-stat)" }}
              >
                <NumberTicker value={10} />+
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">Years afloat</dt>
            </div>
            <div>
              <dd
                className="font-display font-bold leading-[1.05] text-[color:var(--color-accent)]"
                style={{ fontSize: "var(--text-stat)" }}
              >
                <NumberTicker value={4630} />
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">m² Johor facility</dt>
            </div>
            <div>
              <dd
                className="font-display font-bold leading-[1.05] text-[color:var(--color-accent)]"
                style={{ fontSize: "var(--text-stat)" }}
              >
                {company.since}
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">Established</dt>
            </div>
            <div>
              <dd
                className="font-display font-bold leading-[1.05] text-[color:var(--color-accent)]"
                style={{ fontSize: "var(--text-stat)" }}
              >
                <NumberTicker value={classCount + aboutData.certifications.length} />
              </dd>
              <dt className="eyebrow mt-2 !text-[0.66rem]">
                Class & ISO certs
              </dt>
            </div>
          </dl>
        </div>
      </section>

      {/* (5) ── discipline marquee — real capability terms ─────────────── */}
      <section
        aria-label="Disciplines"
        className="border-b border-[color:var(--color-rule)] py-[var(--space-lg)]"
      >
        <ScrollVelocityContainer>
          <ScrollVelocityRow
            baseVelocity={4}
            direction={1}
            className="font-display text-[color:var(--color-ink)]"
          >
            {[
              "COMMERCIAL DIVING",
              "IN-WATER SURVEY",
              "ROBOTIC NDT",
              "STEEL FABRICATION",
              "ROPE ACCESS",
              "ICCP",
              "SALVAGE WORKS",
              "HYDROGRAPHIC SURVEY",
            ].map((d) => (
              <span
                key={d}
                className="inline-flex items-center"
                style={{ fontSize: "var(--text-h3)" }}
              >
                <span className="px-[clamp(1rem,3vw,2.5rem)]">{d}</span>
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rotate-45 bg-[color:var(--color-accent)]"
                />
              </span>
            ))}
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </section>

      {/* the GSAP-scrubbed discipline ticker band (real services.json terms) */}
      <GsapifySection />

      {/* (6) ── certs strip — 12 real credential marks ──────────────────── */}
      <section
        id="accreditations"
        className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]"
      >
        <div className="mb-[var(--space-xl)] grid items-end gap-[var(--space-md)] md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-[var(--space-md)]">Accreditations</p>
            <h2
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[16ch]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              <WordReveal text="Approved by twelve class societies." />
            </h2>
          </div>
          <Reveal className="md:pb-2">
            <p className="measure leading-[1.6]" style={muted(66)}>
              Surveys carried out to ABS, DNV&nbsp;GL, Lloyd&apos;s Register,
              Bureau Veritas, Class&nbsp;NK and beyond — under ISO 9001, ISO
              14001 and OHSAS management systems.
            </p>
          </Reveal>
        </div>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-rule)] sm:grid-cols-3 lg:grid-cols-6">
          {CERTS.map((c) => (
            <li
              key={c.slug}
              className="group flex aspect-[4/3] items-center justify-center bg-[color:var(--color-paper-2)] p-5 transition-colors duration-300 hover:bg-[color:var(--color-paper-3)]"
              title={c.title.replace("&#8217;", "’")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.file}
                alt={`${c.title.replace("&#8217;", "’")} accreditation`}
                loading="lazy"
                decoding="async"
                className="max-h-16 w-auto max-w-full object-contain mix-blend-multiply grayscale transition-all duration-500 group-hover:grayscale-0"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* (7) ── selected projects teaser — three documented case files ──── */}
      <section
        id="projects"
        className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <div className="mb-[var(--space-xl)] grid items-end gap-[var(--space-md)] md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow mb-[var(--space-md)]">Selected work</p>
              <h2
                className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[18ch]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                <WordReveal text="Rigs kept on station, on schedule." />
              </h2>
            </div>
            <Reveal className="md:pb-2">
              <Link href="/projects" className="cta-secondary">
                See the project log
              </Link>
            </Reveal>
          </div>

          <ul className="grid gap-[var(--space-lg)] md:grid-cols-3">
            {FEATURED.map(({ p, image }, i) => (
              <li key={p.pdf}>
                <SheenCard
                  index={String(i + 1).padStart(2, "0")}
                  eyebrow={p.category}
                  title={p.title}
                  description={p.summary ?? undefined}
                  imageSrc={image}
                  imageAlt={`${p.title} — AMS marine project`}
                  href="/projects"
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* (8) ── final CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-[color:var(--color-rule)]">
        <div className="mx-auto max-w-[min(1000px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] text-center">
          <p className="eyebrow mb-[var(--space-md)]">Talk to the yard</p>
          <h2
            className="font-display font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            <WordReveal text="Have a vessel that needs eyes underwater?" />
          </h2>
          <Reveal>
            <p
              className="measure mx-auto mt-[var(--space-lg)] leading-[1.6]"
              style={muted(66)}
            >
              Send us the scope — class survey, NDT campaign, steel renewal or
              salvage. We mobilise from Gelang Patah, Johor across the region.
            </p>
          </Reveal>
          <div className="mt-[var(--space-xl)] flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" aria-label="Request a quote from AMS">
              <SlideFillButton label="Request a quote" icon="shield" />
            </Link>
            <Link href="/services" className="cta-secondary">
              Explore services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
