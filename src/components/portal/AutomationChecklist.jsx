/**
 * AutomationChecklist + SetupProgressBar — #265 #266
 * Reads live data from ClientInstallationOS entity.
 */
import { useState, useEffect } from "react";

const CHECKLIST_FIELDS = [
  { key: "twilio_configured",       label: "Twilio SMS configured",        icon: "📱" },
  { key: "instant_response_built",  label: "Instant lead response live",   icon: "⚡" },
  { key: "missed_call_textback",    label: "Missed call text-back",        icon: "📞" },
  { key: "followup_sequence_built", label: "Follow-up sequences built",    icon: "🔁" },
  { key: "lead_sources_connected",  label: "Lead sources connected",       icon: "🔗" },
  { key: "messages_customized",     label: "Messages customized",          icon: "✍️" },
  { key: "end_to_end_tested",       label: "End-to-end tested",           icon: "✅" },
  { key: "dashboard_delivered",     label: "Dashboard delivered",          icon: "📊" },
  { key: "went_live",               label: "System is LIVE",               icon: "🚀" },
];

export default function AutomationChecklist({ order_id }) {
  const [install, setInstall] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) return;
    (async () => {
      try {
        const { ClientOnboarding } = await import("@/api/entities");
        const records = await ClientOnboarding.filter({ order_id });
        setInstall(records?.[0] || null);
      } catch { setInstall(null); }
      finally { setLoading(false); }
    })();
  }, [order_id]);

  const completed = CHECKLIST_FIELDS.filter(f => install?.[f.key]).length;
  const pct = CHECKLIST_FIELDS.length > 0 ? Math.round((completed / CHECKLIST_FIELDS.length) * 100) : 0;

  if (loading) return <div style={{ color: "#6B7280", fontSize: 13, padding: 20 }}>Loading setup status...</div>;

  return (
    <div>
      {/* #266: Setup progress bar driven by real fields */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#9CA3AF", fontSize: 13 }}>Setup Progress</span>
          <span style={{ color: pct === 100 ? "#00FFB3" : "#00AEEF", fontWeight: 700, fontSize: 13 }}>{pct}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9999, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 9999, width: `${pct}%`, transition: "width 0.6s ease",
            background: pct === 100 ? "linear-gradient(90deg,#00D4FF,#00FFB3)" : "linear-gradient(90deg,#00AEEF,#7C3AED)",
          }} />
        </div>
      </div>

      {/* #265: Live checklist from AutomationJob / ClientInstallationOS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CHECKLIST_FIELDS.map(f => {
          const done = install?.[f.key];
          return (
            <div key={f.key} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: done ? "rgba(0,255,179,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${done ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 16, minWidth: 20 }}>{f.icon}</span>
              <span style={{ color: done ? "#D1FAE5" : "#6B7280", fontSize: 13, flex: 1 }}>{f.label}</span>
              <span style={{ color: done ? "#00FFB3" : "rgba(255,255,255,0.15)", fontSize: 16 }}>{done ? "✓" : "○"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
