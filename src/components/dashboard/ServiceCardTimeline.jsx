import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const stageDetails = {
  instant_lead_response: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "Integration Config", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
  missed_call_text_back: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "Twilio Config", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
  nurture_sequence_14d: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "Email Templates", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
  ai_booking_agent: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "Calendar Link", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
  lead_reactivation: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "List Import", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
  review_request: [
    { label: "Order Confirmed", icon: "check" },
    { label: "System Setup", icon: "circle" },
    { label: "Link Config", icon: "circle" },
    { label: "Testing", icon: "circle" },
    { label: "Live ✦", icon: "circle" },
  ],
};

export default function ServiceCardTimeline({ serviceKey, currentStage }) {
  const stages = stageDetails[serviceKey] || stageDetails.instant_lead_response;
  const colors = ["#9a5c2e", "#3b82f6", "#f59e0b", "#8b5cf6", "#22c55e"];

  return (
    <div style={{
      background: "rgba(255,255,255,0.5)",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px",
      border: "1px solid rgba(154,92,46,0.08)",
    }}>
      <p style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Installation Timeline
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {stages.map((stage, idx) => {
          const isComplete = idx < currentStage;
          const isCurrent = idx === currentStage;
          const color = colors[idx];

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isComplete ? color : isCurrent ? `${color}20` : "rgba(154,92,46,0.08)",
                border: `2px solid ${color}${isComplete ? "99" : isCurrent ? "55" : "22"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {isComplete ? (
                  <CheckCircle2 style={{ width: "14px", height: "14px", color: "#fff" }} />
                ) : isCurrent ? (
                  <Loader2 style={{ width: "12px", height: "12px", color: color, animation: "spin 1.5s linear infinite" }} />
                ) : (
                  <Circle style={{ width: "12px", height: "12px", color, opacity: 0.3 }} />
                )}
              </div>
              <span style={{
                fontSize: "12px",
                fontWeight: isCurrent ? "700" : "500",
                color: isComplete ? color : isCurrent ? color : "rgba(27,20,13,0.5)",
              }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}