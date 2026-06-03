import type { Metadata } from "next";
import { Cinzel, Kaushan_Script, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// Display: Cinzel — inscriptional Roman caps serif (headings, stats, wordmark)
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

// Accent: Kaushan Script — brush script for the one expressive statement moment
const kaushan = Kaushan_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kaushan",
  display: "swap",
});

// Body: Inter — paragraph + UI text (Cinzel is caps-only, Kaushan is a script;
// neither can carry running copy, so the legible body sans stays)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://advantage-marine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Advantage Marine Services — In-Water Inspection, NDT & Marine Engineering",
    template: "%s — Advantage Marine Services",
  },
  description:
    "IMCA-standard commercial diving, underwater hull & propeller services, robotic NDT and steel fabrication for the marine, shipping and offshore industries. Johor, Malaysia. Class surveys accepted by ABS, DNV, BV, LR and ClassNK.",
  applicationName: "Advantage Marine Services",
  authors: [{ name: "Advantage Marine Services (Malaysia) Sdn Bhd" }],
  creator: "Advantage Marine Services (Malaysia) Sdn Bhd",
  publisher: "Advantage Marine Services (Malaysia) Sdn Bhd",
  category: "Marine & Offshore Engineering",
  alternates: { canonical: "/" },
  keywords: [
    "commercial diving Malaysia",
    "in-water survey",
    "underwater hull cleaning",
    "propeller polishing",
    "NDT inspection",
    "IMCA diving",
    "offshore marine services",
  ],
  openGraph: {
    title: "Advantage Marine Services",
    description:
      "In-water inspection, robotic NDT and marine engineering — surveyed afloat, never dry-docked.",
    type: "website",
    siteName: "Advantage Marine Services",
    locale: "en_MY",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Advantage Marine Services",
    description:
      "In-water inspection, robotic NDT and marine engineering — surveyed afloat, never dry-docked.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Site-wide structured data — Organization + LocalBusiness + WebSite.
// @id anchors let per-page schema (e.g. /about's detailed Organization with
// named directors) reference the same entity rather than duplicate it.
const SITE_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Advantage Marine Services",
      legalName: "Advantage Marine Services (Malaysia) Sdn Bhd",
      url: SITE_URL,
      foundingDate: "2014-03",
      email: "sales@advantagemarine.com.my",
      description:
        "Marine and offshore specialist in commercial diving, in-water inspection, NDT and steel fabrication — class surveys accepted by ABS, DNV GL, Bureau Veritas, Lloyd's Register and ClassNK.",
      areaServed: ["MY", "Southeast Asia"],
      knowsAbout: [
        "Commercial diving",
        "In-water survey",
        "Underwater hull cleaning",
        "Propeller polishing",
        "NDT inspection",
        "Steel fabrication",
        "Marine engineering",
        "ABS",
        "DNV",
        "Bureau Veritas",
        "Lloyd's Register",
        "ClassNK",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "Advantage Marine Services (Malaysia) Sdn Bhd",
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      url: SITE_URL,
      email: "sales@advantagemarine.com.my",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "No.18 Jalan Laman Setia 7/4, Taman Laman Setia (Setia Business Park)",
        addressLocality: "Gelang Patah",
        addressRegion: "Johor",
        postalCode: "81550",
        addressCountry: "MY",
      },
      areaServed: "MY",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Advantage Marine Services",
      inLanguage: "en-MY",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${kaushan.variable} ${inter.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SCHEMA) }}
        />
        <SmoothScroll>
          <SiteNav />
          {/* Block-level horizontal clip: iOS Safari mishandles overflow-x:clip
              on the html/body root, so stray over-wide content (pin halos,
              decorative glows) leaks → right-side white space on inner pages.
              Clipping on a normal in-body wrapper is reliable on iOS. `clip`
              (not `hidden`) creates no scroll container, so the home hero's
              sticky scroll-dive is unaffected. */}
          <div className="overflow-x-clip">{children}</div>
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
