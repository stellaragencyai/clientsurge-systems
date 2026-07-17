import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";
const SUPPORT_PHONE = "+16025843227";
const SUPPORT_PHONE_DISPLAY = "(602) 584-3227";

const STAGES = [
  { key: "paid", label: "Payment confirmed", matches: ["paid", "pending", "pending_payment"] },
  { key: "credentials", label: "Credentials received", matches: ["configuring", "intake_received", "credentials_complete", "onboarding"] },
  { key: "systems", label: "Systems configuring", matches: ["activation_ready", "installing", "testing", "ready for install"] },
  { key: "website", label: "Website building", matches: ["website spec generated", "website copy generated", "awaiting approval", "website building"] },
  { key: "live", label: "All live", matches: ["live", "went_live", "fully_live"] },
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
  if (normalized.includes("test")) return 2;
  if (normalized.includes("live")) return 4;
  return 0;
}

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getPayload(raw) {
  return raw?.data || raw || {};
}

function statusErrorMessage(error, requestId) {
  const suffix = requestId ? ` Reference: ${requestId}.` : "";
  return `${error || "Unable to verify your setup status."}${suffix}`;
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>{children}</div>
    </div>
  );
}

function SupportLinks({ subject = "Setup status help" }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 18 }}>
      <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`} style={{ borderRadius: 999, background: "linear-gradient(135deg,#0088CC,#003B8F)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "10px 14px", textDecoration: "none" }}>Email support</a>
      <a href={`tel:${SUPPORT_PHONE}`} style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 14px", textDecoration: "none" }}>Call {SUPPORT_PHONE_DISPLAY}</a>
      <Link to="/client-portal/support" style={{ color: "#7DD3FC", fontSize: 12, fontWeight: 700, padding: "10px 14px", textDecoration: "none" }}>Open portal support</Link>
    </div>
  );
}

export default function SetupStatus() {
  const params = useParams();
  const orderId = params.order_id || params.orderId || "";
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);
  const [requestId, setRequestId] = useState("");

  const fetchStatus = async () => {
    if (!orderId) return;
    setError("");
    try {
      const [orderRaw, progressRaw] = await Promise.all([
        base44.functions.invoke("getOrderStatus", { order_id: orderId }),
        base44.functions.invoke("getActivationProgress", { order_id: orderId }),
      ]);
      const orderPayload = getPayload(orderRaw);
      const progressPayload = getPayload(progressRaw);
      const nextOrder = orderPayload.order || null;
      const nextProgress = progressPayload.progress || progressPayload || null;
      setRequestId(orderPayload.request_id || progressPayload.request_id || "");
      if (!nextOrder) {
        setError("Order status was not found for this setup link. Please use the link from your confirmation email or contact support.");
      }
      setOrder(nextOrder);
      setProgress(nextProgress);
      setLastChecked(new Date());
    } catch (err) {
      setError(err?.data?.error || err?.message || "Unable to verify your setup status right now.");
      setRequestId(err?.data?.request_id || err?.request_id || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("This setup status link is missing an order ID.");
      return;
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const stageSource = order?.workflow_stage || order?.pipeline_status || progress?.workflow_stage || progress?.pipeline_status || order?.order_status;
  const currentStageIndex = useMemo(() => findStageIndex(stageSource), [stageSource]);
  const hasActivationError = Boolean(error) || (progress?.errored || 0) > 0 || /error|fail|stalled|issue/i.test(stageSource || "");
  const statusUpdatedAt = formatTimestamp(order?.updated_date || progress?.updated_date || lastChecked);
  const configured = Number(progress?.configured ?? progress?.completed ?? 0);
  const total = Number(progress?.total_services ?? progress?.total ?? 0);
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((configured / total) * 100))) : Number(progress?.percent_complete || 0);

  if (loading) {
    return <Shell><div style={{ color: "#9CA3AF", padding: 60, textAlign: "center" }}>Loading your setup status...</div></Shell>;
  }

  if (!orderId || (error && !order)) {
    return (
      <Shell>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Setup status needs verification</h1>
          <p style={{ color: "rgba(255,255,255,0.66)", fontSize: 14, lineHeight: 1.6 }}>{statusErrorMessage(error, requestId)}</p>
          <p style={{ marginTop: 14, color: "rgba(255,255,255,0.38)", fontSize: 12 }}>Data source: getOrderStatus + getActivationProgress. No setup progress is shown without a verified order record.</p>
          <SupportLinks />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>We&apos;re setting up your system</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>We&apos;ll email you when verified launch status changes.</p>
        {statusUpdatedAt && <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 12, margin: "10px 0 0" }}>Last checked {statusUpdatedAt}</p>}
        {requestId && <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, margin: "6px 0 0" }}>Reference: {requestId}</p>}
      </div>

      <div style={{ marginBottom: 24, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 16, padding: 16 }}>
        <p style={{ color: "#FDE68A", fontSize: 12, fontWeight: 800, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status evidence</p>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, margin: 0 }}>This page uses posted ClientSurge order/progress records. This is setup-record status, not live provider proof. Live status appears only after a verified live/proof event exists in your portal.</p>
      </div>

      {hasActivationError && (
        <div style={{ marginBottom: 24, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 16, padding: 18 }}>
          <p style={{ color: "#FECACA", fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>{error || "We hit a setup issue and our team should take a look."}</p>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, margin: 0 }}>Your order is still safe. Contact support and include the reference above if present.</p>
          <SupportLinks />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STAGES.map((stage, index) => {
          const isDone = currentStageIndex > index;
          const isActive = currentStageIndex === index;
          return (
            <div key={stage.key} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "linear-gradient(135deg,#00D4FF,#00FFB3)" : isActive ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)", border: isActive ? "2px solid #00D4FF" : isDone ? "none" : "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 800, color: isDone ? "#0A0F1E" : isActive ? "#00D4FF" : "rgba(255,255,255,0.3)" }}>{isDone ? "✓" : index + 1}</div>
                {index < STAGES.length - 1 && <div style={{ width: 2, height: 32, background: isDone ? "linear-gradient(#00FFB3,rgba(0,212,255,0.3))" : "rgba(255,255,255,0.08)", margin: "4px 0" }} />}
              </div>
              <div style={{ paddingTop: 6 }}>
                <p style={{ color: isDone ? "#00FFB3" : isActive ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: isActive ? 700 : 500, fontSize: 14, margin: "0 0 4px" }}>
                  {stage.label}{isActive && <span style={{ marginLeft: 8, fontSize: 11, color: "#00D4FF", fontWeight: 600 }}>← In progress</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {progress && total > 0 && (
        <div style={{ marginTop: 32, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Services activated</span>
            <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 700 }}>{configured}/{total}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${percent}%`, background: "linear-gradient(90deg,#00D4FF,#00FFB3)", borderRadius: 999, transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 24 }}>Updates every 30 seconds · Questions? Email {SUPPORT_EMAIL}</p>
    </Shell>
  );
}
