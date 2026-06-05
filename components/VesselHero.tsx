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
   VESSEL HERO — home page (2026-06-04).

   Three-stage technical exploded-assembly, mapped to Rj's reference poster:
     stage 01  PART BY PART          — exploded modular components + manifest
     stage 02  INTERMEDIATE ASSEMBLY — partial hull & systems
     stage 03  COMBINED TOGETHER     — survey-ready vessel
   Reads top→bottom (scroll) the way the reference reads left→right. Monotonic
   assemble: the visitor enters on the parts and scrolls the ship together.

   Warm cream studio stage (matches page paper), ink copy + one teal accent.
   Sticky 340lvh narrative, iOS-safe (position:sticky only — no pin).
   ════════════════════════════════════════════════════════════════ */

/* v4 vessel — Blender-authored research vessel (advantage-vessel-v4.glb, 103
   named meshes). Explode rig ships as per-part `explode` offset vectors in glTF
   extras (lerped in JS by scroll progress inside VesselHeroV4Scene), plus a live
   Gerstner ocean that surfaces on the assembled end. Replaces the v3 baked-clip
   hero; the same enter-exploded → scroll-together narrative, finer scrub control
   and a living waterline instead of a void floor. */
const VesselContactScene = dynamic(() => import("./VesselHeroV4Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="eyebrow animate-pulse text-[color:var(--color-ink)]/60">Assembling vessel…</div>
    </div>
  ),
});

const MUTE = "color-mix(in oklch, var(--color-ink) 62%, transparent)";
const FAINT = "color-mix(in oklch, var(--color-ink) 42%, transparent)";
const ACCENT = "var(--color-accent)";
const RULE = "color-mix(in oklch, var(--color-ink) 16%, transparent)";

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
  stageNo: string;
  stageTitle: string;
  stageSub: string;
  head: [string, string];
  lead: string;
  stat: { value: number; suffix: string; decimals?: number };
  statLabel: string;
};

/* Copy tracks the COMPLETE → SPLIT → REJOIN scroll arc the scene now runs
   (whole at p0, fully apart at p0.5, joined again at p1). Earlier copy read
   apart→assembling→whole, which inverted against the new animation — the ship
   sat whole while the words said "pulled apart". Re-sequenced so each beat
   describes what's actually on screen; the parts manifest rides beat 01 (the
   whole vessel, introducing the systems about to separate). */
const BEATS: Beat[] = [
  {
    stageNo: "01",
    stageTitle: "Complete vessel",
    stageSub: "Survey-ready, every line in",
    head: ["One vessel,", "every system aboard."],
    lead: "Hull, superstructure, funnel uptakes, radar mast and deck handling gear — the whole research vessel, modelled to the last brace before we take it apart.",
    stat: { value: 103, suffix: "" },
    statLabel: "Modelled parts · whole-of-vessel scope",
  },
  {
    stageNo: "02",
    stageTitle: "Split by part",
    stageSub: "Modular components",
    head: ["Every system,", "pulled apart."],
    lead: "Separated to the last brace — hull plate, machinery, funnel, radar mast and deck gear laid out as the joints we read in-water and document to class.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    stageNo: "03",
    stageTitle: "Joined again",
    stageSub: "Survey-ready vessel",
    head: ["Back together.", "Cleared by class."],
    lead: "Reassembled and certified — our divers and the Chasing M2 ROV verify the welds, the cathodic protection and the steel the surface can't see, to ISO and class society.",
    stat: { value: 12, suffix: "" },
    statLabel: "ISO & class-society certifications",
  },
];

/* Component manifest — the reference's left-column callouts, grounded in the
   real subsystems modelled in vessel-v3.glb (the research-vessel rebuild;
   AMS is commercial subsea inspection, not a naval concept). */
const MANIFEST: { code: string; label: string; note: string }[] = [
  { code: "AMS·H1", label: "Hull & forecastle", note: "Silver hull · main deck · bulwarks" },
  { code: "AMS·S2", label: "Superstructure", note: "Tiered deckhouse · bridge · glass" },
  { code: "AMS·F3", label: "Funnel & uptakes", note: "Casing · A-frame · exhaust uptakes" },
  { code: "AMS·M4", label: "Radar mast", note: "Lattice mast · braces · legs" },
  { code: "AMS·D5", label: "Deck handling gear", note: "Knuckle crane · stern A-frame · winch" },
];

/* Stage header — the reference's "PART BY PART / (MODULAR COMPONENTS)" block. */
function StageHead({ beat }: { beat: Beat }) {
  return (
    <div className="flex items-baseline gap-[var(--space-sm)] mb-[var(--space-md)]">
      <span
        className="font-display font-bold leading-none tabular-nums"
        style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", color: ACCENT }}
      >
        {beat.stageNo}
      </span>
      <span className="h-[1.4em] w-px self-center" style={{ background: RULE }} />
      <span className="flex flex-col">
        <span className="eyebrow !tracking-[0.22em]" style={{ color: ACCENT }}>
          {beat.stageTitle}
        </span>
        <span className="eyebrow !tracking-[0.18em] normal-case" style={{ color: FAINT }}>
          {beat.stageSub}
        </span>
      </span>
    </div>
  );
}

function BeatBlock({
  beat,
  innerRef,
  stacked,
  active,
  withManifest,
}: {
  beat: Beat;
  innerRef?: (el: HTMLDivElement | null) => void;
  stacked?: boolean;
  active: boolean;
  withManifest?: boolean;
}) {
  /* stage 01 carries the component manifest, so its headline runs at a
     calmer scale to leave room — stages 02/03 keep the full display size. */
  const headSize = withManifest
    ? "clamp(2rem, min(4.4vw, 7vh), 3.4rem)"
    : "var(--text-display)";
  return (
    <div
      ref={innerRef}
      style={stacked ? { gridArea: "1 / 1" } : undefined}
      className="max-w-[42rem] will-change-[opacity,transform]"
    >
      <StageHead beat={beat} />
      <div className="mb-[var(--space-md)]" style={{ fontSize: headSize }}>
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
          className="font-display font-light leading-[1.08] tracking-[-0.01em] text-[color:var(--color-ink)]/70"
        />
      </div>

      {withManifest ? (
        <>
          {/* mobile: short lead (manifest would crowd portrait) */}
          <p
            className="lg:hidden max-w-[34rem] leading-[1.55]"
            style={{ fontSize: "var(--text-lead)", color: MUTE }}
          >
            {beat.lead}
          </p>
          {/* desktop: the component manifest — the reference's left column */}
          <ManifestList />
        </>
      ) : (
        <p
          className="max-w-[34rem] leading-[1.55]"
          style={{ fontSize: "var(--text-lead)", color: MUTE }}
        >
          {beat.lead}
        </p>
      )}

      <div className="mt-[var(--space-lg)] flex items-end gap-[var(--space-md)] flex-wrap">
        <span
          className="font-display font-bold leading-none flex items-baseline"
          style={{ fontSize: "var(--text-stat)", color: ACCENT }}
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

/* Component manifest — the reference's left column, rendered inside the
   stage-01 block (desktop only; would crowd portrait). Two columns on wide
   viewports so five subsystems read as a compact technical readout. */
function ManifestList() {
  return (
    <ul className="hidden lg:grid grid-cols-2 gap-x-[var(--space-lg)] gap-y-[0.55rem] max-w-[40rem]">
      {MANIFEST.map((m) => (
        <li
          key={m.code}
          className="grid grid-cols-[auto_1fr] gap-x-[var(--space-sm)] items-baseline border-t pt-[0.5rem]"
          style={{ borderColor: RULE }}
        >
          <span className="eyebrow tabular-nums !tracking-[0.14em]" style={{ color: FAINT }}>
            {m.code}
          </span>
          <span className="flex flex-col">
            <span
              className="font-display"
              style={{ fontSize: "0.95rem", color: "var(--color-ink)", lineHeight: 1.2 }}
            >
              {m.label}
            </span>
            <span className="eyebrow !tracking-[0.1em] normal-case mt-[0.1rem]" style={{ color: FAINT }}>
              {m.note}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* Stage rail — 01 · 02 · 03 progress, highlights the active stage. The
   reference's three column headers, distilled to a scrubbable indicator. */
function StageRail({ current }: { current: number }) {
  return (
    <div
      className="hidden md:flex flex-col items-end gap-[var(--space-md)]"
      aria-hidden
    >
      {BEATS.map((b, i) => {
        const on = i === current;
        return (
          <div key={b.stageNo} className="flex items-center gap-[0.6rem]">
            <span
              className="eyebrow tabular-nums !tracking-[0.2em] transition-colors duration-500"
              style={{ color: on ? ACCENT : FAINT, fontSize: on ? "0.8rem" : "0.72rem" }}
            >
              {b.stageNo}
            </span>
            <span
              className="block rounded-full transition-all duration-500"
              style={{
                width: on ? 28 : 14,
                height: 2,
                background: on ? ACCENT : RULE,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* Static hero fallback — no WebGL / reduced-motion. Shows the COMBINED payoff
   (stage 03) over a real photo, then the story stages below it. */
function StaticHero() {
  return (
    <header id="top" className="relative h-[100lvh] overflow-hidden" style={{ background: "var(--color-paper)" }}>
      <Image
        src="/media/home/Hero-AMS.jpeg"
        alt="Advantage Marine Services diver and vessel"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--color-paper) 0%, color-mix(in oklch, var(--color-paper) 55%, transparent) 45%, transparent 72%)",
        }}
      />
      <div className="absolute inset-0 grid items-end" style={{ padding: "clamp(1.5rem,5vw,3.5rem)" }}>
        <BeatBlock beat={BEATS[2]} active />
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
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);

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
        if (process.env.NODE_ENV === "development") {
          (window as unknown as { __amProgress?: number }).__amProgress = self.progress;
        }
      },
    });

    // copy windows — one trapezoid per stage, aligned to the explode schedule
    // (apart ≈0–0.15, intermediate ≈0.40–0.58, combined ≥0.85).
    const windows: [number, number, number, number][] = [
      [-0.1, -0.05, 0.16, 0.30],
      [0.40, 0.48, 0.60, 0.70],
      [0.84, 0.90, 0.99, 1.05],
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
      const cur = p < 0.38 ? 0 : p < 0.7 ? 1 : 2;
      if (cur !== stageRef.current) {
        stageRef.current = cur;
        setStage(cur);
      }
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
        <section className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto" style={{ background: "var(--color-paper)" }}>
          {BEATS.slice(0, 2).map((beat, i) => (
            <BeatBlock key={i} beat={beat} active withManifest={i === 0} />
          ))}
        </section>
      </>
    );
  }

  return (
    <section id="top" ref={sectionRef} className="relative" style={{ height: "340lvh" }}>
      <div className="sticky top-0 h-[100lvh] overflow-hidden" style={{ background: "var(--color-paper)" }}>
        {/* 3D layer */}
        <div className="absolute inset-0">
          {mounted && (
            <CanvasErrorBoundary onError={() => setCanvasFailed(true)}>
              <VesselContactScene onContextLost={() => setCanvasFailed(true)} />
            </CanvasErrorBoundary>
          )}
        </div>

        {/* Light readability wash — subtle cream gradient from bottom so the
            ink copy stays legible where the vessel sits behind it */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 82%, transparent) 0%, transparent 55%)",
          }}
        />
        {/* Mobile + tablet (portrait-ish): stronger cream wash so the eyebrow/
            headline never sit low-contrast on bare hull. Desktop keeps subtle. */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{
            background:
              "linear-gradient(to top, var(--color-paper) 0%, color-mix(in oklch, var(--color-paper) 72%, transparent) 40%, transparent 72%)",
          }}
        />

        {/* stage rail — right edge, vertically centred (md+) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[clamp(1rem,3vw,2.5rem)] pointer-events-none">
          <StageRail current={stage} />
        </div>

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
                withManifest={i === 0}
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
