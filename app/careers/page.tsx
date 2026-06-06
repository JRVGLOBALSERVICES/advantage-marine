import type { Metadata } from "next";
import CareersContent from "@/components/CareersContent";

export const metadata: Metadata = {
  title: "Career @ AMS — Advantage Marine Services, Johor",
  description:
    "Join the team at Advantage Marine Services. We hire commercial divers, NDT technicians, welders, engineers and offshore crew for in-water inspection, NDT and marine engineering from our Johor yard. Submit your CV.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return <CareersContent />;
}
