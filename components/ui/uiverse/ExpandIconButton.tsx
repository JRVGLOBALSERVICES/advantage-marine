"use client";

/**
 * ExpandIconButton — harvested from uiverse.io
 * Source: AKAspidey01 / orange-donkey-78 (MIT, css/tailwind)
 * https://uiverse.io/AKAspidey01/orange-donkey-78
 *
 * Original: white pill with a green chip that slides from a left square out to
 * full width on hover, carrying an inline SVG arrow. Re-themed to AMS cream +
 * teal: paper-2 pill, teal chip, accent-ink icon, no dark surfaces. The chip
 * expansion is the hover "icon" effect Rj asked for.
 *
 * Accent budget: the teal chip is a small element; at rest it is a 1/4-width
 * square, only filling on hover.
 */

import { cn } from "@/lib/utils";

type IconKind = "arrow" | "anchor" | "wave" | "wrench";

function Glyph({ kind }: { kind: IconKind }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "anchor":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="5" r="2.4" />
          <path d="M12 7.4V21" />
          <path d="M5 12H19" />
          <path d="M5 12a7 7 0 0 0 14 0" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M2 8c2.5-2 4-2 6 0s3.5 2 6 0 4-2 6 0" />
          <path d="M2 14c2.5-2 4-2 6 0s3.5 2 6 0 4-2 6 0" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M15.5 4.5a4 4 0 0 0-5 5L4 16v4h4l6.5-6.5a4 4 0 0 0 5-5l-2.8 2.8-2.2-.6-.6-2.2 2.8-2.8z" />
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

export interface ExpandIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: IconKind;
}

export function ExpandIconButton({
  label,
  icon = "arrow",
  className,
  ...props
}: ExpandIconButtonProps) {
  return (
    <button type="button" className={cn("eib", className)} {...props}>
      <span className="eib__chip" aria-hidden="true">
        <Glyph kind={icon} />
      </span>
      <span className="eib__label">{label}</span>

      <style jsx>{`
        .eib {
          position: relative;
          width: 13rem;
          height: 3.5rem;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-pill);
          background: var(--color-paper-2);
          color: var(--color-ink);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          text-align: center;
          overflow: hidden;
        }
        .eib__chip {
          position: absolute;
          left: 4px;
          top: 4px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          height: calc(3.5rem - 10px);
          width: 25%;
          border-radius: var(--radius-pill);
          background: var(--color-accent);
          color: var(--color-accent-ink);
          transition: width 500ms var(--ease-out),
            background 500ms var(--ease-out);
        }
        .eib__label {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding-left: 1.4rem;
          transition: color 300ms var(--ease-out);
        }
        .eib:hover .eib__chip {
          width: calc(100% - 8px);
          background: var(--color-accent-2);
        }
        .eib:hover .eib__label {
          color: var(--color-ink);
        }
        .eib:active {
          transform: translateY(1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .eib__chip,
          .eib__label {
            transition: none;
          }
        }
      `}</style>
    </button>
  );
}

export default ExpandIconButton;
