import { useEffect } from "react";
import {
  BadgeCheck,
  CircleHelp,
  LockKeyhole,
  MessageSquareText,
  PhoneOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const SECTIONS = [
  {
    title: "SMS Consent",
    icon: BadgeCheck,
    body:
      "By affirmatively selecting the optional SMS-consent checkbox on a ClientSurge Systems form, or by otherwise providing legally sufficient SMS consent, you agree that ClientSurge Systems may send text messages related to your inquiry, appointments, onboarding, account, service updates, or requested customer-support follow-up. Submitting a form without selecting SMS consent does not enroll you in SMS messaging.",
  },
  {
    title: "Message Frequency",
    icon: MessageSquareText,
    body:
      "Message frequency varies based on your request, appointment activity, onboarding status, support needs, and active service relationship.",
  },
  {
    title: "Message and Data Rates",
    icon: PhoneOff,
    body:
      "Message and data rates may apply. Your mobile carrier may charge fees according to your wireless plan.",
  },
  {
    title: "Opt Out",
    icon: PhoneOff,
    body:
      "You can opt out of SMS messages at any time by replying STOP. After you opt out, you may receive a final confirmation message confirming your opt-out request.",
  },
  {
    title: "Help and Support",
    icon: CircleHelp,
    body:
      "For help, reply HELP when available or contact ClientSurge Systems at support@clientsurgesystems.com or (602) 584-3227.",
  },
  {
    title: "Consent Not Required for Purchase",
    icon: ShieldCheck,
    body:
      "SMS consent is not a condition of purchasing goods or services from ClientSurge Systems. You may submit an inquiry without selecting the SMS-consent checkbox and receive a response through another requested channel, such as email.",
  },
  {
    title: "Mobile Data and Consent Protection",
    icon: LockKeyhole,
    body:
      "No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Text-messaging originator opt-in data and consent will not be sold, rented, transferred, or shared with third parties for their own marketing or promotional purposes. Service providers may process data only as needed to operate the messaging program, deliver requested messages, maintain security, and comply with law.",
  },
  {
    title: "Automated and AI-Assisted Communications",
    icon: Sparkles,
    body:
      "Some messages, calls, or replies may be sent or assisted by automated systems or AI assistants. Communications may be logged, monitored, or reviewed to provide the service, improve support, maintain consent records, and comply with applicable requirements.",
  },
  {
    title: "Privacy",
    icon: ShieldCheck,
    body:
      "SMS-related data is handled according to the ClientSurge Systems Privacy Policy. We do not sell personal information or use SMS consent for unrelated third-party marketing.",
  },
];

const QUICK_FACTS = [
  "Optional, affirmative opt-in",
  "Reply STOP to unsubscribe",
  "Reply HELP for assistance",
  "Consent is not required to buy",
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
    <div className="min-h-screen bg-[#f7fbff] text-slate-900">
      <Navbar />

      <section
        className="relative overflow-hidden border-b border-sky-100 px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "calc(var(--cs-nav-height) + 4rem)", paddingBottom: "4rem" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Messaging compliance
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            SMS Terms and Consent
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Clear rules for how ClientSurge Systems collects SMS consent, sends messages, protects mobile data, and handles STOP and HELP requests.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span className="rounded-full border border-sky-100 bg-white px-3 py-2 shadow-sm">Last updated: July 11, 2026</span>
            <a href="/privacy" className="rounded-full border border-sky-100 bg-white px-3 py-2 text-sky-700 shadow-sm transition hover:border-sky-300 hover:text-sky-900">
              View Privacy Policy
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FACTS.map((fact) => (
            <div key={fact} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-bold leading-6 text-slate-900">{fact}</p>
            </div>
          ))}
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
          <div className="space-y-5">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              return (
                <section
                  id={`sms-section-${index + 1}`}
                  key={section.title}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_60px_rgba(14,165,233,0.10)] sm:p-8"
                  style={{ scrollMarginTop: "calc(var(--cs-nav-height) + 24px)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">Section {index + 1}</p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{section.title}</h2>
                    </div>
                  </div>
                  <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600">{section.body}</p>
                </section>
              );
            })}
          </div>

          <aside className="hidden lg:block lg:sticky" style={{ top: "calc(var(--cs-nav-height) + 28px)" }}>
            <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">On this page</p>
              <nav className="mt-4 space-y-1.5" aria-label="SMS terms sections">
                {SECTIONS.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#sms-section-${index + 1}`}
                    className="block rounded-lg px-3 py-2 text-xs font-semibold leading-5 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>

        <section className="mt-12 overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-600 to-blue-700 p-8 text-white shadow-[0_24px_70px_rgba(2,132,199,0.25)] sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Need help?</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Questions about SMS consent or your communication preferences?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50">
                Contact support and we will help you understand your options, update your preferences, or confirm an opt-out request.
              </p>
            </div>
            <a
              href="mailto:support@clientsurgesystems.com"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-sky-700 shadow-lg transition hover:bg-sky-50"
            >
              Contact support
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <MobileCallBar />
    </div>
  );
}
