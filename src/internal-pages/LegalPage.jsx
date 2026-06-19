/**
 * LegalPage.jsx — Privacy Policy & Terms of Service
 * Refactored: semantic JSX, sticky TOC, summary header, compliance badges, consistent typography.
 */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { ChevronDown, ChevronRight, Shield, Lock, PhoneCall, BadgeCheck, ScrollText } from "lucide-react";

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
    body: "ClientSurge Systems provides AI-powered lead automation services on a monthly subscription basis. Service tiers and pricing are listed at clientsurgesystems.com/pricing.",
  },
  {
    id: "billing",
    number: "2",
    title: "Subscription Billing and Auto-Renewal",
    body: "Monthly subscriptions automatically renew each billing period until cancelled. By purchasing a subscription, you authorize ClientSurge Systems and its payment processor to charge the payment method on file for recurring monthly fees, applicable setup fees, add-ons, taxes, and other amounts disclosed at checkout.",
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
    <div className="rounded-xl border border-primary/10 p-5 md:p-6 mb-10"
      style={{ background: "linear-gradient(135deg, rgba(0,136,204,0.04) 0%, rgba(0,59,143,0.02) 100%)" }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary mb-4">At a Glance</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-foreground/90 leading-snug">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBlock({ section, isActive }) {
  return (
    <div id={section.id} className={`scroll-mt-[calc(var(--cs-nav-height)+24px)] ${isActive ? "ring-2 ring-primary/20 rounded-lg" : ""}`}>
      <h2 className="flex items-baseline gap-3 mb-3 group">
        <span className="text-[13px] font-extrabold text-primary/50 tabular-nums shrink-0 w-6 text-right">
          {section.number}.
        </span>
        <span className="text-lg md:text-xl font-bold leading-snug"
          style={{ fontFamily: "'Montserrat', sans-serif", color: "#000000" }}>
          {section.title}
        </span>
      </h2>
      {section.body && (
        <p className="text-sm text-foreground/85 leading-relaxed pl-9 mb-8" style={{ maxWidth: "65ch" }}>
          {section.body}
        </p>
      )}
      {section.contact && (
        <div className="pl-9 mb-8 space-y-2">
          <p className="text-sm text-foreground/70 leading-relaxed">Questions? Reach us at:</p>
          <a href="mailto:support@clientsurgesystems.com"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors">
            support@clientsurgesystems.com
          </a>
          <span className="text-sm text-foreground/50 mx-2">or</span>
          <a href="tel:+16025843227"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors">
            (602) 584-3227
          </a>
        </div>
      )}
    </div>
  );
}

function TableOfContents({ sections, activeId }) {
  return (
    <nav aria-label="Page sections" className="space-y-0.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">On This Page</p>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md text-sm transition-colors ${
            activeId === s.id
              ? "text-primary font-semibold bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById(s.id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground/60 w-5 shrink-0">{s.number}</span>
          <span className="truncate">{s.title}</span>
          {activeId === s.id && <ChevronRight className="w-3 h-3 shrink-0 ml-auto" />}
        </a>
      ))}
    </nav>
  );
}

function ComplianceBadgeBar() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-16 pt-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground text-center mb-5">
        Compliance &amp; Trust
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COMPLIANCE_BADGES.map(({ label, desc }) => (
          <div key={label}
            className="rounded-xl border border-border/60 p-4 text-center flex flex-col items-center gap-2"
            style={{ background: "rgba(255,255,255,0.6)" }}>
            <Shield className="w-5 h-5 text-muted-foreground/40" />
            <span className="text-xs font-bold text-foreground/70 leading-tight">{label}</span>
            <span className="text-[10px] text-muted-foreground/60 leading-snug">{desc}</span>
          </div>
        ))}
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

  // Intersection observer for active TOC item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    const ids = sections.map((s) => s.id);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main
          ref={contentRef}
          className="mx-auto px-4 md:px-6"
          style={{
            maxWidth: "1024px",
            paddingTop: "calc(var(--cs-nav-height) + 36px)",
            paddingBottom: "48px",
          }}
        >
          {/* Last updated + tab switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-medium text-muted-foreground/60">
              Last updated: {updated}
            </p>
            <div className="flex gap-1 rounded-lg border border-border/60 p-0.5 bg-muted/30">
              <button
                onClick={() => navigate("/privacy-policy")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  type === "privacy" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Privacy
              </button>
              <button
                onClick={() => navigate("/terms")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  type === "terms" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Terms
              </button>
            </div>
          </div>

          {/* Title */}
          <h1
            className="font-extrabold mb-2 tracking-tight"
            style={{ color: "#000000", fontFamily: "'Montserrat', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.15 }}
          >
            {title}
          </h1>

          {/* Gold rule */}
          <div className="flex items-center justify-start gap-3 mb-8">
            <div className="h-px w-16" style={{ background: "linear-gradient(to right, rgba(0,174,239,0.5), transparent)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00AEEF" }} />
          </div>

          {/* Summary card */}
          <SummaryCard items={summary} />

          {/* Mobile TOC toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground hover:border-primary/30 transition-colors"
            >
              <ScrollText className="w-4 h-4 text-primary" />
              On This Page
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${mobileTocOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileTocOpen && (
              <div className="mt-2 p-4 rounded-xl border border-border/60 bg-card">
                <TableOfContents sections={sections} activeId={activeId} />
              </div>
            )}
          </div>

          {/* Content + Desktop TOC */}
          <div className="flex gap-12">
            {/* Content */}
            <div className="flex-1 min-w-0">
              {sections.map((section) => (
                <SectionBlock key={section.id} section={section} isActive={activeId === section.id} />
              ))}
            </div>

            {/* Desktop sticky TOC */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky" style={{ top: "calc(var(--cs-nav-height) + 32px)" }}>
                <TableOfContents sections={sections} activeId={activeId} />
              </div>
            </aside>
          </div>
        </main>

        {/* Compliance badges */}
        <ComplianceBadgeBar />

        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}