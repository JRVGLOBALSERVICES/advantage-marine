// Module-level scroll bridge: GSAP ScrollTrigger writes `progress` (0→1),
// the R3F render loop reads it inside useFrame — no React re-renders.
export const scrollState = { progress: 0 };

// set once on mount from prefers-reduced-motion; read inside useFrame
export const motionState = { reduced: false };

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// normalized progress within a [a,b] window, clamped to 0..1
export const window01 = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// smoothstep ease
export const smooth = (t: number) => t * t * (3 - 2 * t);
