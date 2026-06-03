"use client";

/* Hallmark · component: globe-logo · genre: modern-minimal · theme: design.md
 * states: rest · spinning · reduced-motion (static)
 * A logo-scale wireframe globe — teal meridians + parallels on cream, a slow
 * continuous spin via animating the meridian ellipse rx (longitude rotation),
 * plus a marker pip pulsing at the Johor HQ longitude. Pure SVG + CSS, no
 * WebGL context (logo-scale doesn't warrant a second R3F canvas). Honours
 * prefers-reduced-motion: spin stops, marker holds. Accent ≤5%, on-system.
 */

type GlobeLogoProps = {
  size?: number;
  className?: string;
  /** accessible label; omit to render decorative (aria-hidden) */
  label?: string;
};

export function GlobeLogo({ size = 56, className, label }: GlobeLogoProps) {
  const decorative = !label;
  return (
    <span
      className={className}
      style={{ display: "inline-block", lineHeight: 0 }}
      role={decorative ? undefined : "img"}
      aria-label={label}
      aria-hidden={decorative || undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="globe-clip">
            <circle cx="50" cy="50" r="38" />
          </clipPath>
        </defs>

        {/* outer ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          opacity="0.9"
        />

        <g clipPath="url(#globe-clip)">
          {/* parallels (static latitudes) */}
          {[18, 30, 42, 50, 58, 70, 82].map((cy) => {
            const dy = cy - 50;
            const ry = 38 * Math.sqrt(Math.max(0, 1 - (dy / 38) ** 2));
            return (
              <ellipse
                key={cy}
                cx="50"
                cy={cy}
                rx={ry}
                ry={Math.max(2.5, ry * 0.16)}
                stroke="var(--color-accent)"
                strokeWidth="0.8"
                opacity="0.32"
              />
            );
          })}

          {/* meridians — the spinning longitudes (rx animates 0→38→0) */}
          <g className="globe-meridians">
            {[0, 1, 2, 3].map((i) => (
              <ellipse
                key={i}
                className={`globe-meridian globe-meridian-${i}`}
                cx="50"
                cy="50"
                rx="38"
                ry="38"
                stroke="var(--color-accent)"
                strokeWidth="0.9"
                opacity="0.5"
              />
            ))}
          </g>

          {/* Johor HQ marker pip */}
          <circle className="globe-pip" cx="60" cy="58" r="2.4" fill="var(--color-accent-2)" />
        </g>
      </svg>

      <style>{`
        .globe-meridian { transform-box: fill-box; transform-origin: center; }
        .globe-meridian-0 { animation: globe-spin 14s linear infinite; }
        .globe-meridian-1 { animation: globe-spin 14s linear infinite -3.5s; }
        .globe-meridian-2 { animation: globe-spin 14s linear infinite -7s; }
        .globe-meridian-3 { animation: globe-spin 14s linear infinite -10.5s; }
        .globe-pip { animation: globe-pulse 2.8s ease-in-out infinite; }
        @keyframes globe-spin {
          0%   { rx: 38px; opacity: 0.5; }
          25%  { rx: 4px;  opacity: 0.22; }
          50%  { rx: 38px; opacity: 0.5; }
          75%  { rx: 4px;  opacity: 0.22; }
          100% { rx: 38px; opacity: 0.5; }
        }
        @keyframes globe-pulse {
          0%, 100% { opacity: 0.45; r: 2.4px; }
          50%      { opacity: 1;    r: 3.2px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .globe-meridian, .globe-pip { animation: none; }
        }
      `}</style>
    </span>
  );
}

export default GlobeLogo;
