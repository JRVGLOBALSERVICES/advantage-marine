"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/* Branded scene-build loader — holds the frame while the WebGL vessel hydrates.
   Plays the glitch marine footage muted behind the Advantage Marine wordmark +
   logo, with a glitching T-minus COUNTDOWN as the centrepiece. The countdown
   decrements on a timer (each digit drop fires a hard chromatic-split burst)
   and SNAPS to 00 on the real `am:scene-ready` event dispatched by VesselScene
   once the GLB is loaded + positioned — then fades to reveal the cream hero.
   Min on-screen floor (never flashes) + safety timeout (stalled GPU / reduced
   motion still clears). Pattern mirrors seagull's SceneBuildLoader. */

const MIN_DISPLAY_MS = 1400; // never flash — give the countdown a beat
const SAFETY_DISMISS_MS = 6000; // clears even if scene-ready never fires
const START_COUNT = 8; // T-minus seconds shown at boot

export default function SceneBuildLoader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = overlayRef.current;
    const bar = barRef.current;
    const dot = dotRef.current;
    const count = countRef.current;
    const logo = logoRef.current;
    const mark = markRef.current;
    if (!overlay) return;

    const startedAt = Date.now();
    let done = false;
    let shown = START_COUNT;
    let glitchTimer = 0;

    // ── scroll lock: hold the frame until the hero is revealed ──
    // Three coordinated paths: Lenis (desktop smooth) via event, native +
    // iOS-touch via the CSS class, wheel/touch/key preventDefault as a hard
    // backstop. Never leave the page locked — unlockScroll runs on dismiss
    // AND unconditionally on cleanup.
    const root = document.documentElement;
    const SCROLL_KEYS = new Set([
      "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar",
    ]);
    const preventScroll = (e: Event) => e.preventDefault();
    const preventScrollKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    let locked = false;
    const lockScroll = () => {
      if (locked) return;
      locked = true;
      root.classList.add("am-scroll-locked");
      window.dispatchEvent(new Event("am:lock-scroll"));
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventScrollKeys);
    };
    const unlockScroll = () => {
      if (!locked) return;
      locked = false;
      root.classList.remove("am-scroll-locked");
      window.dispatchEvent(new Event("am:unlock-scroll"));
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollKeys);
    };
    lockScroll();

    const setCount = (n: number) => {
      const label = String(Math.max(0, n)).padStart(2, "0");
      if (count) {
        count.textContent = label;
        count.setAttribute("data-text", label);
      }
    };
    const burst = () => {
      if (reduced || !count) return;
      count.classList.add("is-glitch");
      window.clearTimeout(glitchTimer);
      glitchTimer = window.setTimeout(() => count.classList.remove("is-glitch"), 260);
    };

    setCount(START_COUNT);

    const ctx = gsap.context(() => {
      // intro: logo + wordmark settle in
      if (!reduced && logo && mark) {
        gsap.fromTo(
          [logo, mark],
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }
        );
      }
      // corner status dot pulse
      if (!reduced && dot) {
        gsap.to(dot, {
          scale: 1.6,
          opacity: 0.4,
          duration: 0.7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
      // progress rule + countdown driven by one timeline; `finish` snaps to ready
      if (bar) gsap.set(bar, { scaleX: reduced ? 0.92 : 0.05, transformOrigin: "left center" });
      if (!reduced) {
        const driver = { p: 0 };
        gsap.to(driver, {
          p: 0.88,
          duration: SAFETY_DISMISS_MS / 1000,
          ease: "power1.out",
          onUpdate: () => {
            if (bar) gsap.set(bar, { scaleX: 0.05 + driver.p });
            // count down from START toward 1 as progress climbs (snap to 0 on finish)
            const next = Math.max(1, Math.ceil(START_COUNT * (1 - driver.p)));
            if (next !== shown) {
              shown = next;
              setCount(next);
              burst();
            }
          },
        });
      }
    }, overlayRef);

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => {
        setCount(0);
        burst();
        if (bar) gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
        gsap.to(overlay, {
          opacity: 0,
          scale: 1.015,
          duration: reduced ? 0.4 : 0.6,
          delay: reduced ? 0 : 0.32, // let the "00" land before the fade
          ease: "power2.inOut",
          onComplete: () => {
            unlockScroll(); // hero is fully revealed — hand scroll back
            setDismissed(true);
          },
        });
      }, wait);
    };

    const onReady = () => finish();
    window.addEventListener("am:scene-ready", onReady);
    // reduced-motion path renders a static hero (no canvas → no scene-ready),
    // so dismiss on the floor rather than waiting for the safety timeout.
    const safety = window.setTimeout(finish, reduced ? MIN_DISPLAY_MS + 300 : SAFETY_DISMISS_MS);

    return () => {
      window.removeEventListener("am:scene-ready", onReady);
      window.clearTimeout(safety);
      window.clearTimeout(glitchTimer);
      unlockScroll(); // safety — never leave the page scroll-locked
      ctx.revert();
    };
  }, [mounted]);

  if (!mounted || dismissed) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-[color:var(--color-ink)]"
      style={{ willChange: "opacity, transform" }}
      aria-hidden="true"
    >
      {/* glitch marine footage, muted + dimmed behind the wordmark */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        src="/video/loader-glitch.mp4"
        poster="/video/loader-glitch-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* depth wash — keeps the wordmark legible over any frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 42%, transparent 0%, color-mix(in oklch, var(--color-ink) 80%, transparent) 68%, var(--color-ink) 100%)",
        }}
      />
      {/* drifting scanline veil */}
      <div className="sbl-scan pointer-events-none absolute inset-0 opacity-60" />

      {/* corner HUD */}
      <span
        ref={dotRef}
        className="absolute left-5 top-5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-2)]"
      />
      <span className="absolute right-5 top-5 font-[family-name:var(--font-inter)] text-[10px] tracking-[0.22em] text-[color:var(--color-accent-ink)]/55">
        PREPARING VESSEL
      </span>

      {/* center: logo + wordmark + glitch countdown */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          src="/brand/advantage-marine-logo-white.png"
          alt="Advantage Marine"
          className="mb-5 h-10 w-auto md:h-12"
          loading="eager"
        />
        <div
          ref={markRef}
          className="font-display font-semibold uppercase leading-[1.1] tracking-[0.2em] text-[color:var(--color-accent-ink)]"
          style={{ fontSize: "clamp(1.1rem, min(3.6vw, 6vh), 1.9rem)" }}
        >
          Advantage Marine
        </div>

        {/* glitching T-minus countdown */}
        <div
          ref={countRef}
          className="sbl-count mt-3 select-none"
          style={{ fontSize: "clamp(4.5rem, min(26vw, 34vh), 12rem)" }}
          data-text="08"
        >
          08
        </div>

        <p className="mt-2 font-[family-name:var(--font-inter)] text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-accent-ink)]/55">
          In-Water Inspection · NDT · Marine Engineering
        </p>
      </div>

      {/* progress rule */}
      <div className="absolute bottom-12 left-1/2 z-10 w-[min(300px,64vw)] -translate-x-1/2">
        <div className="h-px w-full bg-[color:var(--color-accent-ink)]/15">
          <div ref={barRef} className="h-px w-full bg-[color:var(--color-accent-2)]" />
        </div>
        <div className="mt-3 flex justify-between font-[family-name:var(--font-inter)] text-[10px] tracking-[0.22em] text-[color:var(--color-accent-ink)]/45">
          <span>VESSEL TELEMETRY</span>
          <span>SYNCING</span>
        </div>
      </div>
    </div>
  );
}
