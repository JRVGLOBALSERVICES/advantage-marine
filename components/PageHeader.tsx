import Reveal from "./Reveal";

/* Inner-page hero — measured, document-led. Clears the fixed nav. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="border-b border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
      <div className="max-w-[min(1200px,92vw)] mx-auto px-[clamp(1.5rem,4vw,4rem)] pt-[calc(var(--space-2xl)+3rem)] pb-[var(--space-2xl)]">
        <Reveal>
          <p className="eyebrow mb-[var(--space-md)]">{eyebrow}</p>
          <h1
            className="font-display font-bold leading-[1.05] tracking-[-0.02em] max-w-[18ch]"
            style={{ fontSize: "var(--text-display)", overflowWrap: "anywhere" }}
          >
            {title}
          </h1>
          {lead && (
            <p
              className="mt-[var(--space-lg)] measure leading-[1.6]"
              style={{ fontSize: "var(--text-lead)", color: "color-mix(in oklch, var(--color-ink) 68%, transparent)" }}
            >
              {lead}
            </p>
          )}
        </Reveal>
      </div>
    </header>
  );
}
