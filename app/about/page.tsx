import type { Metadata } from "next";
import Link from "next/link";

import aboutData from "@/lib/content/about.json";
import mediaManifest from "@/lib/content/media-manifest.json";

import Reveal from "@/components/Reveal";
import { WordReveal } from "@/components/ui/WordReveal";
import { TextSpotlightReveal } from "@/components/ui/TextSpotlightReveal";
import { NumberTicker } from "@/components/ui/NumberTicker";
import DecryptedText from "@/components/ui/reactbits/DecryptedText";
import { CardContainer, CardBody, CardItem } from "@/components/ui/TiltCard";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { FanCardsCarousel, type FanCard } from "@/components/ui/aceternity/FanCardsCarousel";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/magic/ScrollBasedVelocity";
import { type Cert } from "@/components/about/CertWall";
import { CertOrbit } from "@/components/about/CertOrbit";

export const metadata: Metadata = {
  title: "About — Advantage Marine Services (Malaysia) Sdn Bhd",
  description:
    "Established March 2014 in Gelang Patah, Johor. Advantage Marine Services is a marine and offshore specialist in commercial diving, in-water inspection, NDT and steel fabrication — class surveys accepted by ABS, DNV GL, Bureau Veritas, Lloyd's Register and ClassNK from a 4,630 m² facility.",
  alternates: { canonical: "/about" },
};

// Real award photography (manifest.awards — the four ceremony/trophy frames:
// amsawards2025, apeaaward, gbaaward, shipaward — not the *_logo or icon-* PNGs).
const awardImages = (mediaManifest.awards as string[]).filter((p) => {
  const name = p.split("/").pop() ?? "";
  return /award/i.test(name) && !/logo|icon/i.test(name);
});

// Real team photography — three frames for the three named directors (manifest.team).
const teamPhotos = (mediaManifest.team as string[]).filter((p) =>
  /\.(jpe?g)$/i.test(p) && !/icon-/.test(p),
);

const muted = { color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" } as const;
const mutedStrong = { color: "color-mix(in oklch, var(--color-ink) 74%, transparent)" } as const;

export default function AboutPage() {
  const { company, leadership, classSocieties, awards, csr } = aboutData;
  const certs = mediaManifest.certs as Cert[];

  const heroImage = (mediaManifest.about as string[])[0]; // IMG-0898 — yard/operations frame

  // Map the eight disciplines + credentials into a single editorial ticker.
  const tickerTop = [
    "COMMERCIAL DIVING",
    "IN-WATER SURVEY",
    "NDT INSPECTION",
    "STEEL FABRICATION",
    "ROPE ACCESS",
  ];
  const tickerBottom = [
    "ABS",
    "DNV GL",
    "BUREAU VERITAS",
    "LLOYD’S REGISTER",
    "CLASS NK",
    "ISO 9001",
    "ISO 14001",
    "OHSAS",
  ];

  // JSON-LD — Organization + the three named directors (E-E-A-T evidence locker).
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    foundingDate: "2014",
    description: company.intro,
    address: {
      "@type": "PostalAddress",
      streetAddress: "No.18 Jalan Laman Setia 7/4, Taman Laman Setia (Setia Business Park)",
      addressLocality: "Gelang Patah",
      addressRegion: "Johor",
      postalCode: "81550",
      addressCountry: "MY",
    },
    employee: leadership.map((p) => ({
      "@type": "Person",
      name: p.name.replace(/^Mr\.?\s*/, ""),
      jobTitle: p.role,
    })),
    hasCredential: [...classSocieties, "ISO 9001", "ISO 14001", "OHSAS"],
  };

  return (
    <main className="bg-[color:var(--color-paper)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* ───────────────────────── HERO — 100lvh, full-bleed real photo ───────────────────────── */}
      <section className="relative h-[100lvh] min-h-[640px] w-full overflow-hidden">
        <ParallaxImage
          src={heroImage}
          alt="Advantage Marine Services dive and engineering crew at the Johor yard"
          className="h-full w-full object-cover"
          priority
        />
        {/* ink scrim — keeps the inscriptional title legible without introducing a dark surface */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-ink) 80%, transparent) 0%, color-mix(in oklch, var(--color-ink) 42%, transparent) 42%, color-mix(in oklch, var(--color-ink) 14%, transparent) 100%)",
          }}
        />
        {/* paper feather at the foot so the hero grounds into the page */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{
            background: "linear-gradient(to top, var(--color-paper) 0%, transparent 100%)",
          }}
        />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,9vh,7rem)]">
            <DecryptedText
              text="ESTABLISHED 2014 · GELANG PATAH, JOHOR"
              animateOn="view"
              sequential
              revealDirection="start"
              speed={28}
              className="font-display"
              parentClassName="eyebrow"
              style={{ color: "var(--color-accent-ink)" }}
            />

            <h1
              className="font-display mt-[var(--space-md)] max-w-[18ch] leading-[1.06] tracking-[-0.01em]"
              style={{ fontSize: "var(--text-display)", color: "var(--color-accent-ink)" }}
            >
              A decade beneath the waterline.
            </h1>

            <p
              className="mt-[var(--space-md)] max-w-[58ch] leading-[1.6]"
              style={{
                fontSize: "var(--text-lead)",
                color: "color-mix(in oklch, var(--color-accent-ink) 84%, transparent)",
              }}
            >
              Marine and offshore specialists in commercial diving, in-water inspection,
              NDT and steel fabrication — working to IMCA and OGP standards out of Johor
              since March 2014.
            </p>

            <div className="mt-[var(--space-lg)] flex flex-wrap items-center gap-4">
              <Link href="/contact" className="cta-primary">
                Talk to AMS
              </Link>
              <Link href="/services" className="cta-secondary">
                Explore services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── STORY — real company prose ───────────────────────── */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[0.85fr_1.4fr] lg:gap-[var(--space-2xl)]">
          <div>
            <p className="eyebrow">Who we are</p>
            <TextSpotlightReveal
              as="h2"
              text="In-water expertise, engineered topside."
              className="font-display mt-[var(--space-md)] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
            />
          </div>
          <div className="lg:pt-[var(--space-sm)]">
            <p className="leading-[1.75]" style={{ ...mutedStrong, fontSize: "var(--text-lead)" }}>
              <WordReveal text={company.intro} staggerMs={12} translate={16} />
            </p>
            <div className="mt-[var(--space-lg)] flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
                Reg. {company.registrationNo}
              </span>
              <span className="eyebrow" style={muted}>
                {company.facility}
              </span>
            </div>
          </div>
        </div>

        {/* Vision / Mission / Commitment — real prose, in spotlight cards (asymmetric weight) */}
        <div className="mt-[var(--space-2xl)] grid gap-[var(--space-lg)] md:grid-cols-3">
          {[
            { t: "Vision", b: company.vision, idx: "01" },
            { t: "Mission", b: missionLede(company.mission), idx: "02" },
            { t: "Commitment", b: company.commitment, idx: "03" },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.06} className="h-full">
              <CardContainer
                containerClassName="block h-full"
                className="h-full w-full"
              >
                <CardBody className="flex h-full w-full flex-col gap-4">
                  <CardItem
                    as="div"
                    translateZ={45}
                    className="flex w-full items-baseline justify-between"
                  >
                    <p className="eyebrow">{c.t}</p>
                    <span
                      className="font-display tabular-nums"
                      style={{ ...muted, fontSize: "var(--text-eyebrow)", letterSpacing: "0.1em" }}
                    >
                      {c.idx}
                    </span>
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ={22}
                    className="w-full leading-[1.7]"
                    style={{ ...mutedStrong, fontSize: "var(--text-card)" }}
                  >
                    {c.b}
                  </CardItem>
                </CardBody>
              </CardContainer>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────────────── HONEST STAT BAND ───────────────────────── */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
        <div className="mx-auto grid max-w-[min(1280px,92vw)] gap-y-[var(--space-xl)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] sm:grid-cols-2 lg:grid-cols-4">
          {/* Established 2014 */}
          <Reveal>
            <p
              className="font-display leading-none text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-stat)" }}
            >
              <NumberTicker value={2014} decimalPlaces={0} className="font-display" />
            </p>
            <p className="eyebrow mt-[var(--space-sm)]" style={muted}>
              Established · Johor, Malaysia
            </p>
          </Reveal>

          {/* Over a decade — the only honest "10+" figure */}
          <Reveal delay={0.06}>
            <p
              className="font-display leading-none text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-stat)" }}
            >
              <NumberTicker value={10} decimalPlaces={0} className="font-display" />
              <span style={{ color: "var(--color-accent)" }}>+</span>
            </p>
            <p className="eyebrow mt-[var(--space-sm)]" style={muted}>
              Years of in-water experience
            </p>
          </Reveal>

          {/* 4,630 m² facility */}
          <Reveal delay={0.12}>
            <p
              className="font-display leading-none text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-stat)" }}
            >
              <NumberTicker value={4630} decimalPlaces={0} className="font-display" />
              <span style={{ color: "var(--color-accent)", fontSize: "0.4em" }}> m²</span>
            </p>
            <p className="eyebrow mt-[var(--space-sm)]" style={muted}>
              <DecryptedText
                text="JOHOR WAREHOUSE FACILITY"
                animateOn="view"
                sequential
                speed={26}
                className="font-display"
                parentClassName="eyebrow"
                style={muted}
              />
            </p>
          </Reveal>

          {/* Class societies accepted */}
          <Reveal delay={0.18}>
            <p
              className="font-display leading-none text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-stat)" }}
            >
              <NumberTicker value={classSocieties.length} decimalPlaces={0} className="font-display" />
            </p>
            <p className="eyebrow mt-[var(--space-sm)]" style={muted}>
              Class societies surveys accepted
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── LEADERSHIP — real names, real photos ───────────────────────── */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <div className="max-w-[40ch]">
          <p className="eyebrow">Leadership</p>
          <TextSpotlightReveal
            as="h2"
            text="The people behind the work."
            className="font-display mt-[var(--space-md)] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
          />
        </div>

        <div className="mt-[var(--space-xl)] flex flex-col">
          {leadership.map((p, i) => {
            const photo = teamPhotos[i % teamPhotos.length];
            const reversed = i % 2 === 1;
            return (
              <Reveal key={p.name} delay={i * 0.05}>
                <article
                  className="grid items-center gap-[var(--space-lg)] border-t border-[color:var(--color-rule)] py-[var(--space-xl)] lg:grid-cols-[0.9fr_1.6fr] lg:gap-[var(--space-2xl)]"
                >
                  {/* portrait */}
                  <div
                    className={`relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-3)] ${
                      reversed ? "lg:order-2" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`${p.name.replace(/^Mr\.?\s*/, "")}, ${p.role} at Advantage Marine Services`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* bio */}
                  <div className={reversed ? "lg:order-1" : ""}>
                    <span
                      className="font-display tabular-nums"
                      style={{ color: "var(--color-accent)", fontSize: "var(--text-eyebrow)", letterSpacing: "0.18em" }}
                    >
                      0{i + 1}
                    </span>
                    <h3
                      className="font-display mt-2 leading-[1.1] text-[color:var(--color-ink)]"
                      style={{ fontSize: "var(--text-h2)" }}
                    >
                      {p.name.replace(/^Mr\.?\s*/, "")}
                    </h3>
                    <p className="eyebrow mt-2">{p.role}</p>
                    {"yearsExperience" in p && p.yearsExperience && (
                      <p className="mt-3" style={{ ...muted, fontSize: "var(--text-eyebrow)", letterSpacing: "0.12em" }}>
                        {p.yearsExperience} years in oil, gas &amp; marine
                      </p>
                    )}
                    <p className="mt-[var(--space-md)] leading-[1.75]" style={{ ...mutedStrong, fontSize: "var(--text-card)" }}>
                      {p.bio}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────── DISCIPLINE / CREDENTIAL TICKER ───────────────────────── */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] py-[var(--space-lg)]">
        <ScrollVelocityContainer className="flex flex-col gap-2">
          <ScrollVelocityRow
            baseVelocity={4}
            direction={1}
            className="font-display text-[color:var(--color-ink)]"
          >
            {tickerTop.map((t) => (
              <Token key={t} text={t} />
            ))}
          </ScrollVelocityRow>
          <ScrollVelocityRow
            baseVelocity={3}
            direction={-1}
            className="font-display"
          >
            {tickerBottom.map((t) => (
              <Token key={t} text={t} subtle />
            ))}
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </section>

      {/* ───────────────────────── CLASS SOCIETIES + CERTIFICATIONS ───────────────────────── */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[0.7fr_1.8fr] lg:gap-[var(--space-2xl)]">
          <div>
            <p className="eyebrow">Accredited &amp; accepted</p>
            <h2
              className="font-display mt-[var(--space-md)] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Surveys the major class societies accept.
            </h2>
            <p className="mt-[var(--space-md)] leading-[1.7]" style={{ ...mutedStrong, fontSize: "var(--text-card)" }}>
              In-water surveys and inspection reports prepared to be accepted by{" "}
              {classSocieties.slice(0, -1).map((c) => c).join(", ")} and {classSocieties.at(-1)} —
              backed by an ISO 9001, ISO 14001 and OHSAS management system.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <CertOrbit certs={certs} />
          </div>
        </div>
      </section>

      {/* ───────────────────────── RECOGNITION — real award photography ───────────────────────── */}
      <section className="border-t border-[color:var(--color-rule)] py-[var(--space-2xl)]">
        <div className="mx-auto mb-[var(--space-lg)] max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)]">
          <p className="eyebrow">Recognition</p>
          <h2
            className="font-display mt-[var(--space-md)] max-w-[24ch] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Awarded for how we build the business.
          </h2>
        </div>

        <FanCardsCarousel
          items={awards.slice(0, awardImages.length).map(
            (a, i): FanCard => ({
              title: a.title,
              category: "Entrepreneurship award",
              src: awardImages[i % awardImages.length],
              summary: `${a.title} — recognising Advantage Marine Services' growth and leadership across the marine and offshore services sector.`,
            }),
          )}
        />
      </section>

      {/* ───────────────────────── DIRECTOR QUOTE ───────────────────────── */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[min(1040px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <Reveal>
            <span
              aria-hidden
              className="font-display block leading-none"
              style={{ color: "var(--color-accent)", fontSize: "var(--text-stat)" }}
            >
              “
            </span>
            <blockquote
              className="font-display -mt-4 leading-[1.25] tracking-[-0.01em] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {company.directorQuote.quote}
            </blockquote>
            <p className="eyebrow mt-[var(--space-lg)]">{company.directorQuote.attribution}</p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── CSR ───────────────────────── */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <div className="grid gap-[var(--space-xl)] lg:grid-cols-[0.7fr_1.8fr] lg:gap-[var(--space-2xl)]">
          <div>
            <p className="eyebrow">Responsibility</p>
            <h2
              className="font-display mt-[var(--space-md)] leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Industrial progress, environmental care.
            </h2>
          </div>
          <p className="leading-[1.8]" style={{ ...mutedStrong, fontSize: "var(--text-lead)" }}>
            <WordReveal text={csr} staggerMs={8} translate={14} />
          </p>
        </div>
      </section>

      {/* ───────────────────────── CLOSING CTA ───────────────────────── */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)]">
        <div className="flex flex-col items-start gap-[var(--space-md)] rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] p-[clamp(2rem,5vw,4rem)] md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="font-display leading-[1.1] tracking-[-0.02em] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Have a vessel or structure below the line?
            </h2>
            <p className="mt-2 leading-[1.6]" style={{ ...muted, fontSize: "var(--text-card)" }}>
              Tell us the scope and we will scope the dive, the survey and the report.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="cta-primary">
              Request a quote
            </Link>
            <Link href="/projects" className="cta-secondary">
              See our work
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/** A single ticker token with the teal diamond separator. */
function Token({ text, subtle = false }: { text: string; subtle?: boolean }) {
  return (
    <span className="inline-flex items-center">
      <span
        style={{
          fontSize: subtle ? "var(--text-h3)" : "var(--text-h2)",
          color: subtle
            ? "color-mix(in oklch, var(--color-ink) 60%, transparent)"
            : "var(--color-ink)",
          letterSpacing: "0.02em",
        }}
      >
        {text}
      </span>
      <span aria-hidden className="mx-6 inline-block" style={{ color: "var(--color-accent)" }}>
        ◆
      </span>
    </span>
  );
}

/**
 * The mission JSON is a single packed paragraph of five "Label – sentence"
 * clauses. Surface the lede sentence so the card reads cleanly; the full text
 * stays in the JSON source (no fabrication, just truncation at a sentence
 * boundary).
 */
function missionLede(mission: string): string {
  const firstTwo = mission.split(". ").slice(0, 2).join(". ");
  return firstTwo.endsWith(".") ? firstTwo : `${firstTwo}.`;
}
