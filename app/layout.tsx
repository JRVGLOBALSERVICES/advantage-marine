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

export const metadata: Metadata = {
  metadataBase: new URL("https://advantage-marine.vercel.app"),
  title: "Advantage Marine Services — In-Water Inspection, NDT & Marine Engineering",
  description:
    "IMCA-standard commercial diving, underwater hull & propeller services, robotic NDT and steel fabrication for the marine, shipping and offshore industries. Johor, Malaysia. Class surveys accepted by ABS, DNV, BV, LR and ClassNK.",
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${kaushan.variable} ${inter.variable}`}>
        <SmoothScroll>
          <SiteNav />
          {children}
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
