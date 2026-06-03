# Advantage Marine Services

> In-water inspection, robotic NDT and marine engineering for the shipping and offshore industries — surveyed afloat, never dry-docked. Johor, Malaysia.

**Live (Vercel):** https://advantage-marine.vercel.app
**Content source (client's production site):** https://www.advantagemarine.com.my/ (WordPress + Elementor — scraped, real copy/images only)

The site's signature is a scroll-narrative hero: a **Blender-authored 26-part
support vessel** — 11 exterior parts (Hull · Deck · Bridge · Funnel · Mast ·
Crane · Bulwark · BootTopping · twin Props · Rudder) plus a **15-part engine-room
interior** (twin main diesels · two gensets + yellow trim · port/stbd azimuth
Z-drives · a forward tunnel bow-thruster · the engine-room deck) — reads as an
exploded technical diagram at scroll-top and **assembles into the complete hull**
as you scroll, on a slow turntable. The interior machinery (teal bodies, yellow
highlights, dark-steel deck) **drops out below the hull on explode and nests back
inside when assembled** — the concept video's "look inside" reveal. The home hero
runs a **dark CAD-visualization stage** matching the client's concept video: deep
ink backdrop (`#080c14`), a cyan grid floor, neon **connection lines** (exterior
parts only, to keep the interior read clean) tracing each part to its assembled
position, a pulsating target ring, and a **one-shot expanding scan-pulse** that
bursts from the vessel and fades as assembly completes (scroll 0.86→1.0). A single bright cyan
(`#22eeff`, the video's accent) carries the lines, ring, pulse and the hero
eyebrow + stat. Three capability beats (whole-of-vessel → read underwater →
cleared by class) latch to the assembly progress. The **rest of the site** keeps
the warm sailcloth-cream light theme; the dark CAD treatment is scoped to the
home hero stage only.

The scroll mechanic is **iOS-safe `position: sticky`** (a 340lvh section with a
sticky 100lvh stage), never `ScrollTrigger pin:true` — with a full static-photo
fallback for reduced-motion / no-WebGL / context-lost.

> **Hero history (kept, not deleted):** the ducted-azimuth-thruster hero
> (`PropellerHero` / `PropellerScene`) → the jack-up rig hero (`RigHero` /
> `RigHeroScene`, now `RigShowcase`) → the **vessel hero** (`VesselHero` /
> `VesselContactScene`), current as of 2026-06-03. Each prior hero is retained
> in the repo for history. The **contact page** is slated for its own DIFFERENT
> model (a work-class ROV) — its 3D band is currently a placeholder; the page is
> otherwise fully functional (hero + enquiry form + key contacts).

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
- **Display**: Cinzel (`--font-display`) — 400 / 500 / 600 / 700 — inscriptional
  Roman caps serif. Drives every heading, stat numeral and the footer wordmark
  via `.font-display`. Tracking neutralized to **+0.012em** centrally (caps serifs
  need air; the old −0.02em geometric-sans tracking would cramp them).
- **Accent**: Kaushan Script (`--font-accent` / `.font-accent`) — 400 — brush
  script reserved for the **single expressive statement** (footer statement) only.
  Never used for body, labels or eyebrows.
- **Body / eyebrow**: Inter (`--font-body`) — 400 / 500. Retained because Cinzel
  is caps-only and Kaushan is a script — neither carries running copy.
- Fluid, width-**and**-height-adaptive scale via `clamp(min, min(Xvw, Yvh), max)`
  so short laptops shrink type: `--text-display`, `--text-h2`, `--text-h3`,
  `--text-stat`, `--text-lead`, `--text-card`, `--text-eyebrow`. No `text-lg`,
  no arbitrary `text-[Npx]`.

> Note: Cinzel + Kaushan is Rj's explicit pick (2026-06-02). It's a luxury/editorial
> pairing rather than a technical-B2B one — Kaushan is deliberately confined to a
> single statement moment to keep the brush script from reading as wedding-y across
> the dense NDT/marine surfaces.

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
- **Scroll-driven explode→assemble 3D mechanic** — `vessel.glb` (Blender-authored, Draco-compressed ~87KB, 26 named meshes — 11 exterior + 15 engine-room interior) mounts via `useGLTF` + DRACOLoader; scroll maps `p=0` exploded technical diagram → `p=1` assembled hull. Each exterior part drifts along the axis it really comes off the hull on, keyed to the GLB's true axis (X=length, stern −X / bow +X; Y=up; Z=beam, twin props split ∓0.69m); interior machinery drops out below the hull on explode (negative-Y offsets) for the "look inside" reveal and nests back when assembled — no faked cross-section.
- **iOS-safe sticky scroll-narrative hero** — a 340lvh section with a `sticky top-0 h-[100lvh]` stage (NOT `ScrollTrigger pin:true`), three copy beats trapezoid-faded off scroll progress via `gsap.ticker` (no React re-render per frame), full static-photo fallback (`VesselHero.tsx`).
- **SEO infrastructure** — `app/robots.ts`, `app/sitemap.ts` (6 static routes + one URL per news post + one URL per service), `app/manifest.ts`; sitewide `Organization` + `LocalBusiness` + `WebSite` JSON-LD (`@id`-linked, real Gelang Patah / Johor facts) in the root layout; per-page canonical + `summary_large_image` twitter card + `en_MY` locale.
- **News slug/detail pages** — `app/news/[slug]/page.tsx` pre-renders one SSG article per post (`generateStaticParams` from `lib/news.ts`), mirroring the live WordPress per-post sitemap structure. Editorial layout (Cinzel display headline, hero photo, lead + body, prev/next, closing CTA), `NewsArticle` JSON-LD + `og:type=article` + self-canonical. Index featured panel and cards link through to the detail pages. The live `em_event` theme-demo posts (overcome-nonprofit etc.) are excluded as fake; class-society `post` slugs are cert logos, not news.
- **Per-service slug/detail pages** — the live WordPress site exposes one URL per service (`/marine-diving`, `/ndt`, `/rope-access`, `/engineering-steelwork`, `/salvage-works`, `/trading-others`, `/ovolifts`, `/chasing-m2-rov`); the rebuild had only the single `/services` hub with anchored sections. `app/services/[slug]/page.tsx` pre-renders one SSG page per service (9 routes; `generateStaticParams` from `lib/services.ts`), nested under the hub with **slugs matching the live site**. Full-bleed hero + Cinzel H1, summary lead, body, capabilities matrix, real per-discipline photo gallery (core only), related-scope rail, CTA; `Service` + `BreadcrumbList` JSON-LD + per-service canonical + OG. Hub bucket headings ("Full capability →") and specialty cards now link through. `lib/services.ts` is the single source of service data + the deduped media maps (lifted out of `ServicesContent` so hub + detail can't drift).
- **Honest per-discipline imagery (no repeated photos)** — the original WordPress scrape dumped ONE shared underwater-welding gallery (md5-identical) into 8 service folders, so iccp/rov/salvage/ovolifts/trading all showed the SAME photos as diving. `ServicesContent` now maps each discipline to an explicit curated gallery so no image repeats anywhere; Ovolifts uses the real manufacturer product shot (AMS is the authorized SE-Asia distributor).
- **Material + FX contrast** — cool gunmetal steel (`#586068`) so the rig reads on cream + `ContactShadows` grounding; `@react-three/postprocessing` Bloom catches only the raw-HDR emissive FX (`luminanceThreshold 1.0`), `ToneMapping` last in the chain
- **Registry components, not hand-rolled**: `BlurText` (reactbits) · `NumberTicker` + `Marquee` (magicui) · `WorldMap` + `BackgroundBeams` (aceternity, recolored to brand teal) · `ScrollCue` (uiverse)
- **N5 floating-pill nav** with the real AMS logo **image** (not a text wordmark)
- **iOS-safe choices**: a single R3F canvas; SVG dotted `WorldMap` + `BackgroundBeams` instead of a 2nd WebGL globe (a 2nd context on top of R3F is the iOS-scroll-stuck pattern)

## File structure

```
app/
  layout.tsx            Root layout, fonts (Cinzel + Kaushan + Inter), metadata, sitewide JSON-LD, <SmoothScroll>
  globals.css           OKLCH cream tokens + Hallmark stamp
  robots.ts             robots.txt (blocks none public; sitemap ref)
  sitemap.ts            XML sitemap — 6 static + one URL per news post + one per service
  manifest.ts           PWA web manifest
  page.tsx              Home — VesselHero + capability beats + reach
  about/page.tsx        About Us — AMS since 2014, IMCA/OGP, Johor facility
  services/page.tsx     Services hub — Marine & Diving · NDT · Engineering/Steel · Trading
  services/[slug]/page.tsx Service detail (SSG per service; Service + BreadcrumbList JSON-LD)
  projects/page.tsx     Projects portfolio
  news/page.tsx         News / events — index, cards link to [slug]
  news/[slug]/page.tsx  News article detail (SSG per post; NewsArticle JSON-LD)
  contact/page.tsx      Contact form + reach
components/
  SiteNav.tsx           N5 floating-pill nav, AMS logo image
  SiteFooter.tsx        Footer — "Site by JRV"
  PageHeader.tsx        Inner-page header band
  VesselHero.tsx        CURRENT home hero — iOS-safe sticky narrative + 3 beats
  VesselContactScene.tsx R3F scene — 26-part vessel (11 exterior + 15 engine-room interior), scroll explode→assemble with interior "look inside" reveal; dark CAD stage (cyan grid + exterior-only connection lines + target ring + one-shot scan-pulse), teal scan as secondary accent
  VesselShowcase.tsx    Showcase wrapper (vessel scene + copy)
  RigShowcase.tsx       (retained, unused) prior jack-up rig hero
  RigHeroScene.tsx      (retained, unused) R3F jack-up rig scene + Bloom FX
  PropellerHero.tsx     (retained, unused) prior thruster hero shell
  PropellerScene.tsx    (retained, unused) prior R3F ducted-azimuth-thruster scene
  ServicesContent.tsx   Services body — curated per-discipline galleries (deduped)
  GlobalReach.tsx       WorldMap arcs + BackgroundBeams + class-society Marquee
  ContactForm.tsx       Contact form
  Reveal.tsx            Predictive whileInView reveal wrapper
  ScrollCue.tsx(.module.css)  Scroll-down indicator
  SmoothScroll.tsx      Lenis wrapper
  ui/                   Registry components — BlurText · NumberTicker · Marquee · WorldMap · BackgroundBeams
lib/
  content/              Real scraped copy as JSON — about · services · projects · news (no fabrication)
  news.ts               Shared news post data + title→media map + helpers (index + [slug])
  services.ts           Shared service data + deduped per-discipline media maps (hub + [slug])
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

- **Contact page 3D model** — the contact page needs its own DIFFERENT hero model
  (planned: a work-class ROV, Blender-authored part-by-part). The 3D band is a
  placeholder; the page is otherwise complete.
- **Chasing M2 ROV product photo** — the M2 specialty card currently uses a subsea
  context photo. Swap in AMS's official Chasing M2 product image (held as the
  authorized SE-Asia distributor) — the manufacturer site is a JS-walled SPA, so
  it couldn't be scraped cleanly.
- **Real AMS photography → Cloudinary CDN** across pages — logos + a clean set of
  live-site category photos (`public/media/_live/`) are in place; the full
  `wp-content/uploads` set is not yet migrated (push to Cloudinary to dodge Vercel
  anti-bot 403s on `/public` fetches).
- **Seagull-parity sections** still to port from the seagull homepage (Stats /
  Testimonials / CertStrip / ClientLogoStrip / StatusPulse / a real /privacy page).
- **OG-image + favicon visuals** — the SEO *infra* is shipped; the icon / apple-icon /
  opengraph-image visuals still route through hallmark.
- **Device audit** (iPhone 11 / iPad / MacBook 13) against the skill + reference MDs
  is the final gate before "done".
- The live 3D settle/timing hasn't been eyeballed in a real browser (headless WebGL is
  unreliable on the build box) — preview on the Vercel URL to tune feel.

## Acknowledgments

- Built with Friday (Rj's WhatsApp-accessed assistant)
- Visual quality bar: jrvglobalservices.co
- Component sources: reactbits · magicui · aceternity · uiverse
