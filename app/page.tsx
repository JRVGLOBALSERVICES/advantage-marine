import PropellerHero from "@/components/PropellerHero";
import GlobalReach from "@/components/GlobalReach";

const SERVICES = [
  ["Marine / Diving", "Air & mixed-gas commercial diving, Class IWS, real-time CCTV inspection, hull cleaning and propeller polishing."],
  ["Robotic NDT", "UT-CS crawlers, MFL inline inspection, Time-of-Flight Diffraction, MPI, eddy current and lifting-gear inspection."],
  ["Steel Fabrication", "Piping and steel renewal, structural fabrication and afloat repairs, inshore and offshore."],
  ["Rope Access & HVAC", "Industrial rope-access maintenance, accommodation upgrading, HVAC, automation and calibration."],
];

export default function Home() {
  return (
    <main>
      {/* one crawlable H1 — the page promise */}
      <h1 className="sr-only">
        Advantage Marine Services — in-water inspection, robotic NDT and marine
        engineering for shipping and offshore, Johor, Malaysia.
      </h1>

      <PropellerHero />

      {/* ---- beat 3: Global Reach (registry components) ---- */}
      <GlobalReach />

      {/* ---- grounding content below the hero ---- */}
      <section
        id="services"
        className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto"
      >
        <p className="eyebrow mb-[var(--space-md)]">What we do</p>
        <h2
          className="font-display font-bold leading-[1.08] tracking-[-0.02em] mb-[var(--space-xl)] max-w-[20ch]"
          style={{ fontSize: "var(--text-h2)", overflowWrap: "anywhere" }}
        >
          End-to-end marine &amp; offshore engineering.
        </h2>
        <div className="grid gap-px bg-[color:color-mix(in_oklch,var(--color-cyan)_16%,transparent)] sm:grid-cols-2 rounded-2xl overflow-hidden border border-[color:color-mix(in_oklch,var(--color-cyan)_16%,transparent)]">
          {SERVICES.map(([t, d]) => (
            <div key={t} className="bg-[color:var(--color-abyss)] p-[var(--space-lg)]">
              <h3 className="font-display font-medium mb-[var(--space-sm)]" style={{ fontSize: "var(--text-card)" }}>{t}</h3>
              <p className="text-[color:var(--color-mute)] leading-[1.55]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="about"
        className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] max-w-[min(900px,92vw)] mx-auto border-t border-[color:color-mix(in_oklch,var(--color-cyan)_14%,transparent)]"
      >
        <p className="eyebrow mb-[var(--space-md)]">About AMS</p>
        <p
          className="font-display leading-[1.3] tracking-[-0.01em]"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Advantage Marine Services (Malaysia) Sdn Bhd has delivered
          best-in-class in-water services for marine, shipping and offshore
          since 2014 — to OGP / IMCA standard, from a 4,630&nbsp;m² facility in
          Johor.
        </p>
      </section>

      <footer
        id="contact"
        className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-xl)] border-t border-[color:color-mix(in_oklch,var(--color-cyan)_14%,transparent)]"
      >
        <div className="max-w-[min(1200px,92vw)] mx-auto flex flex-wrap items-end justify-between gap-[var(--space-lg)]">
          <div>
            <p className="font-display font-bold" style={{ fontSize: "var(--text-card)" }}>
              ADVANTAGE<span className="text-[color:var(--color-cyan-hi)]"> MARINE</span>
            </p>
            <p className="text-[color:var(--color-mute)] text-sm mt-2">
              Johor, Malaysia · Class-approved · IMCA / OGP standard
            </p>
          </div>
          <a
            href="https://www.advantagemarine.com.my/"
            className="text-sm font-medium rounded-full px-5 py-2.5 bg-[color:var(--color-amber)] text-[color:var(--color-navy-2)] hover:opacity-90 transition-opacity"
          >
            Talk to AMS
          </a>
        </div>
        <p className="max-w-[min(1200px,92vw)] mx-auto mt-[var(--space-xl)] text-xs text-[color:var(--color-mute)]">
          Site by JRV
        </p>
      </footer>
    </main>
  );
}
