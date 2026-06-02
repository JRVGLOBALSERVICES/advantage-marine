"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: false, margin: "0px 0px -120px 0px" } as const;

const CARD: Variants = {
  hidden: { opacity: 0, y: 52, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

/**
 * Card-stack reveal — items arrive with y-offset + soft scale, staggered, so
 * the group reads as stacking into place from below. Pair <StackedCards>
 * (container) with <StackedCard> (item). Ported from seagull-group.
 */
export function StackedCards({
  children,
  className,
  as: TagName = "div",
  stagger = 0.08,
  delayChildren = 0.04,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul" | "section";
  stagger?: number;
  delayChildren?: number;
}) {
  const reduce = useReducedMotion();
  const Wrapper = motion[TagName] as typeof motion.div;

  if (reduce) {
    const Static = TagName as "div";
    return <Static className={className}>{children}</Static>;
  }

  const parent: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };

  return (
    <Wrapper
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={parent}
    >
      {children}
    </Wrapper>
  );
}

export function StackedCard({
  children,
  className,
  as: TagName = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  const reduce = useReducedMotion();
  const Wrapper = motion[TagName] as typeof motion.div;

  if (reduce) {
    const Static = TagName as "div";
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Wrapper className={className} variants={CARD}>
      {children}
    </Wrapper>
  );
}
