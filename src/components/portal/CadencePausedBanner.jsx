/**
 * CadencePausedBanner — #535
 * Amber banner shown in ClientDashboard when cadence_paused=true.
 */
export default function CadencePausedBanner({ order }) {
  if (!order?.cadence_paused) return null;
  return (
    <div style={{
      background: "rgba(245,158,11,0.1)",
      border: "1px solid rgba(245,158,11,0.35)",
      borderRadius: 12,
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 18 }}>⏸️</span>
      <div>
        <p style={{ color: "#F59E0B", fontSize: 13, fontWeight: 700, margin: 0 }}>Outreach paused</p>
        <p style={{ color: "rgba(245,158,11,0.7)", fontSize: 12, margin: "3px 0 0" }}>
          Your AI follow-up sequences are currently paused. {order.cadence_pause_reason || "Contact support to resume."}{" "}
          <a href="mailto:nolan@clientsurgesystems.com" style={{ color: "#F59E0B" }}>Reach out to resume →</a>
        </p>
      </div>
    </div>
  );
}
