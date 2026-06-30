import { useEffect } from "react";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const SECTIONS = [
  {
    title: "SMS Consent",
    body:
      "By submitting a form, booking a call, requesting information, or otherwise opting in, you agree that ClientSurge Systems may send text messages related to your inquiry, appointment, service request, onboarding, account, or requested follow-up.",
  },
  {
    title: "Message Frequency",
    body:
      "Message frequency varies based on your request, appointment activity, onboarding status, support needs, and active service relationship.",
  },
  {
    title: "Message and Data Rates",
    body:
      "Message and data rates may apply. Your mobile carrier may charge fees according to your wireless plan.",
  },
  {
    title: "Opt Out",
    body:
      "You can opt out of SMS messages at any time by replying STOP. After you opt out, you may receive a final confirmation message confirming your opt-out request.",
  },
  {
    title: "Help and Support",
    body:
      "For help, reply HELP when available or contact ClientSurge Systems at support@clientsurgesystems.com or (602) 584-3227.",
  },
  {
    title: "Consent Not Required for Purchase",
    body:
      "Where required by law, SMS consent is not a condition of purchasing goods or services from ClientSurge Systems.",
  },
  {
    title: "Automated and AI-Assisted Communications",
    body:
      "Some messages, calls, or replies may be sent or assisted by automated systems or AI assistants. Communications may be logged, monitored, or reviewed to provide the service, improve support, maintain consent records, and comply with applicable requirements.",
  },
  {
    title: "Privacy",
    body:
      "SMS-related data is handled according to the ClientSurge Systems Privacy Policy. We do not sell your personal information.",
  },
];

export default function SmsTermsPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "SMS Terms and Consent | ClientSurge Systems",
      description:
        "ClientSurge Systems SMS terms covering opt-in consent, message frequency, message and data rates, STOP opt-out instructions, HELP support, and automated communications.",
      canonicalPath: "/sms-terms",
      ogTitle: "SMS Terms and Consent | ClientSurge Systems",
      ogDescription:
        "Review ClientSurge Systems SMS consent, STOP opt-out, HELP support, message frequency, and automated communication terms.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: "calc(var(--cs-nav-height) + 3rem)", paddingBottom: "4rem" }}>
        <section className="max-w-4xl mx-auto">
          <p className="cs-section-eyebrow mb-3">Legal</p>
          <h1 className="cs-section-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            SMS Terms and Consent
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">
            These SMS Terms explain how ClientSurge Systems uses text messaging for inquiries,
            appointment coordination, onboarding, support, and service-related follow-up.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: June 29, 2026</p>

          <div className="mt-10 grid gap-5">
            {SECTIONS.map((section, index) => (
              <section key={section.title} className="rounded-xl border border-border bg-white p-6">
                <p className="text-xs font-bold text-primary mb-2">{index + 1}.</p>
                <h2 className="text-lg font-bold text-foreground mb-3">{section.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
