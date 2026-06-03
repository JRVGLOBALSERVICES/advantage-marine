import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Reveal from "@/components/Reveal";
import { allPosts, postBySlug, postMedia, fmtDate } from "@/lib/news";

/* Pre-render one static page per real post (matches the live sitemap's
   one-URL-per-post structure). Any slug not in news.json → 404. */
export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return { title: "News — Advantage Marine Services" };

  const desc = post.excerpt ?? `${post.title} — Advantage Marine Services.`;
  const media = postMedia(post.title);

  return {
    title: `${post.title} — Advantage Marine Services`,
    description: desc,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: desc,
      url: `/news/${post.slug}`,
      images: [{ url: media.src, alt: media.alt }],
      publishedTime: `${post.date}T00:00:00+08:00`,
    },
    twitter: { card: "summary_large_image", title: post.title, description: desc },
  };
}

const muted = {
  color: "color-mix(in oklch, var(--color-ink) 72%, transparent)",
} as const;
const faint = {
  color: "color-mix(in oklch, var(--color-ink) 55%, transparent)",
} as const;

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();

  const media = postMedia(post.title);

  // Previous / next within the chronological run (newest-first list).
  const ordered = allPosts();
  const idx = ordered.findIndex((p) => p.slug === post.slug);
  const newer = idx > 0 ? ordered[idx - 1] : null;
  const older = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  // JSON-LD: each post is a NewsArticle entity (E-E-A-T / rich-result coverage).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: `${post.date}T00:00:00+08:00`,
    image: [media.src],
    articleSection: "News",
    publisher: {
      "@type": "Organization",
      name: "Advantage Marine Services (M) Sdn Bhd",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `/news/${post.slug}` },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-[min(820px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)] pt-[calc(var(--space-2xl)+2rem)]">
        {/* Breadcrumb back to the index */}
        <Reveal>
          <Link
            href="/news"
            className="eyebrow inline-flex items-center gap-2 !tracking-[0.18em]"
            style={{ color: "var(--color-accent)" }}
          >
            <span aria-hidden>←</span> Dispatch
          </Link>
        </Reveal>

        {/* Masthead — date, then the Cinzel headline (the page's single h1) */}
        <Reveal>
          <p
            className="eyebrow mt-[var(--space-lg)] !tracking-[0.18em] normal-case"
            style={faint}
          >
            <time dateTime={post.date}>{post.dateLabel ?? fmtDate(post.date)}</time>
          </p>
          <h1
            className="mt-[var(--space-sm)] font-display font-bold leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: "var(--text-display)" }}
          >
            {post.title}
          </h1>
          <span
            aria-hidden
            className="mt-[var(--space-md)] block h-px w-16 bg-[color:var(--color-accent)]"
          />
        </Reveal>

        {/* Hero photograph */}
        <Reveal>
          <figure className="mt-[var(--space-xl)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)]">
            <div className="relative aspect-[16/9] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.src}
                alt={media.alt}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            </div>
          </figure>
        </Reveal>

        {/* Body — lead (excerpt) set larger, then the paragraphs */}
        <div className="mt-[var(--space-xl)] flex flex-col gap-[var(--space-lg)]">
          {post.excerpt && (
            <Reveal>
              <p
                className="font-display leading-[1.5]"
                style={{ fontSize: "var(--text-lead)" }}
              >
                {post.excerpt}
              </p>
            </Reveal>
          )}
          {(post.body ?? []).map((para, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <p className="measure leading-[1.8]" style={muted}>
                {para}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Prev / next within the run */}
        {(newer || older) && (
          <Reveal className="mt-[var(--space-2xl)] grid gap-4 border-t border-[color:var(--color-rule)] pt-[var(--space-xl)] sm:grid-cols-2">
            {older ? (
              <Link
                href={`/news/${older.slug}`}
                className="group flex flex-col gap-1"
              >
                <span className="eyebrow !tracking-[0.18em]" style={faint}>
                  ← Earlier
                </span>
                <span className="font-display leading-[1.2] group-hover:text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-h3)" }}>
                  {older.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link
                href={`/news/${newer.slug}`}
                className="group flex flex-col gap-1 sm:items-end sm:text-right"
              >
                <span className="eyebrow !tracking-[0.18em]" style={faint}>
                  Later →
                </span>
                <span className="font-display leading-[1.2] group-hover:text-[color:var(--color-accent)]" style={{ fontSize: "var(--text-h3)" }}>
                  {newer.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </Reveal>
        )}

        {/* Closing CTA */}
        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--color-rule)] pt-[var(--space-xl)]">
          <p
            className="font-display leading-[1.1]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Discover the AMS difference.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/news" className="cta-secondary">
              All news
            </Link>
            <Link href="/contact" className="cta-primary">
              Talk to AMS
            </Link>
          </div>
        </Reveal>
      </article>
    </main>
  );
}
