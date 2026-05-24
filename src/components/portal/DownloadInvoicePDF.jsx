/**
 * DownloadInvoicePDF.jsx — #71 #196
 * "Download Invoice PDF" button using Stripe invoice_pdf URL.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download } from "lucide-react";

export default function DownloadInvoicePDF({ order_id }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke("getStripeBillingData", { order_id })
      .then(r => setInvoices((r?.data || r || {})?.invoices || []))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [order_id]);

  if (loading) return null;
  if (!invoices.length) return <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No invoices yet.</p>;

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Invoices</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {invoices.slice(0, 12).map((inv, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px" }}>
            <div>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, margin: 0 }}>
                ${((inv.amount_paid || 0) / 100).toFixed(2)} — {new Date(inv.created * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{inv.status}</p>
            </div>
            {inv.invoice_pdf && (
              <a href={inv.invoice_pdf} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                <Download style={{ width: 12, height: 12 }} /> PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
