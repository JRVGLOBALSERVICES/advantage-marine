"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────────────────────
   CONTACT CONSTELLATION — scroll-driven 3-stage vessel + contact payoff.

   Redesign 2026-06-04 (was: static held-assembled vessel + flanking nodes).
   Rj's reference video shows the support vessel assembling through THREE
   labelled stages — PART BY PART → INTERMEDIATE ASSEMBLY → COMBINED TOGETHER
   — then a closing feature callout. Here the vessel scrolls through those same
   three stages (the explode→assemble schedule already lives in
   VesselContactScene.explodeAmount), and the SIX real AMS contact points
   reveal as the COMBINED-stage payoff — the video's callout, grounded in
   actual Advantage Marine contacts.

   iOS-safe: a tall section with a `position: sticky` inner frame (never
   ScrollTrigger pin:true — banned on touch). GSAP writes scrollState.progress;
   the R3F loop reads it; gsap.ticker drives the DOM stage labels + node reveal.
   Stage language matches the home VesselHero — one system across the site.

   reduced-motion / no-WebGL → static poster band with the nodes shown, no
   scroll assembly (a real in-water frame, never a fabricated render).
   ────────────────────────────────────────────────────────────────────────── */

const VesselContactScene = dynamic(() => import("./VesselContactScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <span className="eyebrow animate-pulse text-[color:var(--color-accent-2)]">
        Bringing the vessel online…
      </span>
    </div>
  ),
});

/* reduced-motion / no-WebGL still — a real in-water frame, never a fake render */
const POSTER = "/media/service_diving/bluestream-offshore-1920-2-1.1920x0.jpg";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/* trapezoid envelope (0 outside [a,d], 1 across [b,c]) — one per stage label,
   aligned to the explode schedule in VesselContactScene (apart ≈0–0.15,
   intermediate ≈0.40–0.58, combined ≥0.85). */
function trap(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

/* ---------- inline glyphs (no icon lib — matches the rest of contact) ---------- */
const gp = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const PhoneGlyph = () => (<svg {...gp}><path d="M5 4h3l1.6 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></svg>);
const MailGlyph = () => (<svg {...gp}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const VideoGlyph = () => (<svg {...gp}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>);
const AnchorGlyph = () => (<svg {...gp}><circle cx="12" cy="4" r="2" /><path d="M12 6v14M5 12H3a9 9 0 0 0 18 0h-2M8 9h8" /></svg>);
const LifeRingGlyph = () => (<svg {...gp}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" /><path d="m5 5 4.2 4.2M14.8 14.8 19 19M19 5l-4.2 4.2M9.2 14.8 5 19" /></svg>);
const ChatGlyph = () => (<svg {...gp}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" /><path d="M8.5 11h7M8.5 14h4" /></svg>);

/* ---------- the three assembly stages (match home VesselHero language) ---------- */
type Stage = { no: string; title: string; sub: string; window: [number, number, number, number] };
const STAGES: Stage[] = [
  { no: "01", title: "Part by part",          sub: "Every system pulled apart",   window: [-0.1, -0.05, 0.18, 0.32] },
  { no: "02", title: "Intermediate assembly", sub: "Hull & machinery re-seated",  window: [0.40, 0.48, 0.60, 0.70] },
  // caption 03 announces the combined ship, then CLOSES (trailing edge 0.84→0.90)
  // BEFORE the contact cards reveal (0.90→1.0) — a clean sequential handoff, so
  // the big "Combined together" display type never sits under the left column.
  { no: "03", title: "Combined together",     sub: "Survey-ready — every line in", window: [0.74, 0.80, 0.84, 0.90] },
];

/* ---------- the six contact points (real AMS data) ---------- */
type Node = {
  id: string;
  side: "L" | "R";
  row: 0 | 1 | 2;
  label: string;
  glyph: React.ReactNode;
  value: string;
  sub?: string;
  href?: string;
};

const NODES: Node[] = [
  { id: "sales", side: "L", row: 0, label: "Sales & Quotes", glyph: <PhoneGlyph />, value: "Andrew Teow", sub: "+65 8393 3227", href: "tel:+6583933227" },
  { id: "email", side: "L", row: 1, label: "Email the Yard", glyph: <MailGlyph />, value: "sales@advantagemarine.com.my", sub: "Scope, drawings & RFQs", href: "mailto:sales@advantagemarine.com.my" },
  { id: "consult", side: "L", row: 2, label: "Consultation", glyph: <VideoGlyph />, value: "Dharmendra Varshney", sub: "+60 19 768 0816", href: "tel:+60197680816" },
  { id: "yard", side: "R", row: 0, label: "Main Yard", glyph: <AnchorGlyph />, value: "Gelang Patah, Johor", sub: "4,630 m² dive-support yard", href: "https://www.google.com/maps/search/?api=1&query=Taman+Laman+Setia,+81550+Gelang+Patah,+Johor" },
  { id: "support", side: "R", row: 1, label: "Dive Support", glyph: <LifeRingGlyph />, value: "Class survey · NDT · IRM", sub: "24/7 in-water response" },
  { id: "whatsapp", side: "R", row: 2, label: "WhatsApp", glyph: <ChatGlyph />, value: "Chat with the team", sub: "+60 16 448 8052", href: "https://wa.me/60164488052" },
];

/* node anchor centres in % of the band — drives BOTH the absolute placement and
   the SVG trace endpoints, so lines always meet the cards. */
const ROW_Y = [27, 50, 73];
const ANCHOR_X = { L: 22, R: 78 } as const; // inner edge of each card, toward hull
const HULL = { x: 50, y: 53 } as const;

function NodeCard({ node }: { node: Node }) {
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--cc-line)] bg-[color:var(--cc-node)] text-[color:var(--cc-glow)] shadow-[0_0_18px_-4px_var(--cc-glow)] transition-[box-shadow,transform] duration-300 group-hover:scale-105 group-hover:shadow-[0_0_26px_-2px_var(--cc-glow)]">
        {node.glyph}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--cc-glow)]">{node.label}</span>
        <span className="block truncate font-body text-[0.95rem] font-medium text-[color:var(--cc-fg)]">{node.value}</span>
        {node.sub && <span className="block truncate font-body text-[0.8rem] text-[color:var(--cc-fg-mute)]">{node.sub}</span>}
      </span>
    </>
  );

  const cls = "group flex items-center gap-[0.85rem] rounded-[14px] border border-[color:var(--cc-line)] bg-[color:var(--cc-card)] px-[0.9rem] py-[0.8rem] backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--cc-glow)]";

  return node.href ? (
    <a href={node.href} target={node.href.startsWith("http") ? "_blank" : undefined} rel={node.href.startsWith("http") ? "noopener noreferrer" : undefined} className={cls} aria-label={`${node.label}: ${node.value}${node.sub ? `, ${node.sub}` : ""}`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* stage caption — the reference's "PART BY PART" label, connected by a hairline
   trace down toward the vessel (one teal accent, restrained). Opacity + lift
   are driven imperatively by gsap.ticker; React only renders the shells. */
function StageCaption({
  stage,
  innerRef,
}: {
  stage: Stage;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={innerRef} className="absolute left-0 top-0 will-change-[opacity,transform]" style={{ opacity: 0 }}>
      <div className="flex items-baseline gap-[0.7rem]">
        <span className="font-display font-bold leading-none tabular-nums text-[color:var(--cc-glow)]" style={{ fontSize: "clamp(1.5rem,3vw,2.3rem)" }}>
          {stage.no}
        </span>
        <span className="h-[1.3em] w-px self-center bg-[color:var(--cc-line)]" />
        <span className="flex flex-col">
          <span className="font-display leading-[1.1] text-[color:var(--cc-fg)]" style={{ fontSize: "clamp(1.5rem,3.4vw,2.6rem)" }}>
            {stage.title}
          </span>
          <span className="eyebrow !tracking-[0.18em] normal-case mt-1 text-[color:var(--cc-fg-mute)]">
            {stage.sub}
          </span>
        </span>
      </div>
      {/* connector hairline down toward the hull — the video's label→ship trace */}
      <div className="ml-[0.6rem] mt-[0.6rem] flex flex-col items-start gap-1" aria-hidden>
        <span className="block h-[10vh] w-px" style={{ background: "linear-gradient(to bottom, var(--cc-glow), transparent)" }} />
        <span className="h-1.5 w-1.5 -translate-x-[0.18rem] rounded-full bg-[color:var(--cc-glow)] shadow-[0_0_10px_var(--cc-glow)]" />
      </div>
    </div>
  );
}

/* right-edge stage rail — 01·02·03, highlights the active stage. */
function StageRail({ current }: { current: number }) {
  return (
    <div className="hidden md:flex flex-col items-end gap-[var(--space-md)]" aria-hidden>
      {STAGES.map((s, i) => {
        const on = i === current;
        return (
          <div key={s.no} className="flex items-center gap-[0.6rem]">
            <span
              className="eyebrow tabular-nums !tracking-[0.2em] transition-colors duration-500"
              style={{ color: on ? "var(--cc-glow)" : "var(--cc-fg-mute)", fontSize: on ? "0.8rem" : "0.72rem" }}
            />
            <span className="font-display tabular-nums text-[0.72rem] transition-colors duration-500" style={{ color: on ? "var(--cc-glow)" : "var(--cc-fg-mute)" }}>
              {s.no}
            </span>
            <span
              className="block rounded-full transition-all duration-500"
              style={{ width: on ? 28 : 14, height: 2, background: on ? "var(--cc-glow)" : "var(--cc-line)" }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* shared LIGHT CAD stage tokens, scoped to this band only.

   Unified with the home VesselHero — warm sailcloth cream paper, ink copy,
   one marine-teal accent (the exact page tokens). The earlier dark
   holographic build dropped the navy+white PSV into near-black, where the
   vessel read far too dim against Rj's light-grey reference video; on the
   cream CAD stage the same model reads cleanly, the way the home hero does. */
const STAGE_TOKENS = {
  ["--cc-fg" as string]: "var(--color-ink)",
  ["--cc-fg-mute" as string]: "color-mix(in oklch, var(--color-ink) 62%, transparent)",
  ["--cc-glow" as string]: "var(--color-accent)",   // #30837b marine teal — reads on cream
  ["--cc-line" as string]: "color-mix(in oklch, var(--color-ink) 16%, transparent)",
  ["--cc-node" as string]: "color-mix(in oklch, var(--color-accent) 10%, transparent)",
  ["--cc-card" as string]: "color-mix(in oklch, var(--color-paper-2) 82%, transparent)",
  background: "var(--color-paper)",
  color: "var(--color-ink)",
} as React.CSSProperties;

/* faint holographic deck grid — very low contrast, masked to centre */
function DeckGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{
      backgroundImage: "linear-gradient(var(--cc-line) 1px, transparent 1px), linear-gradient(90deg, var(--cc-line) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(80% 70% at 50% 45%, #000 30%, transparent 100%)",
      WebkitMaskImage: "radial-gradient(80% 70% at 50% 45%, #000 30%, transparent 100%)",
      opacity: 0.12,
    }} />
  );
}

export default function ContactConstellation() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stage, setStage] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeLayerRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<SVGGElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(0);

  useEffect(() => {
    motionState.reduced = !!reduce;
    setMounted(true);
    setUseCanvas(!reduce && hasWebGL());
  }, [reduce]);

  const showCanvas = mounted && useCanvas && !failed;

  /* scroll driver — only while the canvas hero is live */
  useEffect(() => {
    if (!showCanvas || !sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        sceneState.invalidate?.();
      },
    });

    const tick = () => {
      const p = scrollState.progress;
      sectionRef.current?.setAttribute("data-p", p.toFixed(3));
      // contact-node payoff — reveal AFTER caption 03 has closed (0.90 → 1.0),
      // a sequential handoff so the cards never overlap the stage display type.
      const reveal = smoothstep(clamp01((p - 0.9) / 0.1));
      // stage captions — each owns its full open→hold→close via its own trapezoid
      // window (caption 03 closes by 0.90, before the cards reveal). No coupling
      // to `reveal`, so nothing can leave a half-faded label under the column.
      captionRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = trap(p, ...STAGES[i].window);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 22}px)`;
      });
      if (nodeLayerRef.current) {
        nodeLayerRef.current.style.opacity = String(reveal);
        nodeLayerRef.current.style.transform = `translateY(${(1 - reveal) * 18}px)`;
        nodeLayerRef.current.style.pointerEvents = reveal > 0.6 ? "auto" : "none";
      }
      // the stage rail recedes as the payoff arrives so the six cards own the
      // frame cleanly (rail otherwise peeks behind the R column).
      if (railRef.current) railRef.current.style.opacity = String(1 - reveal);
      if (traceRef.current) traceRef.current.style.opacity = String(reveal * 0.9);
      // stage rail index
      const cur = p < 0.38 ? 0 : p < 0.72 ? 1 : 2;
      if (cur !== stageRef.current) {
        stageRef.current = cur;
        setStage(cur);
      }
    };
    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      sceneState.invalidate = null;
    };
  }, [showCanvas]);

  /* ============ reduced-motion / no-WebGL — static poster band ============ */
  if (mounted && !showCanvas) {
    return (
      <section
        aria-label="Contact Advantage Marine — every line to the yard"
        className="relative isolate overflow-hidden border-y border-[color:var(--color-rule)] py-[var(--space-2xl)]"
        style={STAGE_TOKENS}
      >
        <DeckGrid />
        <div className="relative mx-auto max-w-[min(1320px,94vw)] px-[clamp(1.5rem,4vw,4rem)]">
          <div className="mb-[var(--space-xl)]">
            <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--cc-glow)]">Every line to the yard</p>
            <h2 className="font-display leading-[1.08] text-[color:var(--cc-fg)]" style={{ fontSize: "var(--text-h2)" }}>
              Contact Advantage Marine
            </h2>
          </div>
          <div className="mb-[var(--space-lg)] overflow-hidden rounded-[18px] border border-[color:var(--cc-line)]">
            <img src={POSTER} alt="Advantage Marine support vessel in offshore operation" className="h-[42vh] min-h-[18rem] w-full object-cover opacity-90" />
          </div>
          <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2 lg:grid-cols-3">
            {NODES.map((n) => (<NodeCard key={n.id} node={n} />))}
          </div>
        </div>
      </section>
    );
  }

  /* ============ scroll-driven 3-stage hero (canvas live) ============ */
  return (
    <section
      ref={sectionRef}
      aria-label="Contact Advantage Marine — assembling, every line to the yard"
      className="relative isolate border-y border-[color:var(--color-rule)]"
      style={{ height: "320lvh", ...STAGE_TOKENS }}
    >
      <div className="sticky top-0 h-[100lvh] overflow-hidden">
        {/* 3D layer — scroll-driven explode→assemble (no hold).
            Opaque CREAM canvas (no `dark`) — the scene paints its own warm
            stage + lights the navy/white PSV to read clearly, matching the
            home hero and Rj's light-grey reference video. */}
        <div className="absolute inset-0">
          {mounted && (
            <VesselContactScene active onContextLost={() => setFailed(true)} />
          )}
        </div>

        <DeckGrid />

        {/* desktop SVG traces — node inner-edge → hull, revealed at combined */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="cc-glow-f" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g ref={traceRef} filter="url(#cc-glow-f)" style={{ opacity: 0 }}>
            {NODES.map((n, i) => {
              const fx = ANCHOR_X[n.side];
              const fy = ROW_Y[n.row];
              const cx = (fx + HULL.x) / 2;
              const d = `M ${fx} ${fy} Q ${cx} ${fy}, ${HULL.x} ${HULL.y}`;
              return (
                <g key={n.id}>
                  <path d={d} fill="none" stroke="var(--cc-line)" strokeWidth={0.22} vectorEffect="non-scaling-stroke" />
                  <path d={d} fill="none" stroke="var(--cc-glow)" strokeWidth={0.4} strokeLinecap="round" strokeDasharray="3 9" vectorEffect="non-scaling-stroke" className={reduce ? "" : "cc-flow"} style={{ animationDelay: `${i * 0.5}s` }} />
                </g>
              );
            })}
            <circle cx={HULL.x} cy={HULL.y} r={0.7} fill="var(--cc-glow)" className={reduce ? "" : "cc-pulse"} />
          </g>
        </svg>

        {/* persistent eyebrow + heading (top-left) */}
        <div className="pointer-events-none absolute left-[clamp(1.5rem,4vw,4rem)] top-[clamp(1.5rem,4vw,3.5rem)]">
          <p className="eyebrow mb-[var(--space-2xs)] text-[color:var(--cc-glow)]">Every line to the yard</p>
          <h2 className="font-display leading-[1.08] text-[color:var(--cc-fg)]" style={{ fontSize: "var(--text-h3)" }}>
            Contact Advantage Marine
          </h2>
        </div>

        {/* changing stage captions — sit below the heading, connector toward hull */}
        <div className="pointer-events-none absolute left-[clamp(1.5rem,4vw,4rem)] top-[clamp(7rem,16vh,10rem)] w-[min(30rem,80vw)]">
          {STAGES.map((s, i) => (
            <StageCaption key={s.no} stage={s} innerRef={(el) => (captionRefs.current[i] = el)} />
          ))}
        </div>

        {/* right-edge stage rail */}
        <div ref={railRef} className="absolute right-[clamp(1rem,3vw,2.5rem)] top-1/2 -translate-y-1/2 pointer-events-none">
          <StageRail current={stage} />
        </div>

        {/* ---- contact-node payoff — revealed at the COMBINED stage ---- */}
        <div ref={nodeLayerRef} className="absolute inset-0" style={{ opacity: 0 }}>
          {/* desktop: nodes flank the assembled vessel */}
          <div className="relative mx-auto hidden h-full max-w-[min(1320px,94vw)] px-[clamp(1.5rem,4vw,4rem)] lg:block">
            {NODES.map((n) => (
              <div
                key={n.id}
                className="absolute w-[clamp(15rem,21vw,18rem)]"
                style={{ top: `${ROW_Y[n.row]}%`, transform: "translateY(-50%)", ...(n.side === "L" ? { left: "0%" } : { right: "0%" }) }}
              >
                <NodeCard node={n} />
              </div>
            ))}
          </div>

          {/* mobile/tablet: nodes as a 2-col grid in the lower frame, over a scrim
              (the vessel pans up on portrait, leaving the bottom clear) */}
          <div className="absolute inset-x-0 bottom-0 lg:hidden">
            <div className="h-[34vh]" style={{ background: "linear-gradient(to top, var(--color-paper) 8%, color-mix(in oklch, var(--color-paper) 78%, transparent) 55%, transparent 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 px-[clamp(1rem,5vw,2rem)] pb-[clamp(1.25rem,5vh,2.5rem)]">
              <div className="grid grid-cols-1 gap-[0.6rem] sm:grid-cols-2">
                {NODES.map((n) => (<NodeCard key={n.id} node={n} />))}
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue — fades out as the payoff lands */}
        <motion.div
          className="pointer-events-none absolute bottom-[var(--space-md)] left-1/2 -translate-x-1/2"
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? {} : { opacity: [0, 1, 1, 0], y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <span className="eyebrow !tracking-[0.28em] text-[color:var(--cc-fg-mute)]">Scroll to assemble</span>
        </motion.div>
      </div>
    </section>
  );
}
