"use client";

/**
 * CertOrbit — the class-society + ISO credentials as a slow orbital
 * constellation of TEXT badges (no external logo hotlinks).
 *
 * Rebuilt to the pasted ORBIT layout: a centre node + 3 dotted, counter-
 * rotating rings, with badges spaced evenly around each ring at
 * angle = idx · (2π / perRing), positioned left/top = 50 ± 50·cos/sin(angle)
 * and pulled back to centre with translate(-50%,-50%). The generic
 * React/AWS/Docker icon set from the paste is off-brand for a marine /
 * offshore NDT specialist, so each badge instead carries the SHORT NAME of a
 * real class society / ISO mark the firm actually carries (ABS, DNV GL,
 * Bureau Veritas, Lloyd's Register, ClassNK, ISO 9001/14001, OHSAS …),
 * distributed across the rings from the `certs` prop.
 *
 * AM theme (single light theme — no next-themes anywhere):
 *  - Cream page; rings = dotted teal (var(--color-accent) at low alpha).
 *  - Centre node = teal radial fill with "AMS" in Cinzel.
 *  - Badges = cream pill (var(--color-paper-2)) + var(--color-rule) border,
 *    ink text; teal fill + on-teal text on hover.
 *
 * Motion contract:
 *  - Each ring spins; its badges counter-spin the SAME duration/direction so
 *    the text stays upright (ring spin cancels at the badge inner wrapper).
 *  - prefers-reduced-motion → every ring frozen (no spin at all).
 *  - In-view gated and retriggering (paused → running on each re-entry).
 *
 * Pure-% geometry (radius as % of an aspect-square container) so it scales to
 * the viewport. On narrow screens the diameters shrink and the badge sizing
 * clamps down, so it never overflows a phone.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Cert } from "@/components/about/CertWall";

/** Ring config: [diameter %, seconds/rev, direction]. Outermost first. */
const RINGS: { diameter: number; seconds: number; dir: 1 | -1 }[] = [
  { diameter: 100, seconds: 46, dir: 1 },
  { diameter: 64, seconds: 36, dir: -1 },
  { diameter: 30, seconds: 28, dir: 1 },
];

/** Render Lloyd's apostrophe + ampersand entities cleanly. */
function stripEntities(s: string): string {
  return s.replace(/&#8217;/g, "’").replace(/&amp;/g, "&");
}

/**
 * A short, upright-readable badge label for each credential. The Cert type
 * only carries { slug, title, file }, so map the known marine class-society /
 * ISO slugs to their conventional abbreviation; fall back to the title.
 */
const ABBR: Record<string, string> = {
  abs: "ABS",
  "dnv-gl": "DNV GL",
  "bureau-veritas": "BV",
  "lloyds-register": "LR",
  "class-nk": "ClassNK",
  "china-register": "CCS",
  "ir-class": "IRS",
  "kr-register": "KR",
  rina: "RINA",
  "iso-9001": "ISO 9001",
  "iso-14001": "ISO 14001",
  ohsas: "OHSAS",
};

function badgeLabel(cert: Cert): string {
  return ABBR[cert.slug] ?? stripEntities(cert.title);
}

/** Split the certs across the three rings, outer-heaviest. */
function partition(certs: Cert[]): Cert[][] {
  const n = certs.length;
  const inner = Math.max(1, Math.round(n * 0.18));
  const middle = Math.max(2, Math.round(n * 0.34));
  const outer = Math.max(0, n - inner - middle);
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
      {/* faint radial wash so the constellation reads as one object */}
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
        const count = Math.max(tiles.length, 1);
        return (
          <div
            key={ri}
            className="absolute left-1/2 top-1/2 rounded-full border-2 border-dotted"
            style={{
              width: `${ring.diameter}%`,
              height: `${ring.diameter}%`,
              transform: "translate(-50%, -50%)",
              borderColor:
                "color-mix(in oklch, var(--color-accent) 34%, transparent)",
              animation: reduce
                ? undefined
                : `am-orbit-spin ${ring.seconds}s linear infinite ${
                    ring.dir === -1 ? "reverse" : "normal"
                  }`,
              animationPlayState: running ? "running" : "paused",
            }}
          >
            {tiles.map((cert, ti) => {
              // angle = idx · (2π / perRing); ring stagger so tiles don't align
              const angle = (ti / count) * 360 + ri * 18;
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
                  {/* counter-rotation wrapper — cancels the ring spin so the
                      badge text stays upright */}
                  <div
                    style={{
                      animation: reduce
                        ? undefined
                        : `am-orbit-spin-plain ${ring.seconds}s linear infinite ${
                            ring.dir === -1 ? "normal" : "reverse"
                          }`,
                      animationPlayState: running ? "running" : "paused",
                    }}
                  >
                    <span
                      className={cn(
                        "group inline-flex select-none items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border font-display",
                        "border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] text-[color:var(--color-ink)]",
                        "transition-colors duration-300 hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-accent-ink)]",
                      )}
                      style={{
                        padding: "clamp(0.3rem, 1.2vw, 0.5rem) clamp(0.6rem, 2vw, 0.95rem)",
                        fontSize: "clamp(0.62rem, 1.7vw, 0.82rem)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        lineHeight: 1,
                        transitionTimingFunction: "var(--ease-out)",
                        boxShadow:
                          "0 1px 0 color-mix(in oklch, var(--color-ink) 8%, transparent)",
                      }}
                      title={stripEntities(cert.title)}
                    >
                      {badgeLabel(cert)}
                    </span>
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
