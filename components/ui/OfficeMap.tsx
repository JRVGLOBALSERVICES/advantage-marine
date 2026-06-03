"use client";

// OfficeMap — a real interactive MapLibre GL basemap framing Advantage Marine's
// three Malaysian offices. Replaces the decorative dotted WorldMap on the
// GlobalReach section. Single LIGHT theme: Carto Positron basemap matches the
// cream brand. Self-contained — no next-themes, no theme detection.
//
// SSR-safe: null-renders until mounted, inits maplibre against a ref div in an
// effect, and cleans up map.remove() on unmount. Calm interaction — rotation
// disabled, scroll-zoom kept but gentle. This is a credibility element.

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const POSITRON =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type Office = {
  name: string;
  region: string;
  lngLat: [number, number];
  hq?: boolean;
};

// Advantage Marine's three REAL Malaysian offices (no Singapore — the old
// dotted map arced to a non-existent SG office).
const OFFICES: Office[] = [
  { name: "Johor Bahru", region: "Headquarters", lngLat: [103.7578, 1.4655], hq: true },
  { name: "Kuala Lumpur", region: "Peninsular Malaysia", lngLat: [101.6869, 3.139] },
  { name: "Miri", region: "Sarawak", lngLat: [113.9914, 4.3995] },
];

// AM tokens read off the document root so the markers stay in lockstep with the
// brand palette (var(--color-accent) etc.) without hard-coding hexes here.
function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function buildMarkerEl(office: Office, accent: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "am-office-marker";
  wrap.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:8px",
    "cursor:default",
    "transform:translateY(-2px)",
    "-webkit-font-smoothing:antialiased",
  ].join(";");

  // dot + soft ring
  const dotSize = office.hq ? 16 : 12;
  const dot = document.createElement("span");
  dot.style.cssText = [
    "position:relative",
    "flex:0 0 auto",
    `width:${dotSize}px`,
    `height:${dotSize}px`,
    "border-radius:999px",
    `background:${accent}`,
    "box-shadow:0 0 0 4px color-mix(in oklch, " + accent + " 26%, transparent), 0 1px 3px rgba(0,0,0,0.22)",
    office.hq ? "outline:2px solid var(--color-accent-ink, #fff)" : "",
    office.hq ? "outline-offset:1px" : "",
  ].join(";");

  // soft expanding ring on HQ only (subtle, respects reduced-motion via CSS)
  if (office.hq) {
    const ring = document.createElement("span");
    ring.className = "am-office-ring";
    ring.style.cssText = [
      "position:absolute",
      "inset:0",
      "border-radius:999px",
      `border:2px solid ${accent}`,
      "opacity:0.55",
    ].join(";");
    dot.appendChild(ring);
  }

  // label — Cinzel display, cream chip
  const label = document.createElement("span");
  label.textContent = office.name;
  label.className = "font-display";
  label.style.cssText = [
    "font-family:var(--font-display, Georgia, serif)",
    "font-weight:600",
    `font-size:${office.hq ? "0.92rem" : "0.82rem"}`,
    "letter-spacing:0.04em",
    "line-height:1",
    "white-space:nowrap",
    "padding:5px 9px",
    "border-radius:8px",
    "background:var(--color-paper-2, #FAF4E8)",
    "color:var(--color-ink, #15302e)",
    "border:1px solid var(--color-rule, #DDD2BC)",
    "box-shadow:0 2px 8px rgba(20,40,38,0.10)",
  ].join(";");

  wrap.appendChild(dot);
  wrap.appendChild(label);
  return wrap;
}

export default function OfficeMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !ref.current || mapRef.current) return;

    const accent = token("--color-accent", "#30837b");

    const map = new maplibregl.Map({
      container: ref.current,
      style: POSITRON,
      center: [108, 3], // rough Peninsular+East MY midpoint; fitBounds overrides on load
      zoom: 4.4,
      minZoom: 3,
      maxZoom: 11,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      // calm: no rotation/pitch playground
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    mapRef.current = map;

    // disable rotation gestures fully (keyboard + touch-rotate)
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    // gentle zoom controls (no compass/rotate)
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right"
    );

    OFFICES.forEach((office) => {
      const el = buildMarkerEl(office, accent);
      new maplibregl.Marker({ element: el, anchor: "left" })
        .setLngLat(office.lngLat)
        .addTo(map);
    });

    map.on("load", () => {
      const bounds = new maplibregl.LngLatBounds();
      OFFICES.forEach((o) => bounds.extend(o.lngLat));
      map.fitBounds(bounds, {
        padding: { top: 80, right: 140, bottom: 70, left: 70 },
        maxZoom: 7.5,
        duration: 0, // settle silently; no fly-in animation on credibility element
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* scoped chrome: tint maplibre controls to AM cream/teal, no shadcn tokens */}
      <style jsx global>{`
        .am-office-map .maplibregl-ctrl-group {
          background: var(--color-paper-2);
          border: 1px solid var(--color-rule);
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(20, 40, 38, 0.12);
          overflow: hidden;
        }
        .am-office-map .maplibregl-ctrl-group button {
          background: var(--color-paper-2);
        }
        .am-office-map .maplibregl-ctrl-group button:hover {
          background: var(--color-paper-3);
        }
        .am-office-map .maplibregl-ctrl-group button + button {
          border-top: 1px solid var(--color-rule);
        }
        .am-office-map .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
          filter: none;
        }
        .am-office-map .maplibregl-ctrl-attrib {
          background: color-mix(in oklch, var(--color-paper-2) 88%, transparent);
          color: color-mix(in oklch, var(--color-ink) 70%, transparent);
          font-family: var(--font-body);
        }
        .am-office-map .maplibregl-ctrl-attrib a {
          color: var(--color-accent);
        }
        .am-office-ring {
          animation: am-office-pulse 2.6s var(--ease-out, ease-out) infinite;
        }
        @keyframes am-office-pulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .am-office-ring { animation: none; opacity: 0.4; }
        }
      `}</style>
      <div ref={ref} className="am-office-map h-full w-full" aria-label="Advantage Marine office locations across Malaysia" role="img" />
    </>
  );
}
