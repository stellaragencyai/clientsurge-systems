import { CheckCircle2, Loader2 } from "lucide-react";

// Plain-English stage labels — no technical terms visible to clients
const DEFAULT_STAGES = ["Payment Confirmed", "Queued for Setup", "Being Configured", "Being Tested", "You're Live! ✦"];

const stageConfig = {
  instant_lead_response: ["Payment Confirmed", "Queued for Setup", "Connecting Lead Forms", "Being Tested", "You're Live! ✦"],
  missed_call_text_back: ["Payment Confirmed", "Queued for Setup", "Setting Up Your Number", "Being Tested", "You're Live! ✦"],
  nurture_sequence_14d:  ["Payment Confirmed", "Queued for Setup", "Writing Your Messages", "Being Tested", "You're Live! ✦"],
  ai_booking_agent:      ["Payment Confirmed", "Queued for Setup", "Connecting Your Calendar", "Being Tested", "You're Live! ✦"],
  lead_reactivation:     ["Payment Confirmed", "Queued for Setup", "Importing Your Leads", "Being Tested", "You're Live! ✦"],
  review_request:        ["Payment Confirmed", "Queued for Setup", "Setting Up Review Link", "Being Tested", "You're Live! ✦"],
};

export default function HorizontalStageTracker({ serviceKey, currentStage = 0, productName, installStatus }) {
  // Always fall back to a valid 5-stage track — never renders empty
  const stages = (serviceKey && stageConfig[serviceKey]) ? stageConfig[serviceKey] : DEFAULT_STAGES;
  const safeStage = Math.min(Math.max(currentStage, 0), stages.length - 1);

  return (
    <div style={{
      background: "linear-gradient(135deg, #3d1f0a 0%, #6b3f1f 40%, #4a2510 100%)",
      borderRadius: "18px",
      padding: "clamp(20px,3vw,28px)",
      marginBottom: "28px",
      boxShadow: "0 12px 40px rgba(60,25,5,0.28), 0 2px 8px rgba(0,0,0,0.1)",
      border: "1px solid rgba(245,217,168,0.18)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-60%", right: "-5%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,150,92,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(245,217,168,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 4px" }}>
              Installation Progress
            </p>
            <h3 style={{ fontSize: "clamp(15px,2.5vw,20px)", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              {productName}
            </h3>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: "9999px",
            background: installStatus === "Live" ? "rgba(34,197,94,0.2)" : installStatus === "Error" ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.18)",
            border: `1px solid ${installStatus === "Live" ? "rgba(34,197,94,0.4)" : installStatus === "Error" ? "rgba(239,68,68,0.35)" : "rgba(245,158,11,0.35)"}`,
            fontSize: "12px", fontWeight: "700",
            color: installStatus === "Live" ? "#4ade80" : installStatus === "Error" ? "#f87171" : "#fbbf24",
          }}>
            {installStatus === "Live" ? "✦ Live" : installStatus === "Error" ? "⚠ Needs Attention" : `Step ${Math.min(safeStage + 1, stages.length)} of ${stages.length}`}
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {stages.map((stage, idx) => {
            const isComplete = idx < safeStage;
            const isCurrent = idx === safeStage;
            const isLast = idx === stages.length - 1;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  {/* Circle */}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                    background: isComplete ? "linear-gradient(135deg,#22c55e,#16a34a)" : isCurrent ? "linear-gradient(135deg,#f5d9a8,#c8965c)" : "rgba(255,255,255,0.1)",
                    border: `2px solid ${isComplete ? "rgba(34,197,94,0.5)" : isCurrent ? "rgba(245,217,168,0.7)" : "rgba(255,255,255,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isCurrent ? "0 0 16px rgba(245,217,168,0.5)" : isComplete ? "0 0 10px rgba(34,197,94,0.3)" : "none",
                    transition: "all 0.4s ease",
                  }}>
                    {isComplete ? (
                      <CheckCircle2 style={{ width: "18px", height: "18px", color: "#fff" }} />
                    ) : isCurrent ? (
                      <Loader2 style={{ width: "16px", height: "16px", color: "#7a4825", animation: "spin 1.5s linear infinite" }} />
                    ) : (
                      <span style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.4)" }}>{idx + 1}</span>
                    )}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: "9px", fontWeight: "700", textAlign: "center",
                    color: isComplete ? "#4ade80" : isCurrent ? "#fff" : "rgba(255,255,255,0.4)",
                    lineHeight: 1.3, maxWidth: "64px", display: "block",
                  }}>
                    {stage}
                  </span>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    flex: 1, height: "2px", margin: "0 4px", marginBottom: "24px",
                    background: idx < safeStage
                      ? "linear-gradient(90deg,#22c55e,#16a34a)"
                      : "rgba(255,255,255,0.12)",
                    transition: "background 0.4s ease",
                    borderRadius: "2px",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}