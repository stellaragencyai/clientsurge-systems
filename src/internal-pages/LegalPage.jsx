/**
 * LegalPage.jsx — Privacy Policy & Terms of Service
 * Rebuilt to match main site: Montserrat headings, #000000 text, electric blue accents, blue bar hero.
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
    <div style={{
      borderRadius: "0.75rem",
      border: "1px solid rgba(0,174,239,0.15)",
      padding: "24px",
      marginBottom: "40px",
      background: "linear-gradient(135deg, rgba(0,136,204,0.05) 0%, rgba(0,59,143,0.03) 100%)",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00AEEF", marginBottom: "16px" }}>
        At a Glance
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        {items.map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Icon style={{ width: "16px", height: "16px", color: "#00AEEF", flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", lineHeight: 1.5 }}>{text}</span>
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
      style={{
        scrollMarginTop: "calc(var(--cs-nav-height) + 24px)",
        borderLeft: isActive ? "3px solid #00AEEF" : "3px solid transparent",
        paddingLeft: isActive ? "16px" : "0",
        transition: "border-color 0.2s, padding-left 0.2s",
        marginBottom: "40px",
      }}
    >
      {/* Section heading row */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
        <span style={{
          fontSize: "12px",
          fontWeight: 800,
          color: "#00AEEF",
          fontFamily: "'Montserrat', sans-serif",
          minWidth: "20px",
          flexShrink: 0,
        }}>
          {section.number}.
        </span>
        <h2 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          fontWeight: 800,
          color: "#000000",
          lineHeight: 1.2,
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          {section.title}
        </h2>
      </div>

      {section.body && (
        <p style={{
          fontSize: "15px",
          color: "#1a1a1a",
          lineHeight: 1.75,
          paddingLeft: "32px",
          maxWidth: "68ch",
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
        }}>
          {section.body}
        </p>
      )}

      {section.contact && (
        <div style={{ paddingLeft: "32px" }}>
          <p style={{ fontSize: "15px", color: "#1a1a1a", lineHeight: 1.7, marginBottom: "8px", fontFamily: "'Inter', sans-serif" }}>
            Questions? Reach us at:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <a href="mailto:support@clientsurgesystems.com" style={{
              fontSize: "14px", fontWeight: 700, color: "#00AEEF", textDecoration: "none",
              borderBottom: "1px solid rgba(0,174,239,0.3)", paddingBottom: "1px",
            }}>
              support@clientsurgesystems.com
            </a>
            <span style={{ color: "#6b7280", fontSize: "13px" }}>or</span>
            <a href="tel:+16025843227" style={{
              fontSize: "14px", fontWeight: 700, color: "#00AEEF", textDecoration: "none",
              borderBottom: "1px solid rgba(0,174,239,0.3)", paddingBottom: "1px",
            }}>
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
      <p style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>
        On This Page
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(s.id);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 8px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: activeId === s.id ? 700 : 500,
              color: activeId === s.id ? "#00AEEF" : "#1a1a1a",
              background: activeId === s.id ? "rgba(0,174,239,0.06)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s ease",
              borderLeft: activeId === s.id ? "2px solid #00AEEF" : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", minWidth: "16px" }}>{s.number}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
            {activeId === s.id && <ChevronRight style={{ width: "12px", height: "12px", marginLeft: "auto", flexShrink: 0 }} />}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ComplianceBadgeBar() {
  return (
    <div style={{ background: "#f8fafc", borderTop: "1px solid rgba(0,174,239,0.10)", padding: "48px 24px" }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b7280", textAlign: "center", marginBottom: "20px" }}>
          Compliance &amp; Trust
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {COMPLIANCE_BADGES.map(({ label, desc }) => (
            <div key={label} style={{
              borderRadius: "0.75rem",
              border: "1px solid rgba(0,174,239,0.12)",
              padding: "16px",
              textAlign: "center",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}>
              <Shield style={{ width: "20px", height: "20px", color: "#00AEEF" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#000000", lineHeight: 1.3 }}>{label}</span>
              <span style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.4 }}>{desc}</span>
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
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <Navbar />

        {/* ── Hero — matches main site contact/about hero style ── */}
        <section style={{
          background: "linear-gradient(180deg, rgba(0,174,239,0.06) 0%, #ffffff 100%)",
          paddingTop: "calc(var(--cs-nav-height) + 48px)",
          paddingBottom: "40px",
          paddingLeft: "clamp(1.5rem, 6vw, 80px)",
          paddingRight: "clamp(1.5rem, 6vw, 80px)",
        }}>
          <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
            {/* Eyebrow */}
            <p style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#00AEEF",
              marginBottom: "14px",
              fontFamily: "'Montserrat', sans-serif",
            }}>
              Legal
            </p>

            {/* Title row — blue bar + heading */}
            <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "16px" }}>
              <div style={{
                width: "5px",
                height: "52px",
                background: "#00AEEF",
                borderRadius: "3px",
                flexShrink: 0,
                boxShadow: "0 0 14px rgba(0,174,239,0.6)",
              }} />
              <h1 style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 900,
                color: "#000000",
                WebkitTextFillColor: "#000000",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                margin: 0,
                textShadow: "none",
                background: "none",
                WebkitBackgroundClip: "unset",
                backgroundClip: "unset",
              }}>
                {title}
              </h1>
            </div>

            {/* Last updated + tab switcher */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>
                Last updated: {updated}
              </p>
              <div style={{
                display: "flex",
                gap: "4px",
                borderRadius: "8px",
                border: "1px solid rgba(0,174,239,0.2)",
                padding: "3px",
                background: "#f9fafb",
              }}>
                <button
                  onClick={() => navigate("/privacy-policy")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: type === "privacy" ? "#ffffff" : "transparent",
                    color: type === "privacy" ? "#00AEEF" : "#6b7280",
                    boxShadow: type === "privacy" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Privacy
                </button>
                <button
                  onClick={() => navigate("/terms")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: type === "terms" ? "#ffffff" : "transparent",
                    color: type === "terms" ? "#00AEEF" : "#6b7280",
                    boxShadow: type === "terms" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Terms
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <main
          ref={contentRef}
          style={{
            maxWidth: "1024px",
            margin: "0 auto",
            padding: "40px 24px 64px",
          }}
        >
          {/* Summary card */}
          <SummaryCard items={summary} />

          {/* Mobile TOC toggle */}
          <div style={{ display: "block", marginBottom: "24px" }} className="lg:hidden">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(0,174,239,0.2)",
                background: "#f9fafb",
                fontSize: "13px",
                fontWeight: 700,
                color: "#000000",
                cursor: "pointer",
              }}
            >
              <ScrollText style={{ width: "15px", height: "15px", color: "#00AEEF" }} />
              On This Page
              <ChevronDown style={{ width: "15px", height: "15px", marginLeft: "auto", transform: mobileTocOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {mobileTocOpen && (
              <div style={{ marginTop: "8px", padding: "16px", borderRadius: "10px", border: "1px solid rgba(0,174,239,0.15)", background: "#ffffff" }}>
                <TableOfContents sections={sections} activeId={activeId} />
              </div>
            )}
          </div>

          {/* Content + Desktop TOC */}
          <div style={{ display: "flex", gap: "56px", alignItems: "flex-start" }}>
            {/* Sections */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {sections.map((section) => (
                <SectionBlock key={section.id} section={section} isActive={activeId === section.id} />
              ))}
            </div>

            {/* Desktop sticky TOC */}
            <aside className="hidden lg:block" style={{ width: "220px", flexShrink: 0 }}>
              <div style={{ position: "sticky", top: "calc(var(--cs-nav-height) + 32px)" }}>
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