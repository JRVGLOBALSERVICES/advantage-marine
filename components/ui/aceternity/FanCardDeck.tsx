"use client";

// Source: Aceternity UI "Card Stack" (card-stack)
// https://ui.aceternity.com/components/card-stack — license: free personal & commercial.
// Original cycles a testimonial deck on a timer via vertical stacking only. Re-worked into a true
// FANNED deck: each card behind the top one fans out with a small rotation + x/y offset (the "fan
// cards" Rj asked for), carries a real image + Cinzel title, and advances on click OR an auto timer
// that pauses on hover. Re-themed to cream+teal — paper-2 card faces, hairline rules, teal accent.
// No dark mode, no icon lib, no next/image.

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export type FanCard = {
  title: string;
  src?: string; // real image path from public/media/<section>/ (news cards)
  media?: React.ReactNode; // OR a live media node (e.g. a centred map) — takes precedence over src
  category: string;
  summary: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function FanCardDeck({
  items,
  offset,
  scaleFactor,
  rotate = 5,
  autoplay = true,
  interval = 5000,
}: {
  items: FanCard[];
  offset?: number; // px x/y fan offset per card behind
  scaleFactor?: number; // scale drop per card behind
  rotate?: number; // degrees of fan rotation per card behind
  autoplay?: boolean;
  interval?: number;
}) {
  const CARD_OFFSET = offset ?? 16;
  const SCALE_FACTOR = scaleFactor ?? 0.05;
  const [cards, setCards] = useState<FanCard[]>(items);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const advance = () =>
    setCards((prev) => {
      const next = [...prev];
      next.unshift(next.pop()!); // last → front
      return next;
    });

  useEffect(() => setCards(items), [items]);

  useEffect(() => {
    if (!autoplay || paused || cards.length < 2) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    timer.current = setInterval(advance, interval);
    return () => clearInterval(timer.current);
  }, [autoplay, paused, interval, cards.length]);

  return (
    <div
      className="relative h-[26rem] w-[min(78vw,18rem)] md:h-[30rem] md:w-[26rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {cards.map((card, index) => {
        const isTop = index === 0;
        // fan: cards behind tilt + shift; the visible top card sits flat.
        const dir = index % 2 === 0 ? 1 : -1;
        return (
          <motion.div
            key={`${card.title}-${index}`}
            className="absolute flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border"
            style={{
              transformOrigin: "bottom center",
              background: "var(--color-paper-2)",
              borderColor: "var(--color-rule)",
              boxShadow:
                "0 18px 40px -24px color-mix(in oklch, var(--color-ink) 40%, transparent)",
            }}
            onClick={advance}
            animate={{
              top: index * -CARD_OFFSET,
              x: index === 0 ? 0 : index * CARD_OFFSET * dir,
              rotate: index === 0 ? 0 : index * rotate * dir,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="relative h-3/5 w-full overflow-hidden">
              {card.media ? (
                card.media
              ) : (
                <img
                  src={card.src}
                  alt={card.title}
                  className="h-full w-full object-cover"
                  loading={isTop ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
              <div>
                <p
                  className="eyebrow"
                  style={{ color: "var(--color-accent)" }}
                >
                  {card.category}
                </p>
                <h3
                  className="font-display mt-2 leading-[1.1]"
                  style={{ fontSize: "var(--text-h3)", color: "var(--color-ink)" }}
                >
                  {card.title}
                </h3>
              </div>
              <p
                className="mt-3 line-clamp-3"
                style={{
                  color: "color-mix(in oklch, var(--color-ink) 68%, transparent)",
                }}
              >
                {card.summary}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default FanCardDeck;
