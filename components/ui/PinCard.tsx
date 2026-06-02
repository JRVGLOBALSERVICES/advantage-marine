"use client";
import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export const PinContainer = ({
  children,
  title,
  href,
  className,
  containerClassName,
}: {
  /** Short location label shown in the floating pin pill (e.g. "Lumut HQ"). */
  title?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const reduceMotion = useReducedMotion();
  const [transform, setTransform] = useState(
    "translate(-50%,-50%) rotateX(0deg)"
  );

  const onMouseEnter = () => {
    if (reduceMotion) return;
    setTransform("translate(-50%,-50%) rotateX(40deg) scale(0.8)");
  };
  const onMouseLeave = () => {
    if (reduceMotion) return;
    setTransform("translate(-50%,-50%) rotateX(0deg) scale(1)");
  };

  return (
    <a
      className={cn(
        "relative group/pin z-50 cursor-pointer",
        containerClassName
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      href={href || "/"}
    >
      <div
        style={{ perspective: "1000px" }}
        className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{
            transform: reduceMotion
              ? "translate(-50%,-50%)"
              : transform,
          }}
          className="absolute left-1/2 top-1/2 flex justify-start items-start p-4 rounded-2xl overflow-hidden border border-rule bg-paper-2 shadow-[0_10px_28px_-12px_rgba(48,131,123,0.30)] group-hover/pin:border-accent/40 transition duration-700"
        >
          <div className={cn("relative z-50", className)}>{children}</div>
        </div>
      </div>
      <PinPerspective title={title} reduceMotion={!!reduceMotion} />
    </a>
  );
};

export const PinPerspective = ({
  title,
  reduceMotion,
}: {
  title?: string;
  reduceMotion?: boolean;
}) => {
  return (
    <motion.div
      className={cn(
        "pointer-events-none w-96 h-80 flex items-center justify-center z-[60] transition duration-500",
        reduceMotion
          ? "opacity-100"
          : "opacity-0 group-hover/pin:opacity-100"
      )}
    >
      <div className="w-full h-full -mt-7 flex-none inset-0">
        {/* Floating pin pill — teal accent */}
        <div className="absolute top-0 inset-x-0 flex justify-center">
          {/* Non-link label — the whole PinContainer is already the anchor (avoids nested <a>). */}
          <div className="relative flex space-x-2 items-center z-10 rounded-full bg-accent py-0.5 px-4 ring-1 ring-accent-2/40">
            <span className="relative z-20 inline-block py-0.5 text-xs font-bold text-accent-ink">
              {title}
            </span>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-accent-2/0 via-accent-2/90 to-accent-2/0 transition-opacity duration-500 group-hover/btn:opacity-40" />
          </div>
        </div>

        {/* Radar ping rings — teal, gated on reduced motion */}
        {!reduceMotion && (
          <div
            style={{
              perspective: "1000px",
              transform: "rotateX(70deg) translateZ(0)",
            }}
            className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
          >
            {[0, 2, 4].map((delay) => (
              <motion.div
                key={delay}
                initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
                animate={{ opacity: [0, 1, 0.5, 0], scale: 1, z: 0 }}
                transition={{ duration: 6, repeat: Infinity, delay }}
                className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-accent/[0.10] shadow-[0_8px_16px_-6px_rgba(48,131,123,0.30)]"
              />
            ))}
          </div>
        )}

        {/* Pin stem + glowing tip — teal/seafoam */}
        <>
          <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-accent translate-y-[14px] w-px h-20 group-hover/pin:h-40 blur-[2px]" />
          <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-accent translate-y-[14px] w-px h-20 group-hover/pin:h-40" />
          <motion.div className="absolute right-1/2 translate-x-[1.5px] bottom-1/2 bg-accent-2 translate-y-[14px] w-[4px] h-[4px] rounded-full z-40 blur-[3px]" />
          <motion.div className="absolute right-1/2 translate-x-[0.5px] bottom-1/2 bg-aqua translate-y-[14px] w-[2px] h-[2px] rounded-full z-40" />
        </>
      </div>
    </motion.div>
  );
};
