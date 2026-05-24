/**
 * AdminOnboardingBadges — #186 #189 #190
 * Components for the AdminOnboarding page:
 * - PipelineStatusBadge: prominent pipeline_status badge
 * - InitializeInstallButton: one-click install init
 * - StalledInstallWarning: warning when paid > 2 days, no install
 */
import { useState } from "react";

const STATUS_STYLES = {
  "Pending":       { bg: "#00AEEF20", color: "#00AEEF", border: "#00AEEF40" },
  "Configuring":   { bg: "#00AEEF20", color: "#00AEEF", border: "#00AEEF40" },
  "Ready for Install": { bg: "#7C3AED20", color: "#C4B5FD", border: "#7C3AED40" },
  "Active":        { bg: "#00FFB320", color: "#00FFB3", border: "#00FFB340" },
  "Live":          { bg: "#00FFB320", color: "#00FFB3", border: "#00FFB340" },
  "Failed":        { bg: "#EF444420", color: "#FCA5A5", border: "#EF444440" },
  "At Risk":       { bg: "#EF444420", color: "#FCA5A5", border: "#EF444440" },
  "Churned":       { bg: "#6B728020", color: "#9CA3AF", border: "#6B728040" },
};

// #186: prominent pipeline_status badge
export function PipelineStatusBadge({ status, large = false }) {
  const style = STATUS_STYLES[status] || { bg: "#6B728020", color: "#9CA3AF", border: "#6B728040" };
  return (
    <span style={{
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
      borderRadius: 9999, padding: large ? "6px 16px" : "3px 10px",
      fontSize: large ? 14 : 12, fontWeight: 700, display: "inline-block",
    }}>
      {status || "Unknown"}
    </span>
  );
}

// #189: one-click "Initialize Install OS" button for newly paid orders
export function InitializeInstallButton({ orderId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleInit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/functions/installPipeline", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize", order_id: orderId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return <span style={{ color: "#00FFB3", fontSize: 12, fontWeight: 700 }}>✅ Initialized</span>;

  return (
    <div>
      <button onClick={handleInit} disabled={loading} style={{
        background: "linear-gradient(135deg,#7C3AED,#00D4FF)", color: "#fff",
        border: "none", borderRadius: 9999, padding: "7px 16px",
        fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? "Initializing..." : "⚙️ Initialize Install"}
      </button>
      {error && <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

// #190: warning badge when order paid > 2 days, no install started
export function StalledInstallWarning({ order }) {
  if (!order?.paid_at || order?.workflow_stage !== "Pending") return null;
  const hoursSince = (Date.now() - new Date(order.paid_at).getTime()) / 3600000;
  if (hoursSince < 48) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 8, padding: "6px 12px", marginTop: 8,
    }}>
      <span style={{ fontSize: 14 }}>🚨</span>
      <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 600 }}>
        Paid {Math.round(hoursSince)}h ago — install not started
      </span>
    </div>
  );
}
