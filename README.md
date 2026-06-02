# Advantage Marine Services

> In-water inspection, robotic NDT and marine engineering for the shipping and offshore industries — surveyed afloat, never dry-docked. Johor, Malaysia.

**Live (Vercel):** https://advantage-marine.vercel.app
**Content source (client's production site):** https://www.advantagemarine.com.my/ (WordPress + Elementor — scraped, real copy/images only)

The site's signature is a pinned scroll-narrative hero: a ducted azimuth
thruster begins **exploded** on load, then its parts fly in and lock into one
whole across the first stretch of scroll ("every system, brought together"),
before the narrative continues into the capability beats. The whole site runs a
**warm sailcloth-cream light theme — no dark surfaces anywhere.**

## Stack

- **Framework**: Next.js 14.2 (App Router, RSC)
- **Styling**: Tailwind CSS 3.4 + OKLCH design tokens in `app/globals.css`
- **3D**: React Three Fiber v8.18 + drei v9 (`three` 0.170) — one sticky `<Canvas>`
- **Motion**: GSAP 3.15 + ScrollTrigger (scroll-scrub), `motion` 11 (registry component reveals)
- **Smooth scroll**: Lenis 1.3 (wrapped once at the layout root via `SmoothScroll`)
- **UI components**: pulled from the reference registries (reactbits · magicui · aceternity · uiverse), adapted to the marine cream palette
- **Maps**: `dotted-map` (SVG dotted world map, no 2nd WebGL context — iOS-safe)
- **Hosting**: Vercel — auto-deploys on every push to `main`

## Design system

Locked system lives in `design.md`; tokens live in `app/globals.css`
(`/* Hallmark · genre: modern-minimal · macrostructure: family · OKLCH warm sailcloth cream + marine teal */`).

### Colors (OKLCH — warm sailcloth cream + marine teal, NO dark surfaces)

The cream `#F4EBD9` was chosen **deliberately distinct** from the other JRV
creams (`#EFEAE0` on seagull/jrv-systems, `#FAF6EE` on jrv-systems bg) — sandier
and a touch deeper so Advantage Marine reads as its own brand. Sail + sea.

- `--color-paper` `oklch(0.943 0.024 82)` — **#F4EBD9** warm sand cream, page base
- `--color-paper-2` `oklch(0.966 0.017 84)` — **#FAF4E8** lighter lift / panel
- `--color-paper-3` `oklch(0.908 0.030 80)` — **#ECDFC7** deeper card / hover wash
- `--color-ink` `oklch(0.20 0.025 215)` — deep teal-black, body text (~13:1 on cream)
- `--color-rule` `oklch(0.862 0.022 80)` — **#DDD2BC** warm hairline divider
- `--color-accent` `oklch(0.53 0.072 188)` — **#30837b** links / structure / fills
- `--color-accent-2` `oklch(0.72 0.100 174)` — **#44BBA4** hover / highlight
- `--color-accent-ink` `oklch(0.985 0.010 85)` — warm white on teal fills (~6:1)
- `--color-aqua` / `--color-aqua-2` — soft seafoam washes (warmed for the cream base)
- 3D scene backdrop + fog re-warmed to **#F6EFE1** so the hero canvas sits seamlessly on cream
- Legacy dark-build token names (`--color-abyss`, `--color-navy`, `--color-cyan`, `--color-amber`) are kept as **back-compat aliases that now resolve to the cream/teal values** — so no dark surface can leak through an old reference.

### Typography
- **Display**: Space Grotesk (`--font-display`) — 400 / 500 / 700
- **Body / eyebrow**: Inter (`--font-body`) — 400 / 500
- Fluid, width-**and**-height-adaptive scale via `clamp(min, min(Xvw, Yvh), max)`
  so short laptops shrink type: `--text-display`, `--text-h2`, `--text-h3`,
  `--text-stat`, `--text-lead`, `--text-card`, `--text-eyebrow`. No `text-lg`,
  no arbitrary `text-[Npx]`.

> Note: the design brief floated Cinzel + Kaushan Script as a display/accent pair;
> the build **held to Space Grotesk + Inter** for legibility on dense NDT/marine
> data surfaces (Cinzel caps + Kaushan brush read luxury-wedding, fighting the
> technical-B2B direction). Font family revisit is parked pending Rj's call.

### Spacing (4pt)
`--space-xs 0.5rem · sm 1rem · md 1.5rem · lg 2.5rem · xl 4rem · 2xl 6rem`

### Motion tokens
- **Smooth scroll**: Lenis (synced to GSAP via `gsap.ticker`)
- **Scroll-scrub hero**: CSS `position: sticky` (`sticky top-0 h-[100lvh]`) inside a tall section — **NOT `ScrollTrigger pin:true`** (pin is banned on touch: iOS URL-bar dvh re-measure + rubber-band = scroll-stuck). Sticky-scrub is the iOS-safe equivalent and keeps the same desktop hero on mobile, scaled to width.
- **Reveal**: predictive `whileInView` with ~120px positive margin, `once:false` (entry choreography replays on re-entry)
- **Easings**: `--ease-out` cubic-bezier(.22,1,.36,1) · `--ease-in` · `--ease-in-out`
- **Durations**: `--dur-fast 160ms · --dur-mid 320ms`
- Full `prefers-reduced-motion` branch: hero collapses to an honest static layout, all copy in flow

## Research + references

**Brief**: replicate the Rolls-Royce "Propulsion Systems" engine hero (client-supplied
reels) — Apple-keynote pinned-scroll, one sticky 3D canvas, HTML copy scrubbed over
it — adapted to marine propulsion. Aesthetic canon picks: **lusion.co** (WebGL craft /
3D narrative), **activetheory.net** (beat-latched interactive case-study scroll),
terminal-industrial (dense technical data surfaces). Palette from a confirmed
Muzli set, re-anchored from its original dark canvas to the cream light theme.

Page IA mirrors the client's real WordPress site 1:1 (primary nav: Home · About ·
Services · Projects · News · Contact), verified against `wp-sitemap.xml` + rendered
header — not a guess.

Patterns implemented:
- **Extract → assemble 3D mechanic** — thruster explodes on load, parts stagger-lock into one whole on scroll (procedural multi-part meshes — the only clean path to a labelled explode)
- **Pinned scroll-narrative hero** — sticky `100lvh` canvas, copy beats driven off scroll progress (`PropellerHero.tsx`)
- **Material contrast** — bronze rotor vs cool stainless duct/shaft (kills the flat mono-metal AI look)
- **Registry components, not hand-rolled**: `BlurText` (reactbits) · `NumberTicker` + `Marquee` (magicui) · `WorldMap` + `BackgroundBeams` (aceternity, recolored to brand teal) · `ScrollCue` (uiverse)
- **N5 floating-pill nav** with the real AMS logo **image** (not a text wordmark)
- **iOS-safe choices**: a single R3F canvas; SVG dotted `WorldMap` + `BackgroundBeams` instead of a 2nd WebGL globe (a 2nd context on top of R3F is the iOS-scroll-stuck pattern)

## File structure

```
app/
  layout.tsx            Root layout, fonts (Space Grotesk + Inter), metadata, <SmoothScroll>
  globals.css           OKLCH cream tokens + Hallmark stamp
  page.tsx              Home — hero + capability beats + reach
  about/page.tsx        About Us — AMS since 2014, IMCA/OGP, Johor facility
  services/page.tsx     Services hub — Marine & Diving · NDT · Engineering/Steel · Trading
  projects/page.tsx     Projects portfolio
  news/page.tsx         News / events
  contact/page.tsx      Contact form + reach
components/
  SiteNav.tsx           N5 floating-pill nav, AMS logo image
  SiteFooter.tsx        Footer — "Site by JRV"
  PageHeader.tsx        Inner-page header band
  PropellerHero.tsx     Pinned scroll narrative + copy beats
  PropellerScene.tsx    R3F scene — ducted azimuth thruster, explode→assemble
  GlobalReach.tsx       WorldMap arcs + BackgroundBeams + class-society Marquee
  ContactForm.tsx       Contact form
  Reveal.tsx            Predictive whileInView reveal wrapper
  ScrollCue.tsx(.module.css)  Scroll-down indicator
  SmoothScroll.tsx      Lenis wrapper
  ui/                   Registry components — BlurText · NumberTicker · Marquee · WorldMap · BackgroundBeams
lib/
  content/              Real scraped copy as JSON — about · services · projects · news (no fabrication)
  scroll.ts             Shared scroll/motion state (no re-render for fades)
  utils.ts              cn() — clsx + tailwind-merge
public/
  brand/                Real AMS logo assets (white + dark variants)
```

## Local development

```bash
git clone https://github.com/JRVGLOBALSERVICES/advantage-marine.git
cd advantage-marine
npm install
npm run dev          # http://localhost:3000
```

No environment variables required — the site is fully static (no backend, no Supabase).

## Deployment

- Hosted on Vercel — **auto-deploys on every push to `main`** (direct-to-main, no PR).
- Verify the git author email is GitHub-verified before each push — Vercel hard-blocks
  unverified-author commits. Current author: `jrvservices.main@gmail.com` ✓.
- Attack Challenge Mode: **off** · SSO / password protection: **null** (so the public + browser-test agents reach it).
- `metadataBase` pinned to the Vercel URL so OG/scraper previews resolve pre-DNS.
- Gate before each commit: `npm run build` (catches RSC/client-boundary errors) + tsc + lint + `hallmark audit`.

## Known gaps / follow-on

- **Real AMS photography → Cloudinary CDN** across pages — logos are in place; the full
  photo set from `wp-content/uploads` is not yet migrated (push to Cloudinary to dodge
  Vercel anti-bot 403s on `/public` fetches).
- **Component extras parked**: cult-ui / watermelon-ui card stacks, more aceternity pieces,
  gsapify-generated motion, Lottie hero/feature accents + animated icons.
- The thruster centerpiece is **procedural geometry** (required for the labelled explode
  mechanic) — not a Meshy GLB.
- The live 3D settle/timing hasn't been eyeballed in a real browser (headless WebGL is
  unreliable on the build box) — preview on the Vercel URL to tune feel.

## Acknowledgments

- Built with Friday (Rj's WhatsApp-accessed assistant)
- Visual quality bar: jrvglobalservices.co
- Component sources: reactbits · magicui · aceternity · uiverse
