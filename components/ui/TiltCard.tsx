"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

// Tracks whether the tilt motion should be suppressed (reduced-motion users).
// Children read this so CardItem can skip its depth transforms entirely.
const ReducedMotionContext = createContext<boolean>(false);

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || prefersReducedMotion) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    // Original Aceternity tilt math — preserved exactly.
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  const handleMouseEnter = () => {
    if (prefersReducedMotion) return;
    setIsMouseEntered(true);
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
  };

  return (
    <ReducedMotionContext.Provider value={prefersReducedMotion}>
      <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
        <div
          className={cn(
            "flex items-center justify-center",
            containerClassName,
          )}
          style={
            prefersReducedMotion ? undefined : { perspective: "1000px" }
          }
        >
          <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "relative flex items-center justify-center transition-all duration-200",
              className,
            )}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    transformStyle: "preserve-3d",
                    transitionTimingFunction: "var(--ease-out)",
                  }
            }
          >
            {children}
          </div>
        </div>
      </MouseEnterContext.Provider>
    </ReducedMotionContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        // Themed shell: cream panel, ruled border, warm/teal-tinted lift on hover.
        // No fixed h/w so it adapts to real, varied record content.
        "group/card relative rounded-[var(--radius-card)] border border-rule bg-paper-2 p-6",
        "[transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        "transition-shadow duration-300 [transition-timing-function:var(--ease-out)]",
        "shadow-[0_1px_2px_rgba(48,131,123,0.06)]",
        "hover:shadow-[0_18px_40px_-12px_rgba(48,131,123,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  [key: string]: unknown;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();
  const prefersReducedMotion = useContext(ReducedMotionContext);

  useEffect(() => {
    handleAnimations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMouseEntered, prefersReducedMotion]);

  const handleAnimations = () => {
    if (!ref.current) return;
    // Reduced motion: never lift items off the plane — keep flat + themed.
    if (prefersReducedMotion) {
      ref.current.style.transform = "";
      return;
    }
    if (isMouseEntered) {
      // Original per-item depth transform — preserved exactly.
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn(
        "w-fit transition duration-200 [transition-timing-function:var(--ease-out)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Hook to read the hover state from within a CardContainer.
export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a CardContainer");
  }
  return context;
};
