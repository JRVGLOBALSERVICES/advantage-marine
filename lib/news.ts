import newsData from "@/lib/content/news.json";

/** A single Dispatch (news) entry, sourced from lib/content/news.json. */
export type NewsPost = {
  title: string;
  slug: string;
  date: string;
  dateLabel?: string;
  excerpt: string | null;
  body?: string[];
};

/* Map each real post to a real photograph from public/media via the manifest.
   Keyed on title so order changes don't break the pairing. Fallback covers any
   future post added to news.json. Shared by the index and the [slug] detail. */
const POST_MEDIA: Record<string, { src: string; alt: string }> = {
  "Oil & Gas Asia 2025": {
    src: "/media/csr/WhatsApp-Image-2025-10-15-at-2.54.59-PM.jpeg",
    alt: "Advantage Marine Services at the Oil & Gas Asia 2025 exhibition, Kuala Lumpur Convention Centre",
  },
  "Oil & Gas Asia 2024": {
    src: "/media/home/photo_6305331321802710100_y.jpg",
    alt: "The AMS team in conversation with stakeholders at Oil & Gas Asia 2024",
  },
  "Industry awards & recognition": {
    src: "/media/awards/amsawards2025.jpeg",
    alt: "Advantage Marine Services receiving enterprise-awards recognition",
  },
  "Community & CSR": {
    src: "/media/csr/AMS-DIVER-3-scaled-e1616042912140.jpg",
    alt: "AMS commercial diver suited up before an in-water inspection dive",
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

export function postMedia(title: string) {
  return POST_MEDIA[title] ?? FALLBACK_MEDIA;
}

/** All posts, newest first. */
export function allPosts(): NewsPost[] {
  return (newsData.posts as NewsPost[])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function postBySlug(slug: string): NewsPost | undefined {
  return (newsData.posts as NewsPost[]).find((p) => p.slug === slug);
}

export function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
