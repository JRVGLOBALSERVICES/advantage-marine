"use client";

/**
 * ClampText — fixed-line body copy with an honest "Read more" expander.
 *
 * Why it exists: project / news / service cards carry real, variable-length
 * summaries pulled from the JSON sources. Rendered raw, the cards take wildly
 * different heights and break the "same width + height per component" rule.
 * ClampText pins the collapsed copy to a fixed line count (so every card in a
 * component is the same height by default) and only surfaces the toggle when
 * the text actually overflows — measured, not guessed. Expanding one card is
 * opt-in and never touches the others.
 *
 * Tokens only: accent toggle, eyebrow type scale, Cinzel via .font-display.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CLAMP: Record<number, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

type Props = {
  text: string;
  /** Collapsed line count. Default 4. */
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function ClampText({ text, lines = 4, className, style }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);

  // Measure overflow only while collapsed; once detected, keep the toggle so
  // the "Read less" affordance survives the expanded state.
  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setClampable(el.scrollHeight - el.clientHeight > 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, lines, expanded]);

  return (
    <>
      <p
        ref={ref}
        className={cn(className, !expanded && CLAMP[lines])}
        style={style}
      >
        {text}
      </p>

      {(clampable || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="group/clamp relative z-30 mt-1 inline-flex w-fit items-center gap-1.5 font-display uppercase tracking-[0.08em] transition-colors duration-300"
          style={{
            fontSize: "var(--text-eyebrow)",
            color: "var(--color-accent)",
            transitionTimingFunction: "var(--ease-out)",
          }}
          aria-expanded={expanded}
        >
          {expanded ? "Read less" : "Read more"}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-3 w-3 transition-transform duration-300",
              expanded ? "-rotate-180" : "rotate-0",
            )}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </>
  );
}

export default ClampText;
