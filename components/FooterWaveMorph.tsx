"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

/* Ambient morphing horizon line above the footer mega-wordmark. A calm teal
   swell that drifts between four 8-point waveforms (flat tide → swell → ebb →
   ripple). Same point count across all four so MorphSVG maps them 1:1.
   Teal stroke only — it never sits under the type, so the wordmark stays clean.
   Respects prefers-reduced-motion (renders the flat line, no animation). */

const FLAT = "M0,40 L171,40 L342,40 L513,40 L684,40 L855,40 L1026,40 L1200,40";
const SWELL = "M0,40 L171,20 L342,40 L513,60 L684,40 L855,20 L1026,40 L1200,60";
const EBB = "M0,52 L171,44 L342,36 L513,28 L684,36 L855,44 L1026,52 L1200,44";
const RIPPLE = "M0,40 L171,48 L342,32 L513,46 L684,34 L855,48 L1026,32 L1200,40";

export default function FooterWaveMorph() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ repeat: -1, defaults: { duration: 2.2, ease: "sine.inOut" } })
        .to(path, { morphSVG: SWELL })
        .to(path, { morphSVG: EBB })
        .to(path, { morphSVG: RIPPLE })
        .to(path, { morphSVG: FLAT });
    });
    return () => ctx.revert();
  }, []);

  return (
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className="h-10 w-full"
      fill="none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d={FLAT}
        stroke="color-mix(in oklch, var(--color-accent) 70%, transparent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
