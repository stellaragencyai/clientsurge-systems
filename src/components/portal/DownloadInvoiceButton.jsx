/**
 * DownloadInvoiceButton — #262
 * Fetches Stripe invoice_pdf URL and opens in new tab.
 */
import { useState } from "react";

export default function DownloadInvoiceButton({ order_id }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/functions/getStripeInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id }),
      });
      const data = await res.json();
      if (data.invoice_pdf) {
        window.open(data.invoice_pdf, "_blank");
      } else if (data.invoice_url) {
        window.open(data.invoice_url, "_blank");
      } else {
        throw new Error(data.error || "Invoice not available yet");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={loading} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#D1D5DB", borderRadius: 9999, padding: "8px 20px",
        fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {loading ? "Loading..." : "⬇️ Download Invoice"}
      </button>
      {error && <p style={{ color: "#EF4444", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
