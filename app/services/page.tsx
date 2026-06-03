import type { Metadata } from "next";
import ServicesContent from "@/components/ServicesContent";

export const metadata: Metadata = {
  title: "Services — Diving, NDT, Engineering & Steelwork | Advantage Marine Services",
  description:
    "Commercial diving and in-water inspection, conventional & advanced NDT, engineering and steel fabrication, plus rope access, salvage, ICCP and ROV services. IMCA / OGP standard, Johor, Malaysia.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
