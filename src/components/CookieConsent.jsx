/**
 * CookieConsent.jsx — #356
 * Persists dismissal in localStorage so it never re-shows on refresh.
 * Key: "cs_cookie_consent" | Value: "accepted" | "declined"
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "cs_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true); // only show if not already answered
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
    // Fire GA consent if available
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
    }
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "calc(100% - 40px)", maxWidth: 520,
      background: "linear-gradient(160deg, #0D1B2E, #0A1628)",
      border: "1px solid rgba(0,212,255,0.18)",
      borderRadius: 16,
      padding: "16px 20px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      flexWrap: "wrap",
    }}>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.6, flex: 1 }}>
        We use cookies to improve your experience. By continuing, you agree to our{" "}
        <a href="/privacy" style={{ color: "#00D4FF", textDecoration: "none" }}>privacy policy</a>.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", borderRadius: 9999, padding: "7px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Decline
        </button>
        <button onClick={accept} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 9999, padding: "7px 16px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          Accept
        </button>
      </div>
    </div>
  );
}
