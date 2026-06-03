import servicesData from "@/lib/content/services.json";

/**
 * Shared service data + media mapping.
 *
 * Single source for BOTH the /services hub (ServicesContent) and the
 * /services/[slug] detail pages, so the two never drift. The live WordPress
 * site exposes one URL per service (/marine-diving, /ndt, /rope-access …);
 * this mirrors that structure under the /services hub with matching slugs.
 *
 * The media maps were lifted out of ServicesContent verbatim — the dedup work
 * (one curated, md5-distinct gallery per discipline; no image repeated across
 * trades) lives here now and is reused by both surfaces.
 */

type Bucket = (typeof servicesData.buckets)[number];
type Specialty = (typeof servicesData.specialty)[number];

export type Service = {
  slug: string;
  title: string;
  /** Buckets carry a one-line summary; specialty entries do not. */
  summary?: string;
  body: string;
  capabilities: string[];
  /** "core" = one of the four disciplines; "specialty" = supporting scope. */
  kind: "core" | "specialty";
  /** Lead/hero photograph for this service (detail page + card). */
  hero: string;
  /** Extra real photos for the discipline galleries (core buckets only). */
  gallery: string[];
  /** Short positioning kicker, e.g. "IRATA member company". */
  eyebrow: string;
  alt: string;
};

const D = "/media/service_diving";

/** Curated, deduplicated per-discipline galleries (md5-distinct, no repeats). */
const BUCKET_GALLERY: Record<string, string[]> = {
  "marine-diving": [
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.23.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.25.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.26.jpeg`,
    `${D}/WhatsApp-Image-2021-03-22-at-14.58.27.jpeg`,
    `${D}/1.jpeg`,
    `${D}/3.jpeg`,
  ],
  ndt: [
    "/media/service_ndt/ndt1.jpg",
    "/media/service_ndt/ndt2.jpg",
    "/media/service_ndt/ndt3.jpg",
    "/media/service_radiography/rs1.png",
    "/media/service_radiography/rs2.png",
    "/media/service_radiography/rs3.png",
  ],
  "engineering-steelwork": [
    "/media/service_steelwork/ES1.jpg",
    "/media/service_steelwork/ES2.jpg",
    "/media/service_steelwork/ES3.jpg",
  ],
  "trading-others": [
    "/media/_live/other_service.jpg",
    "/media/_live/marine_dive.jpg",
    "/media/_live/steel.jpg",
  ],
};

/** Per-specialty distinct hero + paired Lottie icon + positioning eyebrow. */
const SPECIALTY_META: Record<
  string,
  { img: string; lottie: string; eyebrow: string }
> = {
  "rope-access": {
    img: "/media/service_rope/ra1.jpg",
    lottie: "/lottie/engineering-gear.json",
    eyebrow: "IRATA member company",
  },
  "salvage-works": {
    img: `${D}/WhatsApp-Image-2021-03-22-at-14.58.26-1.jpeg`,
    lottie: "/lottie/diving-helmet.json",
    eyebrow: "Rescue & recovery",
  },
  iccp: {
    img: `${D}/underwater-wet-welding-1-1-e1490151670919-640x480_c.jpg`,
    lottie: "/lottie/ndt-scan.json",
    eyebrow: "Cathodic protection",
  },
  ovolifts: {
    img: "/media/service_ovolifts/_real/ovolift-system.jpg",
    lottie: "/lottie/engineering-gear.json",
    eyebrow: "Authorized distributor — SE Asia",
  },
  "chasing-m2-rov": {
    img: `${D}/bluestream-offshore-1920-2-1.1920x0.jpg`,
    lottie: "/lottie/rov-sonar.json",
    eyebrow: "Authorized distributor — SE Asia",
  },
};

/** Lottie icon path for a specialty slug — re-exported for the hub. */
export function specialtyLottie(slug: string): string | undefined {
  return SPECIALTY_META[slug]?.lottie;
}

export function bucketGallery(slug: string): string[] {
  return BUCKET_GALLERY[slug] ?? [];
}

export function specialtyImage(slug: string): string | undefined {
  return SPECIALTY_META[slug]?.img;
}

export function specialtyEyebrow(slug: string): string | undefined {
  return SPECIALTY_META[slug]?.eyebrow;
}

const CORE_EYEBROW: Record<string, string> = {
  "marine-diving": "Commercial diving",
  ndt: "Inspection & testing",
  "engineering-steelwork": "Fabrication & repair",
  "trading-others": "Supply & support",
};

function bucketToService(b: Bucket): Service {
  const gallery = BUCKET_GALLERY[b.slug] ?? [];
  return {
    slug: b.slug,
    title: b.title,
    summary: b.summary,
    body: b.body,
    capabilities: b.capabilities ?? [],
    kind: "core",
    hero: gallery[0] ?? `${D}/P4040406.JPG-1.jpeg`,
    gallery: gallery.slice(1),
    eyebrow: CORE_EYEBROW[b.slug] ?? "Core discipline",
    alt: `${b.title} — Advantage Marine Services`,
  };
}

function specialtyToService(s: Specialty): Service {
  const meta = SPECIALTY_META[s.slug];
  return {
    slug: s.slug,
    title: s.title,
    body: s.body,
    capabilities: s.capabilities ?? [],
    kind: "specialty",
    hero: meta?.img ?? `${D}/P4040406.JPG-1.jpeg`,
    gallery: [],
    eyebrow: meta?.eyebrow ?? "Specialty capability",
    alt: `${s.title} — Advantage Marine Services`,
  };
}

/** Every service — four core disciplines first, then specialty scope. */
export function allServices(): Service[] {
  return [
    ...(servicesData.buckets as Bucket[]).map(bucketToService),
    ...(servicesData.specialty as Specialty[]).map(specialtyToService),
  ];
}

export function serviceBySlug(slug: string): Service | undefined {
  return allServices().find((s) => s.slug === slug);
}
