# Design — Advantage Marine Services

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Consulted: design-3d-stack.md §Anti-AI-slop checklist, §5 (type/color), §6E
(hybrid-3D-element B2B IA), §7 (page blueprints), §8 (SEO).

## Genre
modern-minimal — B2B marine/offshore NDT, diving and engineering. Technical
buyers (shipowners, fleet ops, class surveyors, offshore operators). Legible,
data-forward, restrained. NOT consumer-soft, NOT SaaS-bento.

## Macrostructure family
- Marketing pages (`/`):        Pinned Scroll-Narrative (3D propeller hero) → Stat-Led proof → service grid → CTA.
- Content/index pages (`/services` `/projects` `/news`): Workbench — dense, labelled, table/grid of real records.
- Document pages (`/about` `/contact`): Long Document — measured prose, leadership, offices, class-society proof.

Pages share the system (type, colour, CTA voice, nav, footer). They vary only in
macrostructure within these families. Consistency wins over per-page variety.

## Theme — custom OKLCH, warm sailcloth cream + marine teal (NO dark surfaces)
Per Rj 2026-06-02: no dark backgrounds anywhere; warm cream base, distinct from
the creams already used on other JRV sites (seagull/jrv-systems `#EFEAE0`,
jrv-systems bg `#FAF6EE`). Advantage Marine anchors on a sandier "sailcloth"
cream `#F4EBD9` — a coastal sail+sea pairing with the marine teal. Deep teal
carries text + structure, mint teal is the single accent doing the heavy
lifting, seafoam washes are small accents only (never a hero background).

- `--color-paper`    oklch(0.943 0.024 82)   /* #F4EBD9 — warm sand "sailcloth" cream, page base */
- `--color-paper-2`  oklch(0.966 0.017 84)   /* #FAF4E8 — lighter lift / panel */
- `--color-paper-3`  oklch(0.908 0.030 80)   /* #ECDFC7 — card alt / hover wash (deeper cream) */
- `--color-ink`      oklch(0.20 0.025 215)   /* deep teal-black — body + display text */
- `--color-rule`     oklch(0.862 0.022 80)   /* #DDD2BC — warm hairline divider */
- `--color-accent`   oklch(0.53 0.072 188)   /* #30837b — links, structure, fills */
- `--color-accent-2` oklch(0.72 0.100 174)   /* #44BBA4 — hover / highlight */
- `--color-accent-ink` oklch(0.985 0.010 85) /* warm white text on accent fills */
- `--color-aqua`     oklch(0.930 0.030 178)  /* soft seafoam wash (warmed for cream) */
- `--color-aqua-2`   oklch(0.900 0.045 176)  /* deeper seafoam */
- `--color-focus`    oklch(0.55 0.110 186)
- 3D scene backdrop + fog: `#F6EFE1` (cream family — matches the page, no cool-white rectangle).

NO dark surfaces — there is no dark band anywhere in the system; legacy
`--color-abyss`/`--color-navy` aliases now resolve to the cream paper.

Accent budget: ≤ 5% of any viewport. Muted text = `--color-ink` at opacity
(`/60`, `/70`). The locked JRV "pure ink or white only" rule governs TEXT colour
(no slate/zinc off-white type) — it does NOT forbid the warm cream *background*.
Type stays pure ink (tinted via opacity); never set cream-coloured text.

## Typography
- Display: Cinzel, weight 400/500/600/700 — inscriptional Roman caps serif
  (Rj's pick, 2026-06-02). Used for every heading, stat numeral and the footer
  wordmark via `.font-display`.
- Accent: Kaushan Script, weight 400 — brush script, the single expressive
  statement moment ONLY (footer statement). Never for body, labels or eyebrows.
  Wired as `--font-accent` / `.font-accent`.
- Body:    Inter, weight 400/500. Cinzel is caps-only and Kaushan is a script;
  neither carries running copy, so the legible body sans stays (matches the
  brief's "no body added").
- No `text-lg`. Strict fluid scale below.
- Display tracking: +0.012em on `.font-display` — caps serif needs air, so the
  old −0.02em geometric-sans tracking is centrally neutralized (not per-element).
- Type scale anchor: `--text-display` = clamp(2.6rem, min(8.5vw, 13.6vh), 7rem),
  width+height adaptive per [[feedback_hero_typography_width_and_height]].

## Spacing
4-point named scale in `globals.css` (`--space-xs`…`--space-2xl`). Pages use named
tokens, never raw values.

## Motion
- Easings: `--ease-out` cubic-bezier(0.22,1,0.36,1), `--ease-in`, `--ease-in-out`.
  Never browser default `ease`, never bounce/overshoot on UI state.
- Reveal pattern: fade + short slide on `whileInView`, `once:false`, predictive
  margin ~120px per [[feedback_observer_margin_positive]] / [[feedback_text_anim_magic_ui_canonical]].
- Smooth scroll: Lenis, wrapped once at layout. GSAP synced via ticker, not native
  scroll. Sticky-scrub R3F hero (CSS `position:sticky`, NOT ScrollTrigger pin) —
  iOS-safe per [[feedback_gsap_pin_mobile]] / [[feedback_css_sticky_is_safe_scrub]].
- Reduced-motion: spatial motion → ≤150ms opacity crossfade; 3D skipped.

## Microinteractions stance
- Silent success over celebratory toasts.
- Hover tooltip delay 800ms · focus delay 0ms.
- `:focus-visible` ring always visible (≥3:1), never animated.

## CTA voice
- Primary: filled `--color-accent`, white ink, pill, 2–4 words, outcome-led
  ("Request a quote", "Talk to AMS"). Risk reducer line where it fits.
- Secondary: hairline outline, ink text, same pill geometry ("Explore services").

## Per-page allowances
- Marketing (`/`): R3F hero + scroll motion + stat counters allowed.
- Content/index pages: motion limited to reveals + hover; no decorative 3D.
- Document pages: typography + reveals only.

## What pages MUST share
- The AMS logo image in the nav (not a text wordmark).
- The accent colour + ≤5% placement.
- Cinzel (display) + Inter (body); Kaushan accent reserved for the footer statement.
- CTA pill geometry + voice.
- The shared caliber footer (`SiteFooter`): editorial italic statement +
  HQ spec-sheet + capabilities/company/offices index + ADVANTAGE mega-wordmark
  sign-off + microbar. Footer is cream (`--color-paper-2`), never dark.
- JRV credit via `FooterJrvLogoReveal` — the real JRV **logo image** (Cloudinary),
  not plain "Site by JRV" text. Ink/55 label + teal hover underline.

## Shared caliber components (ported from seagull-group + jrv-systems-new)
Reusable motion/structure components, all recolored to the cream+teal system,
no new dependencies (motion 11 + gsap 3.15 already present):
- `ui/WordReveal` — word-by-word IO reveal (blur+rise), `once:false`, predictive margin.
- `ui/TextSpotlightReveal` — GSAP char spotlight (blur/scale, stagger from centre),
  rewired off `@gsap/react` to plain `useEffect` + `gsap.context`.
- `ui/StackedCards` / `StackedCard` — motion stagger stack-in reveal.
- `ui/MagneticLink` — pointer-magnetic CTA wrapper (pointer-fine + motion-OK only).
Home service section uses numbered editorial spec-rows (NOT identical feature cards)
+ a real-discipline marquee; about teaser uses TextSpotlightReveal + real NumberTicker stats.

## What pages MAY differ on
- Macrostructure within the page-type family.
- Hero/section archetype within the family allowance.

## Content source — scraped-only, NO fabrication
All copy, stats, names, projects and news come from the real WordPress site
(advantagemarine.com.my), structured into `lib/content/*.json`. Theme-demo
placeholders (em_portfolios demos, demo testimonials, lorem team names) are
EXCLUDED. Where source content is missing, leave a flagged TODO — never invent.
Real anchors: est. 2014, 4,630 m² Johor facility, IMCA/OGP, class societies
(ABS/DNV/BV/LR/ClassNK/KR/IRS/CCS/RINA), leadership (Andrew Teow MD, Victor Wong,
Dean Chapman), 15 real project records, OGA 2024/2025 news.

## Stamp
`/* Hallmark · genre: modern-minimal · macrostructure: <family> · design-system: design.md · designed-as-app */`
