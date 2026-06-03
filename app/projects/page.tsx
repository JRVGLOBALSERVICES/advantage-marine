import type { Metadata } from "next";
import ProjectsView, { type Project } from "@/components/ProjectsView";
import projectsData from "@/lib/content/projects.json";
import mediaManifest from "@/lib/content/media-manifest.json";

export const metadata: Metadata = {
  title: "Projects — Advantage Marine Services",
  description:
    "Real AMS project records: jack-up rig UWILDs and class surveys, structural steel repairs, NDT and drop surveys, seawater piping change-outs and refinery composite repairs across Malaysia's offshore and industrial sites.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = projectsData.projects as Project[];
  const images = (mediaManifest.projects as string[]).filter((s) =>
    /\.(jpe?g|png|webp)$/i.test(s),
  );
  // First real projects photo doubles as the full-bleed hero plate.
  const heroImage = images[0];

  return <ProjectsView projects={projects} images={images} heroImage={heroImage} />;
}
