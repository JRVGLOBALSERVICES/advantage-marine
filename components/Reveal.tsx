"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/* whileInView entry choreography — once:false (replays on re-entry),
   predictive margin so it lands as the element scrolls in.
   See feedback_observer_margin_positive / feedback_text_anim_magic_ui_canonical. */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "0px 0px -120px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
