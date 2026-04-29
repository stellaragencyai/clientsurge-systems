const stageConfig = {
  instant_lead_response: ["Order Confirmed", "Setup", "Integration", "Testing", "Live"],
  missed_call_text_back: ["Order Confirmed", "Setup", "Twilio Config", "Testing", "Live"],
  nurture_sequence_14d: ["Order Confirmed", "Setup", "Templates", "Testing", "Live"],
  ai_booking_agent: ["Order Confirmed", "Setup", "Calendar Link", "Testing", "Live"],
  lead_reactivation: ["Order Confirmed", "Setup", "List Import", "Testing", "Live"],
  review_request: ["Order Confirmed", "Setup", "Link Config", "Testing", "Live"],
};

export default function HorizontalStageTracker({ serviceKey, currentStage = 0, productName }) {
  const stages = stageConfig[serviceKey] || ["Order Confirmed", "Setup", "Testing", "Live"];
  const totalStages = stages.length;
  const progressPercent = (currentStage / (totalStages - 1)) * 100;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 8px 24px rgba(154,92,46,0.25)",
        border: "1px solid rgba(245,217,168,0.2)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {productName}
        </h3>
        <p style={{ fontSize: "12px", color: "rgba(245,217,168,0.7)", margin: 0 }}>
          Click here to track the progress of your order in real time →
        </p>
      </div>

      {/* Main tracker bar */}
      <div
        style={{
          position: "relative",
          height: "80px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(245,217,168,0.15)",
        }}
      >
        {/* Filled progress section */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${progressPercent}%`,
            background: "linear-gradient(90deg, rgba(255,107,53,0.8) 0%, rgba(255,160,80,0.8) 50%, rgba(255,185,110,0.8) 100%)",
            transition: "width 0.8s ease",
            zIndex: 1,
          }}
        />

        {/* Stage markers */}
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "stretch",
            zIndex: 2,
          }}
        >
          {stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRight: idx < stages.length - 1 ? "2px solid rgba(245,217,168,0.2)" : "none",
                position: "relative",
              }}
            >
              {/* Stage number circle */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: idx <= currentStage ? "linear-gradient(135deg, #ffd49a, #f5c66a)" : "rgba(255,255,255,0.15)",
                  border: "2px solid " + (idx <= currentStage ? "#fff9e6" : "rgba(255,255,255,0.3)"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "800",
                  color: idx <= currentStage ? "#7a4825" : "rgba(255,255,255,0.5)",
                  marginBottom: "6px",
                  boxShadow: idx <= currentStage ? "0 4px 12px rgba(255,212,154,0.4)" : "none",
                }}
              >
                {idx + 1}
              </div>

              {/* Stage label */}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: idx <= currentStage ? "#ffffff" : "rgba(255,255,255,0.6)",
                  textAlign: "center",
                  maxWidth: "100%",
                  paddingX: "4px",
                  lineHeight: "1.2",
                }}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current step indicator */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", fontWeight: "600", color: "rgba(245,217,168,0.9)", margin: 0 }}>
          Currently at: <span style={{ color: "#ffd49a", fontWeight: "800" }}>{stages[currentStage]}</span>
        </p>
      </div>
    </div>
  );
}