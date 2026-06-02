"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Footer mega-wordmark with an in-view colour sweep: a marine-teal fill wipes
 * across "ADVANTAGE" from right to left as the sign-off scrolls into view, then
 * settles to the faint ink ghost. Replays every time it re-enters (once:false),
 * and uses a POSITIVE viewport margin so the reveal fires on iOS Safari instead
 * of triggering late / never (the mobile bug this replaces). Reduced-motion
 * renders the static faint wordmark.
 *
 * bg-clip:text — text is the direct child of the gradient element (no nested
 * inline-block descendants, which would punch through the clip).
 */
const GHOST = "color-mix(in oklch, var(--color-ink) 9%, transparent)";

export default function FooterWordmark() {
  const reduce = useReducedMotion();

  return (
    <motion.p
      aria-hidden
      className="select-none font-display font-bold leading-[0.9] tracking-[-0.03em]"
      style={{
        fontSize: "clamp(3rem, 13vw, 11rem)",
        backgroundImage: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) 45%, ${GHOST} 55%, ${GHOST} 100%)`,
        backgroundSize: "230% 100%",
        backgroundPositionX: "100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
      initial={reduce ? false : { backgroundPositionX: "100%" }}
      whileInView={reduce ? undefined : { backgroundPositionX: "0%" }}
      viewport={{ once: false, margin: "0px 0px 120px 0px" }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      ADVANTAGE
    </motion.p>
  );
}
