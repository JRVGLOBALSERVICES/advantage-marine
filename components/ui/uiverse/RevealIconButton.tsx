"use client";

/**
 * RevealIconButton — harvested from uiverse.io
 * Source: AmIt-DasIT / gentle-gecko-87 (MIT, css)
 * https://uiverse.io/AmIt-DasIT/gentle-gecko-87
 *
 * Original: a 45px green circle holding a CSS arrow that widens to a pill and
 * reveals a label on hover (label fades in). Re-themed to AMS: teal circle,
 * accent-ink inline SVG icon (not a CSS-border arrow), expands to a hairline
 * paper pill on hover with the label fading in. Compact icon-first control —
 * ideal beside a list item or contact row.
 */

import { cn } from "@/lib/utils";

type IconKind = "arrow" | "phone" | "diveMask" | "doc";

function Glyph({ kind }: { kind: IconKind }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "phone":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 3h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "diveMask":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="7" width="18" height="9" rx="3" />
          <path d="M3 11h18" />
          <path d="M11 16v2a3 3 0 0 0 3 3" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4" />
          <path d="M10 13h6M10 17h6" />
        </svg>
      );
    case "arrow":
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );
  }
}

export interface RevealIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: IconKind;
}

export function RevealIconButton({
  label,
  icon = "arrow",
  className,
  ...props
}: RevealIconButtonProps) {
  return (
    <button
      type="button"
      className={cn("rib", className)}
      aria-label={label}
      {...props}
    >
      <span className="rib__icon" aria-hidden="true">
        <Glyph kind={icon} />
      </span>
      <span className="rib__label">{label}</span>

      <style jsx>{`
        .rib {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 3rem;
          height: 3rem;
          padding: 0;
          border: 1px solid transparent;
          border-radius: var(--radius-pill);
          background: var(--color-accent);
          color: var(--color-accent-ink);
          cursor: pointer;
          overflow: hidden;
          white-space: nowrap;
          transition: width 320ms var(--ease-out),
            padding 320ms var(--ease-out), background 320ms var(--ease-out),
            border-color 320ms var(--ease-out), color 320ms var(--ease-out);
        }
        .rib__icon {
          display: inline-flex;
          flex: none;
        }
        .rib__label {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-width 320ms var(--ease-out),
            opacity 240ms var(--ease-out);
        }
        .rib:hover {
          width: 12rem;
          padding: 0 1.25rem;
          background: var(--color-paper-2);
          border-color: var(--color-accent);
          color: var(--color-ink);
        }
        .rib:hover .rib__label {
          max-width: 9rem;
          opacity: 1;
        }
        .rib:active {
          transform: translateY(1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .rib,
          .rib__label {
            transition: none;
          }
          .rib:hover {
            width: 12rem;
            padding: 0 1.25rem;
          }
          .rib:hover .rib__label {
            max-width: 9rem;
          }
        }
      `}</style>
    </button>
  );
}

export default RevealIconButton;
