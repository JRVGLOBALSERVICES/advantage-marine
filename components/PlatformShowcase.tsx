"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const PlatformScene = dynamic(() => import("./PlatformScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <span className="eyebrow animate-pulse text-[color:var(--color-accent-2)]">
        Building rig…
      </span>
    </div>
  ),
});

const EASE = [0.22, 1, 0.36, 1] as const;
const POSTER = "/media/contact/platform-poster.png";

/* warm-white on the dark ink band, via the existing --color-accent-ink token
   ("warm white on teal fills"). Muted tiers are opacity-only — no off-white
   shades, per the locked font-colour rule. */
const WARM = "var(--color-accent-ink)";
const WARM_MUTED = "color-mix(in oklch, var(--color-accent-ink) 64%, transparent)";
const WARM_FAINT = "color-mix(in oklch, var(--color-accent-ink) 46%, transparent)";

export default function PlatformShowcase() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [active, setActive] = useState(false);

  // decide canvas vs poster: desktop fine-pointer, wide, not reduced-motion.
  // the platform GLB is ~5.7 MB / 390k tris — too heavy for phones, so mobile
  // + tablet + reduced-motion get the rendered poster instead.
  useEffect(() => {
    const ok =
      !reduce &&
      window.matchMedia("(min-width: 1024px)").matches &&
      window.matchMedia("(pointer: fine)").matches;
    setUseCanvas(ok);
  }, [reduce]);

  // lazy-mount the WebGL context only once the section nears the viewport,
  // and pause the frameloop when it scrolls away (battery / GPU).
  useEffect(() => {
    if (!useCanvas || !sectionRef.current) return;
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasEntered(true);
        setActive(entry.isIntersecting);
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useCanvas]);

  return (
    <section
      ref={sectionRef}
      aria-label="Offshore platform — the structures Advantage Marine services"
      className="relative isolate overflow-hidden border-y border-[color:color-mix(in_oklch,var(--color-accent-ink)_14%,transparent)] bg-[color:var(--color-ink)]"
    >
      <div className="relative h-[clamp(34rem,88lvh,52rem)] w-full">
        {/* ---- 3D layer (desktop) or rendered poster (mobile / reduced) ---- */}
        <div className="absolute inset-0">
          {useCanvas ? (
            hasEntered && <PlatformScene active={active} />
          ) : (
            <img
              src={POSTER}
              alt="3D reconstruction of an offshore oil and gas platform — jacket legs, deck modules, flare derrick and crane booms"
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        {/* readability wash — ink from the bottom-left so copy stays legible
            over the rig, fading to clear over the model on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, var(--color-ink) 0%, color-mix(in oklch, var(--color-ink) 70%, transparent) 34%, transparent 62%)",
          }}
        />
        {/* faint top + bottom vignette so the poster's dark corners blend the band edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--color-ink) 0%, transparent 12%, transparent 86%, var(--color-ink) 100%)",
          }}
        />

        {/* ---- copy overlay, anchored bottom-left ---- */}
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[min(1280px,92vw)] flex-col justify-end px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2rem,6vh,4rem)]">
          <motion.p
            className="eyebrow mb-[var(--space-sm)]"
            style={{ color: "var(--color-accent-2)" }}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            The structures we work on
          </motion.p>

          <motion.h2
            className="font-display max-w-[18ch] leading-[1.08]"
            style={{ fontSize: "var(--text-h2)", color: WARM }}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={reduce ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.06 }}
          >
            Offshore structures, serviced in place.
          </motion.h2>

          <motion.p
            className="mt-[var(--space-md)] max-w-[44ch] font-body leading-[1.55]"
            style={{ fontSize: "var(--text-lead)", color: WARM_MUTED }}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.14 }}
          >
            From jacket legs to topside modules, our divers and ROV crews
            inspect, clean and repair fixed and floating platforms in the
            water — keeping the asset on station while the work gets done.
          </motion.p>

          <motion.p
            className="mt-[var(--space-md)] eyebrow !tracking-[0.2em] normal-case"
            style={{ color: WARM_FAINT }}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? {} : { opacity: 1 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.24 }}
          >
            {useCanvas ? "Live 3D · move your cursor to shift the view" : "Reconstructed offshore platform"}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
