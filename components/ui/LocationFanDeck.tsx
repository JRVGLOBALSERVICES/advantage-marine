"use client";

// LocationFanDeck — the three Advantage Marine offices as a fanned, advancing
// card deck for the dark GlobalReach section (replaces the single OfficeMap).
//
// Each card carries a REAL dark-basemap map tile of that city (Carto dark_all
// retina raster — same provider as the live OfficeMap, no API key, no paid
// asset), a cyan location pin over it, then the region tag + office name
// (Cinzel) + street address + role note. No stock imagery, no fabricated copy.
//
// Motion mirrors the FanCardDeck pattern: a bounded back-stack (small offsets,
// so it never overflows the viewport — the fan-deck mobile-overflow lesson),
// top card advances on click/tap or a hover-pausing autoplay timer. Respects
// prefers-reduced-motion. Single accent: cyan. Self-contained, SSR-safe.

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export type OfficeLocation = {
  name: string;
  region: string;
  lngLat: [number, number];
  lines: string[];
  note: string;
  hq?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

// Web-Mercator lng/lat → XYZ tile indices (exact, computed — not hand-picked).
function lngLatToTile(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

// Carto dark-matter raster, retina (@2x = 512px) — free, keyless, same brand
// basemap family as the interactive OfficeMap. City-level zoom so each office's
// city reads.
function tileUrl(lngLat: [number, number], z = 11) {
  const { x, y } = lngLatToTile(lngLat[0], lngLat[1], z);
  return `https://basemaps.cartocdn.com/rastertiles/dark_all/${z}/${x}/${y}@2x.png`;
}

export default function LocationFanDeck({
  offices,
  interval = 5200,
}: {
  offices: OfficeLocation[];
  interval?: number;
}) {
  const [cards, setCards] = useState<OfficeLocation[]>(offices);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const advance = () =>
    setCards((prev) => {
      if (prev.length < 2) return prev;
      const next = [...prev];
      next.push(next.shift()!); // front → back
      return next;
    });

  useEffect(() => setCards(offices), [offices]);

  useEffect(() => {
    if (paused || cards.length < 2) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    timer.current = setInterval(advance, interval);
    return () => clearInterval(timer.current);
  }, [paused, cards.length, interval]);

  return (
    <div
      className="relative mx-auto h-[clamp(22rem,52vh,28rem)] w-full max-w-[min(36rem,90vw)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ perspective: 1400 }}
    >
      {cards.map((office, index) => {
        const isTop = index === 0;
        // bounded back-stack: small, viewport-safe offsets (no wide fan)
        const depth = Math.min(index, 3);
        return (
          <motion.button
            type="button"
            key={office.name}
            aria-label={`${office.name} office — tap for next`}
            aria-hidden={!isTop}
            tabIndex={isTop ? 0 : -1}
            disabled={!isTop}
            onClick={() => isTop && advance()}
            className="absolute inset-0 mx-auto flex flex-col overflow-hidden rounded-[var(--radius-card,1rem)] text-left"
            style={{
              transformOrigin: "top center",
              cursor: isTop ? "pointer" : "default",
              background:
                "linear-gradient(180deg, color-mix(in oklch, var(--color-ink,#0c1622) 92%, transparent), color-mix(in oklch, var(--color-ink,#0c1622) 98%, transparent))",
              border:
                "1px solid color-mix(in oklch, var(--color-cyan,#22eeff) 22%, transparent)",
              boxShadow: isTop
                ? "0 24px 60px -20px color-mix(in oklch, var(--color-cyan,#22eeff) 26%, transparent), 0 2px 0 color-mix(in oklch, var(--color-cyan,#22eeff) 10%, transparent) inset"
                : "0 18px 40px -24px rgba(0,0,0,0.7)",
              zIndex: cards.length - index,
            }}
            animate={{
              top: depth * 14,
              scale: 1 - depth * 0.045,
              rotateZ: isTop ? 0 : (index % 2 === 0 ? 1 : -1) * depth * 1.2,
              opacity: depth > 2 ? 0 : 1,
              filter: isTop ? "saturate(1)" : "saturate(0.7) brightness(0.82)",
            }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {/* map tile — real Carto dark basemap of the office city */}
            <div className="relative h-[54%] w-full overflow-hidden">
              <img
                src={tileUrl(office.lngLat)}
                alt={`Map of ${office.name}, Malaysia`}
                className="h-full w-full object-cover opacity-70"
                loading={isTop ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
              {/* navy wash to seat the tile in the section + lift the pin */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 90% at 50% 40%, transparent 30%, color-mix(in oklch, var(--color-ink,#0c1622) 70%, transparent) 100%), linear-gradient(180deg, transparent 40%, color-mix(in oklch, var(--color-ink,#0c1622) 96%, transparent) 100%)",
                }}
              />
              {/* cyan office pin, centred, pulsing ring on HQ */}
              <span
                className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
                aria-hidden
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: office.hq ? 16 : 12,
                    height: office.hq ? 16 : 12,
                    background: "var(--color-cyan,#22eeff)",
                    boxShadow:
                      "0 0 0 5px color-mix(in oklch, var(--color-cyan,#22eeff) 22%, transparent), 0 0 18px color-mix(in oklch, var(--color-cyan,#22eeff) 60%, transparent)",
                  }}
                />
                {office.hq && (
                  <span
                    className="lfd-ring absolute inset-0 rounded-full"
                    style={{
                      border: "2px solid var(--color-cyan,#22eeff)",
                      opacity: 0.55,
                    }}
                  />
                )}
              </span>
              {/* HQ / branch chip, top-left */}
              <span
                className="eyebrow absolute left-4 top-4 rounded-full px-3 py-1"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-ink,#0c1622) 70%, transparent)",
                  border:
                    "1px solid color-mix(in oklch, var(--color-cyan,#22eeff) 30%, transparent)",
                  color: "var(--color-cyan-hi, var(--color-cyan,#22eeff))",
                }}
              >
                {office.hq ? "Headquarters" : "Branch"}
              </span>
            </div>

            {/* details */}
            <div className="flex flex-1 flex-col justify-between gap-3 px-5 py-4 md:px-6 md:py-5">
              <div>
                <p
                  className="eyebrow"
                  style={{ color: "var(--color-cyan,#22eeff)" }}
                >
                  {office.region}
                </p>
                <h3
                  className="font-display mt-1.5 leading-[1.12] text-white"
                  style={{ fontSize: "var(--text-h3,1.5rem)" }}
                >
                  {office.name}
                </h3>
                <address className="mt-2 not-italic leading-[1.5] text-[color:var(--color-mute,#9fb0c0)]">
                  {office.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </div>
              <p className="text-[color:color-mix(in_oklch,white_72%,transparent)] leading-[1.4]">
                {office.note}
              </p>
            </div>
          </motion.button>
        );
      })}

      {/* progress dots */}
      <div className="pointer-events-none absolute -bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
        {offices.map((o) => {
          const active = cards[0]?.name === o.name;
          return (
            <span
              key={o.name}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: active ? 22 : 6,
                background: active
                  ? "var(--color-cyan,#22eeff)"
                  : "color-mix(in oklch, var(--color-cyan,#22eeff) 30%, transparent)",
              }}
            />
          );
        })}
      </div>

      <style jsx global>{`
        .lfd-ring {
          animation: lfd-pulse 2.6s ease-out infinite;
        }
        @keyframes lfd-pulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lfd-ring { animation: none; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
