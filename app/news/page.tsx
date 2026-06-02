import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import newsData from "@/lib/content/news.json";

export const metadata: Metadata = {
  title: "News — Advantage Marine Services",
  description:
    "Advantage Marine Services news and events — including Oil & Gas Asia (OGA) 2024 and 2025 at the Kuala Lumpur Convention Centre.",
};

type Post = { title: string; date: string; excerpt: string | null };

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsPage() {
  const posts = (newsData.posts as Post[]).slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main>
      <PageHeader
        eyebrow="News & events"
        title="Where AMS shows up."
        lead="Industry events, exhibitions and milestones — Discover the AMS Difference."
      />

      <div className="max-w-[min(900px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        {posts.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.05}>
            <article className="py-[var(--space-xl)] border-b border-[color:var(--color-rule)] first:pt-0">
              <p className="eyebrow !tracking-[0.18em] normal-case mb-[var(--space-sm)]" style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
                <time dateTime={p.date}>{fmtDate(p.date)}</time>
              </p>
              <h2 className="font-display font-bold leading-[1.15] tracking-[-0.01em]" style={{ fontSize: "var(--text-h3)" }}>
                {p.title}
              </h2>
              {p.excerpt && (
                <p className="mt-[var(--space-md)] leading-[1.7] measure" style={{ color: "color-mix(in oklch, var(--color-ink) 72%, transparent)" }}>
                  {p.excerpt}
                </p>
              )}
            </article>
          </Reveal>
        ))}

        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center gap-4">
          <p className="font-display" style={{ fontSize: "var(--text-h3)" }}>Meet the team next.</p>
          <Link href="/contact" className="cta-primary">Talk to AMS</Link>
        </Reveal>
      </div>
    </main>
  );
}
