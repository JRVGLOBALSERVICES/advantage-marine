import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Reveal from "@/components/Reveal";
import { allServices, serviceBySlug } from "@/lib/services";

/* One static page per service — mirrors the live site's one-URL-per-service
   structure (/marine-diving, /ndt, /rope-access …), nested under the /services
   hub with the same slugs. Any slug not in services.json → 404. */
export function generateStaticParams() {
  return allServices().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = serviceBySlug(slug);
  if (!svc) return { title: "Services — Advantage Marine Services" };

  const desc =
    svc.summary ??
    `${svc.title} — ${svc.body.slice(0, 150).replace(/\s+\S*$/, "")}…`;

  return {
    title: `${svc.title} — Advantage Marine Services`,
    description: desc,
    alternates: { canonical: `/services/${svc.slug}` },
    openGraph: {
      type: "website",
      title: `${svc.title} — Advantage Marine Services`,
      description: desc,
      url: `/services/${svc.slug}`,
      images: [{ url: svc.hero, alt: svc.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: svc.title,
      description: desc,
    },
  };
}

const muted = {
  color: "color-mix(in oklch, var(--color-ink) 72%, transparent)",
} as const;
const faint = {
  color: "color-mix(in oklch, var(--color-ink) 55%, transparent)",
} as const;

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = serviceBySlug(slug);
  if (!svc) notFound();

  // Sibling services for the related-scope rail (exclude self, cap at 4).
  const related = allServices().filter((s) => s.slug !== svc.slug).slice(0, 4);

  // JSON-LD: Service entity + breadcrumb trail (Home › Services › this).
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: svc.title,
    description: svc.summary ?? svc.body,
    serviceType: svc.title,
    image: [svc.hero],
    areaServed: { "@type": "Country", name: "Malaysia" },
    provider: {
      "@type": "Organization",
      name: "Advantage Marine Services (M) Sdn Bhd",
    },
    url: `/services/${svc.slug}`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Services", item: "/services" },
      {
        "@type": "ListItem",
        position: 3,
        name: svc.title,
        item: `/services/${svc.slug}`,
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ───────── full-bleed service hero ───────── */}
      <section className="relative h-[68lvh] min-h-[420px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svc.hero}
          alt={svc.alt}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-ink) 82%, transparent) 0%, color-mix(in oklch, var(--color-ink) 40%, transparent) 42%, color-mix(in oklch, var(--color-ink) 8%, transparent) 76%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[min(1100px,92vw)] items-end px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2.5rem,7vh,5rem)]">
          <div>
            <p
              className="eyebrow mb-[var(--space-md)] !tracking-[0.18em]"
              style={{ color: "var(--color-accent-ink)" }}
            >
              {svc.eyebrow}
            </p>
            <h1
              className="font-display font-bold leading-[1.06] tracking-[-0.01em] max-w-[18ch]"
              style={{
                fontSize: "var(--text-display)",
                color: "var(--color-accent-ink)",
                overflowWrap: "anywhere",
              }}
            >
              {svc.title}
            </h1>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-[min(900px,92vw)] px-[clamp(1.5rem,4vw,4rem)] pb-[var(--space-2xl)] pt-[var(--space-xl)]">
        {/* breadcrumb back to the hub */}
        <Reveal>
          <Link
            href="/services"
            className="eyebrow inline-flex items-center gap-2 !tracking-[0.18em]"
            style={{ color: "var(--color-accent)" }}
          >
            <span aria-hidden>←</span> All services
          </Link>
        </Reveal>

        {/* lead / summary */}
        {svc.summary && (
          <Reveal>
            <p
              className="mt-[var(--space-lg)] font-display leading-[1.5]"
              style={{ fontSize: "var(--text-lead)" }}
            >
              {svc.summary}
            </p>
          </Reveal>
        )}

        {/* body */}
        <Reveal>
          <p className="mt-[var(--space-lg)] measure leading-[1.8]" style={muted}>
            {svc.body}
          </p>
        </Reveal>

        {/* capabilities matrix */}
        {svc.capabilities.length > 0 && (
          <Reveal className="mt-[var(--space-2xl)]">
            <p className="eyebrow mb-[var(--space-md)] !tracking-[0.18em]" style={faint}>
              Scope of work
            </p>
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-rule)]">
              {svc.capabilities.map((c) => (
                <li
                  key={c}
                  className="flex gap-3 bg-[color:var(--color-paper)] px-[var(--space-md)] py-3 leading-[1.5] transition-colors duration-300 hover:bg-[color:var(--color-paper-3)]"
                  style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                  <span
                    className="mt-[0.55em] h-[6px] w-[6px] shrink-0 rotate-45 bg-[color:var(--color-accent)]"
                    aria-hidden
                  />
                  <span
                    style={{
                      color: "color-mix(in oklch, var(--color-ink) 80%, transparent)",
                    }}
                  >
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* real photo gallery — core disciplines only */}
        {svc.gallery.length > 0 && (
          <Reveal className="mt-[var(--space-2xl)]">
            <p className="eyebrow mb-[var(--space-md)] !tracking-[0.18em]" style={faint}>
              On the job
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {svc.gallery.map((src, i) => (
                <figure
                  key={src}
                  className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)]"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${svc.title} — field photograph ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </figure>
              ))}
            </div>
          </Reveal>
        )}

        {/* related services */}
        <Reveal className="mt-[var(--space-2xl)] border-t border-[color:var(--color-rule)] pt-[var(--space-xl)]">
          <p className="eyebrow mb-[var(--space-md)] !tracking-[0.18em]" style={faint}>
            Related scope
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/services/${r.slug}`}
                className="group flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)] px-[var(--space-lg)] py-[var(--space-md)] transition-colors duration-300 hover:bg-[color:var(--color-paper-3)]"
                style={{ transitionTimingFunction: "var(--ease-out)" }}
              >
                <span
                  className="font-display leading-[1.2] group-hover:text-[color:var(--color-accent)]"
                  style={{ fontSize: "var(--text-h3)" }}
                >
                  {r.title}
                </span>
                <span aria-hidden style={{ color: "var(--color-accent)" }}>
                  →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* closing CTA */}
        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--color-rule)] pt-[var(--space-xl)]">
          <p
            className="font-display leading-[1.1]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Need this scope priced?
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/services" className="cta-secondary">
              All services
            </Link>
            <Link href="/contact" className="cta-primary">
              Request a quote
            </Link>
          </div>
        </Reveal>
      </article>
    </main>
  );
}
