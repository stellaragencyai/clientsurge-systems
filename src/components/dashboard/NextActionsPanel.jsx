import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const actionsByService = {
  instant_lead_response: [
    { action: "Verify SMS number is active", status: "pending", daysLeft: 1 },
    { action: "Test with sample lead", status: "pending", daysLeft: 2 },
    { action: "Review response template", status: "in_progress", daysLeft: 0 },
  ],
  missed_call_text_back: [
    { action: "Connect Twilio account", status: "pending", daysLeft: 1 },
    { action: "Configure missed call webhook", status: "pending", daysLeft: 2 },
    { action: "Send test missed call", status: "pending", daysLeft: 3 },
  ],
  nurture_sequence_14d: [
    { action: "Create email templates", status: "in_progress", daysLeft: 2 },
    { action: "Set follow-up timing", status: "pending", daysLeft: 3 },
    { action: "Test sequence flow", status: "pending", daysLeft: 4 },
  ],
  ai_booking_agent: [
    { action: "Add your booking link", status: "pending", daysLeft: 1 },
    { action: "Configure intake form", status: "pending", daysLeft: 2 },
    { action: "Test booking flow", status: "pending", daysLeft: 3 },
  ],
  lead_reactivation: [
    { action: "Import old lead list", status: "pending", daysLeft: 1 },
    { action: "Define reactivation message", status: "pending", daysLeft: 2 },
    { action: "Schedule first batch", status: "pending", daysLeft: 3 },
  ],
  review_request: [
    { action: "Provide review link", status: "pending", daysLeft: 1 },
    { action: "Choose trigger event", status: "pending", daysLeft: 2 },
    { action: "Test review request", status: "pending", daysLeft: 3 },
  ],
};

function StatusIcon({ status }) {
  if (status === "completed") {
    return <CheckCircle2 style={{ width: "16px", height: "16px", color: "#22c55e" }} />;
  }
  if (status === "in_progress") {
    return <Clock style={{ width: "16px", height: "16px", color: "#f59e0b" }} />;
  }
  return <AlertCircle style={{ width: "16px", height: "16px", color: "#9a5c2e" }} />;
}

export default function NextActionsPanel({ serviceKey }) {
  const actions = actionsByService[serviceKey] || [];

  return (
    <div
      style={{
        borderRadius: "16px",
        background: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(154,92,46,0.12)",
        padding: "16px",
        marginTop: "16px",
      }}
    >
      <p style={{ fontSize: "12px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
        Next Actions
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {actions.map((item, idx) => (
          <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <StatusIcon status={item.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "#1b140d", margin: 0 }}>
                {item.action}
              </p>
              {item.daysLeft > 0 && (
                <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.5)", margin: "2px 0 0" }}>
                  Due in {item.daysLeft} day{item.daysLeft > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}