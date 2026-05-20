/**
 * InstallChecklistPanel — #276
 * Shows clients what has been set up for them.
 * Reads from ClientOnboarding record fields.
 */
export default function InstallChecklistPanel({ onboarding }) {
  const checks = [
    { key: "twilio_configured",         label: "Twilio SMS configured",          icon: "📱" },
    { key: "instant_response_built",    label: "Instant lead response live",      icon: "⚡" },
    { key: "missed_call_textback",      label: "Missed call text-back active",    icon: "📞" },
    { key: "followup_sequence_built",   label: "Follow-up sequence built",        icon: "🔁" },
    { key: "lead_sources_connected",    label: "Lead sources connected",          icon: "🔗" },
    { key: "messages_customized",       label: "Messages customized to brand",    icon: "✍️" },
    { key: "end_to_end_tested",         label: "End-to-end test passed",          icon: "✅" },
    { key: "dashboard_delivered",       label: "Dashboard delivered",             icon: "📊" },
    { key: "went_live",                 label: "System went live",                icon: "🚀" },
  ];

  const completed = checks.filter(c => onboarding?.[c.key]).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <div style={{ padding: "24px 0", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Setup Progress</h2>
        <span style={{ color: "#9CA3AF", fontSize: 13 }}>{completed}/{checks.length} complete</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9999, height: 8, marginBottom: 24, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 9999,
          background: pct === 100 ? "linear-gradient(90deg,#00D4FF,#00FFB3)" : "linear-gradient(90deg,#00AEEF,#7C3AED)",
          width: `${pct}%`, transition: "width 0.6s ease"
        }} />
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {checks.map((c) => {
          const done = onboarding?.[c.key];
          return (
            <div key={c.key} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 16px",
              background: done ? "rgba(0,255,179,0.04)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${done ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 18, minWidth: 24 }}>{c.icon}</span>
              <span style={{ color: done ? "#D1FAE5" : "#6B7280", fontSize: 14, fontWeight: done ? 500 : 400, flex: 1 }}>{c.label}</span>
              <span style={{
                fontSize: 18,
                color: done ? "#00FFB3" : "rgba(255,255,255,0.15)"
              }}>{done ? "✓" : "○"}</span>
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <div style={{ marginTop: 20, padding: 16, background: "rgba(0,255,179,0.06)", border: "1px solid rgba(0,255,179,0.2)", borderRadius: 12, textAlign: "center" }}>
          <p style={{ color: "#00FFB3", fontWeight: 700, margin: 0 }}>🎉 All systems are live and running!</p>
        </div>
      )}
    </div>
  );
}
