/**
 * CookieConsent — #78
 * TCPA-compliant consent banner for all public lead capture forms.
 * Must be accepted before form submission is allowed.
 */
import { useState, useEffect } from "react";

const CONSENT_KEY = "cs_lead_consent_v1";

export function useCookieConsent() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === "true");
  }, []);

  const giveConsent = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setConsented(true);
  };

  return { consented, giveConsent };
}

export default function CookieConsent({ onConsent, compact = false }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
    onConsent?.();
  };

  if (compact) {
    return (
      <p style={{ fontSize: 11, color: "#6B7280", margin: "8px 0 0", lineHeight: 1.5 }}>
        By submitting, you agree to receive SMS and email communications from us.
        Reply STOP to opt out anytime. View our{" "}
        <a href="/privacy" style={{ color: "#00AEEF" }}>Privacy Policy</a>.
      </p>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, left: 20, right: 20, zIndex: 9999,
      background: "#1a1f35", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 16, padding: "20px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      maxWidth: 640, margin: "0 auto",
    }}>
      <p style={{ color: "#D1D5DB", fontSize: 13, margin: 0, lineHeight: 1.5, flex: 1 }}>
        🍪 By using this site and submitting your info, you agree to receive SMS/email communications.
        Reply STOP to opt out.{" "}
        <a href="/privacy" style={{ color: "#00AEEF" }}>Privacy Policy</a>
      </p>
      <button onClick={handleAccept} style={{
        background: "linear-gradient(135deg, #00D4FF, #00FFB3)", color: "#0A0F1E",
        border: "none", borderRadius: 9999, padding: "10px 20px",
        fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
      }}>
        Got it
      </button>
    </div>
  );
}
