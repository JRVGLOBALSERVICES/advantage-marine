"use client";

// Beat 3 of the reel — "Global Reach. Proven Performance." — rebuilt as a real
// section from registry components: Aceternity WorldMap (animated great-circle
// arcs), Aceternity BackgroundBeams (cyan→violet airflow), Magic UI Marquee
// (class-society marks) and NumberTicker (count-up stats), React Bits BlurText.

import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import { Marquee } from "./ui/Marquee";
import WorldMap from "./ui/WorldMap";
import { BackgroundBeams } from "./ui/BackgroundBeams";

// Routes radiating from the Johor facility (1.49, 103.76) across the region's
// offshore fields and ports.
const JOHOR = { lat: 1.4854, lng: 103.7618, label: "Johor HQ" };
const ROUTES = [
  { start: JOHOR, end: { lat: 5.2831, lng: 115.2308, label: "Labuan" } },
  { start: JOHOR, end: { lat: 4.5482, lng: 103.426, label: "Kerteh" } },
  { start: JOHOR, end: { lat: 3.1701, lng: 113.0411, label: "Bintulu" } },
  { start: JOHOR, end: { lat: 1.2897, lng: 103.8501, label: "Singapore" } },
  { start: JOHOR, end: { lat: 25.276, lng: 55.2962, label: "Gulf" } },
];

const SOCIETIES = ["ABS", "DNV", "BV", "LR", "ClassNK", "KR", "IRS", "CCS", "RINA"];

export default function GlobalReach() {
  return (
    <section
      id="reach"
      className="relative overflow-hidden border-t border-[color:color-mix(in_oklch,var(--color-cyan)_14%,transparent)]"
    >
      <BackgroundBeams className="opacity-50" />

      <div className="relative z-10 px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto">
        <p className="eyebrow mb-[var(--space-md)]">03 — Class-approved reach</p>

        <BlurText
          text="Global reach."
          animateBy="words"
          className="font-display font-bold leading-[1.06] tracking-[-0.02em]"
        />
        <BlurText
          text="Proven performance."
          animateBy="words"
          delay={140}
          className="font-display font-light leading-[1.06] tracking-[-0.02em] text-[color:var(--color-cyan-hi)] mb-[var(--space-lg)]"
        />

        <p
          className="text-[color:var(--color-mute)] max-w-[42rem] leading-[1.55]"
          style={{ fontSize: "var(--text-lead)" }}
        >
          Surveys accepted by the major class societies — mobilised from our Johor
          facility across the region&rsquo;s offshore fields.
        </p>

        {/* animated great-circle arcs from Johor */}
        <div className="mt-[var(--space-xl)]">
          <WorldMap dots={ROUTES} lineColor="#30837b" />
        </div>

        {/* count-up stats */}
        <div className="mt-[var(--space-xl)] grid grid-cols-2 sm:grid-cols-3 gap-[var(--space-lg)]">
          {[
            { value: 10, suffix: "+", label: "Years afloat · IMCA / OGP" },
            { value: 9, suffix: "", label: "Class societies accepted" },
            { value: 4630, suffix: " m²", label: "Johor facility footprint" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display font-bold leading-none text-[color:var(--color-amber)] flex items-baseline" style={{ fontSize: "var(--text-h2)" }}>
                <NumberTicker value={s.value} className="text-[color:var(--color-amber)]" />
                <span>{s.suffix}</span>
              </p>
              <p className="eyebrow mt-[var(--space-sm)] !tracking-[0.18em] normal-case text-[color:var(--color-mute)] max-w-[14rem]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* class-society marquee */}
        <div className="mt-[var(--space-xl)] relative">
          <Marquee pauseOnHover className="[--duration:26s]">
            {SOCIETIES.map((m) => (
              <span
                key={m}
                className="font-display font-medium text-base tracking-[0.14em] px-5 py-2 mx-1 border border-[color:color-mix(in_oklch,var(--color-cyan)_30%,transparent)] rounded-full text-[color:var(--color-cyan-hi)]"
              >
                {m}
              </span>
            ))}
          </Marquee>
          {/* fade-mask edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[color:var(--color-abyss)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[color:var(--color-abyss)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
