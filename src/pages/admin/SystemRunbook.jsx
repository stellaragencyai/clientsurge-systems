// PL-100: Post-launch rollback plan / go-live runbook page (admin only)
import { useState } from "react";
import { CheckCircle, AlertTriangle, ExternalLink, Copy } from "lucide-react";

const ROLLBACK_STEPS = [
  {
    phase: "Pre-Launch Verification",
    steps: [
      "✅ Stripe is in Live Mode — verify at dashboard.stripe.com",
      "✅ STRIPE_SECRET_KEY starts with sk_live_",
      "✅ STRIPE_WEBHOOK_SECRET is set to production webhook secret",
      "✅ APP_URL points to production domain (not localhost)",
      "✅ Resend SPF/DKIM/DMARC authenticated",
      "✅ Twilio A2P 10DLC registered",
      "✅ healthCheck endpoint returns 200",
    ],
  },
  {
    phase: "Launch Steps (in order)",
    steps: [
      "1. Run testProviderConnections from admin — confirm Twilio + Resend both return OK",
      "2. Place a test purchase with a real card (use personal card, refund after)",
      "3. Verify: Order created → welcome email sent → portal redirect works",
      "4. Verify: Stripe webhook fires → order updates to paid",
      "5. Watch admin dashboard for new order notification",
      "6. Set UptimeRobot monitor on /healthCheck endpoint",
      "7. Monitor for 2 hours post-launch",
    ],
  },
  {
    phase: "If Stripe Goes Down",
    steps: [
      "1. Check status.stripe.com for outage",
      "2. Temporarily disable checkout button in CartSidebar (set STRIPE_DOWN=true env var)",
      "3. Add banner: 'Checkout temporarily unavailable — call (602) 584-3227'",
      "4. Manually collect payments via Stripe payment links in dashboard",
      "5. When Stripe recovers: re-enable checkout, verify webhook backfill ran",
    ],
  },
  {
    phase: "If Twilio Goes Down",
    steps: [
      "1. Check status.twilio.com for outage",
      "2. Disable voice_calls_enabled in AdminSettings",
      "3. SMS will queue — check _shared/smsOptOut for held messages",
      "4. Monitor CommunicationEvent for failed SMS events",
      "5. When Twilio recovers: re-enable, run runTwilioProofCheck",
    ],
  },
  {
    phase: "If Resend Goes Down",
    steps: [
      "1. Check resend.com/status for outage",
      "2. Check CommunicationEvent for failed email events",
      "3. Critical emails (receipts, confirmations) can be resent via admin panel",
      "4. When Resend recovers: run sendOrderConfirmationEmail manually for any missed orders",
    ],
  },
  {
    phase: "Emergency Rollback",
    steps: [
      "1. Switch STRIPE_SECRET_KEY back to sk_test_ key to stop real charges",
      "2. Update Stripe webhook endpoint back to previous URL",
      "3. Set emergency kill switch in AdminSettings.emergency_kill_switch = true",
      "4. Notify any affected customers within 1 hour",
      "5. Document incident in AuditLog",
    ],
  },
];

export default function SystemRunbook() {
  const [copied, setCopied] = useState(false);
  const [openPhase, setOpenPhase] = useState(null);

  const copyHealthCheckUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/functions/healthCheck`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#00AEEF", marginBottom: "8px" }}>
          Operations
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#000", marginBottom: "12px" }}>
          Go-Live Runbook & Rollback Plan
        </h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>
          Follow this guide for a safe production launch. In case of incidents, use the rollback procedures below.
        </p>
      </div>

      {/* Health check URL */}
      <div style={{ marginBottom: "28px", padding: "16px 20px", borderRadius: "10px", background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#00AEEF", margin: "0 0 4px" }}>Health Check Endpoint</p>
          <p style={{ fontSize: "13px", color: "#333", margin: 0, fontFamily: "monospace" }}>
            {window.location.origin}/api/functions/healthCheck
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={copyHealthCheckUrl} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #00AEEF", background: "transparent", color: "#00AEEF", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <Copy style={{ width: "12px", height: "12px" }} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <a href="https://uptimerobot.com" target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", background: "#00AEEF", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <ExternalLink style={{ width: "12px", height: "12px" }} />
            Set Up UptimeRobot
          </a>
        </div>
      </div>

      {/* Runbook phases */}
      {ROLLBACK_STEPS.map((phase, idx) => (
        <div key={idx} style={{ marginBottom: "16px", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <button
            onClick={() => setOpenPhase(openPhase === idx ? null : idx)}
            style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: openPhase === idx ? "rgba(0,174,239,0.05)" : "#f9fafb", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {idx === 0 ? (
                <CheckCircle style={{ width: "18px", height: "18px", color: "#22c55e" }} />
              ) : (
                <AlertTriangle style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
              )}
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>{phase.phase}</span>
            </div>
            <span style={{ fontSize: "18px", color: "#999" }}>{openPhase === idx ? "−" : "+"}</span>
          </button>
          {openPhase === idx && (
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
              {phase.steps.map((step, sIdx) => (
                <p key={sIdx} style={{ fontSize: "13px", color: "#333", lineHeight: 1.7, margin: "0 0 8px", paddingLeft: "4px" }}>
                  {step}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* External links */}
      <div style={{ marginTop: "28px", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fafafa" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: "12px" }}>
          Status Pages
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {[
            { name: "Stripe Status", url: "https://status.stripe.com" },
            { name: "Twilio Status", url: "https://status.twilio.com" },
            { name: "Resend Status", url: "https://resend.com/status" },
            { name: "Base44 Status", url: "https://base44.com" },
          ].map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", background: "#fff", border: "1px solid #ddd", fontSize: "13px", fontWeight: 600, color: "#333", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
              <ExternalLink style={{ width: "12px", height: "12px" }} />
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}