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
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
