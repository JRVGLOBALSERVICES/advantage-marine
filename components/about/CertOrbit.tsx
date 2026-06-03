"use client";

/**
 * CertOrbit — the class-society + ISO credentials as a slow orbital constellation.
 *
 * Adapted from a generic "orbiting tech-logo" pattern, but the freelance
 * React/AWS/Docker icon set is exactly the AI-slop this brand must avoid — a
 * marine / offshore NDT specialist orbits the 12 REAL class-society + ISO marks
 * it actually carries (ABS, DNV GL, Bureau Veritas, Lloyd's, ClassNK, ISO 9001/
 * 14001, OHSAS …), pulled from media-manifest.certs — never invented logos.
 *
 * Motion contract (AM design.md + design-3d-stack §3, §11):
 *  - Dotted teal rings rotate slowly; each tile counter-rotates the SAME
 *    duration so the logo stays upright (ring spin cancels at the tile).
 *  - Reduced-motion → no rotation at all, tiles sit in a static radial spread.
 *  - In-view gated AND retriggering: the orbit only spins while on screen and
 *    re-enters paused→running each time it scrolls back (once:false parity with
 *    the rest of the site).
 *
 * Pure-% geometry (radius as % of an aspect-square container) so it scales to
 * the viewport instead of overflowing on mobile — the fan-deck cutoff lesson.
 */

import { useEffect, useRef, useState } from "react";
import type { Cert } from "@/components/about/CertWall";

/** Ring config: [share of tiles, diameter %, seconds/rev, direction]. */
const RINGS: { diameter: number; seconds: number; dir: 1 | -1 }[] = [
  { diameter: 100, seconds: 46, dir: 1 },
  { diameter: 66, seconds: 36, dir: -1 },
  { diameter: 34, seconds: 28, dir: 1 },
];

function stripEntities(s: string): string {
  return s.replace(/&#8217;/g, "’").replace(/&amp;/g, "&");
}

/** Split the certs across the three rings, outer-heaviest. */
function partition(certs: Cert[]): Cert[][] {
  const n = certs.length;
  const inner = Math.max(1, Math.round(n * 0.18));
  const middle = Math.max(2, Math.round(n * 0.34));
  const outer = n - inner - middle;
  return [
    certs.slice(0, outer),
    certs.slice(outer, outer + middle),
    certs.slice(outer + middle),
  ];
}

export function CertOrbit({ certs }: { certs: Cert[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !reduce;
  const rings = partition(certs);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[min(34rem,86vw)]"
      role="img"
      aria-label={`Advantage Marine Services credentials: ${certs
        .map((c) => stripEntities(c.title))
        .join(", ")}`}
    >
      {/* faint radial wash so the constellation reads as one object, not floating tiles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklch, var(--color-accent) 9%, transparent) 0%, transparent 64%)",
        }}
      />

      {RINGS.map((ring, ri) => {
        const tiles = rings[ri] ?? [];
        const count = tiles.length;
        return (
          <div
            key={ri}
            className="absolute left-1/2 top-1/2 rounded-full border border-dotted"
            style={{
              width: `${ring.diameter}%`,
              height: `${ring.diameter}%`,
              transform: "translate(-50%, -50%)",
              borderColor: "color-mix(in oklch, var(--color-accent) 38%, transparent)",
              animation: reduce
                ? undefined
                : `am-orbit-spin ${ring.seconds}s linear infinite ${ring.dir === -1 ? "reverse" : "normal"}`,
              animationPlayState: running ? "running" : "paused",
            }}
          >
            {tiles.map((cert, ti) => {
              const angle = (ti / count) * 360 + ri * 18; // stagger rings so tiles don't align
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 50 * Math.cos(rad);
              const y = 50 + 50 * Math.sin(rad);
              return (
                <div
                  key={cert.slug}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* counter-rotation wrapper — cancels the ring spin so the tile stays upright */}
                  <div
                    style={{
                      animation: reduce
                        ? undefined
                        : `am-orbit-spin-plain ${ring.seconds}s linear infinite ${ring.dir === -1 ? "normal" : "reverse"}`,
                      animationPlayState: running ? "running" : "paused",
                    }}
                  >
                    <div
                      className="group flex items-center justify-center rounded-[calc(var(--radius-card)*0.7)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] shadow-[0_1px_0_color-mix(in_oklch,var(--color-ink)_8%,transparent)] transition-colors duration-500 hover:bg-[color:var(--color-paper-3)]"
                      style={{
                        width: "clamp(3rem, 9vw, 4.75rem)",
                        height: "clamp(3rem, 9vw, 4.75rem)",
                        transitionTimingFunction: "var(--ease-out)",
                      }}
                      title={stripEntities(cert.title)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cert.file}
                        alt={`${stripEntities(cert.title)} mark`}
                        className="max-h-[64%] max-w-[72%] object-contain mix-blend-multiply"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* hub — the AMS node the credentials orbit */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
        <div
          className="flex flex-col items-center justify-center rounded-full text-center"
          style={{
            width: "clamp(4.5rem, 14vw, 7rem)",
            height: "clamp(4.5rem, 14vw, 7rem)",
            background:
              "radial-gradient(circle at 32% 28%, color-mix(in oklch, var(--color-accent) 86%, white) 0%, var(--color-accent) 70%)",
            boxShadow:
              "0 8px 28px color-mix(in oklch, var(--color-accent) 32%, transparent)",
          }}
        >
          <span
            className="font-display leading-none"
            style={{
              fontSize: "clamp(1.25rem, 4vw, 1.9rem)",
              color: "var(--color-paper)",
              letterSpacing: "0.04em",
            }}
          >
            AMS
          </span>
          <span
            className="font-display mt-1"
            style={{
              fontSize: "var(--text-eyebrow)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "color-mix(in oklch, var(--color-paper) 82%, transparent)",
            }}
          >
            Accredited
          </span>
        </div>
      </div>
    </div>
  );
}

export default CertOrbit;
