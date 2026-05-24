/**
 * LegalPage.jsx — #12
 * Wraps Privacy Policy / Terms with proper Navbar + Footer.
 */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "May 21, 2026",
    body: `<h2>1. Information We Collect</h2>
<p>We collect information you provide directly, including business name, contact name, phone number, email address, website URL, service interest, messages submitted through forms, booking details, and information needed to respond to your inquiry.</p>
<h2>2. How We Use Your Information</h2>
<p>We use your information to respond to inquiries, schedule automation audits, provide and improve our AI automation services, support lead capture and booking workflows, send relevant follow-up communications, and maintain business records. You may opt out of SMS at any time by replying STOP or by emailing support@clientsurgesystems.com.</p>
<h2>3. Cookies and Tracking</h2>
<p>We may use cookies, analytics, pixels, UTM parameters, and similar technologies to understand website traffic, measure marketing performance, improve forms and booking flows, and prevent abuse.</p>
<h2>4. Data Sharing and Third-Party Services</h2>
<p>We do not sell your personal information. We share data only with service providers needed to operate the website, forms, messaging, payments, email, analytics, automation, and AI workflows. These providers may include Base44, Twilio, Resend, Stripe, OpenAI, Google, Calendly, and similar infrastructure or business service vendors.</p>
<h2>5. Data Retention</h2>
<p>We retain contact records and business inquiry data for as long as reasonably needed to provide services, maintain records, support legal obligations, and improve operations. We may delete or anonymize records that are no longer needed.</p>
<h2>6. Contact</h2>
<p>Questions? Email <a href="mailto:support@clientsurgesystems.com">support@clientsurgesystems.com</a> or call <a href="tel:+16025843227">(602) 584-3227</a>.</p>`,
  },
  terms: {
    title: "Terms of Service",
    updated: "May 8, 2026",
    body: `<h2>1. Services</h2>
<p>ClientSurge Systems provides AI-powered lead automation services on a monthly subscription basis. Service tiers and pricing are listed at clientsurgesystems.com/pricing.</p>
<h2>2. Payment</h2>
<p>Subscriptions are billed monthly. Setup fees are one-time and non-refundable. Monthly fees may be cancelled at any time; cancellation takes effect at the end of the current billing period.</p>
<h2>3. SMS Compliance</h2>
<p>By providing a phone number, you consent to receive automated text messages from ClientSurge Systems. Message frequency varies. Reply STOP to opt out. Message and data rates may apply.</p>
<h2>4. Limitation of Liability</h2>
<p>ClientSurge Systems is not liable for indirect or consequential damages. Our total liability shall not exceed the amount paid in the prior 30 days.</p>
<h2>5. Governing Law</h2>
<p>These terms are governed by the laws of the State of Arizona.</p>`,
  },
};

export default function LegalPage({ fixedType, canonicalPath }) {
  const { type: routeType = "privacy" } = useParams();
  const type = fixedType || routeType;
  const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;

  useEffect(() => setPageMetadata({
    title: `${content.title} | ClientSurge Systems`,
    description: `Read the ClientSurge Systems ${content.title.toLowerCase()} and how we handle customer data, messaging, and service terms.`,
    canonicalPath: canonicalPath || `/legal/${type}`,
    ogTitle: `${content.title} | ClientSurge Systems`,
    ogDescription: `Review the latest ClientSurge Systems ${content.title.toLowerCase()} for lead capture, messaging, and service operations.`,
  }), [canonicalPath, content.title, type]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E" }}>
      {/* #12: simple branded navbar */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>ClientSurge</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4FF", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 8px", borderRadius: 9999 }}>Systems</span>
        </a>
        <span style={{ flex: 1 }} />
        <a href="/automations" style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, textDecoration: "none" }}>Automations</a>
        <a href="/book" style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, textDecoration: "none", marginLeft: 16 }}>Book Audit</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, marginBottom: 8 }}>Last updated: {content.updated}</p>
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 32px" }}>{content.title}</h1>
        <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: content.body }} />
      </div>
    </div>
  );
}
