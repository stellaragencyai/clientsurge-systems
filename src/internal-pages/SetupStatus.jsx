/**
 * SetupStatus.jsx
 * Page: /setup/status/[order_id]
 * Shows live install progress stepper.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STAGES = [
  { key: "paid", label: "Payment confirmed", matches: ["paid", "pending"] },
  { key: "credentials", label: "Credentials received", matches: ["configuring", "intake_received", "credentials_complete", "onboarding"] },
  { key: "systems", label: "Systems configuring", matches: ["activation_ready", "installing", "testing"] },
  { key: "website", label: "Website building", matches: ["website spec generated", "website copy generated", "awaiting approval", "website building"] },
  { key: "live", label: "All live", matches: ["live", "went_live"] },
];

function normalizeStage(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function findStageIndex(stageValue) {
  const normalized = normalizeStage(stageValue);
  if (!normalized) return 0;
  const directMatch = STAGES.findIndex((stage) => stage.matches.includes(normalized));
  if (directMatch >= 0) return directMatch;
  if (normalized.includes("error") || normalized.includes("fail")) return 2;
  return 0;
}

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SetupStatus() {
  const params = useParams();
  const orderId = params.order_id || params.orderId || "";
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSupportOptions, setShowSupportOptions] = useState(false);

  const fetchStatus = async () => {
    try {
      const [orderRes, progressRes] = await Promise.all([
        base44.functions.invoke("getOrderStatus", { order_id: orderId }),
        base44.functions.invoke("getActivationProgress", { order_id: orderId }),
      ]);
      if (orderRes?.order) setOrder(orderRes.order);
      if (progressRes) setProgress(progressRes);
    } catch {
      // Show empty state below if the order cannot be resolved.
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

  const currentStageIndex = useMemo(() => findStageIndex(order?.workflow_stage || progress?.workflow_stage), [order?.workflow_stage, progress?.workflow_stage]);
  const hasActivationError = (progress?.errored || 0) > 0 || /error|fail|stalled/i.test(order?.workflow_stage || progress?.workflow_stage || "");
  const statusUpdatedAt = formatTimestamp(order?.updated_date || progress?.updated_date);

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
          {statusUpdatedAt && (
            <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 12, margin: "10px 0 0" }}>
              Last updated {statusUpdatedAt}
            </p>
          )}
        </div>

        {hasActivationError && (
          <div
            style={{
              marginBottom: 24,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <p style={{ color: "#FECACA", fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>
              We hit a setup issue and our team should take a look.
            </p>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, margin: 0 }}>
              Your order is still safe. Reach out and we&apos;ll help fast.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button
                onClick={() => setShowSupportOptions((value) => !value)}
                style={{
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(135deg,#0088CC,#003B8F)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Contact Support
              </button>
              <a
                href="mailto:support@clientsurgesystems.com?subject=Setup%20status%20help"
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "10px 14px",
                  textDecoration: "none",
                }}
              >
                Email support
              </a>
            </div>
            {showSupportOptions && (
              <div
                style={{
                  marginTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 14,
                  display: "grid",
                  gap: 10,
                }}
              >
                <a href="/client-portal?tab=support" style={{ color: "#7DD3FC", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Open portal support chat
                </a>
                <a href="tel:+16025874608" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none" }}>
                  Call (602) 587-4608
                </a>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0 }}>
                  If you already have portal access, the support tab is the fastest way to keep the thread attached to your project.
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
          Updates every 30 seconds · Questions? Email support@clientsurgesystems.com
        </p>
      </div>
    </div>
  );
}
