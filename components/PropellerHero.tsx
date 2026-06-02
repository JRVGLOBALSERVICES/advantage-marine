"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState, sceneState } from "@/lib/scroll";
import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import ScrollCue from "./ScrollCue";

gsap.registerPlugin(ScrollTrigger);

const PlatformHeroScene = dynamic(() => import("./PlatformHeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="eyebrow animate-pulse">Initialising scene…</div>
    </div>
  ),
});

const MUTE = "color-mix(in oklch, var(--color-ink) 66%, transparent)";

/* WebGL availability probe — if the browser/GPU can't give us a context at all,
   never mount the canvas; go straight to the static poster hero. */
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

/* Copy + stats grounded ONLY in lib/content/{about,services}.json.
   Honest figures only — "10+ years" (over a decade), 4,630 m² Johor facility,
   12 class-society / ISO certs, established 2014. No invented metrics. */
const BEATS: Beat[] = [
  {
    kicker: "00 — In-water marine & offshore",
    head: ["Every scope,", "assembled afloat."],
    lead: "Commercial diving, robotic NDT, ICCP, steel fabrication and rope access — one accountable team delivering integrated solutions below the waterline.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "01 — Surveyed afloat, never dry-docked",
    head: ["Class surveys,", "without the dock."],
    lead: "IMCA-standard divers and the Chasing M2 ROV inspect, clean and repair hulls, propellers and structures in the water — so the vessel keeps earning while we work.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    kicker: "02 — Certified to class",
    head: ["Verified to spec.", "Cleared by class."],
    lead: "Conventional and advanced NDT — PAUT, TOFD, digital radiography — documented to ISO 9001 / 14001 / OHSAS and recognised by nine class societies.",
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
      <div
        className="mb-[var(--space-md)]"
        style={{ fontSize: "var(--text-display)" }}
      >
        <BlurText
          text={beat.head[0]}
          inView={active}
          animateBy="words"
          className="font-display font-bold leading-[1.08] tracking-[-0.01em] text-[color:var(--color-ink)]"
        />
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.08] tracking-[-0.01em] text-[color:var(--color-accent)]"
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

/* Static hero (mobile / touch / reduced-motion) — real photo + headline overlay */
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
      {/* cream readability wash from the bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 92%, transparent) 0%, color-mix(in oklch, var(--color-paper) 30%, transparent) 42%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 grid items-end"
        style={{ padding: "clamp(1.5rem,5vw,3.5rem)" }}
      >
        <BeatBlock beat={BEATS[0]} active />
      </div>
    </header>
  );
}

export default function PropellerHero() {
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
    // Vessel renders on ALL viewports (mobile included) via the iOS-safe sticky
    // scroll pattern. Static photo is the reduced-motion a11y fallback AND the
    // fallback when WebGL is unavailable, so the hero is never a blank canvas.
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
        // demand-mode canvas: kick a render whenever scroll advances
        sceneState.invalidate?.();
      },
    });

    // copy beats — beat 0 lands as the vessel locks together (~0.6), then narrative
    const windows: [number, number, number, number][] = [
      [-0.02, 0.12, 0.5, 0.62],
      [0.62, 0.69, 0.82, 0.9],
      [0.9, 0.95, 1.04, 1.1],
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

  /* ---------- reduced-motion / no-WebGL / context-lost: honest static layout ---------- */
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

  /* ---------- default: sticky scroll narrative with the vessel scene ---------- */
  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative"
      style={{ height: "340lvh" }}
    >
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        {/* 3D layer — exploded parts fly together into the vessel.
            onContextLost → swap to the static poster so it can never go blank. */}
        <div className="absolute inset-0">
          {mounted && <PlatformHeroScene onContextLost={() => setCanvasFailed(true)} />}
        </div>

        {/* readability wash — cream, anchored bottom-left for the copy */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 78%, transparent) 0%, transparent 50%)",
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
