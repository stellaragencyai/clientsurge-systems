import { CheckCircle2, Loader2, Zap } from "lucide-react";

const DEFAULT_STAGES = ["Payment Confirmed", "Queued for Setup", "Being Configured", "Being Tested", "You're Live! ✦"];

const stageConfig = {
  instant_lead_response: ["Payment Confirmed", "Queued for Setup", "Connecting Lead Forms", "Being Tested", "You're Live! ✦"],
  missed_call_text_back: ["Payment Confirmed", "Queued for Setup", "Setting Up Your Number", "Being Tested", "You're Live! ✦"],
  nurture_sequence_14d:  ["Payment Confirmed", "Queued for Setup", "Writing Your Messages", "Being Tested", "You're Live! ✦"],
  ai_booking_agent:      ["Payment Confirmed", "Queued for Setup", "Connecting Your Calendar", "Being Tested", "You're Live! ✦"],
  lead_reactivation:     ["Payment Confirmed", "Queued for Setup", "Importing Your Leads", "Being Tested", "You're Live! ✦"],
  review_request:        ["Payment Confirmed", "Queued for Setup", "Setting Up Review Link", "Being Tested", "You're Live! ✦"],
};

const LEVEL_LABELS = ["Lv. 1", "Lv. 2", "Lv. 3", "Lv. 4", "MAX"];

export default function HorizontalStageTracker({ serviceKey, currentStage = 0, productName, installStatus }) {
  const stages = (serviceKey && stageConfig[serviceKey]) ? stageConfig[serviceKey] : DEFAULT_STAGES;
  const safeStage = Math.min(Math.max(currentStage, 0), stages.length - 1);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0A1628 0%, #003B8F 100%)",
      borderRadius: "20px",
      padding: "clamp(20px, 3vw, 32px)",
      marginBottom: "28px",
      boxShadow: "0 12px 44px rgba(0,59,143,0.3), 0 0 0 1px rgba(0,174,239,0.15)",
      border: "1px solid rgba(0,174,239,0.22)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient pulse glow */}
      <div style={{
        position: "absolute", top: "-40%", right: "-10%",
        width: "320px", height: "320px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,174,239,0.14) 0%, transparent 70%)",
        pointerEvents: "none",
        animation: "trackerPulse 3s ease-in-out infinite",
      }} />
      {/* Subtle scan line */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(0deg, transparent 49%, rgba(0,174,239,0.03) 50%, transparent 51%)",
        backgroundSize: "100% 4px",
        pointerEvents: "none",
        opacity: 0.4,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,174,239,0.6)", textTransform: "uppercase", letterSpacing: "0.22em", margin: "0 0 5px" }}>
              System Tracker
            </p>
            <h3 style={{ fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              {productName}
            </h3>
          </div>
          <div style={{
            padding: "6px 16px", borderRadius: "9999px",
            background: installStatus === "Live"
              ? "rgba(34,197,94,0.18)"
              : installStatus === "Error"
              ? "rgba(239,68,68,0.16)"
              : "rgba(0,174,239,0.16)",
            border: `1px solid ${
              installStatus === "Live"
                ? "rgba(34,197,94,0.4)"
                : installStatus === "Error"
                ? "rgba(239,68,68,0.35)"
                : "rgba(0,174,239,0.35)"
            }`,
            fontSize: "12px", fontWeight: "700",
            color: installStatus === "Live" ? "#4ade80" : installStatus === "Error" ? "#f87171" : "#00AEEF",
          }}>
            {installStatus === "Live"
              ? "✦ ONLINE"
              : installStatus === "Error"
              ? "⚠ OFFLINE"
              : `Step ${Math.min(safeStage + 1, stages.length)} of ${stages.length}`}
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
                  {/* Circle with level indicator */}
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
                    background: isComplete
                      ? "linear-gradient(135deg, #00AEEF, #0088CC)"
                      : isCurrent
                      ? "linear-gradient(135deg, rgba(0,174,239,0.3), rgba(0,136,204,0.2))"
                      : "rgba(255,255,255,0.06)",
                    border: `2px solid ${
                      isComplete
                        ? "rgba(0,174,239,0.6)"
                        : isCurrent
                        ? "rgba(0,174,239,0.8)"
                        : "rgba(255,255,255,0.12)"
                    }`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isCurrent
                      ? "0 0 24px rgba(0,174,239,0.55), 0 0 48px rgba(0,174,239,0.15)"
                      : isComplete
                      ? "0 0 14px rgba(0,174,239,0.25)"
                      : "none",
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}>
                    {isComplete ? (
                      <CheckCircle2 style={{ width: "19px", height: "19px", color: "#fff" }} />
                    ) : isCurrent ? (
                      <Loader2 style={{ width: "17px", height: "17px", color: "#00AEEF", animation: "spin 1.5s linear infinite" }} />
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
                        {LEVEL_LABELS[idx]}
                      </span>
                    )}
                  </div>
                  {/* Level label */}
                  <span style={{
                    fontSize: "9px", fontWeight: "700", textAlign: "center",
                    color: isComplete ? "#4ade80" : isCurrent ? "#ffffff" : "rgba(255,255,255,0.35)",
                    lineHeight: 1.3, maxWidth: "68px", display: "block",
                  }}>
                    {stage}
                  </span>
                </div>
                {/* Connector line — glows when active */}
                {!isLast && (
                  <div style={{
                    flex: 1, height: "2px", margin: "0 4px", marginBottom: "24px",
                    background: idx < safeStage
                      ? "linear-gradient(90deg, #00AEEF, rgba(0,174,239,0.6))"
                      : "rgba(255,255,255,0.1)",
                    boxShadow: idx < safeStage ? "0 0 8px rgba(0,174,239,0.5)" : "none",
                    transition: "all 0.5s ease",
                    borderRadius: "2px",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes trackerPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}