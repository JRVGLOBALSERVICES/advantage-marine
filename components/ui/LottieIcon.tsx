"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieComponentProps } from "lottie-react";
import { cn } from "@/lib/utils";

type LottieIconProps = {
  /** Path under /public, e.g. "/lottie/diving-helmet.json" */
  src: string;
  /** Square px size of the rendered icon. Default 48. */
  size?: number;
  className?: string;
  /** Respect prefers-reduced-motion by freezing on the first frame. Default true. */
  respectReducedMotion?: boolean;
  /** Accessible label; if omitted the icon is treated as decorative. */
  label?: string;
};

/**
 * Lightweight Lottie player for the AMS marine service icons.
 *
 * Renders bodymovin JSON via `lottie-react` when the library is present.
 * If `lottie-react` is NOT installed (or fails to load), it degrades
 * gracefully to an inline teal SVG glyph keyed off the filename — so the
 * UI never shows an empty box. No runtime crash either way.
 */
export function LottieIcon({
  src,
  size = 48,
  className,
  respectReducedMotion = true,
  label,
}: LottieIconProps) {
  const [Player, setPlayer] =
    useState<React.ComponentType<LottieComponentProps> | null>(null);
  const [data, setData] = useState<unknown | null>(null);
  const [failed, setFailed] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    if (respectReducedMotion && typeof window !== "undefined") {
      reduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }

    let alive = true;

    // Lazy-load lottie-react client-side (keeps it out of the SSR bundle and
    // off the critical path). If it ever fails, we fall back to the inline SVG.
    import("lottie-react")
      .then((m) => {
        if (alive) setPlayer(() => m.default);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    fetch(src)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((json) => {
        if (alive) setData(json);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, [src, respectReducedMotion]);

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  if (!failed && Player && data) {
    return (
      <span
        className={cn("inline-block", className)}
        style={{ width: size, height: size }}
        {...a11y}
      >
        <Player
          animationData={data}
          loop={!reduced.current}
          autoplay={!reduced.current}
          initialSegment={reduced.current ? [0, 1] : undefined}
          style={{ width: size, height: size }}
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        />
      </span>
    );
  }

  // Fallback: inline SVG glyph (teal stroke, transparent bg).
  return (
    <span
      className={cn("inline-block", className)}
      style={{ width: size, height: size }}
      {...a11y}
    >
      <LottieFallbackGlyph src={src} size={size} />
    </span>
  );
}

/** Static inline-SVG glyphs that mirror each Lottie icon's silhouette. */
function LottieFallbackGlyph({ src, size }: { src: string; size: number }) {
  const teal = "var(--color-accent)";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: teal,
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (src.includes("diving-helmet")) {
    return (
      <svg {...common}>
        <circle cx="32" cy="31" r="15" />
        <circle cx="32" cy="30" r="7" strokeWidth={1.8} />
        <rect x="21" y="44" width="22" height="8" rx="2" strokeWidth={2.2} />
      </svg>
    );
  }
  if (src.includes("ndt-scan")) {
    return (
      <svg {...common}>
        <circle cx="22" cy="32" r="4.5" fill={teal} stroke="none" />
        <path d="M30 22a14 14 0 0 1 0 20" strokeWidth={3} />
        <path d="M37 16a22 22 0 0 1 0 32" strokeWidth={2.6} opacity={0.7} />
      </svg>
    );
  }
  if (src.includes("engineering-gear")) {
    return (
      <svg {...common}>
        <circle cx="26" cy="26" r="9" />
        <circle cx="26" cy="26" r="3" strokeWidth={2} />
        <path d="M26 13v-4M26 43v4M13 26H9M43 26h4M17 17l-3-3M35 35l3 3M35 17l3-3M17 35l-3 3" />
        <circle cx="44" cy="42" r="6" />
        <circle cx="44" cy="42" r="2" strokeWidth={1.6} />
      </svg>
    );
  }
  // rov-sonar
  return (
    <svg {...common}>
      <circle cx="32" cy="32" r="23" />
      <circle cx="32" cy="32" r="13" strokeWidth={1.4} opacity={0.6} />
      <path d="M32 32V10" strokeWidth={2.6} />
      <circle cx="44" cy="22" r="3" fill={teal} stroke="none" />
    </svg>
  );
}

export default LottieIcon;
