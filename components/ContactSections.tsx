"use client";

import { motion, useReducedMotion } from "motion/react";
import ContactForm from "@/components/ContactForm";
import { PinContainer } from "@/components/ui/PinCard";
import DecryptedText from "@/components/ui/reactbits/DecryptedText";
import SpotlightCard from "@/components/ui/reactbits/SpotlightCard";
import { RevealIconButton } from "@/components/ui/uiverse/RevealIconButton";
import { ScrollVelocityContainer, ScrollVelocityRow } from "@/components/ui/magic/ScrollBasedVelocity";
import { WordReveal } from "@/components/ui/WordReveal";

/* ---------- real content (from about.json / live site) ---------- */

const HERO_IMG = "/media/home/Hero-AMS.jpeg";

const CONTACTS = [
  { name: "Andrew Teow", role: "Managing Director", tels: ["+65 8393 3227", "+60 16 448 8052"] },
  { name: "Dharmendra Varshney", role: "Business Development Manager", tels: ["+60 19 768 0816"] },
  { name: "Victor Wong", role: "Director", tels: ["+65 9789 3633", "+60 19 731 0016"] },
];

const OFFICES = [
  {
    tag: "Main Office · Johor",
    short: "Johor",
    lines: [
      "No. 18, Jalan Laman Setia 7/4, Taman Laman Setia",
      "(Setia Business Park), 81550 Gelang Patah, Johor",
    ],
    note: "4,630 m² fabrication & dive-support yard",
  },
  {
    tag: "Branch · Miri",
    short: "Miri",
    lines: [
      "Lot 2215, Jalan Piasau Utara 1, Premier Industrial Park",
      "Piasau, 98000 Miri, Sarawak",
    ],
    note: "East Malaysia offshore support",
  },
  {
    tag: "Branch · Kuala Lumpur",
    short: "Kuala Lumpur",
    lines: [
      "Unit H10-1, Plaza Kelana Jaya, Jalan SS7/13A",
      "Kelana Jaya, 47301 Selangor",
    ],
    note: "Commercial & business development",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const MUTED = { color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" } as const;
const FAINT = { color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" } as const;

function mapsHref(lines: string[]) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lines.join(", "))}`;
}

/* ---------- inline marine SVG glyphs (no icon lib) ---------- */

function AnchorGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v14M5 12H3a9 9 0 0 0 18 0h-2M8 9h8" />
    </svg>
  );
}

export default function ContactSections() {
  const reduce = useReducedMotion();

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: "120px" },
        transition: { duration: 0.8, ease: EASE },
      };

  return (
    <main className="bg-[color:var(--color-paper)]">
      {/* ===================== HERO — 100lvh full-bleed ===================== */}
      <section className="relative h-[100lvh] min-h-[40rem] w-full overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Advantage Marine Services dive-support operation"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* ink scrim — keep type legible, no cream text */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--color-paper) 30%, transparent) 0%, color-mix(in oklch, var(--color-paper) 12%, transparent) 38%, color-mix(in oklch, var(--color-paper) 92%, transparent) 100%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex h-full max-w-[min(1280px,92vw)] flex-col justify-end px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2.5rem,7vh,5rem)]">
          <motion.p
            className="eyebrow mb-[var(--space-md)] text-[color:var(--color-ink)]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <DecryptedText
              text="GET IN TOUCH · JOHOR · MIRI · KUALA LUMPUR"
              animateOn="view"
              sequential
              revealDirection="start"
              className="font-display"
              parentClassName="eyebrow text-[color:var(--color-ink)]"
            />
          </motion.p>

          <h1
            className="font-display leading-[1.06] text-[color:var(--color-ink)]"
            style={{ fontSize: "var(--text-display)" }}
          >
            <motion.span
              className="block"
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: EASE, delay: 0.08 }}
            >
              Talk to AMS
            </motion.span>
          </h1>

          <motion.p
            className="mt-[var(--space-lg)] max-w-[46ch] font-body"
            style={{ ...MUTED, fontSize: "var(--text-lead)" }}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
          >
            Class survey, in-water inspection, NDT or steel renewal — tell us
            what the vessel needs and our team responds promptly from the Johor yard.
          </motion.p>

          <motion.div
            className="mt-[var(--space-lg)] flex flex-wrap items-center gap-[var(--space-md)]"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.26 }}
          >
            <a href="#enquiry" className="cta-primary">Request a quote</a>
            <a href="#offices" className="cta-secondary">Find the yard</a>
          </motion.div>
        </div>
      </section>

      {/* ===================== marquee band — discipline ticker ===================== */}
      <div className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] py-[var(--space-md)]">
        <ScrollVelocityContainer>
          <ScrollVelocityRow
            baseVelocity={4}
            direction={1}
            className="font-display text-[color:var(--color-ink)]"
          >
            <span className="px-8" style={{ fontSize: "var(--text-h3)" }}>COMMERCIAL DIVING</span>
            <span className="px-8 text-[color:var(--color-accent)]">◆</span>
            <span className="px-8" style={{ fontSize: "var(--text-h3)" }}>CLASS SURVEY</span>
            <span className="px-8 text-[color:var(--color-accent)]">◆</span>
            <span className="px-8" style={{ fontSize: "var(--text-h3)" }}>NDT INSPECTION</span>
            <span className="px-8 text-[color:var(--color-accent)]">◆</span>
            <span className="px-8" style={{ fontSize: "var(--text-h3)" }}>STEEL RENEWAL</span>
            <span className="px-8 text-[color:var(--color-accent)]">◆</span>
            <span className="px-8" style={{ fontSize: "var(--text-h3)" }}>ROPE ACCESS</span>
            <span className="px-8 text-[color:var(--color-accent)]">◆</span>
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </div>

      {/* ===================== enquiry + key contacts ===================== */}
      <section
        id="enquiry"
        className="mx-auto grid max-w-[min(1280px,92vw)] gap-[var(--space-2xl)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] lg:grid-cols-[1.15fr_0.85fr]"
      >
        <motion.div {...reveal}>
          <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">Request a quote</p>
          <h2
            className="font-display mb-[var(--space-lg)] leading-[1.1] text-[color:var(--color-ink)]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            <WordReveal text="Tell us about the scope." />
          </h2>
          <ContactForm />
          <p className="mt-[var(--space-lg)] font-body" style={MUTED}>
            Or email us directly{" "}
            <a
              href="mailto:sales@advantagemarine.com.my"
              className="font-medium text-[color:var(--color-accent)] underline decoration-[color:var(--color-rule)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-accent)]"
            >
              sales@advantagemarine.com.my
            </a>
          </p>
        </motion.div>

        <motion.div {...reveal} transition={reduce ? undefined : { duration: 0.8, ease: EASE, delay: 0.08 }}>
          <p className="eyebrow mb-[var(--space-lg)] text-[color:var(--color-accent)]">Key contacts</p>
          <div className="grid gap-[var(--space-md)]">
            {CONTACTS.map((c) => (
              <SpotlightCard key={c.name} className="!p-[var(--space-lg)]">
                <p className="font-display text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h3)" }}>
                  {c.name}
                </p>
                <p className="eyebrow !tracking-[0.16em] mt-1 normal-case" style={MUTED}>
                  {c.role}
                </p>
                <div className="mt-[var(--space-md)] flex flex-wrap gap-[var(--space-sm)]">
                  {c.tels.map((t) => (
                    <RevealIconButton
                      key={t}
                      label={t}
                      icon="phone"
                      onClick={() => {
                        window.location.href = `tel:${t.replace(/\s/g, "")}`;
                      }}
                    />
                  ))}
                </div>
              </SpotlightCard>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===================== offices — PinCards over paper-2 band ===================== */}
      <section
        id="offices"
        className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <motion.div
            {...reveal}
            className="mb-[var(--space-xl)] flex flex-wrap items-end justify-between gap-[var(--space-lg)]"
          >
            <div>
              <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">Where to find us</p>
              <h2
                className="font-display leading-[1.1] text-[color:var(--color-ink)]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                Three yards, one team.
              </h2>
            </div>
            <p className="max-w-[34ch] font-body" style={MUTED}>
              Headquartered in Gelang Patah, Johor since 2014, with branch offices
              in Miri and Kuala Lumpur.
            </p>
          </motion.div>

          <div className="grid gap-[var(--space-xl)] sm:grid-cols-2 lg:grid-cols-3">
            {OFFICES.map((o, i) => (
              <motion.div
                key={o.tag}
                {...reveal}
                transition={reduce ? undefined : { duration: 0.8, ease: EASE, delay: i * 0.06 }}
                className="flex h-[24rem] items-center justify-center"
              >
                <PinContainer title={o.short} href={mapsHref(o.lines)}>
                  <div className="flex h-[13rem] w-[16rem] flex-col p-1">
                    <p className="font-display font-medium text-[color:var(--color-ink)]">{o.tag}</p>
                    <div className="mt-3 space-y-1">
                      {o.lines.map((ln) => (
                        <p key={ln} className="font-body text-[0.82rem] leading-[1.5]" style={MUTED}>
                          {ln}
                        </p>
                      ))}
                    </div>
                    <p className="mt-3 font-body text-[0.78rem]" style={FAINT}>
                      {o.note}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs text-[color:var(--color-accent)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-2)]" aria-hidden />
                      View on map
                    </div>
                  </div>
                </PinContainer>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HQ map — Johor ===================== */}
      <section className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <motion.div
          {...reveal}
          className="grid items-center gap-[var(--space-xl)] lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">Headquarters</p>
            <h2
              className="font-display mb-[var(--space-md)] leading-[1.1] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-h2)" }}
            >
              Gelang Patah, Johor
            </h2>
            <p className="font-body" style={MUTED}>
              No. 18, Jalan Laman Setia 7/4, Taman Laman Setia (Setia Business Park),
              81550 Gelang Patah, Johor, Malaysia. Our 4,630 m² yard handles dive
              support, NDT and steel fabrication under one roof.
            </p>
            <div className="mt-[var(--space-lg)] flex items-center gap-[var(--space-md)]">
              <span className="text-[color:var(--color-accent)]"><AnchorGlyph /></span>
              <a
                href={mapsHref(OFFICES[0].lines)}
                className="cta-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)]">
            <iframe
              title="Advantage Marine Services — Gelang Patah, Johor"
              src="https://www.google.com/maps?q=Taman+Laman+Setia,+81550+Gelang+Patah,+Johor,+Malaysia&output=embed"
              className="block h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
