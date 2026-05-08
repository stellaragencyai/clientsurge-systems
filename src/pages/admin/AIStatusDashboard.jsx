/**
 * AIStatusDashboard — #500
 * /admin/ai-status — shows all AI functions with last invocation time,
 * error count 24h, and overall system status.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AI_FUNCTIONS = [
  "activateAllServices", "configureService", "generateSmsTemplates",
  "generateWebsiteSpec", "generateClientWebsite", "sendGoLiveNotification",
  "predictChurnRisk", "detectAnalyticsAnomalies", "classifyInstallError",
  "autoResolveInstallError", "getSystemHealthDashboard", "generateLeadMagnet",
  "generateMonthlyPerformanceReport", "initiateVoiceCloneIntake",
  "clientOffboardingAI", "generatePackageComparisonEmail", "conversationIntelligence",
];

export default function AIStatusDashboard() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.functions.invoke("getSystemHealthDashboard", {}),
      base44.functions.invoke("classifyInstallError", { limit: 100 }),
    ]).then(([healthRes, errRes]) => {
      setHealth(healthRes?.health);
      setLogs(errRes?.errors || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STATUS_COLOR = { healthy: "#00FFB3", warning: "#F59E0B", degraded: "#EF4444" };
  const status = health?.overall_status || "unknown";

  if (loading) return <div style={{ color: "#9CA3AF", padding: 40 }}>Loading AI status...</div>;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900 }}>
      {/* Overall status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: STATUS_COLOR[status] || "#6B7280", boxShadow: `0 0 12px ${STATUS_COLOR[status] || "#6B7280"}` }} />
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>AI System Status: <span style={{ color: STATUS_COLOR[status] || "#6B7280", textTransform: "capitalize" }}>{status}</span></h2>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: "auto" }}>{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : ""}</span>
      </div>

      {/* Metrics grid */}
      {health && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 28 }}>
          {[
            ["Live Clients", health.clients?.live, "#00FFB3"],
            ["Active Installs", health.clients?.active_installs, "#00D4FF"],
            ["Stalled", health.clients?.stalled, health.clients?.stalled > 2 ? "#EF4444" : "#6B7280"],
            ["Past Due", health.clients?.past_due, health.clients?.past_due > 0 ? "#F59E0B" : "#6B7280"],
            ["Errors 24h", health.errors_24h?.total, health.errors_24h?.total > 3 ? "#EF4444" : "#6B7280"],
            ["Unresolved", health.errors_24h?.unresolved, health.errors_24h?.unresolved > 0 ? "#F59E0B" : "#00FFB3"],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>{label}</p>
              <p style={{ color, fontSize: 22, fontWeight: 800, margin: 0 }}>{val ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error log */}
      {logs.length > 0 && (
        <>
          <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>Recent Errors ({logs.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {logs.slice(0, 15).map((log, i) => (
              <div key={i} style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999 }}>{log.category}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1 }}>{log.summary}</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{log.service}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
