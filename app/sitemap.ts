import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/news";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://advantage-marine.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes = [
    { path: "", priority: 1, freq: "monthly" as const },
    { path: "/services", priority: 0.9, freq: "monthly" as const },
    { path: "/projects", priority: 0.9, freq: "monthly" as const },
    { path: "/about", priority: 0.8, freq: "monthly" as const },
    { path: "/contact", priority: 0.8, freq: "monthly" as const },
    { path: "/news", priority: 0.7, freq: "weekly" as const },
  ];

  const staticEntries = routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // One URL per news post — mirrors the live site's per-post sitemap structure.
  const newsEntries = allPosts().map((p) => ({
    url: `${BASE}/news/${p.slug}`,
    lastModified: new Date(`${p.date}T00:00:00+08:00`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...newsEntries];
}
