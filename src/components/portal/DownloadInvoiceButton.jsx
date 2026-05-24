/**
 * DownloadInvoiceButton — #262
 * Fetches Stripe invoice_pdf URL and opens in new tab.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function DownloadInvoiceButton({ order_id }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("getStripeBillingData", { order_id });
      const data = res?.data || res || {};
      const invoice = (data.invoices || []).find((item) => item.invoice_pdf || item.hosted_invoice_url);
      if (invoice?.invoice_pdf) {
        window.open(invoice.invoice_pdf, "_blank");
      } else if (invoice?.hosted_invoice_url) {
        window.open(invoice.hosted_invoice_url, "_blank");
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
