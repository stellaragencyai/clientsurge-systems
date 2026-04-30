import { formatDistanceToNow } from "date-fns";

const STAGE_EVENTS = {
  "Paid": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
  ],
  "Ready for Install": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
    { stage: "Ready for Install", label: "Installer assigned", icon: "👷" },
  ],
  "Configuring": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
    { stage: "Ready for Install", label: "Installer assigned", icon: "👷" },
    { stage: "Configuring", label: "Configuration started", icon: "⚙️" },
  ],
  "Testing": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
    { stage: "Ready for Install", label: "Installer assigned", icon: "👷" },
    { stage: "Configuring", label: "Configuration complete", icon: "⚙️" },
    { stage: "Testing", label: "Testing in progress", icon: "🧪" },
  ],
  "Live": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
    { stage: "Ready for Install", label: "Installer assigned", icon: "👷" },
    { stage: "Configuring", label: "Configuration complete", icon: "⚙️" },
    { stage: "Testing", label: "Testing passed", icon: "🧪" },
    { stage: "Live", label: "System went live", icon: "🚀" },
  ],
  "Error": [
    { stage: "Paid", label: "Payment received", icon: "✓" },
    { stage: "Ready for Install", label: "Installer assigned", icon: "👷" },
    { stage: "Error", label: "Issue detected", icon: "⚠️" },
  ],
};

export default function ActivityFeed({ installStatus, createdDate }) {
  const events = STAGE_EVENTS[installStatus] || STAGE_EVENTS["Paid"];
  const created = createdDate ? new Date(createdDate) : new Date();

  return (
    <div style={{
      borderRadius: "12px",
      background: "rgba(255,255,255,0.6)",
      border: "1px solid rgba(154,92,46,0.08)",
      padding: "14px",
      marginTop: "16px",
    }}>
      <p style={{ fontSize: "10px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
        Activity Timeline
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {events.map((evt, idx) => {
          const isLatest = idx === events.length - 1;
          const daysAgo = Math.max(0, idx); // Simplified: each stage ~1 day apart
          const eventDate = new Date(created.getTime() + daysAgo * 24 * 60 * 60 * 1000);
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                background: isLatest ? "linear-gradient(135deg,#9a5c2e,#c8965c)" : "rgba(34,197,94,0.15)",
                border: isLatest ? "none" : "1px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", color: isLatest ? "white" : "#22c55e",
              }}>
                {evt.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: "600", color: "#1b140d", margin: 0 }}>
                  {evt.label}
                </p>
              </div>
              <span style={{ fontSize: "10px", color: "rgba(27,20,13,0.35)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {formatDistanceToNow(eventDate, { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}