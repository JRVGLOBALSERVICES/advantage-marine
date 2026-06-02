"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/* Branded scene-build loader — holds the frame while the WebGL vessel hydrates.
   Plays the marine footage muted behind the Advantage Marine wordmark + logo,
   then fades to reveal the cream hero. Dismisses on the real `am:scene-ready`
   event dispatched by VesselScene once the GLB is loaded + positioned, with a
   minimum on-screen floor (so it never flashes) and a safety timeout (so a
   stalled GPU / reduced-motion path still clears).  Pattern mirrors seagull's
   SceneBuildLoader, adapted to a video loader per brief. */

const MIN_DISPLAY_MS = 1300; // never flash — give the footage a beat
const SAFETY_DISMISS_MS = 5000; // clears even if scene-ready never fires

export default function SceneBuildLoader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = overlayRef.current;
    const bar = barRef.current;
    const dot = dotRef.current;
    const pct = pctRef.current;
    const logo = logoRef.current;
    const mark = markRef.current;
    if (!overlay) return;

    const startedAt = Date.now();
    let done = false;

    const ctx = gsap.context(() => {
      // intro: logo + wordmark settle in
      if (!reduced && logo && mark) {
        gsap.fromTo(
          [logo, mark],
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }
        );
      }
      // corner status dot pulse
      if (!reduced && dot) {
        gsap.to(dot, {
          scale: 1.6,
          opacity: 0.4,
          duration: 0.7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
      // progress rule creeps to ~88% on a timer; `finish` snaps it to 100%
      if (bar) {
        gsap.set(bar, { scaleX: reduced ? 0.9 : 0.04, transformOrigin: "left center" });
        if (!reduced) {
          gsap.to(bar, {
            scaleX: 0.88,
            duration: SAFETY_DISMISS_MS / 1000,
            ease: "power1.out",
            onUpdate: () => {
              if (pct) {
                const v = Math.round((gsap.getProperty(bar, "scaleX") as number) * 100);
                pct.textContent = `${Math.min(v, 99)}%`;
              }
            },
          });
        }
      }
    }, overlayRef);

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => {
        if (pct) pct.textContent = "100%";
        const out = () => setDismissed(true);
        if (bar) gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
        gsap.to(overlay, {
          opacity: 0,
          scale: 1.015,
          duration: reduced ? 0.4 : 0.6,
          ease: "power2.inOut",
          onComplete: out,
        });
      }, wait);
    };

    const onReady = () => finish();
    window.addEventListener("am:scene-ready", onReady);
    // reduced-motion path renders a static hero (no canvas → no scene-ready),
    // so dismiss on the floor rather than waiting for the safety timeout.
    const safety = window.setTimeout(finish, reduced ? MIN_DISPLAY_MS + 300 : SAFETY_DISMISS_MS);

    return () => {
      window.removeEventListener("am:scene-ready", onReady);
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [mounted]);

  if (!mounted || dismissed) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-ink)]"
      style={{ willChange: "opacity, transform" }}
      aria-hidden="true"
    >
      {/* marine footage, muted + dimmed behind the wordmark */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        src="/video/footer-marine.mp4"
        poster="/video/footer-marine-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* depth wash — keeps the wordmark legible over any frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, transparent 0%, color-mix(in oklch, var(--color-ink) 78%, transparent) 70%, var(--color-ink) 100%)",
        }}
      />

      {/* corner HUD */}
      <span
        ref={dotRef}
        className="absolute left-5 top-5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-2)]"
      />
      <span className="absolute right-5 top-5 font-[family-name:var(--font-inter)] text-[10px] tracking-[0.22em] text-[color:var(--color-accent-ink)]/55">
        PREPARING VESSEL
      </span>

      {/* center: logo + wordmark + tagline */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          src="/brand/advantage-marine-logo-white.png"
          alt="Advantage Marine"
          className="mb-7 h-12 w-auto md:h-14"
          loading="eager"
        />
        <div
          ref={markRef}
          className="font-display font-semibold uppercase leading-[1.1] tracking-[0.18em] text-[color:var(--color-accent-ink)]"
          style={{ fontSize: "clamp(1.5rem, min(5vw, 8vh), 2.75rem)" }}
        >
          Advantage Marine
        </div>
        <p className="mt-3 font-[family-name:var(--font-inter)] text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-accent-ink)]/55">
          In-Water Inspection · NDT · Marine Engineering
        </p>
      </div>

      {/* progress rule */}
      <div className="absolute bottom-12 left-1/2 z-10 w-[min(280px,62vw)] -translate-x-1/2">
        <div className="h-px w-full bg-[color:var(--color-accent-ink)]/15">
          <div ref={barRef} className="h-px w-full bg-[color:var(--color-accent-2)]" />
        </div>
        <div className="mt-3 flex justify-between font-[family-name:var(--font-inter)] text-[10px] tracking-[0.22em] text-[color:var(--color-accent-ink)]/45">
          <span>SCENE BUILD</span>
          <span ref={pctRef}>0%</span>
        </div>
      </div>
    </div>
  );
}
