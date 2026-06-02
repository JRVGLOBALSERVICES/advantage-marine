"use client";

type Props = {
  logoUrl?: string;
  href?: string;
};

const DEFAULT_LOGO = "https://res.cloudinary.com/de3gn7o77/image/upload/logo.png";
const DEFAULT_HREF = "https://jrvsystems.app";

/**
 * "Site by JRV" credit with the real JRV logo image (not a text wordmark).
 * Plain anchor — no IntersectionObserver gate, so the credit can never go
 * invisible on iOS Safari. Cream-system recolor of seagull's
 * FooterJrvLogoReveal: ink/55 label + teal accent hover underline.
 */
export function FooterJrvLogoReveal({ logoUrl = DEFAULT_LOGO, href = DEFAULT_HREF }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center gap-2 pb-1 whitespace-nowrap"
      aria-label="Site by JRV — opens in new tab"
    >
      <span
        className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}
      >
        Site by
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt="JRV"
        className="h-5 w-auto transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-[color:var(--color-accent)] transition-transform duration-300 group-hover:scale-x-100"
      />
    </a>
  );
}
