import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
