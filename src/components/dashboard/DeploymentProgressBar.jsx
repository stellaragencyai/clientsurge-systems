import { Loader2, CheckCircle2, Zap } from "lucide-react";

export default function DeploymentProgressBar({ pipelineStatus, installStatus }) {
  const stages = [
    { key: "Paid", label: "Payment Confirmed", icon: "✓", status: "Complete" },
    { key: "Configuring", label: "AI Configuring", icon: "⚙", status: "Active" },
    { key: "Testing", label: "Running Tests", icon: "🧪", status: "Active" },
    { key: "Live", label: "System Live", icon: "🚀", status: "Complete" },
  ];

  const currentIndex = stages.findIndex((s) => s.key === installStatus);
  const isComplete = installStatus === "Live";
  const isError = installStatus === "Error";
  const isActive = currentIndex >= 0 && currentIndex < stages.length;

  const getStatusLabel = (idx) => {
    if (idx < currentIndex) return "Completed";
    if (idx === currentIndex) return "In Progress";
    return "Pending";
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(0,174,239,0.04) 0%, rgba(0,59,143,0.03) 100%)",
      border: "1px solid rgba(0,174,239,0.15)",
      borderRadius: "16px",
      padding: "clamp(18px, 3vw, 28px)",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle top glow bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.5), transparent)",
      }} />

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(0, 174, 239, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0); }
        }
        .deploy-stage-active {
          animation: pulse-ring 2.2s infinite;
        }
      `}</style>

      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,174,239,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 4px" }}>
              Deployment Pipeline
            </p>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#0A1628", margin: 0 }}>
              {isComplete
                ? "Your system is fully live and operational"
                : isError
                ? "Setup paused — please check your credentials"
                : "AI is provisioning your system in real-time"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isComplete ? (
              <CheckCircle2 style={{ width: "22px", height: "22px", color: "#22c55e" }} />
            ) : !isError ? (
              <Loader2 style={{ width: "22px", height: "22px", color: "#00AEEF", animation: "spin 1s linear infinite" }} />
            ) : null}
            {isComplete && (
              <Zap style={{ width: "16px", height: "16px", color: "#00AEEF" }} />
            )}
          </div>
        </div>

        {/* Progress Stages */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentIndex;
              const isStageActive = idx === currentIndex;
              const isUpcoming = idx > currentIndex;
              const showConnector = idx < stages.length - 1;

              return (
                <div key={stage.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                  {/* Stage Dot */}
                  <div
                    className={isStageActive ? "deploy-stage-active" : ""}
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "15px", fontWeight: "800",
                      background: isCompleted
                        ? "linear-gradient(135deg, #00AEEF, #0088CC)"
                        : isStageActive
                        ? "linear-gradient(135deg, rgba(0,174,239,0.25), rgba(0,136,204,0.15))"
                        : "rgba(0,174,239,0.06)",
                      border: `2px solid ${
                        isCompleted
                          ? "rgba(0,174,239,0.5)"
                          : isStageActive
                          ? "rgba(0,174,239,0.8)"
                          : "rgba(0,174,239,0.15)"
                      }`,
                      color: isCompleted ? "#fff" : isStageActive ? "#00AEEF" : "rgba(10,22,40,0.3)",
                      boxShadow: isStageActive
                        ? "0 0 20px rgba(0,174,239,0.4)"
                        : isCompleted
                        ? "0 0 10px rgba(0,174,239,0.2)"
                        : "none",
                      transition: "all 0.4s ease",
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? "✓" : stage.icon}
                  </div>

                  {/* Label */}
                  <p style={{
                    fontSize: "11px", fontWeight: "700", marginTop: "10px", textAlign: "center",
                    color: isStageActive || isCompleted ? "#0A1628" : "rgba(10,22,40,0.35)",
                  }}>
                    {stage.label}
                  </p>

                  {/* Status Badge */}
                  <span style={{
                    fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em",
                    marginTop: "4px",
                    color: isCompleted ? "#22c55e" : isStageActive ? "#00AEEF" : "rgba(10,22,40,0.25)",
                  }}>
                    {getStatusLabel(idx)}
                  </span>

                  {/* Connector line */}
                  {showConnector && (
                    <div style={{
                      position: "absolute",
                      top: "22px",
                      left: "calc(50% + 22px)",
                      width: "calc(100% - 44px)",
                      height: "2px",
                      borderRadius: "2px",
                      background: isCompleted
                        ? "linear-gradient(90deg, #00AEEF, rgba(0,174,239,0.4))"
                        : "rgba(0,174,239,0.1)",
                      boxShadow: isCompleted ? "0 0 6px rgba(0,174,239,0.3)" : "none",
                      transition: "all 0.5s ease",
                      zIndex: 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        {isError && (
          <div style={{
            marginTop: "16px", padding: "12px 16px",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#ef4444", margin: 0 }}>
              ⚠ Setup paused due to missing credentials. Add your Twilio and email settings to resume.
            </p>
          </div>
        )}

        {isActive && !isComplete && (
          <div style={{
            marginTop: "16px", padding: "12px 16px",
            background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.18)",
            borderRadius: "10px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#0088CC", margin: 0 }}>
              Your system is being configured. This typically takes 2–5 minutes.
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}