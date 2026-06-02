import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { CardContainer, CardBody, CardItem } from "@/components/ui/TiltCard";
import { MovingBorderButton } from "@/components/ui/MovingBorderButton";
import projectsData from "@/lib/content/projects.json";

export const metadata: Metadata = {
  title: "Projects — Advantage Marine Services",
  description:
    "Real AMS project records: jack-up rig UWILDs and class surveys, structural steel repairs, NDT and drop surveys, seawater piping change-outs and refinery composite repairs across Malaysia's offshore and industrial sites.",
};

type Project = {
  title: string;
  client: string | null;
  category: string;
  summary: string | null;
  summaryFromFilenameOnly?: boolean;
  pdf?: string;
};

const ORDER = [
  "UWILD/Inspection",
  "Structural Steel Repair",
  "NDT/Survey",
  "Piping/Mechanical",
  "Fabrication/Gangway",
];

export default function ProjectsPage() {
  const projects = projectsData.projects as Project[];
  const groups = ORDER.map((cat) => ({
    cat,
    items: projects.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <main>
      <PageHeader
        eyebrow="Selected work"
        title="Proven below the waterline."
        lead="A selection of real AMS project records — jack-up rig in-water surveys, structural steel repairs, NDT and drop surveys, piping change-outs and refinery repairs delivered across Malaysia's offshore and industrial sites."
      />

      <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        {groups.map((g, gi) => (
          <section key={g.cat} className={gi > 0 ? "mt-[var(--space-2xl)]" : ""}>
            <Reveal>
              <div className="flex items-baseline justify-between gap-4 mb-[var(--space-lg)] border-b border-[color:var(--color-rule)] pb-3">
                <h2 className="font-display font-bold tracking-[-0.01em]" style={{ fontSize: "var(--text-h3)" }}>{g.cat}</h2>
                <span className="eyebrow !tracking-[0.18em]">{String(g.items.length).padStart(2, "0")}</span>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.items.map((p, i) => (
                <Reveal key={p.title} delay={(i % 2) * 0.05}>
                  <CardContainer containerClassName="block w-full h-full" className="w-full h-full">
                    <CardBody className="w-full h-full flex flex-col gap-3">
                      <CardItem as="h3" translateZ={42} className="font-display font-medium leading-[1.25]" style={{ fontSize: "1.1rem" }}>
                        {p.title}
                      </CardItem>
                      {p.client && (
                        <CardItem as="p" translateZ={26} className="eyebrow !tracking-[0.16em] normal-case text-[color:var(--color-accent)]">
                          {p.client}
                        </CardItem>
                      )}
                      {p.summary ? (
                        <CardItem as="p" translateZ={18} className="leading-[1.6] text-[0.95rem]" style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}>
                          {p.summary}
                        </CardItem>
                      ) : (
                        <CardItem as="p" translateZ={18} className="text-[0.9rem] italic" style={{ color: "color-mix(in oklch, var(--color-ink) 48%, transparent)" }}>
                          Project record on file — full scope available on request.
                        </CardItem>
                      )}
                    </CardBody>
                  </CardContainer>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        <Reveal className="mt-[var(--space-2xl)] flex flex-wrap items-center gap-5">
          <p className="font-display" style={{ fontSize: "var(--text-h3)" }}>Have a scope in mind?</p>
          <MovingBorderButton as={Link} href="/contact" duration={3600}>Request a quote</MovingBorderButton>
        </Reveal>
      </div>
    </main>
  );
}
