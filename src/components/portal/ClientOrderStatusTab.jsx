/**
 * ClientOrderStatusTab — #455
 * Client portal tab: shows order status, workflow stage, service activation progress.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const STAGE_LABELS = {
  "Paid": "Payment confirmed ✅",
  "Configuring": "Setting up credentials...",
  "Website Spec Generated": "Website plan created ✅",
  "Website Copy Generated": "Website copy written ✅",
  "Awaiting Approval": "Waiting for your approval 👆",
  "Website Building": "Building your site 🔨",
  "Installing": "Installing AI systems ⚙️",
  "Testing": "Testing everything 🧪",
  "Live": "Your system is live! 🚀",
};

export default function ClientOrderStatusTab({ order_id }) {
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) return;
    Promise.all([
      base44.functions.invoke("getOrderStatus", { order_id }),
      base44.functions.invoke("getActivationProgress", { order_id }),
    ]).then(([oRes, pRes]) => {
      if (oRes?.order) setOrder(oRes.order);
      if (pRes) setProgress(pRes);
    }).catch(() => {}).finally(() => setLoading(false));
    const iv = setInterval(() => {
      base44.functions.invoke("getActivationProgress", { order_id }).then(r => { if (r) setProgress(r); }).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [order_id]);

  if (loading) return <p style={{ color: "#9CA3AF" }}>Loading your order status...</p>;
  if (!order) return <p style={{ color: "#EF4444" }}>Order not found.</p>;

  const stageLabel = STAGE_LABELS[order.workflow_stage] || order.workflow_stage;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
        <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Current Status</p>
        <p style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>{stageLabel}</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Plan: {order.package_key} · {order.billing_status || "active"}</p>
      </div>

      {progress && progress.total_services > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, margin: "0 0 10px" }}>AI Services</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Activated</span>
            <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 700 }}>{progress.configured}/{progress.total_services}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${progress.percent_complete || 0}%`, background: "linear-gradient(90deg,#00D4FF,#00FFB3)", borderRadius: 999, transition: "width 0.5s" }} />
          </div>
          {progress.errored > 0 && (
            <p style={{ color: "#F59E0B", fontSize: 11, marginTop: 8 }}>⚠️ {progress.errored} service(s) need attention — Nolan has been notified.</p>
          )}
        </div>
      )}

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 16 }}>
        Questions? Email <a href="mailto:nolan@clientsurgesystems.com" style={{ color: "#00D4FF", textDecoration: "none" }}>nolan@clientsurgesystems.com</a>
      </p>
    </div>
  );
}
