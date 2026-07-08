import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, Lock, PhoneCall, BadgeCheck, ScrollText, RotateCcw, CalendarClock, Ban } from "lucide-react";

import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import DataDeletionRequestForm from "@/components/legal/DataDeletionRequestForm";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";
const SUPPORT_PHONE = "(602) 584-3227";
const SUPPORT_TEL = "+16025843227";

const PRIVACY_SECTIONS = [
  {
    id: "info-collect",
    title: "Information We Collect",
    body: "We collect information you provide directly, including business name, contact name, phone number, email address, website URL, service interest, messages submitted through forms, booking details, and information needed to respond to your inquiry.",
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    body: "We use your information to respond to inquiries, schedule automation audits, provide and improve AI automation services, support lead capture and booking workflows, send relevant follow-up communications, and maintain business records. You may opt out of SMS by replying STOP or by emailing support.",
  },
  {
    id: "sms-email",
    title: "SMS and Email Communications",
    body: "If you provide a phone number or email address and opt in where required, we may use it to send requested follow-ups, appointment reminders, booking confirmations, missed-call text-back messages, review requests, reactivation messages, service updates, and related business communications. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase.",
  },
  {
    id: "consent-records",
    title: "Consent Records",
    body: "When you submit a form or otherwise opt in to communications, we may store consent records such as consent text version, timestamp, IP address, source page, UTM/source details, and submitted contact details so we can maintain accurate compliance and audit records.",
  },
  {
    id: "ai-processing",
    title: "AI and Automation Processing",
    body: "We may process inquiry details, message history, booking context, business information, and service preferences through automation and AI-assisted systems to classify leads, draft replies, summarize conversations, recommend next steps, route requests, and support customer service. AI-assisted outputs may be reviewed, edited, or overridden before use when appropriate.",
  },
  {
    id: "cookies",
    title: "Cookies and Tracking",
    body: "We may use cookies, analytics, pixels, UTM parameters, and similar technologies to understand website traffic, measure marketing performance, improve forms and booking flows, and prevent abuse.",
  },
  {
    id: "data-sharing",
    title: "Data Sharing and Third-Party Services",
    body: "We do not sell your personal information. We share data only with service providers needed to operate the website, forms, messaging, payments, email, analytics, automation, and AI workflows. These providers may include Base44, Twilio, Resend, Stripe, OpenAI, Google, Calendly, and similar infrastructure or business service vendors.",
  },
  {
    id: "data-retention",
    title: "Data Retention",
    body: "We retain contact records and business inquiry data for as long as reasonably needed to provide services, maintain records, support legal obligations, and improve operations. We may delete or anonymize records that are no longer needed.",
  },
];

const TERMS_SECTIONS = [
  {
    id: "services",
    title: "Services",
    body: "ClientSurge Systems provides AI-powered lead automation services on a monthly subscription basis. Service tiers and pricing are listed at clientsurgesystems.com/pricing. By using our services, you agree to these terms.",
  },
  {
    id: "billing",
    title: "Subscription Billing and Auto-Renewal",
    body: "Monthly subscriptions automatically renew each billing period until cancelled. By purchasing a subscription, you authorize ClientSurge Systems and its payment processor to charge the payment method on file for recurring monthly fees, applicable setup fees, add-ons, taxes, and other amounts disclosed at checkout. Subscriptions renew automatically unless you cancel before your next billing date.",
  },
  {
    id: "cancellation",
    title: "Cancellation and Changes",
    body: "You may request cancellation, pause, resume, upgrade, or downgrade support by contacting support. Cancellation takes effect at the end of the then-current billing period unless otherwise stated in writing. Setup fees and already-paid monthly subscription fees are non-refundable except where required by law or expressly agreed in writing.",
  },
  {
    id: "payment",
    title: "Payment Processing",
    body: "Payments are processed by Stripe or another third-party payment processor. You are responsible for keeping billing information current. Failed, disputed, or past-due payments may delay onboarding, pause service delivery, or limit access to active automations until billing is resolved.",
  },
  {
    id: "sms-compliance",
    title: "SMS Compliance",
    body: "When you submit a form and check the communication consent box, book a requested appointment, or otherwise opt in, you consent to receive automated and non-automated text messages from ClientSurge Systems related to your inquiry, appointments, service updates, and follow-up. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out or contact support to update communication preferences.",
  },
  {
    id: "ai-outputs",
    title: "AI and Automation Outputs",
    body: "AI-assisted messages, summaries, recommendations, and automations are provided to support business workflows. You are responsible for reviewing business-critical outputs, maintaining accurate business information, honoring customer opt-outs, collecting and maintaining legally sufficient consent for your own customer communications, and using the services in compliance with applicable laws and platform rules.",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: "ClientSurge Systems is not liable for indirect or consequential damages. Our total liability shall not exceed the amount paid in the prior 30 days.",
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: "These terms are governed by the laws of the State of Arizona.",
  },
];

const REFUND_SECTIONS = [
  {
    id: "services-overview",
    title: "Services Overview",
    body: "ClientSurge Systems provides custom AI automation setup, software configuration, workflow implementation, AI agent setup, and recurring monthly automation support services. Because our work involves custom setup, configuration, and digital service delivery, we do not accept physical returns or exchanges.",
  },
  {
    id: "refund-eligibility",
    title: "Refund Eligibility",
    body: "Setup fees, installation fees, and onboarding fees are generally non-refundable once work has begun. This includes account configuration, workflow planning, AI setup, automation installation, software integration, client onboarding, or implementation work performed for the customer. Monthly subscription charges may be canceled before the next billing cycle. Cancellation stops future billing but does not automatically refund prior charges.",
  },
  {
    id: "review-window",
    title: "30-Day Review Window",
    body: "Customers may contact ClientSurge Systems within 30 days of purchase if they believe there was a billing error, duplicate charge, service access issue, or failure to deliver the purchased service. Refund requests are reviewed case by case.",
    items: [
      "A refund may be approved for incorrect or duplicate charges.",
      "A refund may be approved if ClientSurge Systems is unable to begin or deliver the purchased service.",
      "A refund may be denied when custom setup work has already begun or required customer access was not provided.",
    ],
  },
  {
    id: "cancellations",
    title: "Cancellations",
    body: "Customers may request cancellation of their monthly subscription by contacting support. Cancellation requests should be submitted before the next billing date. Once canceled, the customer will not be billed for future monthly service periods.",
  },
  {
    id: "no-returns",
    title: "No Returns or Exchanges",
    body: "ClientSurge Systems does not sell physical goods. Returns and exchanges do not apply.",
  },
];

const LEGAL_META = {
  privacy: {
    title: "Privacy Policy",
    updated: "July 8, 2026",
    canonicalPath: "/privacy",
    sections: PRIVACY_SECTIONS,
    summary: [
      { icon: Lock, text: "We do not sell personal information" },
      { icon: PhoneCall, text: "SMS opt-out: reply STOP anytime" },
      { icon: Shield, text: "Data shared only with service providers needed to operate the system" },
      { icon: ScrollText, text: "Consent records are maintained for auditability" },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "July 8, 2026",
    canonicalPath: "/terms",
    sections: TERMS_SECTIONS,
    summary: [
      { icon: BadgeCheck, text: "Month-to-month service terms" },
      { icon: Shield, text: "Setup fees and paid months are non-refundable unless required by law or agreed in writing" },
      { icon: Lock, text: "Customers must honor consent and opt-outs" },
      { icon: ScrollText, text: "Governed by Arizona law" },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    updated: "July 8, 2026",
    canonicalPath: "/refund-policy",
    sections: REFUND_SECTIONS,
    summary: [
      { icon: RotateCcw, text: "Setup fees are generally non-refundable once work begins" },
      { icon: CalendarClock, text: "Monthly billing can be canceled before the next cycle" },
      { icon: Shield, text: "30-day review window for billing errors and access issues" },
      { icon: Ban, text: "No physical returns or exchanges" },
    ],
  },
};

const TRUST_LABELS = [
  { label: "SMS Opt-Out Guardrails", desc: "STOP handling and compliance-block logging are part of the system design." },
  { label: "Truthful Proof Labels", desc: "Previews, roadmap items, and verified results are labeled separately." },
  { label: "Data-Minimization Standard", desc: "Data is used for requested service, support, operations, analytics, and compliance records." },
  { label: "Arizona Terms", desc: "Terms identify Arizona law without implying third-party certification." },
];

function SummaryCard({ items }) {
  return (
    <div className="rounded-xl border border-primary/15 p-6 mb-10 bg-primary/5">
      <p className="cs-section-eyebrow mb-4">At a Glance</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2.5">
            <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-foreground leading-relaxed">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBlock({ section, index }) {
  return (
    <section id={section.id} className="mb-10" style={{ scrollMarginTop: "calc(var(--cs-nav-height) + 24px)" }}>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-bold text-primary font-titles min-w-[20px] flex-shrink-0">{index + 1}.</span>
        <h2 className="cs-section-title" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>{section.title}</h2>
      </div>
      <p className="text-[15px] text-foreground leading-relaxed pl-8 max-w-[72ch] font-inter">{section.body}</p>
      {section.items && (
        <ul className="pl-12 mt-3 space-y-1.5 max-w-[72ch]">
          {section.items.map((item) => (
            <li key={item} className="list-disc text-[15px] text-foreground leading-relaxed font-inter">{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ContactBlock() {
  return (
    <section className="rounded-xl border border-border bg-muted/30 p-6 mt-10">
      <h2 className="text-lg font-bold text-foreground mb-2">Contact</h2>
      <p className="text-sm text-muted-foreground mb-3">Questions, requests, or communication preference changes can be sent to:</p>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-bold text-primary border-b border-primary/30 hover:border-primary transition-colors pb-px">{SUPPORT_EMAIL}</a>
        <span className="text-muted-foreground text-xs">or</span>
        <a href={`tel:${SUPPORT_TEL}`} className="text-sm font-bold text-primary border-b border-primary/30 hover:border-primary transition-colors pb-px">{SUPPORT_PHONE}</a>
      </div>
    </section>
  );
}

function TrustLabelBar() {
  return (
    <div className="bg-muted/50 border-t border-primary/10 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground text-center mb-5">Compliance &amp; Trust Labels</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST_LABELS.map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-primary/12 p-4 text-center bg-white flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-foreground leading-tight">{label}</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LegalPage({ fixedType, canonicalPath }) {
  const { type: routeType = "privacy" } = useParams();
  const navigate = useNavigate();
  const type = fixedType || routeType;
  const meta = LEGAL_META[type] || LEGAL_META.privacy;
  const { title, updated, sections, summary } = meta;

  useEffect(() => setPageMetadata({
    title: `${title} | ClientSurge Systems`,
    description: `Read the ClientSurge Systems ${title.toLowerCase()} covering data, messaging, billing, service terms, and support contacts.`,
    canonicalPath: canonicalPath || meta.canonicalPath || `/legal/${type}`,
    ogTitle: `${title} | ClientSurge Systems`,
    ogDescription: `Review the latest ClientSurge Systems ${title.toLowerCase()} for lead capture, messaging, billing, and service operations.`,
  }), [canonicalPath, meta.canonicalPath, title, type]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <section
          className="px-4 sm:px-6 lg:px-8"
          style={{
            background: "linear-gradient(180deg, rgba(0,174,239,0.06) 0%, hsl(var(--background)) 100%)",
            paddingTop: "calc(var(--cs-nav-height) + 3rem)",
            paddingBottom: "2.5rem",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <p className="cs-section-eyebrow mb-3">Legal</p>
            <div className="flex items-center gap-4 mb-4">
              <span className="cs-section-bar" style={{ height: "52px" }} aria-hidden="true" />
              <h1 className="cs-section-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{title}</h1>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">Last updated: {updated}</p>
              <div className="flex gap-1 rounded-lg border border-primary/20 p-0.5 bg-muted/50">
                {[
                  ["privacy", "Privacy", "/privacy"],
                  ["terms", "Terms", "/terms"],
                  ["refund", "Refunds", "/refund-policy"],
                ].map(([key, label, path]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold border-none cursor-pointer transition-all ${type === key ? "bg-white text-primary shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
          <SummaryCard items={summary} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10 items-start">
            <div>
              {sections.map((section, index) => <SectionBlock key={section.id} section={section} index={index} />)}
              {type === "privacy" && <div className="mt-10"><DataDeletionRequestForm /></div>}
              <ContactBlock />
            </div>
            <aside className="hidden lg:block sticky" style={{ top: "calc(var(--cs-nav-height) + 32px)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">On This Page</p>
              <nav className="flex flex-col gap-1" aria-label="Page sections">
                {sections.map((section, index) => (
                  <a key={section.id} href={`#${section.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {index + 1}. {section.title}
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        </main>
        <TrustLabelBar />
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}
