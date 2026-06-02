import Link from "next/link";
import { FooterJrvLogoReveal } from "@/components/FooterJrvLogoReveal";
import FooterVideo from "@/components/FooterVideo";
import FooterWaveMorph from "@/components/FooterWaveMorph";
import servicesData from "@/lib/content/services.json";

// Caliber footer (cream system, no dark surface): editorial statement + HQ
// spec-sheet at the top, a capabilities/company index in the middle, an
// ADVANTAGE MARINE mega-wordmark sign-off, and a microbar carrying © + the JRV
// logo credit. Replaces the generic SaaS 3-col footer. Real content only.

const muted = (pct: number) => ({ color: `color-mix(in oklch, var(--color-ink) ${pct}%, transparent)` });

const OFFICES = [
  {
    tag: "Main Office · Johor",
    name: "Advantage Marine Services (Malaysia) Sdn Bhd",
    lines: ["No. 18, Jalan Laman Setia 7/4, Taman Laman Setia", "81550 Gelang Patah, Johor, Malaysia"],
  },
  {
    tag: "Branch · Miri",
    name: "Seadocan Diving & Marine Services Sdn Bhd",
    lines: ["Lot 2215, Jalan Piasau Utara 1, Premier Industrial Park", "Piasau, 98000 Miri, Sarawak, Malaysia"],
  },
  {
    tag: "Branch · Kuala Lumpur",
    name: "Advantage Marine Services (Malaysia) Sdn Bhd",
    lines: ["Unit H10-1, Plaza Kelana Jaya, Jalan SS7/13A", "Kelana Jaya, 47301 Selangor, Malaysia"],
  },
];

const COMPANY = [
  { href: "/about", label: "About AMS" },
  { href: "/projects", label: "Projects" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  const buckets = servicesData.buckets;

  return (
    <footer className="relative overflow-hidden border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
      {/* === Video band — cinematic marine clip + ADVANTAGE MARINE wordmark === */}
      <FooterVideo />

      {/* === A — statement + spec sheet === */}
      <div className="mx-auto max-w-[min(1200px,92vw)] border-b border-[color:var(--color-rule)] px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-xl)] pt-[var(--space-2xl)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/advantage-marine-logo-03.png"
          alt="Advantage Marine Services"
          className="mb-[var(--space-lg)] h-9 w-auto"
          width={2864}
          height={442}
        />
        <div className="grid items-start gap-[var(--space-xl)] lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <p
            className="font-accent leading-[1.18] max-w-[20ch]"
            style={{ fontSize: "var(--text-h2)", fontWeight: 400 }}
          >
            In-water inspection. Robotic NDT.{" "}
            <span className="text-[color:var(--color-accent)]">Marine engineering.</span>
          </p>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm leading-[1.5]">
            <div>
              <dt className="eyebrow mb-1.5 !text-[0.68rem]">Facility</dt>
              <dd style={muted(78)}>4,630&nbsp;m² · Gelang Patah, Johor</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5 !text-[0.68rem]">Established</dt>
              <dd style={muted(78)}>2014 · Reg. 1110016-U</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5 !text-[0.68rem]">Standards</dt>
              <dd style={muted(78)}>IMCA · OGP</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5 !text-[0.68rem]">Class accepted</dt>
              <dd style={muted(78)}>ABS · DNV · BV · LR · ClassNK</dd>
            </div>
            <div className="col-span-2 pt-1">
              <Link href="/contact" className="cta-primary">
                Talk to AMS
              </Link>
            </div>
          </dl>
        </div>
      </div>

      {/* === B — capabilities / company / offices index === */}
      <div className="mx-auto max-w-[min(1200px,92vw)] border-b border-[color:var(--color-rule)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-xl)]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-[var(--space-lg)] lg:grid-cols-4">
          <div>
            <p className="eyebrow mb-4 !text-[0.68rem]">Capabilities</p>
            <ul className="space-y-2.5 text-sm">
              {buckets.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/services#${b.slug}`}
                    className="footer-link transition-colors hover:text-[color:var(--color-accent)]"
                    style={muted(80)}
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 !text-[0.68rem]">Company</p>
            <ul className="space-y-2.5 text-sm">
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="footer-link transition-colors hover:text-[color:var(--color-accent)]"
                    style={muted(80)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2">
            <p className="eyebrow mb-4 !text-[0.68rem]">Offices</p>
            <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
              {OFFICES.map((o) => (
                <div key={o.tag}>
                  <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
                    {o.tag}
                  </p>
                  <p className="mb-0.5 font-display text-[0.9rem] font-medium leading-[1.3]">{o.name}</p>
                  {o.lines.map((ln) => (
                    <p key={ln} className="text-[0.8rem] leading-[1.5]" style={muted(62)}>
                      {ln}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === C — morphing horizon line + mega-wordmark sign-off === */}
      <div className="mx-auto max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pt-[var(--space-lg)]">
        <FooterWaveMorph />
      </div>
      <div className="mx-auto max-w-[min(1200px,92vw)] overflow-hidden px-[clamp(1.5rem,4vw,4rem)] pt-[var(--space-md)]">
        <p
          aria-hidden
          className="select-none font-display font-bold leading-[0.9] tracking-[-0.03em]"
          style={{
            fontSize: "clamp(3rem, 13vw, 11rem)",
            color: "color-mix(in oklch, var(--color-ink) 9%, transparent)",
          }}
        >
          ADVANTAGE
        </p>
      </div>

      {/* === D — microbar === */}
      <div className="mx-auto max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-md)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs" style={muted(55)}>
            © {new Date().getFullYear()} Advantage Marine Services (Malaysia) Sdn Bhd · Reg. 201401033925 (1110016-U)
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs" style={muted(55)}>
            <span className="uppercase tracking-[0.16em]">MY · SG · OFFSHORE</span>
            <FooterJrvLogoReveal />
          </div>
        </div>
      </div>
    </footer>
  );
}
