"use client";

/* ──────────────────────────────────────────────────────────────────────────
   OSV VIDEO-SCRUB HERO
   The client's own concept reel (the ADVANTAGE offshore support vessel —
   orbit → exploded view with callouts → reassemble → blue/yellow livery
   reveal → sail-away) driven frame-by-frame by scroll. This is the literal
   reference animation, scrubbed Apple-keynote style: video.currentTime is a
   function of scroll progress, never autoplayed.

   Why a scrubbed <video> and not the R3F rebuild: the reel already IS the hero
   moment, at a fidelity primitives can't reach. Scrubbing it is lighter than a
   WebGL scene and looks exactly like the concept because it is the concept.

   iOS-safe: CSS `position: sticky` (NOT ScrollTrigger pin — pin re-measures on
   the iOS URL-bar dvh change and feels stuck). Reduced-motion / no-JS falls
   back to the poster frame + stacked copy.
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

/* Same 15.04s reel, two crops: 16:9 master for desktop, a 9:16 blurred-pad cut
   for portrait phones so the vessel fills the frame instead of being letter-
   boxed. Both are identical-duration, so the scroll→currentTime math is shared. */
const VIDEO_SRC_16x9 = "/video/hero-osv-scrub.mp4";
const VIDEO_SRC_9x16 = "/video/hero-osv-scrub-9x16.mp4";
const POSTER = "/media/home/hero-osv-poster.jpg";
const MUTE = "color-mix(in oklch, var(--color-ink) 66%, transparent)";

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

export default function OsvVideoHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef<boolean[]>(BEATS.map(() => false));
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [src, setSrc] = useState(VIDEO_SRC_16x9);
  const [active, setActive] = useState<boolean[]>(BEATS.map(() => false));

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = r;
    setReduced(r);
    // portrait phones get the 9:16 cut; everything wider keeps the 16:9 master
    setSrc(window.matchMedia("(max-width: 640px)").matches ? VIDEO_SRC_9x16 : VIDEO_SRC_16x9);
    setMounted(true);

    // dismiss SceneBuildLoader the moment the hero is paint-ready. The poster
    // covers the frame instantly, so signal as soon as we mount (and again when
    // the video can play, whichever the loader catches first). Once-guarded.
    let fired = false;
    const ready = () => {
      if (fired) return;
      fired = true;
      window.dispatchEvent(new Event("am:scene-ready"));
    };
    const v = videoRef.current;
    if (v) {
      if (v.readyState >= 2) ready();
      else v.addEventListener("loadeddata", ready, { once: true });
    }
    const t = window.setTimeout(ready, 400); // poster is up regardless
    return () => {
      window.clearTimeout(t);
      v?.removeEventListener("loadeddata", ready);
    };
  }, []);

  useEffect(() => {
    if (!mounted || reduced || !sectionRef.current) return;
    const video = videoRef.current;

    // iOS unlock: a muted play()→pause() round-trip lets us seek currentTime
    // smoothly afterwards (Safari blocks programmatic seeks on an untouched el).
    const unlock = () => {
      if (!video) return;
      video.play().then(() => video.pause()).catch(() => {});
    };
    if (video) {
      if (video.readyState >= 1) unlock();
      else video.addEventListener("loadedmetadata", unlock, { once: true });
    }

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
      // ── scrub the video: ease currentTime toward the scroll target so a
      // fast flick doesn't thrash the decoder; dense keyframes keep it crisp ──
      if (video && video.duration) {
        const target = p * (video.duration - 0.05);
        const next = video.currentTime + (target - video.currentTime) * 0.22;
        if (Math.abs(next - video.currentTime) > 0.004) video.currentTime = next;
      }
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

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
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
            contentUrl: VIDEO_SRC_16x9,
          }),
        }}
      />
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        {/* the reel, full-bleed; currentTime driven by scroll */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={POSTER}
          muted
          playsInline
          preload="auto"
        />

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
