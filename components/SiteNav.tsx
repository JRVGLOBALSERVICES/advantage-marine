"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/news", label: "News" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div
        className="mx-auto mt-[var(--space-md)] max-w-[min(1200px,92vw)] flex items-center justify-between
                   rounded-[18px] pointer-events-auto transition-all duration-300
                   px-[var(--space-md)] py-[0.55rem]"
        style={{
          background: scrolled
            ? "color-mix(in oklch, var(--color-paper) 82%, transparent)"
            : "color-mix(in oklch, var(--color-paper) 55%, transparent)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--color-rule)",
          boxShadow: scrolled ? "0 6px 24px -16px var(--color-ink)" : "none",
        }}
      >
        <Link href="/" className="flex items-center shrink-0" aria-label="Advantage Marine Services — home">
          {/* real AMS logo image (not a text wordmark) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/advantage-marine-logo-03.png"
            alt="Advantage Marine Services"
            className="h-7 sm:h-8 w-auto"
            width={2864}
            height={442}
          />
        </Link>

        <div className="hidden md:flex items-center gap-[var(--space-lg)] text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="font-body font-medium transition-colors whitespace-nowrap"
                style={{ color: active ? "var(--color-accent)" : "color-mix(in oklch, var(--color-ink) 70%, transparent)" }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/contact" className="cta-primary !py-2 !px-4 !text-sm whitespace-nowrap">
            Talk to AMS
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid place-items-center h-9 w-9 rounded-full border border-[color:var(--color-rule)]"
          >
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? (
                <path d="M4 4l10 10M14 4L4 14" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M2 5h14M2 9h14M2 13h14" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      {open && (
        <div
          className="md:hidden pointer-events-auto mx-auto mt-2 max-w-[min(1200px,92vw)] rounded-[18px] p-[var(--space-sm)] grid gap-1"
          style={{
            background: "color-mix(in oklch, var(--color-paper) 96%, transparent)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--color-rule)",
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-[var(--space-sm)] py-3 rounded-[12px] font-body font-medium hover:bg-[color:var(--color-aqua)]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
