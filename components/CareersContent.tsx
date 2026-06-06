"use client";

/* ──────────────────────────────────────────────────────────────────────────
   CAREER @ AMS — parity with the live site's /career-ams page, rebuilt on the
   AMS cream system with scroll reveal, parallax hero and a CV-submission form.
   ────────────────────────────────────────────────────────────────────────── */

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const HERO_IMG = "/media/home/Hero-AMS.jpeg";
const TO = "sales@advantagemarine.com.my";
const EASE = [0.22, 1, 0.36, 1] as const;
const MUTED = { color: "color-mix(in oklch, var(--color-ink) 66%, transparent)" } as const;

const VALUES = [
  {
    title: "Our Vision",
    body: "To be a leading world-class underwater inspection and steel-fabrication specialist.",
  },
  {
    title: "Our Mission",
    body: "Safe, professional and efficient operations on even the most demanding jobs — innovative, systematic and consistent, to OGP/IMCA and offshore ethical standards.",
  },
  {
    title: "Our Commitment",
    body: "Best-in-class diving equipment combined with OGP/IMCA standards, practices and procedures — and long-term relationships with clients and vendors.",
  },
];

const BUSINESSES = [
  "CLASS Survey (ABS, DNV/GL, BV, LRS, NKK)",
  "Ship Husbandry — hull cleaning, propeller polishing",
  "Afloat Repair — underwater hull repairs",
  "NDT works",
  "Fabrication, piping & steel renewal",
  "Accommodation upgrading (carpentry / architectural)",
  "Electrical repairs (A/C, motor rewinding)",
  "HVAC & control solutions",
];

function CvForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Career @ AMS — ${role || "application"} (${name || "candidate"})`);
    const body = encodeURIComponent(
      `${message}\n\nName: ${name}\nEmail: ${email}\nRole of interest: ${role}\n\n(Please attach your CV / resume — max 2MB.)`
    );
    window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
  }

  const field =
    "w-full rounded-[12px] border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-4 py-3 font-body outline-none transition-colors focus-visible:border-[color:var(--color-accent)]";

  return (
    <form onSubmit={submit} className="grid max-w-[34rem] gap-[var(--space-md)]">
      <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="eyebrow !tracking-[0.16em] normal-case">Full name</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label className="grid gap-2">
          <span className="eyebrow !tracking-[0.16em] normal-case">Email</span>
          <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="eyebrow !tracking-[0.16em] normal-case">Role of interest</span>
        <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Commercial Diver · NDT Technician · Welder" />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow !tracking-[0.16em] normal-case">A few words about you</span>
        <textarea className={`${field} min-h-[7rem] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="cta-primary">Submit your CV</button>
        <span className="text-sm" style={MUTED}>Opens your mail app — attach your resume (max 2MB)</span>
      </div>
    </form>
  );
}

export default function CareersContent() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.8, ease: EASE },
      };

  return (
    <main className="bg-[color:var(--color-paper)]">
      {/* ── parallax hero ── */}
      <section ref={heroRef} className="relative h-[72lvh] min-h-[34rem] w-full overflow-hidden">
        <motion.div className="absolute inset-0" style={reduce ? undefined : { y: heroY }}>
          <Image src={HERO_IMG} alt="Advantage Marine Services team at work" fill priority sizes="100vw" className="object-cover" />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--color-paper) 24%, transparent) 0%, transparent 36%, color-mix(in oklch, var(--color-paper) 94%, transparent) 100%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex h-full max-w-[min(1280px,92vw)] flex-col justify-end px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(2.5rem,7vh,5rem)]">
          <motion.p
            className="eyebrow mb-[var(--space-md)] text-[color:var(--color-accent)]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            Career @ AMS
          </motion.p>
          <motion.h1
            className="font-display leading-[1.04] text-[color:var(--color-ink)]"
            style={{ fontSize: "var(--text-display)" }}
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.08 }}
          >
            Build your career at sea.
          </motion.h1>
          <motion.p
            className="mt-[var(--space-lg)] max-w-[48ch] font-body"
            style={{ ...MUTED, fontSize: "var(--text-lead)" }}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
          >
            Join our diverse and growing team at Advantage Marine Services — divers,
            NDT technicians, welders, engineers and offshore crew building best-in-class
            in-water services from our Johor yard.
          </motion.p>
          <motion.div
            className="mt-[var(--space-lg)]"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.26 }}
          >
            <a href="#apply" className="cta-primary">Submit your CV</a>
          </motion.div>
        </div>
      </section>

      {/* ── intro ── */}
      <section className="mx-auto grid max-w-[min(1100px,92vw)] gap-[var(--space-lg)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] lg:grid-cols-[0.8fr_1.2fr]">
        <motion.h2 {...reveal} className="font-display leading-[1.12] text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h2)" }}>
          Why work with us
        </motion.h2>
        <motion.p {...reveal} className="font-body" style={{ ...MUTED, fontSize: "var(--text-lead)" }}>
          Established in 2014, Advantage Marine Services delivers top-quality in-water
          services for marine, shipping and offshore — full air/mixed-gas commercial
          diving, class surveys, real-time CCTV inspection, hull maintenance, and a
          growing portfolio of steel fabrication, rope access and engineering. We hire
          people who hold the line on safety, quality and cost-effectiveness.
        </motion.p>
      </section>

      {/* ── values ── */}
      <section className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-paper-2)]">
        <div className="mx-auto max-w-[min(1280px,92vw)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)]">
          <div className="grid items-stretch gap-[var(--space-lg)] md:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                {...(reduce ? {} : { ...reveal, transition: { duration: 0.7, ease: EASE, delay: i * 0.08 } })}
                className="flex h-full flex-col rounded-[var(--radius-card)] border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-[var(--space-lg)] transition-transform duration-300 hover:-translate-y-1"
              >
                <span aria-hidden className="mb-[var(--space-md)] h-px w-10" style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent)" }} />
                <h3 className="font-display mb-[var(--space-sm)] text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h3)" }}>{v.title}</h3>
                <p className="font-body" style={MUTED}>{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── businesses + apply ── */}
      <section id="apply" className="mx-auto grid max-w-[min(1280px,92vw)] gap-[var(--space-2xl)] px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div {...reveal}>
          <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">Where you&rsquo;d fit</p>
          <h2 className="font-display mb-[var(--space-lg)] leading-[1.1] text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h2)" }}>
            Our businesses
          </h2>
          <ul className="grid gap-[var(--space-sm)]">
            {BUSINESSES.map((b) => (
              <li key={b} className="flex items-start gap-3 font-body" style={MUTED}>
                <span className="mt-[0.55em] h-[6px] w-[6px] shrink-0 rotate-45 bg-[color:var(--color-accent)]" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...(reduce ? {} : { ...reveal, transition: { duration: 0.8, ease: EASE, delay: 0.08 } })}>
          <p className="eyebrow mb-[var(--space-sm)] text-[color:var(--color-accent)]">Submit your CV today</p>
          <h2 className="font-display mb-[var(--space-lg)] leading-[1.1] text-[color:var(--color-ink)]" style={{ fontSize: "var(--text-h2)" }}>
            Tell us about you
          </h2>
          <CvForm />
        </motion.div>
      </section>
    </main>
  );
}
