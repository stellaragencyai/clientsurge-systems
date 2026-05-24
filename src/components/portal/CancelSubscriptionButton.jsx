/**
 * CancelSubscriptionButton — #261
 * Redirects to Stripe customer portal for self-serve cancellation.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function CancelSubscriptionButton({ order_id }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCancel = async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("getStripeCustomerPortalUrl", {
        return_url: window.location.href,
      });
      const data = res?.data || res || {};
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Could not open Stripe portal");
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={() => setConfirmOpen(true)} disabled={loading} style={{
        background: "transparent", border: "1px solid rgba(239,68,68,0.4)",
        color: "#EF4444", borderRadius: 9999, padding: "8px 20px",
        fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? "Opening..." : "Cancel Subscription"}
      </button>
      {confirmOpen && (
        <div style={{ marginTop: 10, padding: 12, border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, background: "rgba(239,68,68,0.06)" }}>
          <p style={{ color: "#D1D5DB", fontSize: 12, lineHeight: 1.5, margin: "0 0 10px" }}>
            This opens Stripe's secure billing portal where you can manage or cancel the subscription.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={handleCancel} disabled={loading} style={{ border: 0, borderRadius: 9999, padding: "7px 14px", background: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              Continue to Stripe
            </button>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={loading} style={{ border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9999, padding: "7px 14px", background: "transparent", color: "#D1D5DB", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              Keep Subscription
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color: "#EF4444", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
      <p style={{ color: "#4B5563", fontSize: 11, margin: "4px 0 0" }}>
        Managed securely by Stripe. You'll be redirected to their portal.
      </p>
    </div>
  );
}
