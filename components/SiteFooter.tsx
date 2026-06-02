import Link from "next/link";

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
    lines: ["Unit H10-1 (Ground Floor), Plaza Kelana Jaya, Jalan SS7/13A", "Kelana Jaya, 47301 Selangor, Malaysia"],
  },
];

const NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
      <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <div className="flex flex-col gap-[var(--space-xl)] md:flex-row md:items-start md:justify-between">
          <div className="max-w-[26rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/advantage-marine-logo-03.png" alt="Advantage Marine Services" className="h-9 w-auto mb-[var(--space-md)]" width={2864} height={442} />
            <p className="leading-[1.6]" style={{ color: "color-mix(in oklch, var(--color-ink) 68%, transparent)" }}>
              In-water inspection, robotic NDT and marine engineering for the marine,
              shipping and offshore industries — surveyed afloat, never dry-docked.
            </p>
            <p className="eyebrow mt-[var(--space-md)] !tracking-[0.18em] normal-case" style={{ color: "color-mix(in oklch, var(--color-ink) 60%, transparent)" }}>
              IMCA / OGP standard · Class surveys accepted by ABS · DNV · BV · LR · ClassNK
            </p>
          </div>
          <nav className="flex flex-col gap-3 text-sm">
            <p className="eyebrow mb-1">Navigate</p>
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="font-medium hover:text-[color:var(--color-accent)] transition-colors w-fit">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-[var(--space-2xl)] grid gap-[var(--space-lg)] sm:grid-cols-2 lg:grid-cols-3 border-t border-[color:var(--color-rule)] pt-[var(--space-xl)]">
          {OFFICES.map((o) => (
            <div key={o.tag}>
              <p className="eyebrow mb-2">{o.tag}</p>
              <p className="font-display font-medium text-[0.95rem] mb-1">{o.name}</p>
              {o.lines.map((ln) => (
                <p key={ln} className="text-sm leading-[1.55]" style={{ color: "color-mix(in oklch, var(--color-ink) 62%, transparent)" }}>
                  {ln}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-[var(--space-xl)] flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-rule)] pt-[var(--space-md)]">
          <p className="text-xs" style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
            © {new Date().getFullYear()} Advantage Marine Services (Malaysia) Sdn Bhd · Reg. 201401033925 (1110016-U)
          </p>
          <p className="text-xs" style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
            Site by JRV
          </p>
        </div>
      </div>
    </footer>
  );
}
