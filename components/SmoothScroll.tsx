"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Top-level smooth-scroll provider. Lenis owns the scroll; GSAP's ticker
 * drives Lenis's RAF (the per-frame consumer that keeps scrubbed scenes from
 * freezing), and every Lenis scroll event ticks ScrollTrigger.update().
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // native scroll, no smoothing — respects the user

    const lenis = new Lenis({
      duration: 1.6,
      lerp: 0.06,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // The scene-build loader locks scroll until the hero is revealed. If it
    // already requested the lock before Lenis existed (loader effect runs
    // before this parent effect), honor it immediately; otherwise react to the
    // events it dispatches.
    if (document.documentElement.classList.contains("am-scroll-locked")) lenis.stop();
    const onLock = () => lenis.stop();
    const onUnlock = () => lenis.start();
    window.addEventListener("am:lock-scroll", onLock);
    window.addEventListener("am:unlock-scroll", onUnlock);

    return () => {
      window.removeEventListener("am:lock-scroll", onLock);
      window.removeEventListener("am:unlock-scroll", onUnlock);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
