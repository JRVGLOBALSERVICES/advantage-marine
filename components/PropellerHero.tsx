"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState } from "@/lib/scroll";
import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import ScrollCue from "./ScrollCue";

gsap.registerPlugin(ScrollTrigger);

const PropellerScene = dynamic(() => import("./PropellerScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="eyebrow animate-pulse">Initialising scene…</div>
    </div>
  ),
});

/* trapezoid 0→1 visibility window */
function trap(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
}

type Beat = {
  kicker: string;
  head: [string, string]; // [bold, light]
  lead: string;
  stat: { value: number; suffix: string; decimals?: number };
  statLabel: string;
};

const BEATS: Beat[] = [
  {
    kicker: "00 — Whole-vessel capability",
    head: ["Every system,", "brought together."],
    lead: "Diving, robotic NDT, steel fabrication and rope access — one accountable team assembling the full scope below the waterline.",
    stat: { value: 4, suffix: "" },
    statLabel: "Core disciplines · one team afloat",
  },
  {
    kicker: "01 — In-water inspection",
    head: ["Surveyed afloat.", "Never dry-docked."],
    lead: "IMCA-standard commercial divers and robotic tooling inspect, clean and repair below the waterline — so the vessel keeps earning while we work.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "02 — NDT precision",
    head: ["Every weld,", "scanned to spec."],
    lead: "UT-CS robotic crawlers, MFL inline inspection and Time-of-Flight Diffraction capture pipeline and weld integrity data underwater.",
    stat: { value: 360, suffix: "°" },
    statLabel: "Robotic UT-scan coverage",
  },
];

function BeatBlock({
  beat,
  innerRef,
  stacked,
  active,
}: {
  beat: Beat;
  innerRef?: (el: HTMLDivElement | null) => void;
  stacked?: boolean;
  active: boolean;
}) {
  return (
    <div
      ref={innerRef}
      style={stacked ? { gridArea: "1 / 1" } : undefined}
      className="max-w-[42rem] will-change-[opacity,transform]"
    >
      <p className="eyebrow mb-[var(--space-md)]">{beat.kicker}</p>
      <div
        className="mb-[var(--space-md)]"
        style={{ fontSize: "var(--text-display)" }}
      >
        <BlurText
          text={beat.head[0]}
          inView={active}
          animateBy="words"
          className="font-display font-bold leading-[1.06] tracking-[-0.02em]"
        />
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.06] tracking-[-0.02em] text-[color:var(--color-cyan-hi)]"
        />
      </div>
      <p
        className="text-[color:var(--color-mute)] max-w-[34rem] leading-[1.55]"
        style={{ fontSize: "var(--text-lead)" }}
      >
        {beat.lead}
      </p>

      <div className="mt-[var(--space-lg)] flex items-end gap-[var(--space-md)] flex-wrap">
        <span
          className="font-display font-bold leading-none text-[color:var(--color-amber)] flex items-baseline"
          style={{ fontSize: "var(--text-stat)" }}
        >
          <NumberTicker
            value={beat.stat.value}
            start={active}
            decimalPlaces={beat.stat.decimals ?? 0}
            className="text-[color:var(--color-amber)]"
          />
          <span>{beat.stat.suffix}</span>
        </span>
        <span className="eyebrow pb-2 max-w-[14rem] !tracking-[0.18em] normal-case text-[color:var(--color-mute)]">
          {beat.statLabel}
        </span>
      </div>
    </div>
  );
}

export default function PropellerHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef<boolean[]>(BEATS.map(() => false));
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<boolean[]>(BEATS.map(() => false));

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = r;
    setReduced(r);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || reduced || !sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
      },
    });

    // copy beats driven straight off scroll progress (no re-render for fades)
    // copy beats — beat 0 lands as the parts lock together (~0.28), then narrative
    const windows: [number, number, number, number][] = [
      [-0.02, 0.16, 0.3, 0.4],
      [0.4, 0.47, 0.58, 0.66],
      [0.66, 0.73, 0.92, 1.05],
    ];
    const tick = () => {
      const p = scrollState.progress;
      let changed = false;
      beatRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = trap(p, ...windows[i]);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 26}px)`;
        // latch the reveal trigger once the beat is materially visible
        if (o > 0.4 && !shownRef.current[i]) {
          shownRef.current[i] = true;
          changed = true;
        }
      });
      if (changed) setActive([...shownRef.current]);
    };
    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, [mounted, reduced]);

  /* ---------- reduced-motion: honest static layout, all copy in flow ---------- */
  if (mounted && reduced) {
    return (
      <>
        <header id="top" className="relative h-[100lvh] overflow-hidden">
          <div className="absolute inset-0">
            <PropellerScene />
          </div>
          <div
            className="absolute inset-0 grid items-end"
            style={{ padding: "clamp(1.5rem,4vw,4rem)" }}
          >
            <BeatBlock beat={BEATS[0]} active />
          </div>
        </header>
        <section className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto">
          {BEATS.slice(1).map((beat, i) => (
            <BeatBlock key={i} beat={beat} active />
          ))}
        </section>
      </>
    );
  }

  /* ---------- default: pinned scroll narrative ---------- */
  return (
    <>
      <section
        id="top"
        ref={sectionRef}
        className="relative"
        style={{ height: "340lvh" }}
      >
        <div className="sticky top-0 h-[100lvh] overflow-hidden">
          {/* 3D layer */}
          <div className="absolute inset-0">{mounted && <PropellerScene />}</div>

          {/* readability vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 90% at 70% 30%, transparent 40%, color-mix(in oklch, var(--color-abyss) 78%, transparent) 100%), linear-gradient(to top, color-mix(in oklch, var(--color-abyss) 88%, transparent) 0%, transparent 45%)",
            }}
          />

          {/* copy layer */}
          <div
            className="absolute inset-0 grid items-end pointer-events-none"
            style={{ padding: "clamp(1.5rem,4vw,4rem)" }}
          >
            <div className="grid">
              {BEATS.map((beat, i) => (
                <BeatBlock
                  key={i}
                  beat={beat}
                  stacked
                  active={active[i]}
                  innerRef={(el) => (beatRefs.current[i] = el)}
                />
              ))}
            </div>
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-[var(--space-md)] right-[clamp(1.5rem,4vw,4rem)]">
            <ScrollCue />
          </div>
        </div>
      </section>
    </>
  );
}
