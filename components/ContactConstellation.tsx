"use client";

/* ──────────────────────────────────────────────────────────────────────────
   CONTACT BAND — every line to the yard.

   2026-06-05: the scroll-driven WebGL vessel scene (VesselHeroV4Scene → GLB)
   was removed alongside the rest of the Blender 3D. This band keeps the exact
   editorial treatment the no-WebGL fallback already shipped — a real in-water
   frame over the six live AMS contact points — now as the single, lightweight
   render. No canvas, no GLB, no scroll rig.
   ────────────────────────────────────────────────────────────────────────── */

/* a real in-water frame, never a fabricated render */
const POSTER = "/media/service_diving/bluestream-offshore-1920-2-1.1920x0.jpg";

/* ---------- inline glyphs (no icon lib — matches the rest of contact) ---------- */
const gp = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const PhoneGlyph = () => (<svg {...gp}><path d="M5 4h3l1.6 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></svg>);
const MailGlyph = () => (<svg {...gp}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const VideoGlyph = () => (<svg {...gp}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>);
const AnchorGlyph = () => (<svg {...gp}><circle cx="12" cy="4" r="2" /><path d="M12 6v14M5 12H3a9 9 0 0 0 18 0h-2M8 9h8" /></svg>);
const LifeRingGlyph = () => (<svg {...gp}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" /><path d="m5 5 4.2 4.2M14.8 14.8 19 19M19 5l-4.2 4.2M9.2 14.8 5 19" /></svg>);
const ChatGlyph = () => (<svg {...gp}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" /><path d="M8.5 11h7M8.5 14h4" /></svg>);

/* ---------- the six contact points (real AMS data) ---------- */
type Node = {
  id: string;
  label: string;
  glyph: React.ReactNode;
  value: string;
  sub?: string;
  href?: string;
};

const NODES: Node[] = [
  { id: "sales", label: "Sales & Quotes", glyph: <PhoneGlyph />, value: "Andrew Teow", sub: "+65 8393 3227", href: "tel:+6583933227" },
  { id: "email", label: "Email the Yard", glyph: <MailGlyph />, value: "sales@advantagemarine.com.my", sub: "Scope, drawings & RFQs", href: "mailto:sales@advantagemarine.com.my" },
  { id: "consult", label: "Consultation", glyph: <VideoGlyph />, value: "Dharmendra Varshney", sub: "+60 19 768 0816", href: "tel:+60197680816" },
  { id: "yard", label: "Main Yard", glyph: <AnchorGlyph />, value: "Gelang Patah, Johor", sub: "4,630 m² dive-support yard", href: "https://www.google.com/maps/search/?api=1&query=Taman+Laman+Setia,+81550+Gelang+Patah,+Johor" },
  { id: "support", label: "Dive Support", glyph: <LifeRingGlyph />, value: "Class survey · NDT · IRM", sub: "24/7 in-water response" },
  { id: "whatsapp", label: "WhatsApp", glyph: <ChatGlyph />, value: "Chat with the team", sub: "+60 16 448 8052", href: "https://wa.me/60164488052" },
];

/* warm sailcloth-cream stage tokens, scoped to this band only — one marine-teal
   accent on cream, matching the rest of the site. */
const STAGE_TOKENS = {
  ["--cc-fg" as string]: "var(--color-ink)",
  ["--cc-fg-mute" as string]: "color-mix(in oklch, var(--color-ink) 62%, transparent)",
  ["--cc-glow" as string]: "var(--color-accent)",
  ["--cc-line" as string]: "color-mix(in oklch, var(--color-ink) 16%, transparent)",
  ["--cc-node" as string]: "color-mix(in oklch, var(--color-accent) 10%, transparent)",
  ["--cc-card" as string]: "color-mix(in oklch, var(--color-paper-2) 82%, transparent)",
  background: "var(--color-paper)",
  color: "var(--color-ink)",
} as React.CSSProperties;

/* faint deck grid — very low contrast, masked to centre */
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

export default function ContactConstellation() {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={POSTER} alt="Advantage Marine support vessel in offshore operation" className="h-[42vh] min-h-[18rem] w-full object-cover opacity-90" />
        </div>
        <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2 lg:grid-cols-3">
          {NODES.map((n) => (<NodeCard key={n.id} node={n} />))}
        </div>
      </div>
    </section>
  );
}
