"use client";

/* ──────────────────────────────────────────────────────────────────────────
   OSV SCROLL-FRAME HERO
   The client's own concept reel (the ADVANTAGE offshore support vessel —
   orbit → exploded view with callouts → reassemble → blue/yellow livery
   reveal → sail-away) driven frame-by-frame by scroll.

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

/* Per-orientation frame sets — each a REAL edge-to-edge composition of the same
   15.04s reel, not a crop or blur-pad of the 16:9 master. The portrait sets come
   from a Higgsfield GENERATIVE REFRAME of the 4K master that outpaints the canvas
   vertically with real sea + sky (the iPad 3:4 set is cropped from that same clean
   9:16 render). So every viewport gets a frame whose aspect already matches it:
   no side-crop of the exploded modules (the earlier "cropped on mobile" defect),
   no blurred zoom-pad (the earlier "blurry on mobile" defect). Fit-to-width keeps
   the full vessel width on screen; any vertical overshoot trims only sky/sea. */
type FrameSet = { dir: string; count: number; pad: number; fit: "width" | "contain" };
const FRAME_SETS: Record<"portraitNarrow" | "portraitWide" | "landscape", FrameSet> = {
  portraitNarrow: { dir: "/frames/osv-9x16", count: 120, pad: 3, fit: "width" }, // phones (≈9:16 and taller)
  portraitWide: { dir: "/frames/osv-3x4", count: 120, pad: 3, fit: "width" }, // tablets in portrait (≈3:4)
  landscape: { dir: "/frames/osv", count: 120, pad: 3, fit: "contain" }, // desktop / landscape (16:9)
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
const MUTE = "color-mix(in oklch, var(--color-ink) 66%, transparent)";

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

/* Three acts latched to the reel: assembled vessel → exploded survey →
   reassembled-and-cleared. Copy is grounded ONLY in lib/content (10+ yrs
   afloat, the 4,630 m² Johor yard, 12 class/ISO certs). No invented metrics. */
const BEATS: Beat[] = [
  {
    kicker: "00 — Offshore support, surveyed to class",
    head: ["Built to work", "where the sea won't."],
    lead: "An offshore support vessel is only as sound as the survey behind it — hull, propulsion, deck systems. We build that confidence, then verify every part of it underwater.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "01 — Taken apart, system by system",
    head: ["Every part", "accounted for."],
    lead: "Pulled to its last module — hull, superstructure, azimuth thrusters, deck crane. Every system is a point we read and document to class before the vessel sails.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    kicker: "02 — Reassembled, then proven",
    head: ["Vessel complete.", "Cleared by class."],
    lead: "Systems seated, livery on, underway. Our divers and the Chasing M2 ROV read the welds, the cathodic protection and the steel the surface can't see — documented to ISO and class society.",
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
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.08] tracking-[-0.01em] text-[color:color-mix(in_oklch,var(--color-ink)_74%,transparent)]"
        />
      </div>
      <p className="max-w-[34rem] leading-[1.55]" style={{ fontSize: "var(--text-lead)", color: MUTE }}>
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
        <span className="eyebrow pb-2 max-w-[14rem] !tracking-[0.18em] normal-case" style={{ color: MUTE }}>
          {beat.statLabel}
        </span>
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
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 92%, transparent) 0%, color-mix(in oklch, var(--color-paper) 30%, transparent) 42%, transparent 70%)",
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

    /* Per-orientation frame set — each is a REAL composition for its aspect (a
       Higgsfield generative reframe of the 4K master for the portrait sets), so
       the chosen sequence already matches the live viewport. Fit-to-WIDTH keeps
       the full vessel width on screen on portrait (no side-crop of the exploded
       modules) with only a thin paper margin top/bottom; landscape contains. */
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

    /* Fit-to-WIDTH (portrait sets) fills the screen width and centres the band —
       only a thin sky/sea margin is letterboxed with paper, the full vessel is
       always shown. CONTAIN (landscape) never crops either. Both fill any gap
       with the page paper so nothing is ever black or cut off. */
    const draw = (img: HTMLImageElement) => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih || !cssW || !cssH) return;
      ctx.fillStyle = paperFill;
      ctx.fillRect(0, 0, cssW, cssH);
      const scale = seq.fit === "contain" ? Math.min(cssW / iw, cssH / ih) : cssW / iw;
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

    // Beat windows tuned to the reel: 0 over the assembled vessel, 1 over the
    // exploded-survey hold, 2 over the livery reveal + sail-away.
    const windows: [number, number, number, number][] = [
      [-0.1, -0.05, 0.12, 0.22],
      [0.34, 0.42, 0.56, 0.66],
      [0.82, 0.9, 0.99, 1.06],
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
              "Exploded-view walkthrough of an Advantage Marine offshore support vessel: hull, superstructure, azimuth thrusters and deck systems, reassembled and cleared to class.",
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

        {/* readability wash — cream, anchored bottom-left for the copy */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 82%, transparent) 0%, transparent 52%)",
          }}
        />
        {/* mobile: stronger scrim — portrait fills the frame and copy overlaps the vessel */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 94%, transparent) 0%, color-mix(in oklch, var(--color-paper) 64%, transparent) 40%, transparent 72%)",
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
