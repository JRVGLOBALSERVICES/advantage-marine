"use client";

// Centered static slippy-map composed from Carto Voyager raster tiles (keyless, no API key).
// The previous approach used ONE tile picked by the office's coordinate — but an office can
// fall at the very edge of a tile, leaving the card showing 90% empty ocean (the "blank map"
// bug, e.g. Miri). This composes the minimal grid of 256px tiles needed to fill the viewport
// and offsets them by sub-tile pixels, so the marker sits dead-centre on the office every time.
// Same Carto Voyager basemap the deck already used — real, keyless imagery, just centred.

import React from "react";

const TILE = 256;
// logical canvas; @2x retina tiles keep it crisp. Oversized vs the card box so it always covers.
const W = 640;
const H = 460;

/** fractional global tile coords (Web-Mercator) for a lng/lat at zoom z */
function project(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const y =
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  return { x, y };
}

export function StaticTileMap({
  lng,
  lat,
  zoom = 14,
  label,
}: {
  lng: number;
  lat: number;
  zoom?: number;
  label?: string;
}) {
  const { x, y } = project(lng, lat, zoom);
  const centerPxX = x * TILE;
  const centerPxY = y * TILE;
  // world-pixel of the canvas top-left, so the office lands at (W/2, H/2)
  const originX = centerPxX - W / 2;
  const originY = centerPxY - H / 2;

  const x0 = Math.floor(originX / TILE);
  const x1 = Math.floor((originX + W) / TILE);
  const y0 = Math.floor(originY / TILE);
  const y1 = Math.floor((originY + H) / TILE);

  const tiles: { tx: number; ty: number; left: number; top: number }[] = [];
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      tiles.push({
        tx,
        ty,
        left: tx * TILE - originX,
        top: ty * TILE - originY,
      });
    }
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--color-paper-2)" }}
      role="img"
      aria-label={label ? `Map of ${label}` : "Office location map"}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: W, height: H, transform: "translate(-50%, -50%)" }}
        aria-hidden
      >
        {tiles.map((t) => (
          <img
            key={`${t.tx}-${t.ty}`}
            src={`https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${t.tx}/${t.ty}@2x.png`}
            width={TILE}
            height={TILE}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute"
            style={{ left: t.left, top: t.top, width: TILE, height: TILE }}
          />
        ))}
        {/* centre marker — sits exactly on the office */}
        <div
          className="absolute"
          style={{ left: W / 2, top: H / 2, transform: "translate(-50%, -100%)" }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"
              fill="var(--color-accent)"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.6" fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default StaticTileMap;
