"use client";

// Source: React Bits — SpotlightCard (TS+Tailwind variant), MIT (react-bits, David Haz)
// https://reactbits.dev/r/SpotlightCard-TS-TW.json
// Re-themed for Advantage Marine: cream paper-2 surface, hairline rule border,
// teal spotlight wash (accent budget kept tiny — radial fades to transparent).
// No new deps. prefers-reduced-motion just disables the cursor wash.
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  /**
   * Spotlight color. Defaults to a low-alpha teal accent so the wash stays
   * within the <=5% accent budget on a cream panel. Pass an rgba string.
   */
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  // #30837b (--color-accent) at low alpha
  spotlightColor = "rgba(48, 131, 123, 0.18)",
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused || reduced) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    if (reduced) return;
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    if (reduced) return;
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-8",
        "border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]",
        // gentle hover lift on the surface itself (within token system)
        "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:bg-[color:var(--color-paper-3)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
