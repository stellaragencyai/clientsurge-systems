/**
 * CancelSubscriptionButton — #261
 * Redirects to Stripe customer portal for self-serve cancellation.
 */
import { useState } from "react";

export default function CancelSubscriptionButton({ order_id }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCancel = async () => {
    if (!confirm("This will open Stripe's cancellation portal. Continue?")) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/functions/getStripePortalUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, return_url: window.location.href }),
      });
      const data = await res.json();
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
      <button onClick={handleCancel} disabled={loading} style={{
        background: "transparent", border: "1px solid rgba(239,68,68,0.4)",
        color: "#EF4444", borderRadius: 9999, padding: "8px 20px",
        fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? "Opening..." : "Cancel Subscription"}
      </button>
      {error && <p style={{ color: "#EF4444", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
      <p style={{ color: "#4B5563", fontSize: 11, margin: "4px 0 0" }}>
        Managed securely by Stripe. You'll be redirected to their portal.
      </p>
    </div>
  );
}
