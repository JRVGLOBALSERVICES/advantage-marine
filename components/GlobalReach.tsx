"use client";

// Beat 3 of the reel — "Global Reach. Proven Performance." — rebuilt as a real
// section from registry components: OfficeMap (real interactive MapLibre basemap
// framing AMS's three Malaysian offices), Aceternity BackgroundBeams (cyan→violet
// airflow), Magic UI Marquee (class-society marks) and NumberTicker (count-up
// stats), React Bits BlurText.

import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import OfficeMap from "./ui/OfficeMap";
import { BackgroundBeams } from "./ui/BackgroundBeams";

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

        {/* real interactive MapLibre basemap framing AMS's three Malaysian offices */}
        <div className="mt-[var(--space-xl)] h-[clamp(20rem,46vh,30rem)] overflow-hidden rounded-[var(--radius-card)] border border-[color:color-mix(in_oklch,var(--color-cyan)_18%,transparent)]">
          <OfficeMap />
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
