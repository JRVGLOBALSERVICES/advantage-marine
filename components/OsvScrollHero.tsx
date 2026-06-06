"use client";

/* ──────────────────────────────────────────────────────────────────────────
   OSV SCROLL-FRAME HERO
   A Blender-authored ADVANTAGE offshore support vessel cruising open water
   (gunmetal hull, white superstructure, deck crane, helideck) — the vessel
   rides the swell frame-by-frame as you scroll. Rendered in Cycles from the
   brand-recoloured model (see /blender), exported as an image sequence.

   HOW THE SCRUB IS DONE (matches altida / seagull references):
   The reel is pre-exploded into an IMAGE SEQUENCE and painted to a <canvas>,
   indexed by scroll progress. We do NOT seek video.currentTime on scroll —
   that's the pattern that FREEZES on iOS Safari (programmatic frame-seeks are
   throttled/blocked on iPhone & iPad). Drawing a decoded image to canvas is
   plain raster work, so the scrub is frame-accurate and identical on iOS,
   iPadOS and macOS. This is the Apple-keynote / altida technique.

   iOS-safe pinning: CSS `position: sticky` (NOT ScrollTrigger pin — pin
   re-measures on the iOS URL-bar dvh change and feels stuck). Reduced-motion /
   no-JS falls back to the poster frame + stacked copy.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState } from "@/lib/scroll";
import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import ScrollCue from "./ScrollCue";

gsap.registerPlugin(ScrollTrigger);

/* Per-orientation frame sets — each a REAL edge-to-edge render of the Blender
   cruise for its aspect, not a crop or blur-pad of one master. The portrait sets
   are re-rendered from the same scene with a taller (width-locked) camera so they
   carry more sea + sky, so every viewport gets a frame whose aspect already
   matches it: no side-crop of the vessel, no blurred zoom-pad. */
type FrameSet = { dir: string; count: number; pad: number; fit: "cover" };
const FRAME_SETS: Record<"portraitNarrow" | "portraitWide" | "landscape", FrameSet> = {
  // COVER on every set: the frame fills the viewport edge-to-edge, any aspect
  // overshoot trims only sky/sea. No contain/letterbox → no cream margins. The
  // portrait sets are already composed to ~match phone/tablet aspect, so cover
  // crops almost nothing there; landscape cover removes the desktop letterbox.
  portraitNarrow: { dir: "/frames/osv-9x16", count: 120, pad: 3, fit: "cover" }, // phones (≈9:16 and taller)
  portraitWide: { dir: "/frames/osv-3x4", count: 120, pad: 3, fit: "cover" }, // tablets in portrait (≈3:4)
  landscape: { dir: "/frames/osv", count: 120, pad: 3, fit: "cover" }, // desktop / landscape (16:9)
};
/* Pick by live viewport: landscape → 16:9; portrait phones (narrow) → 9:16;
   portrait tablets (wider, ~0.66–0.9) → 3:4. */
const pickFrameSet = (): FrameSet => {
  if (typeof window === "undefined") return FRAME_SETS.landscape;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w > h) return FRAME_SETS.landscape;
  return w / h < 0.66 ? FRAME_SETS.portraitNarrow : FRAME_SETS.portraitWide;
};
const POSTER = "/media/home/hero-osv-poster.jpg";
/* The reel as durable, indexable content for the VideoObject schema. */
const REEL_URL =
  "https://res.cloudinary.com/de3gn7o77/video/upload/advantage-marine/deliverables/advantage-osv-reel-16x9-4k.mp4";
const framePath = (dir: string, i: number, pad: number) =>
  `${dir}/f-${String(i + 1).padStart(pad, "0")}.webp`;

/* trapezoid 0→1 visibility window */
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

/* Three beats latched to the cruise: vessel underway → read down to the steel →
   cleared by class. Copy is grounded ONLY in lib/content (10+ yrs afloat, the
   4,630 m² Johor yard, 12 class/ISO certs). No invented metrics. */
const BEATS: Beat[] = [
  {
    kicker: "00 — Offshore support, surveyed to class",
    head: ["Built to work", "where the sea won't."],
    lead: "An offshore support vessel earns open water only when the survey behind it holds — hull, propulsion, deck systems. We build that confidence, then prove it underwater.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "01 — Read down to the steel",
    head: ["Every weld,", "every anode."],
    lead: "Before a vessel sails, our divers and NDT teams read what the surface hides — hull plating, welds and cathodic protection — and document each one to class.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    kicker: "02 — Underway, cleared by class",
    head: ["Proven at sea.", "Signed to class."],
    lead: "Systems seated, livery on, underway. The Chasing M2 ROV and our dive teams verify the steel the surface can't see — documented to ISO and class society.",
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
      className="w-[min(34rem,92vw)] will-change-[opacity,transform]"
    >
      {/* frosted-glass card — guaranteed legibility over ANY frame (sky or dark
          sea), with a cyan accent edge. The blur + dark tint give light type a
          stable ground; the ship reads straight through the rest of the frame. */}
      <div
        className="relative overflow-hidden rounded-[1.25rem]"
        style={{
          padding: "clamp(1.25rem, 2.6vw, 2.25rem)",
          background: "color-mix(in oklch, var(--color-ink) 52%, transparent)",
          backdropFilter: "blur(18px) saturate(1.18)",
          WebkitBackdropFilter: "blur(18px) saturate(1.18)",
          border: "1px solid color-mix(in oklch, white 14%, transparent)",
          boxShadow:
            "0 26px 70px -30px oklch(0 0 0 / 0.62), inset 0 1px 0 color-mix(in oklch, white 14%, transparent)",
        }}
      >
        {/* cyan accent edge + glow (the C look) */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: "var(--color-accent)", boxShadow: "0 0 22px 1px var(--color-accent)" }}
        />
        <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">{beat.kicker}</p>
        <div className="mb-[var(--space-sm)]" style={{ fontSize: "var(--text-display)" }}>
          <BlurText
            text={beat.head[0]}
            inView={active}
            animateBy="words"
            className="font-display font-bold leading-[1.06] tracking-[-0.01em] text-[color:var(--color-paper)]"
          />
          <BlurText
            text={beat.head[1]}
            inView={active}
            delay={140}
            animateBy="words"
            className="font-display font-light leading-[1.06] tracking-[-0.01em] text-[color:color-mix(in_oklch,var(--color-paper)_72%,transparent)]"
          />
        </div>
        <p
          className="max-w-[32rem] leading-[1.5]"
          style={{ fontSize: "var(--text-lead)", color: "color-mix(in oklch, var(--color-paper) 82%, transparent)" }}
        >
          {beat.lead}
        </p>
        <div className="mt-[var(--space-md)] flex items-end gap-[var(--space-md)] flex-wrap">
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
            style={{ color: "color-mix(in oklch, var(--color-paper) 70%, transparent)" }}
          >
            {beat.statLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Reduced-motion / no-JS: poster frame + headline, remaining beats stacked. */
function StaticHero() {
  return (
    <>
      <header id="top" className="relative h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        <Image src={POSTER} alt="Advantage Marine offshore support vessel" fill priority sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(125% 95% at 0% 100%, oklch(0.16 0.035 235 / 0.52) 0%, transparent 55%), linear-gradient(to top, oklch(0.15 0.03 235 / 0.42) 0%, transparent 44%)",
          }}
        />
        <div className="absolute inset-0 grid items-end" style={{ padding: "clamp(1.5rem,5vw,3.5rem)" }}>
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

export default function OsvScrollHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef<boolean[]>(BEATS.map(() => false));
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState<boolean[]>(BEATS.map(() => false));

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = r;
    setReduced(r);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || reduced || !sectionRef.current || !canvasRef.current) return;

    /* Per-orientation frame set — each is a REAL Blender render for its aspect
       (the portrait sets re-rendered with a taller width-locked camera), so the
       chosen sequence already matches the live viewport. COVER fills the canvas
       edge-to-edge; any aspect overshoot trims only sky/sea, never the vessel. */
    let seq = pickFrameSet();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    /* Letterbox fill — alpha:false canvas clears to BLACK, so any fit gap must
       be painted with the page paper. Resolve the container's already computed
       background to an rgb() string (works on every browser, unlike a raw oklch
       var in canvas fillStyle). */
    const paperFill =
      getComputedStyle(canvas.parentElement as HTMLElement).backgroundColor || "#ffffff";

    /* ── decode state (re-allocated when the orientation flips the set) ────── */
    let imgs: HTMLImageElement[] = [];
    let loaded: boolean[] = [];
    let firstReady = false;
    let curTarget = 0;
    let curDrawn = -1;

    /* ── canvas sizing (cap DPR at 2) ─────────────────────────────────────── */
    let cssW = 0;
    let cssH = 0;
    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* COVER: scale so the frame fills BOTH axes (Math.max), centred, overflow
       cropped. The vessel always reaches every edge — no cream/black margin on
       any viewport. The paper pre-fill stays only as a 1-frame guard before the
       first decode; cover leaves no visible gap. */
    const draw = (img: HTMLImageElement) => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih || !cssW || !cssH) return;
      ctx.fillStyle = paperFill;
      ctx.fillRect(0, 0, cssW, cssH);
      const scale = Math.max(cssW / iw, cssH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cssW - dw) / 2;
      const dy = (cssH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const nearestLoaded = (t: number) => {
      if (loaded[t]) return t;
      for (let r = 1; r < seq.count; r++) {
        if (t - r >= 0 && loaded[t - r]) return t - r;
        if (t + r < seq.count && loaded[t + r]) return t + r;
      }
      return -1;
    };
    const paint = () => {
      const idx = nearestLoaded(curTarget);
      if (idx < 0 || idx === curDrawn) return;
      draw(imgs[idx]);
      curDrawn = idx;
    };

    /* Decode the current set, coarse-stride first (0,6,12 … then fill) so a fast
       early flick always lands near the target while the rest stream in. */
    const loadSeq = () => {
      imgs = new Array(seq.count);
      loaded = new Array(seq.count).fill(false);
      curDrawn = -1;
      const order: number[] = [];
      const stride = 6;
      for (let s = 0; s < stride; s++) for (let i = s; i < seq.count; i += stride) order.push(i);
      order.forEach((i) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          loaded[i] = true;
          if (!firstReady) {
            firstReady = true;
            window.dispatchEvent(new Event("am:scene-ready"));
          }
          paint();
        };
        img.src = framePath(seq.dir, i, seq.pad);
        imgs[i] = img;
      });
    };

    sizeCanvas();
    loadSeq();

    // poster is already up; signal the loader even if decode is slow
    const readyTimer = window.setTimeout(() => window.dispatchEvent(new Event("am:scene-ready")), 600);

    /* ── scroll → frame index ─────────────────────────────────────────────── */
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
      },
    });

    // Beat windows spread evenly across the continuous cruise (no single hold
    // moment): underway → read the steel → cleared by class.
    const windows: [number, number, number, number][] = [
      [-0.1, -0.05, 0.16, 0.28],
      [0.36, 0.45, 0.56, 0.66],
      [0.74, 0.84, 0.99, 1.06],
    ];

    const tick = () => {
      const p = scrollState.progress;
      curTarget = Math.round(p * (seq.count - 1));
      paint();
      // ── beat opacity / rise ──
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

    const onResize = () => {
      sizeCanvas();
      const next = pickFrameSet();
      if (next.dir !== seq.dir) {
        // orientation flipped into a different aspect → swap to its real set
        seq = next;
        loadSeq();
      } else {
        curDrawn = -1;
      }
      paint();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      st.kill();
      imgs.forEach((img) => {
        if (img) img.onload = null;
      });
    };
  }, [mounted, reduced]);

  if (mounted && reduced) return <StaticHero />;

  return (
    <section id="top" ref={sectionRef} className="relative" style={{ height: "320lvh" }}>
      {/* VideoObject schema — the reel is real indexable content (§ video SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "ADVANTAGE — offshore support vessel, surveyed to class",
            description:
              "An Advantage Marine offshore support vessel underway on open water — hull, superstructure, deck crane and helideck — surveyed by divers and the Chasing M2 ROV and cleared to class.",
            thumbnailUrl: [POSTER],
            uploadDate: "2026-06-06",
            duration: "PT15S",
            contentUrl: REEL_URL,
          }),
        }}
      />
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        {/* poster underlay — instant paint before the first frame decodes */}
        <Image
          src={POSTER}
          alt="Advantage Marine offshore support vessel"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* the reel, scrubbed frame-by-frame on a canvas (iOS-safe) */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* cinematic grounding — a soft dark wash at the base + lower-left so the
           glass card sits on depth (the A+C look), while the upper/right of the
           cruise stays clean and bright. NOT a cream sheet over the ship. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(125% 95% at 0% 100%, oklch(0.16 0.035 235 / 0.52) 0%, transparent 55%), linear-gradient(to top, oklch(0.15 0.03 235 / 0.42) 0%, transparent 44%)",
          }}
        />
        {/* mobile: portrait card overlaps more of the vessel — run the base wash
           a touch stronger/taller for contrast. */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(to top, oklch(0.14 0.03 235 / 0.5) 0%, oklch(0.15 0.03 235 / 0.22) 30%, transparent 60%)",
          }}
        />

        {/* copy layer — three beats stacked, cross-faded on scrub */}
        <div className="absolute inset-0 grid items-end pointer-events-none" style={{ padding: "clamp(1.5rem,4vw,4rem)" }}>
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

        <div className="absolute bottom-[var(--space-md)] right-[clamp(1.5rem,4vw,4rem)]">
          <ScrollCue />
        </div>
      </div>
    </section>
  );
}
