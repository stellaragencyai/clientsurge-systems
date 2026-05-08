/**
 * SetupStatus.jsx — #434
 * Page: /setup/status/[order_id]
 * Shows live install progress stepper.
 * Redirected to after credentials submission.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STAGES = [
  { key: "Paid", label: "Payment confirmed" },
  { key: "Configuring", label: "Setup in progress" },
  { key: "Installing", label: "AI systems being installed" },
  { key: "Testing", label: "Testing & verification" },
  { key: "Live", label: "Your system is live! 🚀" },
];

export default function SetupStatus() {
  const { order_id } = useParams();
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const [orderRes, progressRes] = await Promise.all([
        base44.functions.invoke("getOrderStatus", { order_id }),
        base44.functions.invoke("getActivationProgress", { order_id }),
      ]);
      if (orderRes?.order) setOrder(orderRes.order);
      if (progressRes) setProgress(progressRes);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStatus();
    // #424a: 30-second polling
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [order_id]);

  const currentStageIndex = STAGES.findIndex(s => s.key === order?.workflow_stage);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 60, textAlign: "center" }}>Loading your setup status...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>We're setting up your system</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
            {order?.client_name ? `Hey ${order.client_name} — ` : ""}we'll email you the moment it's live.
          </p>
        </div>

        {/* #424b: stepper with 5 stages reading real workflow_stage */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STAGES.map((stage, i) => {
            const isDone = currentStageIndex > i;
            const isActive = currentStageIndex === i;
            const isPending = currentStageIndex < i;
            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: i < STAGES.length - 1 ? 0 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isDone ? "linear-gradient(135deg,#00D4FF,#00FFB3)"
                      : isActive ? "rgba(0,212,255,0.15)"
                      : "rgba(255,255,255,0.06)",
                    border: isActive ? "2px solid #00D4FF" : isDone ? "none" : "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13, fontWeight: 800,
                    color: isDone ? "#0A0F1E" : isActive ? "#00D4FF" : "rgba(255,255,255,0.3)",
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{ width: 2, height: 32, background: isDone ? "linear-gradient(#00FFB3,rgba(0,212,255,0.3))" : "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                  )}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <p style={{ color: isDone ? "#00FFB3" : isActive ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: isActive ? 700 : 500, fontSize: 14, margin: "0 0 4px" }}>
                    {stage.label}
                    {isActive && <span style={{ marginLeft: 8, fontSize: 11, color: "#00D4FF", fontWeight: 600 }}>← In progress</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        {progress && (
          <div style={{ marginTop: 32, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(0,212,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Services activated</span>
              <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 700 }}>{progress.configured}/{progress.total_services}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${progress.percent_complete || 0}%`, background: "linear-gradient(90deg,#00D4FF,#00FFB3)", borderRadius: 999, transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 24 }}>
          Updates every 30 seconds · Questions? Email nolan@clientsurgesystems.com
        </p>
      </div>
    </div>
  );
}
