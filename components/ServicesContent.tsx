"use client";

/**
 * ServicesContent — client body for /services.
 *
 * The route file (app/services/page.tsx) stays a server component so it can keep
 * the metadata export; all interactive pieces (full-bleed hero with overlaid
 * Cinzel H1, FanCardsCarousel galleries, DecryptedText reveals, hover-icon CTAs,
 * the gsapify discipline band) live here behind "use client".
 *
 * Real content only — copy comes from lib/content/services.json, images from the
 * media-manifest. No placeholders, no invented metrics, no empty cards.
 */

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FanCardsCarousel, type FanCard } from "@/components/ui/aceternity/FanCardsCarousel";
import DecryptedText from "@/components/ui/reactbits/DecryptedText";
import { SheenCard } from "@/components/ui/cult/SheenCard";
import { LottieIcon } from "@/components/ui/LottieIcon";
import { ShineBorder } from "@/components/ui/magic/ShineBorder";
import { SlideFillButton } from "@/components/ui/uiverse/SlideFillButton";
import { ExpandIconButton } from "@/components/ui/uiverse/ExpandIconButton";
import GsapifySection from "@/components/ui/GsapifySection";
import servicesData from "@/lib/content/services.json";

const EASE = [0.22, 1, 0.36, 1] as const;

type Bucket = (typeof servicesData.buckets)[number];
type Specialty = (typeof servicesData.specialty)[number];

/**
 * Explicit, curated, deduplicated galleries.
 *
 * The original scrape dumped ONE shared underwater-welding gallery (a-1, c-1,
 * d-1, 3-, 4-, P4190801, underwater-wet-welding…) into eight service folders,
 * so iccp/rov/salvage/ovolifts/trading all rendered the SAME photos as diving —
 * md5-identical (verified). That reads as AI-slop content padding.
 *
 * Fix: hand-pick real photos PER discipline so no image repeats anywhere on the
 * page. Every path below is a genuine AMS field photo (or, for Ovolifts, the
 * real manufacturer product shot — AMS is the authorized SE-Asia distributor).
 * The shared underwater-welding set now lives only on Marine/Diving, where it
 * truthfully belongs.
 */
const D = "/media/service_diving";
const BUCKET_GALLERY: Record<string, string[]> = {
  "marine-diving": [
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.23.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.25.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.26.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.27.jpeg`,
    `${D}/1.jpeg`,
    `${D}/3.jpeg`,
  ],
  ndt: [
    "/media/service_ndt/ndt1.jpg",
    "/media/service_ndt/ndt2.jpg",
    "/media/service_ndt/ndt3.jpg",
    // Radiographic testing IS an NDT method — these belong here truthfully.
    "/media/service_radiography/rs1.png",
    "/media/service_radiography/rs2.png",
    "/media/service_radiography/rs3.png",
  ],
  "engineering-steelwork": [
    "/media/service_steelwork/ES1.jpg",
    "/media/service_steelwork/ES2.jpg",
    "/media/service_steelwork/ES3.jpg",
  ],
  "trading-others": [
    // Real category photos pulled from AMS's own live site.
    "/media/_live/other_service.jpg",
    "/media/_live/marine_dive.jpg",
    "/media/_live/steel.jpg",
  ],
};

/** Map a specialty slug to ONE distinct hero photo + paired Lottie icon. */
const SPECIALTY_META: Record<string, { img: string; lottie: string; eyebrow: string }> = {
  "rope-access": {
    img: "/media/service_rope/ra1.jpg",
    lottie: "/lottie/engineering-gear.json",
    eyebrow: "IRATA member company",
  },
  "salvage-works": {
    // Salvage = underwater recovery — a real AMS dive photo, distinct from the bucket six.
    img: `${D}/WhatsApp-Image-2021-03-22-at-14.58.26-1.jpeg`,
    lottie: "/lottie/diving-helmet.json",
    eyebrow: "Rescue & recovery",
  },
  iccp: {
    // ICCP / anode work is performed underwater — a real AMS dive photo.
    img: `${D}/underwater-wet-welding-1-1-e1490151670919-640x480_c.jpg`,
    lottie: "/lottie/ndt-scan.json",
    eyebrow: "Cathodic protection",
  },
  ovolifts: {
    // REAL manufacturer product shot (Ovolifts pipeline-access system).
    img: "/media/service_ovolifts/_real/ovolift-system.jpg",
    lottie: "/lottie/engineering-gear.json",
    eyebrow: "Authorized distributor — SE Asia",
  },
  "chasing-m2-rov": {
    // Subsea / offshore context. TODO(Rj): swap in the official Chasing M2
    // product photo — AMS holds it as the authorized SE-Asia distributor.
    img: `${D}/bluestream-offshore-1920-2-1.1920x0.jpg`,
    lottie: "/lottie/rov-sonar.json",
    eyebrow: "Authorized distributor — SE Asia",
  },
};

const HERO_IMG = `${D}/P4040406.JPG-1.jpeg`;

export default function ServicesContent() {
  const router = useRouter();
  const { buckets, specialty } = servicesData as {
    buckets: Bucket[];
    specialty: Specialty[];
  };

  return (
    <main>
      {/* ───────────────── 100lvh full-bleed hero ───────────────── */}
      <section className="relative h-[100lvh] w-full overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Advantage Marine commercial divers working a vessel hull afloat"
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          fetchPriority="high"
        />
        {/* paper-keyed scrim — keeps cream/teal palette, never a flat dark bg.
            Strong at the foot for the Cinzel headline, feathers up to clear sky. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-ink) 80%, transparent) 0%, color-mix(in oklch, var(--color-ink) 42%, transparent) 38%, color-mix(in oklch, var(--color-ink) 8%, transparent) 72%, transparent 100%)",
          }}
        />
        {/* faint top wash so the fixed nav stays legible over bright water */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklch, var(--color-ink) 34%, transparent), transparent)",
          }}
        />

        <div className="relative z-10 flex h-full w-full items-end">
          <div className="mx-auto w-full max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(3rem,9vh,6rem)]">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="eyebrow mb-[var(--space-md)]"
              style={{ color: "var(--color-accent-ink)" }}
            >
              <DecryptedText
                text="THE FULL MARINE & OFFSHORE SCOPE"
                animateOn="view"
                sequential
                revealDirection="start"
                speed={36}
                parentClassName="font-display"
                className="font-display"
                style={{ color: "var(--color-accent-ink)" }}
              />
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
              className="font-display font-bold leading-[1.06] tracking-[-0.01em] max-w-[16ch]"
              style={{
                fontSize: "var(--text-display)",
                color: "var(--color-accent-ink)",
                overflowWrap: "anywhere",
              }}
            >
              Surveyed afloat, never dry-docked.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
              className="mt-[var(--space-lg)] measure leading-[1.6]"
              style={{
                fontSize: "var(--text-lead)",
                color: "color-mix(in oklch, var(--color-accent-ink) 88%, transparent)",
              }}
            >
              IMCA-standard commercial diving, in-water inspection and conventional
              &amp; advanced NDT, engineering and steel fabrication — mobilised from
              our 4,630&nbsp;m² Johor facility, in service for over a decade.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
              className="mt-[var(--space-xl)] flex flex-wrap items-center gap-4"
            >
              <SlideFillButton
                label="Request a quote"
                icon="shield"
                aria-label="Request a quote"
                onClick={() => router.push("/contact")}
              />
              <a
                href="#marine-diving"
                className="cta-secondary"
                style={{
                  borderColor: "color-mix(in oklch, var(--color-accent-ink) 55%, transparent)",
                  color: "var(--color-accent-ink)",
                }}
              >
                Explore the disciplines
                <span aria-hidden>↓</span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* scroll-scrubbed discipline ticker band */}
      <GsapifySection />

      {/* ───────────────── the 4 real discipline buckets ───────────────── */}
      <div className="mx-auto max-w-[min(1280px,94vw)] px-[clamp(1.5rem,4vw,4rem)]">
        {buckets.map((b, i) => {
          const gallery = (BUCKET_GALLERY[b.slug] ?? []).slice(0, 6);
          const cards: FanCard[] = gallery.map((src, idx) => ({
            title: b.title,
            src,
            category: `${b.title} · ${String(idx + 1).padStart(2, "0")}`,
            summary: b.summary,
          }));
          const flip = i % 2 === 1;

          return (
            <section
              key={b.slug}
              id={b.slug}
              className="scroll-mt-28 border-b border-[color:var(--color-rule)] py-[var(--space-2xl)]"
            >
              {/* asymmetric text/lead row — alternates side each bucket */}
              <div
                className={`grid items-start gap-[var(--space-xl)] lg:grid-cols-[0.85fr_1.15fr] ${
                  flip ? "lg:[direction:rtl]" : ""
                }`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "120px" }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="lg:[direction:ltr]"
                >
                  <p className="eyebrow mb-[var(--space-sm)]">
                    <DecryptedText
                      text={`DISCIPLINE ${String(i + 1).padStart(2, "0")}`}
                      animateOn="view"
                      sequential
                      revealDirection="start"
                      parentClassName="font-display"
                      className="font-display"
                    />
                  </p>
                  <h2
                    className="font-display font-bold leading-[1.08] tracking-[-0.02em]"
                    style={{ fontSize: "var(--text-h2)" }}
                  >
                    {b.title}
                  </h2>
                  <p
                    className="mt-[var(--space-md)] leading-[1.6]"
                    style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}
                  >
                    {b.summary}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "120px" }}
                  transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
                  className="lg:[direction:ltr]"
                >
                  <p className="leading-[1.75]">{b.body}</p>

                  {b.capabilities?.length > 0 && (
                    <ul className="mt-[var(--space-lg)] grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-rule)]">
                      {b.capabilities.map((c) => (
                        <li
                          key={c}
                          className="flex gap-3 bg-[color:var(--color-paper)] px-[var(--space-md)] py-3 leading-[1.5] transition-colors duration-300 hover:bg-[color:var(--color-paper-3)]"
                          style={{ transitionTimingFunction: "var(--ease-out)" }}
                        >
                          <span className="mt-[0.55em] h-[6px] w-[6px] shrink-0 rotate-45 bg-[color:var(--color-accent)]" aria-hidden />
                          <span style={{ color: "color-mix(in oklch, var(--color-ink) 80%, transparent)" }}>
                            {c}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </div>

              {/* real gallery — editorial horizontal scroll of full-bleed photos */}
              {cards.length > 0 && (
                <div className="mt-[var(--space-xl)]">
                  <FanCardsCarousel items={cards} />
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ───────────────── specialty grid ───────────────── */}
      <section className="mx-auto max-w-[min(1280px,94vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "120px" }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-[var(--space-xl)] max-w-[42ch]"
        >
          <p className="eyebrow mb-[var(--space-md)]">
            <DecryptedText
              text="SPECIALTY CAPABILITIES"
              animateOn="view"
              sequential
              revealDirection="start"
              parentClassName="font-display"
              className="font-display"
            />
          </p>
          <h2
            className="font-display font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Supporting scope, in-house.
          </h2>
          <p
            className="mt-[var(--space-md)] leading-[1.6]"
            style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}
          >
            Beyond the four core disciplines, AMS holds membership, distributorships
            and certified crews across rope access, salvage, cathodic protection and
            subsea robotics.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specialty.map((s, i) => {
            const meta = SPECIALTY_META[s.slug];
            const img = meta?.img;
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "120px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: EASE }}
                className="h-full"
              >
                <SheenCard
                  className="h-full"
                  eyebrow={meta?.eyebrow ?? "Specialty"}
                  index={String(i + 1).padStart(2, "0")}
                  title={s.title}
                  description={s.body}
                  imageSrc={img}
                  imageAlt={s.title}
                  icon={
                    meta ? (
                      <LottieIcon src={meta.lottie} size={26} label={s.title} />
                    ) : undefined
                  }
                />
              </motion.div>
            );
          })}
        </div>

        {/* closing quote-to-action band — framed by an animated teal ShineBorder */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "120px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative mt-[var(--space-2xl)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] p-[clamp(1.75rem,4vw,3.5rem)]"
        >
          <ShineBorder borderWidth={1.5} />
          <div className="relative z-10 flex flex-col items-start justify-between gap-[var(--space-lg)] md:flex-row md:items-center">
            <div className="max-w-[34ch]">
              <p className="eyebrow mb-[var(--space-sm)]">Mobilised from Johor</p>
              <p
                className="font-display leading-[1.12]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                Need a scope priced?
              </p>
              <p
                className="mt-[var(--space-sm)] leading-[1.6]"
                style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}
              >
                Send us the vessel, the survey window and the standard — we&apos;ll
                come back with a costed mobilisation plan.
              </p>
            </div>
            <ExpandIconButton
              label="Request a quote"
              icon="anchor"
              aria-label="Request a quote"
              className="shrink-0"
              onClick={() => router.push("/contact")}
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
