"use client";

// Beat 3 of the reel — "Global Reach. Proven Performance." — a real section:
// the three Malaysian offices presented as a fanned, advancing LocationFanDeck
// (each card a real dark Carto map tile of the city + address + role), over
// Aceternity BackgroundBeams (cyan airflow) with NumberTicker count-up stats
// and React Bits BlurText. (Replaces the single OfficeMap; that component is
// still in the repo if a live basemap is wanted back.)

import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import LocationFanDeck, { type OfficeLocation } from "./ui/LocationFanDeck";
import { BackgroundBeams } from "./ui/BackgroundBeams";

// AMS's three REAL Malaysian offices — coords match OfficeMap; addresses + notes
// match the contact-page offices list.
const OFFICES: OfficeLocation[] = [
  {
    name: "Johor Bahru",
    region: "Main office · Johor",
    lngLat: [103.7578, 1.4655],
    hq: true,
    lines: [
      "No. 18, Jalan Laman Setia 7/4, Taman Laman Setia",
      "(Setia Business Park), 81550 Gelang Patah, Johor",
    ],
    note: "4,630 m² fabrication & dive-support yard",
  },
  {
    name: "Miri",
    region: "Branch · Sarawak",
    lngLat: [113.9914, 4.3995],
    lines: [
      "Lot 2215, Jalan Piasau Utara 1, Premier Industrial Park",
      "Piasau, 98000 Miri, Sarawak",
    ],
    note: "East Malaysia offshore support",
  },
  {
    name: "Kuala Lumpur",
    region: "Branch · Selangor",
    lngLat: [101.6869, 3.139],
    lines: [
      "Unit H10-1, Plaza Kelana Jaya, Jalan SS7/13A",
      "Kelana Jaya, 47301 Selangor",
    ],
    note: "Commercial & business development",
  },
];

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

        {/* the three offices as a fanned, advancing deck — real dark map tile per city */}
        <div className="mt-[var(--space-xl)] mb-[var(--space-lg)]">
          <LocationFanDeck offices={OFFICES} />
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
      </div>
    </section>
  );
}
