"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Footer video band — a full-bleed cinematic marine clip (Higgsfield seedance,
 * offshore vessels on teal sea at golden hour) with the ADVANTAGE MARINE
 * wordmark overlaid. Autoplays muted + looped; respects prefers-reduced-motion
 * by showing the poster still instead. Bottom edge dissolves into the cream
 * footer (paper-2) so there's no hard seam — no dark UI surface, just a media
 * band that hands off to the footer content below it.
 */
export default function FooterVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    // some mobile browsers need an explicit play() after hydration
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [reduced]);

  return (
    <div className="relative w-full overflow-hidden h-[clamp(300px,46vh,520px)]">
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/video/footer-marine-poster.jpg"
          alt="Offshore support vessels on calm sea at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/video/footer-marine.mp4"
          poster="/video/footer-marine-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      )}

      {/* wordmark — its own soft halo carries legibility now the dark wash is gone */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ textShadow: "0 2px 18px rgba(8,26,24,0.55), 0 1px 3px rgba(8,26,24,0.4)" }}
      >
        <p
          className="mb-3 font-semibold uppercase text-white/80"
          style={{ fontSize: "clamp(0.62rem,1.4vw,0.74rem)", letterSpacing: "0.34em" }}
        >
          In-water Marine &amp; Offshore Services
        </p>
        <h2
          className="font-display font-bold leading-[1.05] text-white"
          style={{
            fontSize: "clamp(2.4rem, min(8vw,12.8vh), 6.5rem)",
            letterSpacing: "0.02em",
            textShadow: "0 2px 30px rgba(10,30,28,0.45)",
          }}
        >
          ADVANTAGE MARINE
        </h2>
        <div
          aria-hidden
          className="mt-5 h-px w-[clamp(60px,12vw,140px)]"
          style={{ background: "var(--color-accent)" }}
        />
        <p
          className="mt-4 font-semibold uppercase text-white/75"
          style={{ fontSize: "clamp(0.6rem,1.2vw,0.72rem)", letterSpacing: "0.28em" }}
        >
          advantagemarine.com.my
        </p>
      </div>
    </div>
  );
}
