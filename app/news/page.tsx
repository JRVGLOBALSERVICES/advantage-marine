import type { Metadata } from "next";
import Link from "next/link";
import NewsHero from "@/components/news/NewsHero";
import Reveal from "@/components/Reveal";
import { ShineBorder } from "@/components/ui/magic/ShineBorder";
import { SheenCard } from "@/components/ui/cult/SheenCard";
import newsData from "@/lib/content/news.json";

export const metadata: Metadata = {
  title: "News — Advantage Marine Services",
  description:
    "Advantage Marine Services news and events — including Oil & Gas Asia (OGA) 2024 and 2025 at the Kuala Lumpur Convention Centre.",
  alternates: { canonical: "/news" },
};

type Post = { title: string; date: string; excerpt: string | null };

/* Map each real post to a real photograph from public/media via the manifest.
   Keyed on title so order changes don't break the pairing. Fallback covers any
   future post added to news.json. */
const POST_MEDIA: Record<string, { src: string; alt: string }> = {
  "Oil & Gas Asia 2025": {
    src: "/media/csr/WhatsApp-Image-2025-10-15-at-2.54.59-PM.jpeg",
    alt: "Advantage Marine Services at the Oil & Gas Asia 2025 exhibition, Kuala Lumpur Convention Centre",
  },
  "Oil & Gas Asia 2024": {
    src: "/media/home/photo_6305331321802710100_y.jpg",
    alt: "The AMS team in conversation with stakeholders at Oil & Gas Asia 2024",
  },
  "Discover the AMS difference": {
    src: "/media/csr/AMS-DIVER-3-scaled-e1616042912140.jpg",
    alt: "AMS commercial diver suited up before an in-water inspection dive",
  },
};
const FALLBACK_MEDIA = {
  src: "/media/projects/Photo-1.jpeg",
  alt: "Advantage Marine Services offshore operations",
};

function media(title: string) {
  return POST_MEDIA[title] ?? FALLBACK_MEDIA;
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsPage() {
  const posts = (newsData.posts as Post[]).slice().sort((a, b) => b.date.localeCompare(a.date));
  const [featured, ...rest] = posts;
  const featuredMedia = media(featured.title);

  return (
    <main>
      <NewsHero image={featuredMedia.src} imageAlt={featuredMedia.alt} />

      <div className="mx-auto max-w-[min(1200px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        {/* Section masthead — editorial, asymmetric. */}
        <Reveal>
          <div className="mb-[var(--space-xl)] flex items-end justify-between gap-6 border-b border-[color:var(--color-rule)] pb-[var(--space-md)]">
            <div>
              <p className="eyebrow mb-[var(--space-sm)]">The latest</p>
              <h2 className="font-display font-bold leading-[1.1] tracking-[-0.01em]" style={{ fontSize: "var(--text-h2)" }}>
                From the field
              </h2>
            </div>
            <span className="font-display tabular-nums hidden sm:block" style={{ fontSize: "var(--text-eyebrow)", letterSpacing: "0.18em", color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
              {String(posts.length).padStart(2, "0")} ENTRIES
            </span>
          </div>
        </Reveal>

        {/* FEATURED — most recent post, large two-column editorial panel framed by
            the Magic UI ShineBorder (animated teal ring). Real image + full excerpt. */}
        <Reveal>
          <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
            <ShineBorder borderWidth={1.5} duration={16} />
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-full md:min-h-[24rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredMedia.src}
                  alt={featuredMedia.alt}
                  className="h-full w-full object-cover"
                />
                {/* teal corner tab — the one place the accent reads as editorial chrome */}
                <span
                  className="absolute left-0 top-0 px-4 py-2 font-display"
                  style={{
                    fontSize: "var(--text-eyebrow)",
                    letterSpacing: "0.18em",
                    background: "var(--color-accent)",
                    color: "var(--color-accent-ink)",
                  }}
                >
                  FEATURED
                </span>
              </div>

              <div className="flex flex-col justify-center gap-[var(--space-md)] p-[clamp(1.5rem,3.5vw,3rem)]">
                <p className="eyebrow !tracking-[0.18em] normal-case" style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
                  <time dateTime={featured.date}>{fmtDate(featured.date)}</time>
                </p>
                <h3 className="font-display font-bold leading-[1.1] tracking-[-0.01em]" style={{ fontSize: "var(--text-h2)" }}>
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p className="measure leading-[1.7]" style={{ color: "color-mix(in oklch, var(--color-ink) 72%, transparent)" }}>
                    {featured.excerpt}
                  </p>
                )}
                <span aria-hidden className="mt-1 block h-px w-16 bg-[color:var(--color-accent)]" />
              </div>
            </div>
          </article>
        </Reveal>

        {/* REMAINING posts — cult-ui SheenCards, each with a real photo, date,
            title and excerpt. No empty cards: every entry carries real content. */}
        {rest.length > 0 && (
          <div className="mt-[var(--space-xl)] grid gap-6 sm:grid-cols-2">
            {rest.map((p, i) => {
              const m = media(p.title);
              return (
                <Reveal key={p.title} delay={(i % 2) * 0.06}>
                  <SheenCard
                    className="h-full"
                    eyebrow={fmtDate(p.date)}
                    index={String(posts.length - 1 - i).padStart(2, "0")}
                    title={p.title}
                    description={
                      p.excerpt ??
                      "The brand line that still sets the standard for every dive, inspection and fabrication AMS delivers."
                    }
                    imageSrc={m.src}
                    imageAlt={m.alt}
                  />
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Closing CTA — outcome-led, leads onward to the team / contact. */}
        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--color-rule)] pt-[var(--space-xl)]">
          <p className="font-display leading-[1.1]" style={{ fontSize: "var(--text-h2)" }}>
            Meet the team next.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="cta-secondary">
              About AMS
            </Link>
            <Link href="/contact" className="cta-primary">
              Talk to AMS
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
