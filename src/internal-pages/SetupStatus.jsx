/**
 * SetupStatus.jsx
 * Page: /setup/status/[order_id]
 * Shows live install progress stepper.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STAGES = [
  { key: "Paid", label: "Payment confirmed" },
  { key: "Configuring", label: "Setup in progress" },
  { key: "Installing", label: "AI systems being installed" },
  { key: "Testing", label: "Testing & verification" },
  { key: "Live", label: "Your system is live!" },
];

export default function SetupStatus({ orderIdOverride = "" }) {
  const params = useParams();
  const orderId = orderIdOverride || params.order_id || params.orderId || "";
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      setError("");
      const [orderRes, progressRes] = await Promise.all([
        base44.functions.invoke("getOrderStatus", { order_id: orderId }),
        base44.functions.invoke("getActivationProgress", { order_id: orderId }),
      ]);
      if (orderRes?.order) setOrder(orderRes.order);
      if (progressRes) setProgress(progressRes);
    } catch {
      setError("We could not load this setup status right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentStageIndex = STAGES.findIndex((stage) => stage.key === order?.workflow_stage);

  if (loading) {
    return (
      <div style={{ color: "#9CA3AF", padding: 60, textAlign: "center" }}>
        Loading your setup status...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0F1E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
            We&apos;re setting up your system
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
            We&apos;ll email you the moment it&apos;s live.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 28,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: 14,
              padding: "16px 18px",
              color: "#FCA5A5",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>
              Setup status needs attention
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => setSupportOpen((value) => !value)}
              style={{
                border: "1px solid rgba(0,212,255,0.35)",
                background: "rgba(0,212,255,0.12)",
                color: "#67E8F9",
                borderRadius: 999,
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Contact Support
            </button>
            {supportOpen && (
              <div
                style={{
                  marginTop: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#fff", fontWeight: 700 }}>
                  SupportChat
                </p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.68)" }}>
                  Email <a href={`mailto:nolan@clientsurgesystems.com?subject=Setup%20status%20help%20${encodeURIComponent(orderId || "")}`} style={{ color: "#67E8F9" }}>nolan@clientsurgesystems.com</a> with this setup ID: {orderId || "not provided"}.
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STAGES.map((stage, index) => {
            const isDone = currentStageIndex > index;
            const isActive = currentStageIndex === index;

            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDone
                        ? "linear-gradient(135deg,#00D4FF,#00FFB3)"
                        : isActive
                          ? "rgba(0,212,255,0.15)"
                          : "rgba(255,255,255,0.06)",
                      border: isActive
                        ? "2px solid #00D4FF"
                        : isDone
                          ? "none"
                          : "1px solid rgba(255,255,255,0.1)",
                      fontSize: 13,
                      fontWeight: 800,
                      color: isDone ? "#0A0F1E" : isActive ? "#00D4FF" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  {index < STAGES.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 32,
                        background: isDone
                          ? "linear-gradient(#00FFB3,rgba(0,212,255,0.3))"
                          : "rgba(255,255,255,0.08)",
                        margin: "4px 0",
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <p
                    style={{
                      color: isDone ? "#00FFB3" : isActive ? "#fff" : "rgba(255,255,255,0.35)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 14,
                      margin: "0 0 4px",
                    }}
                  >
                    {stage.label}
                    {isActive && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#00D4FF", fontWeight: 600 }}>
                        ← In progress
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {progress && (
          <div
            style={{
              marginTop: 32,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid rgba(0,212,255,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Services activated</span>
              <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 700 }}>
                {progress.configured}/{progress.total_services}
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress.percent_complete || 0}%`,
                  background: "linear-gradient(90deg,#00D4FF,#00FFB3)",
                  borderRadius: 999,
                  transition: "width 0.5s ease",
                }}
              />
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
