import type { Metadata } from "next";
import ContactSections from "@/components/ContactSections";

export const metadata: Metadata = {
  title: "Contact — Advantage Marine Services, Johor",
  description:
    "Talk to Advantage Marine Services. Main office in Gelang Patah, Johor, with branches in Miri and Kuala Lumpur. Email sales@advantagemarine.com.my for quotes and service requests.",
};

export default function ContactPage() {
  return <ContactSections />;
}
