"use client";

/**
 * CertWall — the class-society + ISO credential grid for the About page.
 *
 * Renders the 12 real cert logos (mapped from media-manifest.certs) as paper
 * tiles on a hairline grid. The single featured tile (the one the visitor's
 * eye lands on first — ABS, the lead class society) carries a BorderBeam so the
 * accent reads as a deliberate flourish rather than decoration everywhere.
 * BorderBeam is purely decorative, so it is skipped entirely under
 * prefers-reduced-motion.
 *
 * Client component because BorderBeam + the reduced-motion gate need the
 * browser. Lives below the server-rendered About page so the page itself stays
 * a server component and keeps its `metadata` export.
 */

import { motion, useReducedMotion } from "motion/react";
import { BorderBeam } from "@/components/ui/magic/BorderBeam";

const EASE = [0.22, 1, 0.36, 1] as const;

export type Cert = { slug: string; title: string; file: string };

export function CertWall({ certs }: { certs: Cert[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-rule)] sm:grid-cols-3 lg:grid-cols-4">
      {certs.map((cert, i) => {
        // Feature the first tile (ABS — lead class society) with a travelling beam.
        const featured = i === 0;
        return (
          <motion.div
            key={cert.slug}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "120px" }}
            transition={{ duration: 0.5, delay: 0.04 * i, ease: EASE }}
            className="group relative flex flex-col items-center justify-between gap-4 bg-[color:var(--color-paper-2)] p-6 transition-colors duration-500 hover:bg-[color:var(--color-paper-3)]"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
          >
            {featured && !reduce && <BorderBeam size={68} duration={9} borderWidth={1.5} />}
            <div className="flex h-20 w-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.file}
                alt={`${stripEntities(cert.title)} class-society / certification mark`}
                className="max-h-20 w-auto max-w-[80%] object-contain mix-blend-multiply"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p
              className="font-display text-center leading-[1.15] text-[color:var(--color-ink)]"
              style={{ fontSize: "var(--text-eyebrow)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {stripEntities(cert.title)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

/** The manifest stores Lloyd's title HTML-encoded ("Lloyd&#8217;s"); render it clean. */
function stripEntities(s: string): string {
  return s.replace(/&#8217;/g, "’").replace(/&amp;/g, "&");
}

export default CertWall;
