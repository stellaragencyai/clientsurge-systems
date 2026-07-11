import { useEffect } from "react";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const SECTIONS = [
  {
    title: "SMS Consent",
    body:
      "By affirmatively selecting the optional SMS-consent checkbox on a ClientSurge Systems form, or by otherwise providing legally sufficient SMS consent, you agree that ClientSurge Systems may send text messages related to your inquiry, appointments, onboarding, account, service updates, or requested customer-support follow-up. Submitting a form without selecting SMS consent does not enroll you in SMS messaging.",
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
      "SMS consent is not a condition of purchasing goods or services from ClientSurge Systems. You may submit an inquiry without selecting the SMS-consent checkbox and receive a response through another requested channel, such as email.",
  },
  {
    title: "Mobile Data and Consent Protection",
    body:
      "No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Text-messaging originator opt-in data and consent will not be sold, rented, transferred, or shared with third parties for their own marketing or promotional purposes. Service providers may process data only as needed to operate the messaging program, deliver requested messages, maintain security, and comply with law.",
  },
  {
    title: "Automated and AI-Assisted Communications",
    body:
      "Some messages, calls, or replies may be sent or assisted by automated systems or AI assistants. Communications may be logged, monitored, or reviewed to provide the service, improve support, maintain consent records, and comply with applicable requirements.",
  },
  {
    title: "Privacy",
    body:
      "SMS-related data is handled according to the ClientSurge Systems Privacy Policy. We do not sell personal information or use SMS consent for unrelated third-party marketing.",
  },
];

export default function SmsTermsPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "SMS Terms and Consent | ClientSurge Systems",
      description:
        "ClientSurge Systems SMS terms covering optional opt-in consent, message frequency, message and data rates, STOP opt-out instructions, HELP support, and mobile data protections.",
      canonicalPath: "/sms-terms",
      ogTitle: "SMS Terms and Consent | ClientSurge Systems",
      ogDescription:
        "Review ClientSurge Systems SMS consent, STOP opt-out, HELP support, message frequency, and mobile data protections.",
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
          <p className="mt-2 text-xs text-muted-foreground">Last updated: July 11, 2026</p>

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
