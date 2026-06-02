"use client";

import { useState } from "react";

const TO = "sales@advantagemarine.com.my";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry from ${name || "website"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
  }

  const field =
    "w-full rounded-[12px] border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] px-4 py-3 font-body outline-none focus-visible:border-[color:var(--color-accent)] transition-colors";

  return (
    <form onSubmit={submit} className="grid gap-[var(--space-md)] max-w-[34rem]">
      <label className="grid gap-2">
        <span className="eyebrow !tracking-[0.16em] normal-case">Name</span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow !tracking-[0.16em] normal-case">Email</span>
        <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label className="grid gap-2">
        <span className="eyebrow !tracking-[0.16em] normal-case">What do you need?</span>
        <textarea className={`${field} min-h-[7rem] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </label>
      <div className="flex items-center gap-4 flex-wrap">
        <button type="submit" className="cta-primary">Send enquiry</button>
        <span className="text-sm" style={{ color: "color-mix(in oklch, var(--color-ink) 55%, transparent)" }}>
          Opens your mail app · we respond promptly
        </span>
      </div>
    </form>
  );
}
