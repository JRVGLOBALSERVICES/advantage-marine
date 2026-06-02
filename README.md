# Advantage Marine Services

> In-water inspection, robotic NDT and marine engineering for the shipping and offshore industries — surveyed afloat, never dry-docked. Johor, Malaysia.

**Live:** https://advantage-marine.vercel.app

The site's signature is a pinned scroll-narrative hero: a ducted azimuth
thruster begins **exploded** on load, then its parts fly in and lock into one
whole across the first ~28% of scroll ("every system, brought together"),
before the narrative continues through water currents → robotic UT-scan
sonar → global reach.

## Stack

- **Framework**: Next.js 14.2 (App Router, RSC)
- **Styling**: Tailwind CSS 3.4 + OKLCH design tokens in `app/globals.css`
- **3D**: React Three Fiber v8.18 + drei v9 (`three` 0.170) — one sticky `<Canvas>`
- **Motion**: GSAP 3.15 + ScrollTrigger (scroll-scrub), `motion` 11 (registry component reveals)
- **Smooth scroll**: Lenis 1.3 (wrapped once at the layout root)
- **UI components**: pulled from the reference registries (reactbits · magicui · aceternity · uiverse), adapted to the marine palette
- **Hosting**: Vercel (`jrv-services-projects` team)

## Design system

Stamp + tokens live in `app/globals.css` (`/* Hallmark · macrostructure: Pinned Scroll-Narrative (3D-first) */`).

### Colors (OKLCH, derived from advantagemarine.com.my)
- `--color-abyss` `oklch(0.17 0.035 240)` — deep-underwater base background
- `--color-navy` `oklch(0.33 0.072 238)` — #003b5c brand navy
- `--color-navy-2` `oklch(0.30 0.115 264)` — #002e70 deep brand blue
- `--color-cyan` `oklch(0.67 0.132 232)` — #0799d1 primary accent
- `--color-cyan-hi` `oklch(0.80 0.115 215)` — bright cyan (headline highlight)
- `--color-amber` `oklch(0.79 0.155 76)` — #f5b018 stat / CTA accent
- `--color-paper` `oklch(0.98 0.004 240)` — primary text
- `--color-mute` `oklch(0.72 0.02 240)` — muted text

### Typography
- **Display**: Space Grotesk (`--font-display`) — 700 / 300
- **Body / eyebrow**: Inter (`--font-body`) — 400 / 500
- Fluid, width-**and**-height-adaptive scale via `clamp(min, min(Xvw, Yvh), max)`
  so short laptops shrink type: `--text-display`, `--text-h2`, `--text-stat`,
  `--text-lead`, `--text-card`, `--text-eyebrow`. No `text-lg`, no arbitrary `text-[Npx]`.

### Spacing (4pt)
`--space-xs 0.5rem · sm 1rem · md 1.5rem · lg 2.5rem · xl 4rem · 2xl 6rem`

### Motion tokens
- **Smooth scroll**: Lenis (synced to GSAP via `gsap.ticker`)
- **Scroll-scrub**: GSAP ScrollTrigger, `scrub: true`, sticky `100lvh` inside a `340lvh` section
- **Easings**: `--ease-out` cubic-bezier(.22,1,.36,1) · `--ease-in` · `--ease-in-out`
- **Durations**: `--dur-fast 160ms · --dur-mid 320ms`
- Full `prefers-reduced-motion` branch: hero collapses to an honest static layout, all copy in flow

## Research + references

Brief: replicate the Rolls-Royce "Propulsion Systems" engine hero (two Instagram
reels supplied by the client) — Apple-keynote pinned-scroll, one sticky 3D canvas,
HTML copy scrubbed over it — adapted to marine propulsion.

Patterns implemented:
- **Extract → assemble 3D mechanic** — thruster explodes on load, parts stagger-lock into one whole on scroll (procedural multi-part meshes, the only clean path to a labelled explode)
- **Pinned scroll-narrative hero** — sticky `100lvh` canvas, trapezoid-windowed copy beats driven off `ScrollTrigger` progress (`PropellerHero.tsx`)
- **Material contrast** — bronze rotor vs cool stainless duct/shaft (kills the flat mono-metal AI look)
- **Registry components, not hand-rolled**: `BlurText` (reactbits) · `NumberTicker` + `Marquee` (magicui) · `WorldMap` + `BackgroundBeams` (aceternity) · `ScrollCue` (uiverse)
- **iOS-safe choices**: held back Threads / three-globe / Sparkles (each adds a 2nd WebGL context on top of the R3F canvas = the iOS-scroll-stuck pattern); WorldMap + Beams give the same visuals as pure SVG

## File structure

```
app/
  layout.tsx            Root layout, fonts, metadata, <SmoothScroll>
  page.tsx              Home — H1, hero, GlobalReach, services, about, footer
  globals.css           OKLCH tokens + Hallmark stamp
components/
  PropellerHero.tsx     Pinned scroll narrative + copy beats + nav
  PropellerScene.tsx    R3F scene — ducted azimuth thruster, explode→assemble
  GlobalReach.tsx       Beat 3 — WorldMap arcs + BackgroundBeams + class-society Marquee
  ScrollCue.tsx(.module.css)  Scroll-down indicator
  SmoothScroll.tsx      Lenis wrapper
  ui/                   Registry components (BlurText, NumberTicker, Marquee, WorldMap, BackgroundBeams)
lib/
  scroll.ts             Shared scroll/motion state (no re-render for fades)
  utils.ts              cn() — clsx + tailwind-merge
```

## Local development

```bash
git clone https://github.com/JRVGLOBALSERVICES/advantage-marine.git
cd advantage-marine
npm install
npm run dev          # http://localhost:3000
```

No environment variables required — the site is fully static (no backend).

## Deployment

- Hosted on Vercel (`jrv-services-projects` team), production alias `advantage-marine.vercel.app`.
- Deployed via Vercel CLI (`vercel --prod`); the GitHub repo is the source of record.
- Attack Challenge Mode: **off** · SSO / password protection: **null** (so the public + browser-test agents reach it).
- `metadataBase` pinned to the Vercel URL so OG/scraper previews resolve pre-DNS.

## Known gaps

- The thruster centerpiece is **procedural geometry** (required for the labelled explode mechanic) — not a Meshy GLB.
- The live 3D settle/timing hasn't been eyeballed in a real browser (headless WebGL is unreliable on the build box) — preview on the Vercel URL to tune feel.

## Acknowledgments

- Built with Friday (Rj's WhatsApp-accessed assistant)
- Visual quality bar: jrvglobalservices.co
- Component sources: reactbits · magicui · aceternity · uiverse
