"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState, sceneState } from "@/lib/scroll";
import CanvasErrorBoundary from "./ui/CanvasErrorBoundary";
import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import ScrollCue from "./ScrollCue";

gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════════════════════════════
   VESSEL HERO — home page (2026-06).

   Dark CAD visualization concept: deep ink background, blue grid floor,
   neon connection lines during explode, pulsating target ring post-assembly.
   Sticky 340lvh narrative, iOS-safe (position:sticky only).
   ════════════════════════════════════════════════════════════════ */

const VesselContactScene = dynamic(() => import("./VesselContactScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="eyebrow animate-pulse text-white/70">Assembling vessel…</div>
    </div>
  ),
});

const MUTE = "color-mix(in oklch, #ffffff 55%, transparent)";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function trap(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
}

type Beat = {
  kicker: string;
  head: [string, string];
  lead: string;
  stat: { value: number; suffix: string; decimals?: number };
  statLabel: string;
};

const BEATS: Beat[] = [
  {
    kicker: "00 — Whole-of-vessel, every system in scope",
    head: ["Hull to propeller,", "one accountable crew."],
    lead: "Class survey, in-water repair, salvage and conversion — from the boot-topping at the waterline to the twin screws and rudder at the stern, held on one work order.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "01 — Read underwater, joint by joint",
    head: ["Every part", "accounted for."],
    lead: "Pulled apart to its last fitting — hull, deck, bridge, funnel, mast, crane, the running gear. Every joint is a point we read in-water and document to class.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    kicker: "02 — Reassembled, proven to class",
    head: ["The whole vessel.", "Cleared by class."],
    lead: "Brought back together and signed off — our divers and the Chasing M2 ROV verify the welds, the cathodic protection and the steel the surface can't see, to ISO and class society.",
    stat: { value: 12, suffix: "" },
    statLabel: "ISO & class-society certifications",
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
      <p className="eyebrow mb-[var(--space-md)]" style={{ color: "#4fc3f7" }}>
        {beat.kicker}
      </p>
      <div className="mb-[var(--space-md)]" style={{ fontSize: "var(--text-display)" }}>
        <BlurText
          text={beat.head[0]}
          inView={active}
          animateBy="words"
          className="font-display font-bold leading-[1.08] tracking-[-0.01em] text-white"
        />
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.08] tracking-[-0.01em] text-white/75"
        />
      </div>
      <p
        className="max-w-[34rem] leading-[1.55]"
        style={{ fontSize: "var(--text-lead)", color: MUTE }}
      >
        {beat.lead}
      </p>

      <div className="mt-[var(--space-lg)] flex items-end gap-[var(--space-md)] flex-wrap">
        <span
          className="font-display font-bold leading-none flex items-baseline"
          style={{ fontSize: "var(--text-stat)", color: "#29b6f6" }}
        >
          <NumberTicker
            value={beat.stat.value}
            start={active}
            decimalPlaces={beat.stat.decimals ?? 0}
            className="text-[#29b6f6]"
          />
          <span>{beat.stat.suffix}</span>
        </span>
        <span
          className="eyebrow pb-2 max-w-[14rem] !tracking-[0.18em] normal-case"
          style={{ color: MUTE }}
        >
          {beat.statLabel}
        </span>
      </div>
    </div>
  );
}

/* Static hero fallback — dark version with real photo overlay */
function StaticHero() {
  return (
    <header id="top" className="relative h-[100lvh] overflow-hidden" style={{ background: "#080c14" }}>
      <Image
        src="/media/home/Hero-AMS.jpeg"
        alt="Advantage Marine Services diver and vessel"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #080c14 0%, color-mix(in oklch, #080c14 60%, transparent) 42%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 grid items-end" style={{ padding: "clamp(1.5rem,5vw,3.5rem)" }}>
        <BeatBlock beat={BEATS[0]} active />
      </div>
    </header>
  );
}

export default function VesselHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef<boolean[]>(BEATS.map(() => false));
  const [mounted, setMounted] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [active, setActive] = useState<boolean[]>(BEATS.map(() => false));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = reduced;
    setUseCanvas(!reduced && hasWebGL());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !useCanvas || canvasFailed || !sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        sceneState.invalidate?.();
      },
    });

    const windows: [number, number, number, number][] = [
      [-0.1, -0.05, 0.14, 0.24],
      [0.42, 0.5, 0.62, 0.7],
      [0.86, 0.92, 0.99, 1.05],
    ];
    const tick = () => {
      const p = scrollState.progress;
      let changed = false;
      beatRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = trap(p, ...windows[i]);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 26}px)`;
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
      sceneState.invalidate = null;
    };
  }, [mounted, useCanvas, canvasFailed]);

  if (mounted && (!useCanvas || canvasFailed)) {
    return (
      <>
        <StaticHero />
        <section className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto" style={{ background: "#080c14" }}>
          {BEATS.slice(1).map((beat, i) => (
            <BeatBlock key={i} beat={beat} active />
          ))}
        </section>
      </>
    );
  }

  return (
    <section id="top" ref={sectionRef} className="relative" style={{ height: "340lvh" }}>
      <div className="sticky top-0 h-[100lvh] overflow-hidden" style={{ background: "#080c14" }}>
        {/* 3D layer */}
        <div className="absolute inset-0">
          {mounted && (
            <CanvasErrorBoundary onError={() => setCanvasFailed(true)}>
              <VesselContactScene onContextLost={() => setCanvasFailed(true)} />
            </CanvasErrorBoundary>
          )}
        </div>

        {/* Dark readability wash — subtle gradient from bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, #080c14 82%, transparent) 0%, transparent 55%)",
          }}
        />
        {/* Mobile: stronger wash for portrait vessel framing */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(to top, #080c14 0%, color-mix(in oklch, #080c14 72%, transparent) 40%, transparent 72%)",
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
  );
}
