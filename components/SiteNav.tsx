"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type NavLink = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

// Services carries a child nav to the four real disciplines (anchors that
// exist as section ids in ServicesContent).
const SERVICE_CHILDREN = [
  { href: "/services#marine-diving", label: "Commercial Diving" },
  { href: "/services#ndt", label: "Inspection & NDT" },
  { href: "/services#engineering-steelwork", label: "Engineering & Steelwork" },
  { href: "/services#trading-others", label: "Trading & Support" },
];

const LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services", children: SERVICE_CHILDREN },
  { href: "/projects", label: "Projects" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const openRef = useRef(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // entrance + hide-on-scroll-down / show-on-scroll-up, synced via Lenis→ScrollTrigger
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduce) {
      gsap.fromTo(
        bar,
        { y: -24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", delay: 0.12 }
      );
    }

    let lastY = 0;
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        setScrolled(y > 24);
        if (reduce || openRef.current) return;
        if (y > 140 && y > lastY + 4) {
          // scrolling down past the hero → tuck the bar away
          gsap.to(bar, { yPercent: -135, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        } else if (y < lastY - 4 || y < 140) {
          // scrolling up (or near the top) → bring it back
          gsap.to(bar, { yPercent: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        }
        lastY = y;
      },
    });
    return () => st.kill();
  }, []);

  // GSAP mobile sheet — staggered open / reverse close (sheet stays in the DOM)
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const links = sheetLinksRef.current.filter(Boolean) as HTMLAnchorElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // make sure a tucked-away bar comes back when the menu opens
    if (open && barRef.current) gsap.to(barRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out" });

    if (reduce) {
      gsap.set(sheet, { autoAlpha: open ? 1 : 0, height: open ? "auto" : 0 });
      gsap.set(links, { autoAlpha: open ? 1 : 0 });
      return;
    }

    const tl = gsap.timeline();
    if (open) {
      tl.set(sheet, { display: "grid" })
        .fromTo(
          sheet,
          { autoAlpha: 0, y: -10, scaleY: 0.96, transformOrigin: "top" },
          { autoAlpha: 1, y: 0, scaleY: 1, duration: 0.32, ease: "power3.out" }
        )
        .fromTo(
          links,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.34, ease: "power3.out", stagger: 0.06 },
          "-=0.18"
        );
    } else {
      tl.to(links, { autoAlpha: 0, y: 8, duration: 0.18, ease: "power2.in", stagger: 0.03 })
        .to(sheet, { autoAlpha: 0, y: -10, scaleY: 0.96, duration: 0.22, ease: "power2.in" }, "-=0.08")
        .set(sheet, { display: "none" });
    }
    return () => {
      tl.kill();
    };
  }, [open]);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div
        ref={barRef}
        className="mx-auto mt-[var(--space-md)] max-w-[min(1200px,92vw)] flex items-center justify-between
                   rounded-[18px] pointer-events-auto transition-[background,box-shadow] duration-300
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
            const linkColor = active
              ? "var(--color-accent)"
              : "color-mix(in oklch, var(--color-ink) 70%, transparent)";

            if (l.children) {
              return (
                <div key={l.href} className="group/dd relative">
                  <Link
                    href={l.href}
                    aria-haspopup="true"
                    className="group relative inline-flex items-center gap-1 font-body font-medium transition-colors whitespace-nowrap"
                    style={{ color: linkColor }}
                  >
                    {l.label}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 transition-transform duration-300 group-hover/dd:rotate-180"
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-1 inset-x-0 h-px origin-left bg-[color:var(--color-accent)] transition-transform duration-300 group-hover:scale-x-100"
                      style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
                    />
                  </Link>

                  {/* dropdown — bridged with pt-2 so the hover gap doesn't drop it */}
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-[opacity,transform] duration-200 group-hover/dd:visible group-hover/dd:translate-y-0 group-hover/dd:opacity-100 group-focus-within/dd:visible group-focus-within/dd:translate-y-0 group-focus-within/dd:opacity-100">
                    <div
                      className="min-w-[16rem] rounded-[14px] p-1.5"
                      style={{
                        background: "color-mix(in oklch, var(--color-paper) 96%, transparent)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--color-rule)",
                        boxShadow: "0 18px 40px -22px var(--color-ink)",
                      }}
                    >
                      {l.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="block rounded-[10px] px-3 py-2.5 font-body transition-colors hover:bg-[color:var(--color-aqua)]"
                          style={{ color: "color-mix(in oklch, var(--color-ink) 78%, transparent)", fontSize: "0.9rem" }}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={l.href}
                href={l.href}
                className="group relative font-body font-medium transition-colors whitespace-nowrap"
                style={{ color: linkColor }}
              >
                {l.label}
                {/* animated underline — grows from the left on hover / active */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-1 inset-x-0 h-px origin-left bg-[color:var(--color-accent)] transition-transform duration-300 group-hover:scale-x-100"
                  style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
                />
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
                <path d="M2 5h14M2 9h14M2 13h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile sheet — stays mounted; GSAP drives open/close so it animates both ways */}
      <div
        ref={sheetRef}
        className="md:hidden pointer-events-auto mx-auto mt-2 max-w-[min(1200px,92vw)] rounded-[18px] p-[var(--space-sm)] gap-1"
        style={{
          display: "none",
          background: "color-mix(in oklch, var(--color-paper) 96%, transparent)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--color-rule)",
        }}
      >
        {LINKS.map((l, i) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <div key={l.href}>
              <Link
                ref={(el) => {
                  sheetLinksRef.current[i] = el;
                }}
                href={l.href}
                className="block px-[var(--space-sm)] py-3 rounded-[12px] font-body font-medium transition-colors hover:bg-[color:var(--color-aqua)]"
                style={{ color: active ? "var(--color-accent)" : "var(--color-ink)" }}
              >
                {l.label}
              </Link>
              {l.children && (
                <div className="mb-1 ml-[var(--space-sm)] mt-0.5 flex flex-col border-l border-[color:var(--color-rule)] pl-3">
                  {l.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className="rounded-[10px] px-3 py-2 font-body transition-colors hover:bg-[color:var(--color-aqua)]"
                      style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)", fontSize: "0.85rem" }}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
