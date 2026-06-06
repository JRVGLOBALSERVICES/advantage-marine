"use client";

/* ──────────────────────────────────────────────────────────────────────────
   CONTACT — REACH BAND ("every line to the yard")
   Redesigned 2026-06: the static support-vessel photo is gone. This is now a
   dark, motion-rich feature band — animated sonar rings + a faint deck grid
   behind six live contact channels that stagger in and glow on hover. The dark
   band breaks up the cream page and makes the teal accents read.
   ────────────────────────────────────────────────────────────────────────── */

import { motion, useReducedMotion } from "motion/react";
import { BorderBeam } from "@/components/ui/magic/BorderBeam";

/* ---------- inline glyphs (no icon lib) ---------- */
const gp = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const PhoneGlyph = () => (<svg {...gp}><path d="M5 4h3l1.6 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></svg>);
const MailGlyph = () => (<svg {...gp}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const VideoGlyph = () => (<svg {...gp}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>);
const AnchorGlyph = () => (<svg {...gp}><circle cx="12" cy="4" r="2" /><path d="M12 6v14M5 12H3a9 9 0 0 0 18 0h-2M8 9h8" /></svg>);
const LifeRingGlyph = () => (<svg {...gp}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" /><path d="m5 5 4.2 4.2M14.8 14.8 19 19M19 5l-4.2 4.2M9.2 14.8 5 19" /></svg>);
const ChatGlyph = () => (<svg {...gp}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" /><path d="M8.5 11h7M8.5 14h4" /></svg>);

type Node = {
  id: string;
  label: string;
  glyph: React.ReactNode;
  value: string;
  sub?: string;
  href?: string;
  featured?: boolean;
};

const NODES: Node[] = [
  { id: "sales", label: "Sales & Quotes", glyph: <PhoneGlyph />, value: "Andrew Teow", sub: "+65 8393 3227", href: "tel:+6583933227" },
  { id: "email", label: "Email the Yard", glyph: <MailGlyph />, value: "sales@advantagemarine.com.my", sub: "Scope, drawings & RFQs", href: "mailto:sales@advantagemarine.com.my", featured: true },
  { id: "consult", label: "Consultation", glyph: <VideoGlyph />, value: "Dharmendra Varshney", sub: "+60 19 768 0816", href: "tel:+60197680816" },
  { id: "yard", label: "Main Yard", glyph: <AnchorGlyph />, value: "Gelang Patah, Johor", sub: "4,630 m² dive-support yard", href: "https://www.google.com/maps/search/?api=1&query=Taman+Laman+Setia,+81550+Gelang+Patah,+Johor" },
  { id: "support", label: "Dive Support", glyph: <LifeRingGlyph />, value: "Class survey · NDT · IRM", sub: "24/7 in-water response" },
  { id: "whatsapp", label: "WhatsApp", glyph: <ChatGlyph />, value: "Chat with the team", sub: "+60 16 448 8052", href: "https://wa.me/60164488052" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* dark stage tokens — scoped to this band */
const STAGE_TOKENS = {
  ["--cc-fg" as string]: "var(--color-paper)",
  ["--cc-fg-mute" as string]: "color-mix(in oklch, var(--color-paper) 60%, transparent)",
  ["--cc-glow" as string]: "var(--color-accent-2)",
  ["--cc-line" as string]: "color-mix(in oklch, var(--color-paper) 14%, transparent)",
  ["--cc-node" as string]: "color-mix(in oklch, var(--color-accent-2) 16%, transparent)",
  ["--cc-card" as string]: "color-mix(in oklch, var(--color-paper) 6%, transparent)",
  background: "var(--color-ink)",
  color: "var(--color-paper)",
} as React.CSSProperties;

/* faint deck grid, masked to centre */
function DeckGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{
      backgroundImage: "linear-gradient(var(--cc-line) 1px, transparent 1px), linear-gradient(90deg, var(--cc-line) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(80% 80% at 50% 40%, #000 20%, transparent 100%)",
      WebkitMaskImage: "radial-gradient(80% 80% at 50% 40%, #000 20%, transparent 100%)",
      opacity: 0.14,
    }} />
  );
}

/* sonar rings pulsing out from the centre — the "every line to the yard" motif */
function Sonar({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ width: 160, height: 160, borderColor: "color-mix(in oklch, var(--color-accent-2) 36%, transparent)" }}
          initial={{ scale: 0.25, opacity: 0 }}
          animate={{ scale: [0.25, 3.4], opacity: [0, 0.45, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: i * 1.75, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function NodeCard({ node }: { node: Node }) {
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--cc-line)] bg-[color:var(--cc-node)] text-[color:var(--cc-glow)] shadow-[0_0_18px_-4px_var(--cc-glow)] transition-[box-shadow,transform] duration-300 group-hover:scale-110 group-hover:shadow-[0_0_28px_-2px_var(--cc-glow)]">
        {node.glyph}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--cc-glow)]">{node.label}</span>
        <span className="block truncate font-body text-[0.95rem] font-medium text-[color:var(--cc-fg)]">{node.value}</span>
        {node.sub && <span className="block truncate font-body text-[0.8rem] text-[color:var(--cc-fg-mute)]">{node.sub}</span>}
      </span>
      <span className="ml-auto translate-x-[-4px] text-[color:var(--cc-glow)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden>
        →
      </span>
    </>
  );

  const cls = "group relative flex items-center gap-[0.85rem] overflow-hidden rounded-[14px] border border-[color:var(--cc-line)] bg-[color:var(--cc-card)] px-[0.9rem] py-[0.9rem] backdrop-blur-md transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-[color:var(--cc-glow)] hover:bg-[color:color-mix(in_oklch,var(--color-paper)_10%,transparent)]";

  const beam = node.featured ? <BorderBeam size={70} duration={7} /> : null;

  return node.href ? (
    <a href={node.href} target={node.href.startsWith("http") ? "_blank" : undefined} rel={node.href.startsWith("http") ? "noopener noreferrer" : undefined} className={cls} aria-label={`${node.label}: ${node.value}${node.sub ? `, ${node.sub}` : ""}`}>
      {inner}
      {beam}
    </a>
  ) : (
    <div className={cls}>{inner}{beam}</div>
  );
}

export default function ContactConstellation() {
  const reduce = useReducedMotion();
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  // constant variants; animation is gated by the parent's initial/whileInView
  const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

  return (
    <section
      aria-label="Contact Advantage Marine — every line to the yard"
      className="relative isolate overflow-hidden border-y border-[color:var(--color-rule)] py-[var(--space-2xl)]"
      style={STAGE_TOKENS}
    >
      <DeckGrid />
      <Sonar on={!reduce} />
      {/* top/bottom fade so the band blends into the cream sections */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24" style={{ background: "linear-gradient(to bottom, color-mix(in oklch, var(--color-ink) 90%, transparent), transparent)" }} />

      <div className="relative mx-auto max-w-[min(1320px,94vw)] px-[clamp(1.5rem,4vw,4rem)]">
        <motion.div
          className="mb-[var(--space-xl)] max-w-[44rem]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--cc-glow)]">Every line to the yard</p>
          <h2 className="font-display leading-[1.08] text-[color:var(--cc-fg)]" style={{ fontSize: "var(--text-h2)" }}>
            Six ways to reach the team.
          </h2>
          <p className="mt-[var(--space-md)] font-body text-[color:var(--cc-fg-mute)]" style={{ fontSize: "var(--text-lead)" }}>
            Sales, technical consultation, the Johor yard or a 24/7 dive-support
            line — pick the channel that fits and we respond promptly.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial={reduce ? false : "hidden"}
          whileInView={reduce ? {} : "show"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {NODES.map((n) => (
            <motion.div key={n.id} variants={item}>
              <NodeCard node={n} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
