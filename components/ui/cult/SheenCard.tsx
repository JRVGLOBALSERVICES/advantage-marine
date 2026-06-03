"use client";

/**
 * SheenCard — cult-ui-flavored tactile feature card.
 *
 * Provenance: re-themed from 21st.dev "Highlight Card"
 * (mcp__magic__21st_magic_component_inspiration, searchQuery "cult ui minimal
 * card sheen", similarity 0.739). The signature cult-ui move — a diagonal sheen
 * that sweeps across the surface on hover (-skew-x-12 translate-x sweep) plus
 * soft corner washes and an animated accent rule — is preserved. Everything
 * dark/white-on-dark, the rainbow gradients, the lucide icon dependency, the
 * shadcn <Card>, and the perpetual idle animate-* loops were stripped and
 * rebuilt on the locked cream+teal token system.
 *
 * Tokens only: paper-2 panel, --color-rule hairline, --color-accent washes held
 * under the ≤5% accent budget (low-opacity color-mix), --color-ink text, Cinzel
 * via .font-display, --ease-out timing. Sheen + lift gate on prefers-reduced-motion.
 */

import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ClampText } from "@/components/ui/ClampText";

interface SheenCardProps {
  /** Small eyebrow / category label above the title (e.g. service category). */
  eyebrow?: string;
  /** Two-digit-ish index marker, e.g. "01" — set to "" to hide. */
  index?: string;
  /** Card title — rendered in Cinzel display caps. */
  title: string;
  /** Body copy. Pass real content from the JSON sources — no placeholders. */
  description?: string;
  /** Real image src from public/media/<section>/ (mapped via media-manifest). */
  imageSrc?: string;
  imageAlt?: string;
  /** Optional inline-SVG / Lottie icon node (no icon library). */
  icon?: ReactNode;
  href?: string;
  className?: string;
}

export function SheenCard({
  eyebrow,
  index,
  title,
  description,
  imageSrc,
  imageAlt = "",
  icon,
  href,
  className,
}: SheenCardProps) {
  const reduce = useReducedMotion() ?? false;

  const muted = { color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" };

  const Wrapper: "a" | "div" = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "group/sheen relative block overflow-hidden rounded-[var(--radius-card)]",
        "border border-rule bg-paper-2",
        "shadow-[0_1px_2px_rgba(48,131,123,0.06)]",
        "transition-[transform,box-shadow,border-color] duration-500",
        !reduce && "hover:-translate-y-1.5",
        "hover:border-[color:color-mix(in_oklch,var(--color-accent)_40%,var(--color-rule))]",
        "hover:shadow-[0_22px_48px_-16px_rgba(48,131,123,0.30)]",
        className,
      )}
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      {/* Soft teal corner washes — held faint to respect the ≤5% accent budget.
          Idle = invisible; they bloom only on hover. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl",
          "opacity-0 transition-opacity duration-700 group-hover/sheen:opacity-100",
        )}
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-accent) 18%, transparent) 0%, transparent 70%)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full blur-3xl",
          "opacity-0 transition-opacity duration-700 group-hover/sheen:opacity-100",
        )}
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-accent-2) 16%, transparent) 0%, transparent 70%)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      />

      {/* The cult-ui sheen: a single diagonal band that sweeps across on hover.
          Skipped entirely for reduced-motion. */}
      {!reduce && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-20 -translate-x-[120%] -skew-x-12",
            "transition-transform duration-[1100ms] group-hover/sheen:translate-x-[120%]",
          )}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--color-paper-2) 92%, transparent) 45%, color-mix(in oklch, var(--color-accent-2) 22%, transparent) 50%, transparent 100%)",
            transitionTimingFunction: "var(--ease-out)",
          }}
        />
      )}

      {/* Optional real image — never a placeholder. */}
      {imageSrc && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700",
              !reduce && "group-hover/sheen:scale-[1.04]",
            )}
            style={{ transitionTimingFunction: "var(--ease-out)" }}
          />
          {/* paper feather so the image grounds into the panel */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background:
                "linear-gradient(to top, var(--color-paper-2) 0%, transparent 100%)",
            }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-3 p-6">
        {(eyebrow || index) && (
          <div className="flex items-center justify-between">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : <span />}
            {index && (
              <span
                className="font-display tabular-nums"
                style={{ ...muted, fontSize: "var(--text-eyebrow)", letterSpacing: "0.08em" }}
              >
                {index}
              </span>
            )}
          </div>
        )}

        {icon && (
          <div
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border border-rule",
              "text-[color:var(--color-accent)] transition-colors duration-500",
              "group-hover/sheen:border-[color:var(--color-accent)]",
            )}
            style={{
              background: "color-mix(in oklch, var(--color-aqua) 60%, transparent)",
              transitionTimingFunction: "var(--ease-out)",
            }}
          >
            {icon}
          </div>
        )}

        <h3
          className="font-display leading-[1.1] text-[color:var(--color-ink)]"
          style={{ fontSize: "var(--text-h3)" }}
        >
          {title}
        </h3>

        {description && (
          <ClampText
            text={description}
            lines={4}
            className="leading-relaxed"
            style={{ ...muted, fontSize: "var(--text-card)" }}
          />
        )}

        {/* Animated accent rule — grows from a short seam to full width on hover.
            This is the one place the accent reads as a deliberate flourish. */}
        <span
          aria-hidden
          className={cn(
            "mt-1 block h-px origin-left bg-[color:var(--color-accent)]",
            "transition-transform duration-500",
            reduce ? "scale-x-100" : "scale-x-[0.18] group-hover/sheen:scale-x-100",
          )}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        />
      </div>
    </Wrapper>
  );
}

export default SheenCard;
