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

   The 11-part support-vessel GLB authored in Blender (Hull · Deck ·
   Bridge · Funnel · Mast · Crane · Bulwark · BootTopping · twin Props ·
   Rudder) is the home hero. Sticky 340lvh narrative, iOS-safe (no
   ScrollTrigger pin — position:sticky only). The scene maps scroll to
   assembly: p=0 exploded technical diagram → p=1 assembled hull, on a
   slow turntable. The contact page carries a DIFFERENT model.
   ════════════════════════════════════════════════════════════════ */

const VesselContactScene = dynamic(() => import("./VesselContactScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="eyebrow animate-pulse">Assembling vessel…</div>
    </div>
  ),
});

const MUTE = "color-mix(in oklch, var(--color-ink) 66%, transparent)";

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

/* Three acts mapped onto the scene's explode→assemble scrub. Grounded ONLY in
   lib/content/{about,services} — the real figures (10+ yrs afloat, the 4,630 m²
   Johor facility, 12 class/ISO certs). No invented metrics. Luminous accents
   live on the model; the second headline line stays dark ink so type never
   blends with the teal scene glow. */
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
      <p className="eyebrow mb-[var(--space-md)]">{beat.kicker}</p>
      <div className="mb-[var(--space-md)]" style={{ fontSize: "var(--text-display)" }}>
        <BlurText
          text={beat.head[0]}
          inView={active}
          animateBy="words"
          className="font-display font-bold leading-[1.08] tracking-[-0.01em] text-[color:var(--color-ink)]"
        />
        {/* second line stays dark INK (not accent teal) so the headline never
            blends with the teal scene glow behind it. */}
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.08] tracking-[-0.01em] text-[color:color-mix(in_oklch,var(--color-ink)_74%,transparent)]"
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
          className="font-display font-bold leading-none text-[color:var(--color-accent)] flex items-baseline"
          style={{ fontSize: "var(--text-stat)" }}
        >
          <NumberTicker
            value={beat.stat.value}
            start={active}
            decimalPlaces={beat.stat.decimals ?? 0}
            className="text-[color:var(--color-accent)]"
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

/* Static hero (mobile reduced-motion / no-WebGL / context-lost) — real photo +
   headline overlay, then the remaining beats stack honestly below. */
function StaticHero() {
  return (
    <header id="top" className="relative h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
      <Image
        src="/media/home/Hero-AMS.jpeg"
        alt="Advantage Marine Services diver and vessel"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 92%, transparent) 0%, color-mix(in oklch, var(--color-paper) 30%, transparent) 42%, transparent 70%)",
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
    // Vessel renders on ALL viewports via the iOS-safe sticky scroll pattern; the
    // static photo is the reduced-motion a11y + no-WebGL fallback.
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

    // Beats aligned to the scene's explode→assemble scrub: beat 0 over the
    // exploded technical diagram (ON at load so the headline is crisp on first
    // paint), beat 1 over the mid-assembly hold, beat 2 over the assembled hull
    // before the GlobalReach handoff.
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

  /* reduced-motion / no-WebGL / context-lost: honest static layout */
  if (mounted && (!useCanvas || canvasFailed)) {
    return (
      <>
        <StaticHero />
        <section className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto">
          {BEATS.slice(1).map((beat, i) => (
            <BeatBlock key={i} beat={beat} active />
          ))}
        </section>
      </>
    );
  }

  /* default: sticky scroll narrative with the vessel assembly scene */
  return (
    <section id="top" ref={sectionRef} className="relative" style={{ height: "340lvh" }}>
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        {/* 3D layer — vessel assembles on scroll; onContextLost swaps to the
            static poster so it can never go blank. */}
        <div className="absolute inset-0">
          {mounted && (
            <CanvasErrorBoundary onError={() => setCanvasFailed(true)}>
              <VesselContactScene onContextLost={() => setCanvasFailed(true)} />
            </CanvasErrorBoundary>
          )}
        </div>

        {/* readability wash — cream, anchored bottom-left for the copy. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 78%, transparent) 0%, transparent 50%)",
          }}
        />
        {/* Mobile: in portrait the vessel fills the frame, so the headline
            overlaps the hull — a stronger, taller cream scrim keeps the copy
            legible (matches the StaticHero treatment). Desktop unaffected. */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 94%, transparent) 0%, color-mix(in oklch, var(--color-paper) 64%, transparent) 40%, transparent 72%)",
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
