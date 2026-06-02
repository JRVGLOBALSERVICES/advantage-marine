"use client";

/**
 * SlideFillButton — harvested from uiverse.io
 * Source: AqFox / nervous-crab-0 (MIT, css) — class "hover-filled-slide-left"
 * https://uiverse.io/AqFox/nervous-crab-0
 *
 * Original: a solid blue-filled outline button where the fill slides away to
 * the left on hover, flipping the text from white-on-blue to blue-on-white.
 * Re-themed to AMS: teal accent fill recedes on hover, leaving a hairline
 * teal outline with teal text on paper. Inline SVG icon rides with the label
 * and inherits currentColor so it flips with the text. Editorial, structural —
 * reads as engineered, not a default web button.
 */

import { cn } from "@/lib/utils";

type IconKind = "arrow" | "shield" | "gauge" | "anchor";

function Glyph({ kind }: { kind: IconKind }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "shield":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 16a8 8 0 1 1 16 0" />
          <path d="M12 16l4-4" />
        </svg>
      );
    case "anchor":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="5" r="2.2" />
          <path d="M12 7.2V21" />
          <path d="M5 12h14" />
          <path d="M5 12a7 7 0 0 0 14 0" />
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

export interface SlideFillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: IconKind;
}

export function SlideFillButton({
  label,
  icon = "arrow",
  className,
  ...props
}: SlideFillButtonProps) {
  return (
    <button type="button" className={cn("sfb", className)} {...props}>
      <span className="sfb__content">
        <Glyph kind={icon} />
        {label}
      </span>

      <style jsx>{`
        .sfb {
          position: relative;
          display: inline-block;
          min-width: 11rem;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .sfb::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: var(--color-accent);
          border-radius: var(--radius-pill);
          transition: width 300ms var(--ease-out);
          width: 100%;
        }
        .sfb__content {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.85rem 1.5rem;
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-pill);
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-accent-ink);
          transition: color 200ms 100ms var(--ease-out);
        }
        .sfb:hover::before {
          width: 0%;
        }
        .sfb:hover .sfb__content {
          color: var(--color-accent);
        }
        .sfb:active {
          transform: translateY(1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .sfb::before,
          .sfb__content {
            transition: none;
          }
        }
      `}</style>
    </button>
  );
}

export default SlideFillButton;
