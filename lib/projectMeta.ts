/**
 * Shared parsing for real AMS project records. Pulls a human period phrase and
 * a compact year chip out of the source summary WITHOUT inventing anything —
 * if the summary has no date, both return null and the card simply omits the
 * chip. Used by both the /projects grid and the homepage "Selected projects"
 * band so the two render identical metadata.
 */

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

/** Trailing date phrase from the real summary, e.g. "September 2016". */
export function parsePeriod(summary: string | null): string | null {
  if (!summary) return null;
  const re = new RegExp(
    `((?:\\d{1,2}\\s+)?(?:${MONTHS})?\\s*(?:to\\s+(?:\\d{1,2}\\s+)?(?:${MONTHS})\\s+)?\\d{4})\\b\\.?\\s*$`,
  );
  const m = summary.match(re);
  if (!m) return null;
  return m[1].replace(/\.$/, "").trim();
}

/**
 * Resolve a project's "View report" link to the REAL source PDF.
 * The report PDFs live in the original AMS WordPress media library under one
 * uploads folder; projects.json carries only the bare filename. We deep-link
 * straight to the verified PDF (all return 200 application/pdf) instead of
 * dumping the visitor on the generic homepage. encodeURI handles the one
 * filename containing an en-dash. Returns null when a record has no pdf.
 */
const REPORT_BASE =
  "https://www.advantagemarine.com.my/wp-content/uploads/2021/03";

export function reportHref(pdf: string | null | undefined): string | null {
  if (!pdf) return null;
  return encodeURI(`${REPORT_BASE}/${pdf}`);
}

/** Year(s) only, for a compact chip. */
export function parseYear(summary: string | null): string | null {
  if (!summary) return null;
  const years = Array.from(summary.matchAll(/\b(20\d{2})\b/g)).map((x) => x[1]);
  if (years.length === 0) return null;
  const unique = Array.from(new Set(years));
  return unique.length > 1
    ? `${unique[0]}–${unique[unique.length - 1]}`
    : unique[0];
}
