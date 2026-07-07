/**
 * LegalPage.jsx — Privacy Policy & Terms of Service
 * Refactored: all inline styles removed, uses global design system classes.
 * Typography enforced by index.css: Montserrat headings, Inter body, #000 text.
 */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import { ChevronDown, ChevronRight, Shield, Lock, PhoneCall, BadgeCheck, ScrollText, RotateCcw, CalendarClock, Ban } from "lucide-react";
import DataDeletionRequestForm from "@/components/legal/DataDeletionRequestForm";

/* ──────────── Content Data ──────────── */

const PRIVACY_SECTIONS = [
  {
    id: "info-collect",
    number: "1",
    title: "Information We Collect",
    body: "We collect information you provide directly, including business name, contact name, phone number, email address, website URL, service interest, messages submitted through forms, booking details, and information needed to respond to your inquiry.",
  },
  {
    id: "how-we-use",
    number: "2",
    title: "How We Use Your Information",
    body: "We use your information to respond to inquiries, schedule automation audits, provide and improve our AI automation services, support lead capture and booking workflows, send relevant follow-up communications, and maintain business records. You may opt out of SMS at any time by replying STOP or by emailing support@clientsurgesystems.com.",
  },
  {
    id: "sms-email",
    number: "3",
    title: "SMS and Email Communications",
    body: "If you provide a phone number or email address and opt in where required, we may use it to send requested follow-ups, appointment reminders, booking confirmations, missed-call text-back messages, review requests, customer reactivation messages, service updates, and related business communications. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. You can opt out of SMS by replying STOP, and you can contact us to update communication preferences.",
  },
  {
    id: "consent-records",
    number: "4",
    title: "Consent Records",
    body: "When you submit a form or otherwise opt in to communications, we may store consent records such as consent text version, timestamp, IP address, source page, UTM/source details, and submitted contact details so we can maintain accurate compliance and audit records.",
  },
  {
    id: "ai-processing",
    number: "5",
    title: "AI and Automation Processing",
    body: "We may process inquiry details, message history, booking context, business information, and service preferences through automation and AI-assisted systems to classify leads, draft replies, summarize conversations, recommend next steps, route requests, and support customer service. AI-assisted outputs may be reviewed, edited, or overridden by our team before use when appropriate.",
  },
  {
    id: "cookies",
    number: "6",
    title: "Cookies and Tracking",
    body: "We may use cookies, analytics, pixels, UTM parameters, and similar technologies to understand website traffic, measure marketing performance, improve forms and booking flows, and prevent abuse.",
  },
  {
    id: "data-sharing",
    number: "7",
    title: "Data Sharing and Third-Party Services",
    body: "We do not sell your personal information. We share data only with service providers needed to operate the website, forms, messaging, payments, email, analytics, automation, and AI workflows. These providers may include Base44, Twilio, Resend, Stripe, OpenAI, Google, Calendly, and similar infrastructure or business service vendors.",
  },
  {
    id: "data-retention",
    number: "8",
    title: "Data Retention",
    body: "We retain contact records and business inquiry data for as long as reasonably needed to provide services, maintain records, support legal obligations, and improve operations. We may delete or anonymize records that are no longer needed.",
  },
  {
    id: "contact",
    number: "9",
    title: "Contact",
    body: null,
    contact: true,
  },
];

const TERMS_SECTIONS = [
  {
    id: "services",
    number: "1",
    title: "Services",
    body: "ClientSurge Systems provides AI-powered lead automation services on a monthly subscription basis. Service tiers and pricing are listed at clientsurgesystems.com/pricing. By using our services, you agree to these terms.",
  },
  {
    id: "billing",
    number: "2",
    title: "Subscription Billing and Auto-Renewal",
    body: "Monthly subscriptions automatically renew each billing period until cancelled. By purchasing a subscription, you authorize ClientSurge Systems and its payment processor to charge the payment method on file for recurring monthly fees, applicable setup fees, add-ons, taxes, and other amounts disclosed at checkout. Subscriptions renew automatically unless you cancel before your next billing date. You may cancel at any time through the client portal or by contacting support@clientsurgesystems.com before your renewal date.",
  },
  {
    id: "cancellation",
    number: "3",
    title: "Cancellation and Changes",
    body: "You may request cancellation, pause, resume, upgrade, or downgrade support by contacting support@clientsurgesystems.com. Cancellation takes effect at the end of the then-current billing period unless otherwise stated in writing. Setup fees and already-paid monthly subscription fees are non-refundable except where required by law or expressly agreed in writing.",
  },
  {
    id: "payment",
    number: "4",
    title: "Payment Processing",
    body: "Payments are processed by Stripe or another third-party payment processor. You are responsible for keeping billing information current. Failed, disputed, or past-due payments may delay onboarding, pause service delivery, or limit access to active automations until billing is resolved.",
  },
  {
    id: "sms-compliance",
    number: "5",
    title: "SMS Compliance",
    body: "When you submit a form and check the communication consent box, book a requested appointment, or otherwise opt in, you consent to receive automated and non-automated text messages from ClientSurge Systems related to your inquiry, appointments, service updates, and follow-up. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out or contact support@clientsurgesystems.com to update communication preferences.",
  },
  {
    id: "ai-outputs",
    number: "6",
    title: "AI and Automation Outputs",
    body: "AI-assisted messages, summaries, recommendations, and automations are provided to support business workflows. You are responsible for reviewing business-critical outputs, maintaining accurate business information, honoring customer opt-outs, collecting and maintaining legally sufficient consent for your own customer communications, and using the services in compliance with applicable laws and platform rules.",
  },
  {
    id: "liability",
    number: "7",
    title: "Limitation of Liability",
    body: "ClientSurge Systems is not liable for indirect or consequential damages. Our total liability shall not exceed the amount paid in the prior 30 days.",
  },
  {
    id: "governing-law",
    number: "8",
    title: "Governing Law",
    body: "These terms are governed by the laws of the State of Arizona.",
  },
];

const REFUND_SECTIONS = [
  {
    id: "services-overview",
    number: "1",
    title: "Services Overview",
    body: "ClientSurge Systems provides custom AI automation setup, software configuration, workflow implementation, AI agent setup, and recurring monthly automation support services. Because our work involves custom setup, configuration, and digital service delivery, we do not accept physical returns or exchanges.",
  },
  {
    id: "refund-eligibility",
    number: "2",
    title: "Refund Eligibility",
    body: "Setup fees, installation fees, and onboarding fees are generally non-refundable once work has begun. This includes account configuration, workflow planning, AI setup, automation installation, software integration, client onboarding, or any other implementation work performed for the customer. Monthly subscription charges may be canceled before the next billing cycle. Cancellation stops future billing but does not automatically refund prior charges.",
  },
  {
    id: "review-window",
    number: "3",
    title: "30-Day Review Window",
    body: "Customers may contact ClientSurge Systems within 30 days of purchase if they believe there was a billing error, duplicate charge, service access issue, or failure to deliver the purchased service. Refund requests are reviewed case by case.",
    lists: [
      {
        title: "A refund may be approved if:",
        items: [
          "The customer was charged incorrectly.",
          "The customer was charged more than once for the same service.",
          "ClientSurge Systems is unable to begin or deliver the purchased service.",
          "A written refund exception is approved by ClientSurge Systems.",
        ],
      },
      {
        title: "A refund may be denied if:",
        items: [
          "Custom setup work has already begun.",
          "The customer failed to provide required access, approvals, business information, or third-party account permissions.",
          "The customer changed their mind after onboarding or implementation started.",
          "The service was delivered or made available as described.",
          "The customer violated the Terms of Service.",
        ],
      },
    ],
  },
  {
    id: "cancellations",
    number: "4",
    title: "Cancellations",
    body: "Customers may request cancellation of their monthly subscription by contacting support@clientsurgesystems.com. Cancellation requests should be submitted before the next billing date. Once canceled, the customer will not be billed for future monthly service periods.",
  },
  {
    id: "no-returns",
    number: "5",
    title: "No Returns or Exchanges",
    body: "ClientSurge Systems does not sell physical goods. Returns and exchanges do not apply.",
  },
  {
    id: "contact",
    number: "6",
    title: "Contact",
    body: null,
    contact: true,
  },
];

const LEGAL_META = {
  privacy: {
    title: "Privacy Policy",
    updated: "May 21, 2026",
    sections: PRIVACY_SECTIONS,
    summary: [
      { icon: Lock, text: "We never sell your personal information" },
      { icon: PhoneCall, text: "SMS and email opt-in is optional — reply STOP anytime" },
      { icon: Shield, text: "Data shared only with trusted service providers" },
      { icon: ScrollText, text: "Consent records maintained for compliance" },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "May 21, 2026",
    sections: TERMS_SECTIONS,
    summary: [
      { icon: BadgeCheck, text: "Month-to-month — no long-term lock-in" },
      { icon: Shield, text: "Setup fees and paid months are non-refundable" },
      { icon: Lock, text: "You control customer consent and opt-outs" },
      { icon: ScrollText, text: "Governed by Arizona law" },
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    updated: "June 26, 2026",
    sections: REFUND_SECTIONS,
    summary: [
      { icon: RotateCcw, text: "Setup fees are non-refundable once work begins" },
      { icon: CalendarClock, text: "Monthly billing canceled before the next cycle" },
      { icon: Shield, text: "30-day window for billing errors and access issues" },
      { icon: Ban, text: "No physical returns or exchanges — digital services" },
    ],
  },
};

const COMPLIANCE_BADGES = [
  { label: "10DLC SMS Compliant", desc: "Registered campaign with verified sender identity" },
  { label: "Opt-In Only Communications", desc: "All automated messaging requires explicit consent" },
  { label: "Data-Privacy First", desc: "Privacy-centric architecture with audit trails" },
  { label: "Arizona Business Trust", desc: "Operated under Arizona business law and standards" },
];

/* ──────────── Sub-Components ──────────── */

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

function SectionBlock({ section, isActive }) {
  return (
    <div
      id={section.id}
      className="mb-10 transition-all"
      style={{
        scrollMarginTop: "calc(var(--cs-nav-height) + 24px)",
        borderLeft: isActive ? "3px solid hsl(var(--primary))" : "3px solid transparent",
        paddingLeft: isActive ? "1rem" : "0",
        transition: "border-color 0.2s, padding-left 0.2s",
      }}
    >
      {/* Section heading row */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-bold text-primary font-titles min-w-[20px] flex-shrink-0">
          {section.number}.
        </span>
        <h2 className="cs-section-title" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem) !important" }}>
          {section.title}
        </h2>
      </div>

      {section.body && (
        <p className="text-[15px] text-foreground leading-relaxed pl-8 max-w-[68ch] font-inter">
          {section.body}
        </p>
      )}

      {section.lists && (
        <div className="pl-8 mt-3 space-y-5 max-w-[68ch]">
          {section.lists.map((list, idx) => (
            <div key={idx}>
              {list.title && (
                <p className="text-sm font-bold text-foreground mb-2 font-inter">{list.title}</p>
              )}
              <ul className="space-y-1.5">
                {list.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-foreground leading-relaxed font-inter">
                    <span className="text-primary font-bold mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {section.contact && (
        <div className="pl-8">
          <p className="text-[15px] text-foreground leading-relaxed mb-2 font-inter">
            Questions? Reach us at:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="mailto:support@clientsurgesystems.com"
              className="text-sm font-bold text-primary border-b border-primary/30 hover:border-primary transition-colors pb-px"
            >
              support@clientsurgesystems.com
            </a>
            <span className="text-muted-foreground text-xs">or</span>
            <a
              href="tel:+16025843227"
              className="text-sm font-bold text-primary border-b border-primary/30 hover:border-primary transition-colors pb-px"
            >
              (602) 584-3227
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function TableOfContents({ sections, activeId }) {
  return (
    <nav aria-label="Page sections">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
        On This Page
      </p>
      <div className="flex flex-col gap-0.5">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(s.id);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all border-l-2 ${
              activeId === s.id
                ? "font-bold text-primary bg-primary/5 border-primary"
                : "font-medium text-foreground/80 border-transparent hover:text-primary hover:bg-primary/5"
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground min-w-[16px]">{s.number}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{s.title}</span>
            {activeId === s.id && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ComplianceBadgeBar() {
  return (
    <div className="bg-muted/50 border-t border-primary/10 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground text-center mb-5">
          Compliance &amp; Trust
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMPLIANCE_BADGES.map(({ label, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-primary/12 p-4 text-center bg-white flex flex-col items-center gap-2"
            >
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

/* ──────────── Main Page ──────────── */

export default function LegalPage({ fixedType, canonicalPath }) {
  const { type: routeType = "privacy" } = useParams();
  const navigate = useNavigate();
  const type = fixedType || routeType;
  const meta = LEGAL_META[type] || LEGAL_META.privacy;
  const { title, updated, sections, summary } = meta;

  const [activeId, setActiveId] = useState(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => setPageMetadata({
    title: `${title} | ClientSurge Systems`,
    description: `Read the ClientSurge Systems ${title.toLowerCase()} and how we handle customer data, messaging, and service terms.`,
    canonicalPath: canonicalPath || `/legal/${type}`,
    ogTitle: `${title} | ClientSurge Systems`,
    ogDescription: `Review the latest ClientSurge Systems ${title.toLowerCase()} for lead capture, messaging, and service operations.`,
  }), [canonicalPath, title, type]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* ── Hero — matches main site hero pattern ── */}
        <section
          className="px-4 sm:px-6 lg:px-8"
          style={{
            background: "linear-gradient(180deg, rgba(0,174,239,0.06) 0%, hsl(var(--background)) 100%)",
            paddingTop: "calc(var(--cs-nav-height) + 3rem)",
            paddingBottom: "2.5rem",
          }}
        >
          <div className="max-w-5xl mx-auto">
            {/* Eyebrow */}
            <p className="cs-section-eyebrow mb-3">Legal</p>

            {/* Title row — blue bar + heading (matches SectionHeader pattern) */}
            <div className="flex items-center gap-4 mb-4">
              <span className="cs-section-bar" style={{ height: "52px" }} aria-hidden="true" />
              <h1 className="cs-section-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem) !important" }}>
                {title}
              </h1>
            </div>

            {/* Last updated + tab switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                Last updated: {updated}
              </p>
              <div className="flex gap-1 rounded-lg border border-primary/20 p-0.5 bg-muted/50">
                <button
                  onClick={() => navigate("/privacy-policy")}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold border-none cursor-pointer transition-all ${
                    type === "privacy"
                      ? "bg-white text-primary shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Privacy
                </button>
                <button
                  onClick={() => navigate("/terms")}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold border-none cursor-pointer transition-all ${
                    type === "terms"
                      ? "bg-white text-primary shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Terms
                </button>
                <button
                  onClick={() => navigate("/refund-policy")}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold border-none cursor-pointer transition-all ${
                    type === "refund"
                      ? "bg-white text-primary shadow-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Refunds
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <main
          ref={contentRef}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16"
        >
          {/* Summary card */}
          <SummaryCard items={summary} />

          {/* Mobile TOC toggle */}
          <div className="block mb-6 lg:hidden">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-primary/20 bg-muted/50 text-xs font-bold text-foreground cursor-pointer"
            >
              <ScrollText className="w-4 h-4 text-primary" />
              On This Page
              <ChevronDown
                className="w-4 h-4 ml-auto text-muted-foreground"
                style={{ transform: mobileTocOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>
            {mobileTocOpen && (
              <div className="mt-2 p-4 rounded-lg border border-primary/15 bg-white">
                <TableOfContents sections={sections} activeId={activeId} />
              </div>
            )}
          </div>

          {/* Content + Desktop TOC */}
          <div className="flex gap-8 lg:gap-14 items-start">
            {/* Sections */}
            <div className="flex-1 min-w-0">
              {sections.map((section) => (
                <SectionBlock key={section.id} section={section} isActive={activeId === section.id} />
              ))}

              {/* Finding #147: GDPR/CCPA data deletion request form on privacy page */}
              {type === "privacy" && (
                <div className="mt-10">
                  <DataDeletionRequestForm />
                </div>
              )}
            </div>

            {/* Desktop sticky TOC */}
            <aside className="hidden lg:block w-[220px] flex-shrink-0">
              <div className="sticky" style={{ top: "calc(var(--cs-nav-height) + 32px)" }}>
                <TableOfContents sections={sections} activeId={activeId} />
              </div>
            </aside>
          </div>
        </main>

        <ComplianceBadgeBar />
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}