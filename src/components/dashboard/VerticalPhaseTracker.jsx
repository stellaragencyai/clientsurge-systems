import { CheckCircle2, Circle, Loader2, Clock } from "lucide-react";

const PHASES = [
  { phase: "Setup", duration: "1–2 days", icon: "📋", color: "#9a5c2e" },
  { phase: "Integration", duration: "1 day", icon: "🔗", color: "#3b82f6" },
  { phase: "Configuration", duration: "2–3 days", icon: "⚙️", color: "#f59e0b" },
  { phase: "Testing", duration: "1–2 days", icon: "🧪", color: "#8b5cf6" },
  { phase: "Live", duration: "Instant", icon: "🚀", color: "#22c55e" },
];

const PHASE_DESCRIPTIONS = {
  "Setup": "Payment confirmed. Your installer is being assigned.",
  "Integration": "Your integrations are being configured.",
  "Configuration": "We're building your automation flows.",
  "Testing": "Final validation before going live.",
  "Live": "Your system is capturing and responding to leads 24/7.",
};

export default function VerticalPhaseTracker({ currentPhaseIndex = 0 }) {
  return (
    <div style={{
      borderRadius: "18px",
      background: "linear-gradient(135deg, #fdfbf8 0%, #fcfaf6 100%)",
      border: "1px solid rgba(154,92,46,0.12)",
      padding: "28px 24px",
      marginBottom: "32px",
      boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
          Your Installation Journey
        </p>
        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1b140d", margin: 0, lineHeight: 1.2 }}>
          Phase {currentPhaseIndex + 1} of {PHASES.length}: {PHASES[currentPhaseIndex].phase}
        </h3>
      </div>

      {/* Vertical timeline */}
      <div style={{ position: "relative" }}>
        {/* Vertical line connector */}
        <div style={{
          position: "absolute",
          left: "27px",
          top: "52px",
          bottom: 0,
          width: "2px",
          background: "linear-gradient(180deg, rgba(154,92,46,0.3) 0%, rgba(154,92,46,0.05) 100%)",
        }} />

        {/* Phases */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {PHASES.map((phaseItem, idx) => {
            const isComplete = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;
            const isPending = idx > currentPhaseIndex;

            return (
              <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                {/* Circle indicator */}
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isComplete
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : isCurrent
                    ? "linear-gradient(135deg, #9a5c2e, #c8965c)"
                    : "rgba(255,255,255,0.8)",
                  border: isCurrent ? "2px solid #9a5c2e" : isComplete ? "none" : "2px solid rgba(154,92,46,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isCurrent ? "0 0 20px rgba(154,92,46,0.3)" : isComplete ? "0 4px 12px rgba(34,197,94,0.25)" : "none",
                  animation: isCurrent ? "pulse 2s ease-in-out infinite" : "none",
                }}>
                  {isComplete ? (
                    <CheckCircle2 style={{ width: "26px", height: "26px", color: "white" }} />
                  ) : isCurrent ? (
                    <Loader2 style={{ width: "24px", height: "24px", color: "white", animation: "spin 2s linear infinite" }} />
                  ) : (
                    <span style={{ fontSize: "20px" }}>{phaseItem.icon}</span>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: "4px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h4 style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: isComplete ? "rgba(27,20,13,0.45)" : isCurrent ? "#1b140d" : "rgba(27,20,13,0.6)",
                      margin: 0,
                      textDecoration: isComplete ? "line-through" : "none",
                    }}>
                      {phaseItem.phase}
                    </h4>
                    {isCurrent && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "rgba(154,92,46,0.15)",
                        color: "#9a5c2e",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        In Progress
                      </span>
                    )}
                    {isComplete && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "rgba(34,197,94,0.15)",
                        color: "#22c55e",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        Complete
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: "12px",
                    color: "rgba(27,20,13,0.6)",
                    margin: "0 0 6px",
                    lineHeight: 1.5,
                  }}>
                    {PHASE_DESCRIPTIONS[phaseItem.phase]}
                  </p>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "rgba(27,20,13,0.4)",
                  }}>
                    <Clock style={{ width: "12px", height: "12px" }} />
                    {phaseItem.duration}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress percentage at bottom */}
      <div style={{
        marginTop: "28px",
        paddingTop: "20px",
        borderTop: "1px solid rgba(154,92,46,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "12px", color: "rgba(27,20,13,0.55)", fontWeight: "600" }}>
          Overall Progress
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "120px",
            height: "6px",
            borderRadius: "3px",
            background: "rgba(154,92,46,0.1)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${((currentPhaseIndex + 1) / PHASES.length) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #9a5c2e, #c8965c)",
              borderRadius: "3px",
              transition: "width 0.6s ease",
            }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: "800", color: "#9a5c2e" }}>
            {Math.round(((currentPhaseIndex + 1) / PHASES.length) * 100)}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}