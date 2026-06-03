import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Advantage Marine Services",
    short_name: "AMS",
    description:
      "Commercial diving, in-water inspection, NDT and marine engineering — surveyed afloat, never dry-docked. Johor, Malaysia.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EBD9",
    theme_color: "#30837B",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
