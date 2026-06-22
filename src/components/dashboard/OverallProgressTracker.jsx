import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const STAGES = [
  { id: "intake_received", label: "Intake Received", icon: "check" },
  { id: "setup_in_progress", label: "Setup In Progress", icon: "clock" },
  { id: "testing", label: "Testing", icon: "clock" },
  { id: "awaiting_client_approval", label: "Awaiting Approval", icon: "clock" },
  { id: "live", label: "Live", icon: "check" },
];

export default function OverallProgressTracker({ onboarding, completionPercentage }) {
  if (!onboarding) return null;

  const currentStageIndex = STAGES.findIndex(s => s.id === onboarding.unified_stage);
  const isBlocked = onboarding.unified_stage === "blocked";

  return (
    <div className="rounded-2xl p-6 mb-6" style={{
      background: "linear-gradient(135deg,rgba(255,255,255,0.95) 0%, rgba(232,246,255,0.7) 100%)",
      border: "1px solid rgba(0,174,239,0.13)",
      boxShadow: "0 4px 24px rgba(0,59,143,0.07)"
    }}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-2">Setup Journey</p>
        <h3 className="text-[20px] font-bold text-foreground mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {isBlocked ? "Setup Blocked" : "Your Setup Progress"}
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {isBlocked 
            ? "There's an issue blocking your setup. Check 'Action Required' below."
            : `${completionPercentage || 0}% complete`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-2 rounded-full" style={{ background: "rgba(0,174,239,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPercentage || 0}%`,
              background: isBlocked 
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : "linear-gradient(90deg, #0088CC, #00AEEF)"
            }}
          />
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div key={stage.id} className="flex items-start gap-3">
              {/* Icon */}
              <div className="pt-1 flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: "#00AEEF" }} />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 animate-spin" style={{ color: "#0088CC" }} />
                ) : isPending && isBlocked ? (
                  <AlertCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: "rgba(0,174,239,0.3)" }} />
                )}
              </div>

              {/* Label & Details */}
              <div className="flex-1">
                <p className={`text-[14px] font-semibold ${isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {stage.label}
                </p>
                {isCurrent && onboarding.stage_progression && (
                  <p className="text-[12px] text-primary mt-0.5">
                    Current stage — {onboarding.completion_metrics?.completion_percentage || 0}% done
                  </p>
                )}
                {isCompleted && onboarding.stage_progression && (
                  <p className="text-[12px] text-muted-foreground/70 mt-0.5">
                    Completed
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blockers Display */}
      {isBlocked && onboarding.blockers && onboarding.blockers.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-[12px] font-semibold text-destructive mb-3">Issues to resolve:</p>
          {onboarding.blockers.map((blocker, idx) => (
            <div key={idx} className="text-[12px] text-muted-foreground mb-1.5 flex items-start gap-2">
              <span className="text-destructive font-bold mt-0.5">•</span>
              <span>{blocker.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Missing Items */}
      {onboarding.missing_setup_items && onboarding.missing_setup_items.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">To continue:</p>
          {onboarding.missing_setup_items.map((item, idx) => (
            <div key={idx} className="text-[12px] text-muted-foreground mb-1 flex items-center gap-2">
              <span style={{ color: "rgba(0,174,239,0.4)" }}>→</span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}