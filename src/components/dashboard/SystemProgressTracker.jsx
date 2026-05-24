const progressStages = {
  instant_lead_response: { label: "Instant Lead Response", stages: ["Setup", "Integration", "Testing", "Live"] },
  missed_call_text_back: { label: "Missed Call Text-Back", stages: ["Setup", "Twilio Config", "Testing", "Live"] },
  nurture_sequence_14d: { label: "14-Day Nurture", stages: ["Setup", "Templates", "Testing", "Live"] },
  ai_booking_agent: { label: "AI Booking Agent", stages: ["Setup", "Calendar Link", "Testing", "Live"] },
  lead_reactivation: { label: "Lead Reactivation", stages: ["Setup", "List Import", "Testing", "Live"] },
  review_request: { label: "Review Requests", stages: ["Setup", "Link Config", "Testing", "Live"] },
};

export default function SystemProgressTracker({ serviceKey, currentStage = 0, installStatus }) {
  const config = progressStages[serviceKey];
  if (!config) return null;

  const progress = (currentStage / (config.stages.length - 1)) * 100;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1b140d", margin: 0 }}>
          {config.label}
        </h4>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(10,22,40,0.6)" }}>
          {config.stages[currentStage] || "Pending"}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: "8px",
          borderRadius: "4px",
          background: "rgba(0,136,204,0.12)",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #0077B6, #00AEEF)",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Stage indicators */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
        {config.stages.map((stage, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              fontSize: "9px",
              fontWeight: "600",
              textAlign: "center",
              color: idx <= currentStage ? "#0077B6" : "rgba(10,22,40,0.35)",
              opacity: idx <= currentStage ? 1 : 0.5,
            }}
          >
            {stage}
          </div>
        ))}
      </div>
    </div>
  );
}