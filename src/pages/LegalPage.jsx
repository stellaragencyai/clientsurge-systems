/**
 * LegalPage.jsx — #12
 * Wraps Privacy Policy / Terms with proper Navbar + Footer.
 */
import { useParams } from "react-router-dom";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "May 8, 2026",
    body: `<h2>1. Information We Collect</h2>
<p>We collect information you provide directly — business name, phone number, email address, and other contact details submitted through our forms.</p>
<h2>2. How We Use Your Information</h2>
<p>We use your information to provide and improve our AI automation services, contact you about your inquiry, and send you relevant follow-up communications. You may opt out at any time by replying STOP to any SMS or emailing nolan@clientsurgesystems.com.</p>
<h2>3. Data Sharing</h2>
<p>We do not sell your personal information. We share data only with service providers necessary to operate our platform (Twilio, Resend, Stripe, OpenAI).</p>
<h2>4. Data Retention</h2>
<p>We retain contact records for up to 12 months. Records older than 365 days are anonymised automatically.</p>
<h2>5. Contact</h2>
<p>Questions? Email <a href="mailto:nolan@clientsurgesystems.com">nolan@clientsurgesystems.com</a> or write to ClientSurge Systems LLC, 653 W 10th St, Tempe AZ 85282.</p>`,
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

export default function LegalPage() {
  const { type = "privacy" } = useParams();
  const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E" }}>
      {/* #12: simple branded navbar */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>ClientSurge</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4FF", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 8px", borderRadius: 9999 }}>Systems</span>
        </a>
        <span style={{ flex: 1 }} />
        <a href="/pricing" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none" }}>Pricing</a>
        <a href="/store" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none", marginLeft: 16 }}>Store</a>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 8 }}>Last updated: {content.updated}</p>
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 32px" }}>{content.title}</h1>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: content.body }} />
      </div>
    </div>
  );
}
