import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { PinContainer } from "@/components/ui/PinCard";

export const metadata: Metadata = {
  title: "Contact — Advantage Marine Services, Johor",
  description:
    "Talk to Advantage Marine Services. Main office in Gelang Patah, Johor, with branches in Miri and Kuala Lumpur. Email sales@advantagemarine.com.my for quotes and service requests.",
};

const CONTACTS = [
  { name: "Andrew Teow", role: "Managing Director", tels: ["+65 8393 3227", "+60 16 448 8052"] },
  { name: "Dharmendra Varshney", role: "Business Development Manager", tels: ["+60 19 768 0816"] },
  { name: "Victor Wong", role: "Director", tels: ["+65 9789 3633", "+60 19 731 0016"] },
];

const OFFICES = [
  { tag: "Main Office · Johor", lines: ["No. 18, Jalan Laman Setia 7/4, Taman Laman Setia", "81550 Gelang Patah, Johor, Malaysia"] },
  { tag: "Branch · Miri", lines: ["Lot 2215, Jalan Piasau Utara 1, Premier Industrial Park", "Piasau, 98000 Miri, Sarawak, Malaysia"] },
  { tag: "Branch · Kuala Lumpur", lines: ["Unit H10-1, Plaza Kelana Jaya, Jalan SS7/13A", "Kelana Jaya, 47301 Selangor, Malaysia"] },
];

export default function ContactPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Talk to us"
        title="Connect with our team."
        lead="Have a question, need a quote or want to learn more about our services? Our team is ready to assist — reach out and we'll respond promptly."
      />

      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">Request a quote</p>
          <ContactForm />
          <p className="mt-[var(--space-lg)]">
            Or email us directly:{" "}
            <a href="mailto:sales@advantagemarine.com.my" className="font-medium text-[color:var(--color-accent)] underline underline-offset-4 decoration-[color:var(--color-rule)] hover:decoration-[color:var(--color-accent)]">
              sales@advantagemarine.com.my
            </a>
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="eyebrow mb-[var(--space-md)]">Key contacts</p>
          <ul className="grid gap-px bg-[color:var(--color-rule)] rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
            {CONTACTS.map((c) => (
              <li key={c.name} className="bg-[color:var(--color-paper)] p-[var(--space-md)]">
                <p className="font-display font-medium">{c.name}</p>
                <p className="eyebrow !tracking-[0.16em] normal-case mt-1 mb-2">{c.role}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {c.tels.map((t) => (
                    <a key={t} href={`tel:${t.replace(/\s/g, "")}`} className="text-sm text-[color:var(--color-accent)] hover:underline underline-offset-4">{t}</a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* offices */}
      <section className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-rule)]">
        <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <Reveal>
            <p className="eyebrow mb-[var(--space-lg)]">Our offices</p>
          </Reveal>
          <div className="grid gap-[var(--space-lg)] sm:grid-cols-2 lg:grid-cols-3">
            {OFFICES.map((o, i) => {
              const loc = o.tag.split("·").pop()?.trim() ?? o.tag;
              const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.lines.join(", "))}`;
              return (
                <Reveal key={o.tag} delay={i * 0.05}>
                  <div className="flex h-[22rem] items-center justify-center">
                    <PinContainer title={loc} href={maps}>
                      <div className="flex h-[12rem] w-[15rem] flex-col p-1">
                        <p className="font-display font-medium text-[color:var(--color-ink)]">{o.tag}</p>
                        <div className="mt-2 space-y-1">
                          {o.lines.map((ln) => (
                            <p key={ln} className="text-[0.82rem] leading-[1.5]" style={{ color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" }}>{ln}</p>
                          ))}
                        </div>
                        <div className="mt-auto flex items-center gap-2 text-xs text-[color:var(--color-accent)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-2)]" aria-hidden />
                          View on map
                        </div>
                        {/* slim seafoam band — marine brand texture */}
                        <div
                          className="mt-2 h-1 w-full rounded-full"
                          style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--color-accent) 45%, transparent), var(--color-aqua-2), transparent)" }}
                        />
                      </div>
                    </PinContainer>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* map — Johor HQ */}
      <section className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
        <Reveal>
          <div className="rounded-[var(--radius-card)] overflow-hidden border border-[color:var(--color-rule)]">
            <iframe
              title="Advantage Marine Services — Gelang Patah, Johor"
              src="https://www.google.com/maps?q=Taman+Laman+Setia,+81550+Gelang+Patah,+Johor,+Malaysia&output=embed"
              className="w-full h-[360px] block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>
      </section>
    </main>
  );
}
