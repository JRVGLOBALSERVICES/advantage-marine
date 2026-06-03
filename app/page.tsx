import Link from "next/link";
import RigHero from "@/components/RigHero";
import SceneBuildLoader from "@/components/SceneBuildLoader";
import GlobalReach from "@/components/GlobalReach";
import { DottedSurface } from "@/components/ui/DottedSurface";
import Reveal from "@/components/Reveal";
import { WordReveal } from "@/components/ui/WordReveal";
import {
  StickyStackCards,
  type StickyStackItem,
} from "@/components/ui/StickyStackCards";
import { ExpandingCards, type ExpandingCardItem } from "@/components/ui/ExpandingCards";
import { CertOrbit } from "@/components/about/CertOrbit";
import { type Cert } from "@/components/about/CertWall";
import { parseYear } from "@/lib/projectMeta";
import { MovingBorderButton } from "@/components/ui/MovingBorderButton";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { LottieIcon } from "@/components/ui/LottieIcon";
import { SlideFillButton } from "@/components/ui/uiverse/SlideFillButton";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { SheenCard } from "@/components/ui/cult/SheenCard";
import servicesData from "@/lib/content/services.json";
import aboutData from "@/lib/content/about.json";
import projectsData from "@/lib/content/projects.json";
import certsData from "@/lib/content/media-manifest.json";
import newsData from "@/lib/content/news.json";

/* ── homepage news rail — three most-recent real posts, real photos ──────── */
type NewsPost = { title: string; date: string; excerpt: string | null };
const NEWS_MEDIA: Record<string, string> = {
  "Oil & Gas Asia 2025": "/media/csr/WhatsApp-Image-2025-10-15-at-2.54.59-PM.jpeg",
  "Oil & Gas Asia 2024": "/media/home/photo_6305331321802710100_y.jpg",
  "Discover the AMS difference": "/media/csr/AMS-DIVER-3-scaled-e1616042912140.jpg",
};
const NEWS_FALLBACK_EXCERPT: Record<string, string> = {
  "Discover the AMS difference":
    "Our promise as a one-stop solution provider for underwater and topside repair, inspection, NDT, engineering and rope access across the oil, gas, marine and petrochemical sector.",
};
const fmtNewsDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const HOME_NEWS = (newsData.posts as NewsPost[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3);

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

/* ── selected, fully-documented projects → fanned deck (real images + copy) ─ */
const DECK_SRC: { match: string; image: string }[] = [
  { match: "Span Breaker", image: "/media/projects/Photo-1.jpeg" },
  { match: "Perisai Pacific 101 - Seawater", image: "/media/projects/Photo-5.jpeg" },
  { match: "Borr Drilling", image: "/media/projects/Photo-3.jpeg" },
  { match: "Jack-Up Rig UWILD", image: "/media/projects/blog-01.jpg" },
  { match: "ENSCO 67", image: "/media/projects/blog-02.jpg" },
  { match: "Hengyuan Refinery", image: "/media/projects/blog-03.jpg" },
];
/* Six fully-documented records surfaced as the homepage "Selected work"
   expanding-cards accordion. Real photo, title, discipline, on-station year +
   case summary — no fabrication. */
const HOME_RECORDS: ExpandingCardItem[] = DECK_SRC.map(({ match, image }) => {
  const p = projectsData.projects.find((x) => x.title.startsWith(match))!;
  return {
    id: p.title,
    title: p.title,
    category: p.category,
    summary: p.summary ?? "",
    period: parseYear(p.summary ?? null),
    imgSrc: image,
  };
});

export default function Home() {
  const buckets = servicesData.buckets;
  const company = aboutData.company;
  const classCount = aboutData.classSocieties.length;

  /* discipline stack items — the four accountable disciplines, real images +
     summaries + Lottie icons, dealt as a vertical scroll-stack deck */
  const fanCategory: Record<string, string> = {
    "marine-diving": "Air & mixed-gas diving",
    ndt: "Inspection & integrity",
    "engineering-steelwork": "Design & fabrication",
    "trading-others": "Survey & supporting works",
  };
  const stackItems: StickyStackItem[] = buckets.map((b, i) => {
    const m = BUCKET_MEDIA[b.slug];
    const capCount = Array.isArray(
      (b as { capabilities?: unknown[] }).capabilities,
    )
      ? (b as { capabilities: unknown[] }).capabilities.length
      : 0;
    return {
      key: b.slug,
      eyebrow: `Discipline ${String(i + 1).padStart(2, "0")}`,
      title: b.title,
      summary: b.summary,
      meta: capCount ? `${capCount} documented capabilities` : fanCategory[b.slug],
      href: `/services#${b.slug}`,
      image: m.image,
      imageAlt: m.alt,
      icon: <LottieIcon src={m.lottie} size={22} label={`${b.title} icon`} />,
    };
  });

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
        {/* editorial header — full width, deck sits beneath */}
        <div className="grid items-end gap-[var(--space-md)] md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-[var(--space-md)]">What we do</p>
            <h2
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[16ch]"
              style={{ fontSize: "var(--text-h2)", overflowWrap: "anywhere" }}
            >
              <WordReveal text="Four accountable disciplines, mobilised afloat." />
            </h2>
          </div>
          <Reveal className="md:pb-2">
            <p className="measure leading-[1.6]" style={muted(66)}>
              Diving, NDT, engineering and a broad supporting trade — run from
              our 4,630&nbsp;m² Johor facility to OGP / IMCA standard. Surveyed
              afloat, never dry-docked.
            </p>
          </Reveal>
        </div>

        {/* the four disciplines, dealt as a vertical scroll-stack deck */}
        <div className="mx-auto mt-[var(--space-xl)] max-w-[min(960px,100%)]">
          <StickyStackCards items={stackItems} />
        </div>

        <Reveal className="mt-[var(--space-xl)]">
          <MagneticLink href="/services" className="cta-secondary">
            Explore all services
          </MagneticLink>
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

        {/* orbit accreditations — the same constellation as /about, the real
            class-society + ISO logos orbiting the AMS hub */}
        <div className="flex items-center justify-center">
          <CertOrbit certs={CERTS as Cert[]} />
        </div>
      </section>

      {/* (7) ── selected projects — real ProjectCard grid (same component as /projects) ─ */}
      <section
        id="projects"
        className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <div className="grid items-end gap-[var(--space-lg)] md:grid-cols-[1fr_auto]">
            {/* editorial column */}
            <div className="max-w-[42ch]">
              <p className="eyebrow mb-[var(--space-md)]">Selected work</p>
              <h2
                className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[18ch]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                <WordReveal text="A record under the waterline." />
              </h2>
              <Reveal>
                <p
                  className="measure mt-[var(--space-lg)] leading-[1.6]"
                  style={muted(66)}
                >
                  Documented case files — UWILDs in lieu of drydock, structural
                  steel renewals and seawater piping change-outs, delivered
                  afloat across the region.
                </p>
              </Reveal>
            </div>
            <Reveal className="md:pb-2">
              <MovingBorderButton as={Link} href="/projects" duration={3600}>
                See the project log
              </MovingBorderButton>
            </Reveal>
          </div>

          {/* six documented records as a horizontal expanding-cards accordion —
              active panel blooms to colour, rest collapse to rotated spines;
              vertical stack on mobile (the ExpandingCards pattern) */}
          <div className="mt-[var(--space-xl)]">
            <ExpandingCards items={HOME_RECORDS} />
          </div>
        </div>
      </section>

      {/* (7b) ── from the field — three most-recent news posts, vertical cards ─ */}
      <section
        id="news"
        className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]"
      >
        <div className="mb-[var(--space-xl)] grid items-end gap-[var(--space-md)] md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-[var(--space-md)]">From the field</p>
            <h2
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] max-w-[18ch]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              <WordReveal text="News, events and yard dispatches." />
            </h2>
          </div>
          <Reveal className="md:pb-2">
            <MagneticLink href="/news" className="cta-secondary">
              All news
            </MagneticLink>
          </Reveal>
        </div>

        <div className="grid gap-[var(--space-lg)] sm:grid-cols-2 lg:grid-cols-3">
          {HOME_NEWS.map((post, i) => (
            <Reveal key={post.title} delay={Math.min(i, 3) * 0.06}>
              <SheenCard
                className="h-full"
                eyebrow={fmtNewsDate(post.date)}
                index={String(i + 1).padStart(2, "0")}
                title={post.title}
                description={post.excerpt ?? NEWS_FALLBACK_EXCERPT[post.title] ?? ""}
                imageSrc={NEWS_MEDIA[post.title]}
                imageAlt={post.title}
                href="/news"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* (8) ── final CTA — closing hero slug over a quiet teal survey field ─ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--color-rule)]">
        {/* DottedSurface: faint teal sine-wave point grid on cream, scroll-parallax
            + reduced-motion gated. Ambient texture behind the closing slug only. */}
        <DottedSurface className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-[min(1000px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] text-center">
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
            <MagneticLink href="/services" className="cta-secondary">
              Explore services
            </MagneticLink>
          </div>
        </div>
      </section>
    </main>
  );
}
