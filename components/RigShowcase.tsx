"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState, sceneState } from "@/lib/scroll";
import { WordReveal } from "@/components/ui/WordReveal";

gsap.registerPlugin(ScrollTrigger);

const RigContactScene = dynamic(() => import("./RigContactScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <span className="eyebrow animate-pulse text-[color:var(--color-accent)]">
        Assembling rig…
      </span>
    </div>
  ),
});

const EASE = [0.22, 1, 0.36, 1] as const;
const MUTED = "color-mix(in oklch, var(--color-ink) 66%, transparent)";
const FAINT = "color-mix(in oklch, var(--color-ink) 50%, transparent)";

/* real in-water photo — reduced-motion / no-WebGL fallback (no fabricated render) */
const POSTER = "/media/service_diving/bluestream-offshore-1920-2-1.1920x0.jpg";

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

/* ──────────────────────────────────────────────────────────────────────────
   RIG SHOWCASE — contact-page band.

   The jack-up rig GLB explode→assembles as the band is scrolled: a tall
   section with a sticky 100lvh stage; GSAP ScrollTrigger maps section scroll
   → scrollState.progress (0 exploded → 0.6 assembled → 1 orbit/tag reveal),
   which RigContactScene reads inside useFrame. Synced through the same
   Lenis-driven ticker the rest of the site uses (RigHero pattern).

   Sits in the AM cream system — the rig reads as dark steel on warm
   sailcloth, copy is ink (NOT the retired platform band's warm-white on dark).
   ────────────────────────────────────────────────────────────────────────── */
export default function RigShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = reduced;
    // 400 KB single-mesh GLB is light enough to render on every viewport that
    // has WebGL; reduced-motion / no-WebGL get the real photo poster.
    setUseCanvas(!reduced && hasWebGL());
    setMounted(true);
  }, []);

  // lazy-mount the WebGL context near the viewport; pause the loop when away.
  useEffect(() => {
    if (!useCanvas || canvasFailed || !sectionRef.current) return;
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasEntered(true);
        setActive(entry.isIntersecting);
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useCanvas, canvasFailed]);

  // drive scrollState.progress off the band's scroll (the scene reads it in useFrame)
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
    return () => {
      st.kill();
      sceneState.invalidate = null;
    };
  }, [mounted, useCanvas, canvasFailed]);

  /* reduced-motion / no-WebGL / context-lost: real photo + the same copy */
  if (mounted && (!useCanvas || canvasFailed)) {
    return (
      <section
        aria-label="The rigs and structures Advantage Marine services"
        className="relative isolate overflow-hidden border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper)]"
      >
        <div className="relative h-[clamp(34rem,86lvh,52rem)] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER}
            alt="Advantage Marine commercial diver on an in-water hull survey"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, var(--color-paper) 0%, color-mix(in oklch, var(--color-paper) 72%, transparent) 36%, transparent 66%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2rem,6vh,4rem)]">
              <Copy reduce />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* default: sticky-scroll rig assembly band */
  return (
    <section
      ref={sectionRef}
      aria-label="The rigs and structures Advantage Marine services"
      className="relative"
      style={{ height: "220lvh" }}
    >
      <div className="sticky top-0 h-[100lvh] overflow-hidden border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
        <div className="absolute inset-0">
          {hasEntered && (
            <RigContactScene
              active={active}
              onContextLost={() => setCanvasFailed(true)}
            />
          )}
        </div>

        {/* cream readability wash — copy bottom-left, rig breathing room right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 80%, transparent) 0%, transparent 52%)",
          }}
        />
        {/* mobile: stronger scrim so copy stays legible when the hull fills frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-paper) 92%, transparent) 0%, color-mix(in oklch, var(--color-paper) 56%, transparent) 40%, transparent 72%)",
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2.5rem,7vh,5rem)]">
            <Copy />
          </div>
        </div>
      </div>
    </section>
  );
}

function Copy({ reduce }: { reduce?: boolean }) {
  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: "120px" },
      };
  return (
    <>
      <motion.p
        className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]"
        {...fade}
        transition={{ duration: 0.7, ease: EASE }}
      >
        The structures we work on
      </motion.p>
      <h2
        className="font-display max-w-[18ch] leading-[1.08] text-[color:var(--color-ink)]"
        style={{ fontSize: "var(--text-h2)" }}
      >
        <WordReveal text="Surveyed afloat, joint by joint." />
      </h2>
      <motion.p
        className="mt-[var(--space-md)] max-w-[46ch] font-body leading-[1.55]"
        style={{ fontSize: "var(--text-lead)", color: MUTED }}
        {...fade}
        transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
      >
        From hull plate to topside steel, our divers and ROV crews assemble the
        full integrity picture in the water — keeping the asset on station while
        the survey, cleaning and repair get done.
      </motion.p>
      <motion.p
        className="mt-[var(--space-md)] eyebrow !tracking-[0.2em] normal-case"
        style={{ color: FAINT }}
        {...fade}
        transition={{ duration: 0.8, ease: EASE, delay: 0.22 }}
      >
        {reduce ? "In-water structural survey" : "Live 3D · scroll to explode the rig"}
      </motion.p>
    </>
  );
}
