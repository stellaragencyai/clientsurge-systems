/**
 * AutomationPausedBanner — #200
 * Shows in ClientDashboard when cadence_paused = true on the order.
 */
export default function AutomationPausedBanner({ cadence_paused, onResume }) {
  if (!cadence_paused) return null;
  return (
    <div style={{
      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
      borderRadius: 12, padding: "14px 20px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⏸️</span>
        <div>
          <p style={{ color: "#FCD34D", fontWeight: 700, fontSize: 14, margin: 0 }}>Automations Paused</p>
          <p style={{ color: "#9CA3AF", fontSize: 13, margin: "2px 0 0" }}>
            Your follow-up sequences are paused. No automated messages are being sent.
          </p>
        </div>
      </div>
      {onResume && (
        <button onClick={onResume} style={{
          background: "#F59E0B", color: "#0A0F1E", border: "none", borderRadius: 9999,
          padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}>Resume →</button>
      )}
    </div>
  );
}
