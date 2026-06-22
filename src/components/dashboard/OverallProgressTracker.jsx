import { CheckCircle2, Clock, AlertCircle, ArrowRight, Zap } from "lucide-react";

const STAGES = [
  {
    id: "intake_received",
    label: "Intake Received",
    description: "We've received your order and business details. Your project is queued for setup.",
    icon: "check",
    next: "Our team begins configuring your automation system."
  },
  {
    id: "setup_in_progress",
    label: "Setup In Progress",
    description: "We're building your AI agents, connecting your phone number, and configuring automations.",
    icon: "clock",
    next: "Once configured, we'll test everything end-to-end."
  },
  {
    id: "testing",
    label: "Testing & QA",
    description: "Your automation system is live in test mode. We're verifying every workflow before go-live.",
    icon: "clock",
    next: "After tests pass, we'll send it to you for final approval."
  },
  {
    id: "awaiting_client_approval",
    label: "Awaiting Your Approval",
    description: "Your system is ready! Review the setup and approve it for production launch.",
    icon: "clock",
    next: "Once you approve, we flip the switch and your system goes live."
  },
  {
    id: "live",
    label: "Live & Automated",
    description: "Your automation system is live and capturing leads. You're fully operational!",
    icon: "check",
    next: "Monitor performance in your dashboard. We handle ongoing optimization."
  },
];

export default function OverallProgressTracker({ onboarding, completionPercentage }) {
  if (!onboarding) return null;

  const currentStageIndex = STAGES.findIndex(s => s.id === onboarding.unified_stage);
  const isBlocked = onboarding.unified_stage === "blocked";
  const activeIdx = isBlocked ? -1 : (currentStageIndex === -1 ? 0 : currentStageIndex);
  const isLive = onboarding.unified_stage === "live";
  const currentStage = STAGES[activeIdx];
  const missingItems = onboarding.missing_setup_items || [];
  const hasNextAction = !isLive && (missingItems.length > 0 || isBlocked || currentStage?.id === "awaiting_client_approval");

  return (
    <div className="rounded-2xl p-6 md:p-8 mb-6" style={{
      background: "linear-gradient(135deg,rgba(255,255,255,0.95) 0%, rgba(232,246,255,0.7) 100%)",
      border: "1px solid rgba(0,174,239,0.13)",
      boxShadow: "0 4px 24px rgba(0,59,143,0.07)"
    }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Setup Journey</p>
        </div>
        <h3 className="text-[22px] font-bold text-foreground mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {isBlocked ? "Setup Blocked" : isLive ? "You're Live! 🎉" : "Your Setup Progress"}
        </h3>
        <p className="text-[13px] text-muted-foreground">
          {isBlocked
            ? "There's an issue blocking your setup. Check 'Action Required' below."
            : isLive
            ? "Your automation system is fully operational. Monitor your performance below."
            : `${completionPercentage || 0}% complete — ${currentStage?.label || "getting started"}`}
        </p>
      </div>

      {/* ── NEXT ACTION CALLOUT ── */}
      {hasNextAction && (
        <div className="mb-6 p-4 md:p-5 rounded-xl" style={{
          background: isBlocked
            ? "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))"
            : "linear-gradient(135deg, rgba(0,174,239,0.08), rgba(0,174,239,0.02))",
          border: isBlocked
            ? "1.5px solid rgba(239,68,68,0.25)"
            : "1.5px solid rgba(0,174,239,0.25)",
          boxShadow: isBlocked ? "none" : "0 0 16px rgba(0,174,239,0.08)",
        }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
              background: isBlocked ? "rgba(239,68,68,0.12)" : "rgba(0,174,239,0.12)",
            }}>
              {isBlocked ? (
                <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
              ) : (
                <ArrowRight className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] mb-1" style={{
                color: isBlocked ? "#ef4444" : "#00AEEF"
              }}>
                {isBlocked ? "Action Required" : "Next Step for You"}
              </p>
              <p className="text-[14px] font-semibold text-foreground leading-snug mb-2">
                {isBlocked && onboarding.blockers?.length > 0
                  ? onboarding.blockers[0]?.description
                  : currentStage?.id === "awaiting_client_approval"
                  ? "Review and approve your system for production launch"
                  : missingItems.length > 0
                  ? missingItems[0]
                  : "We're working on your setup — nothing needed from you yet"}
              </p>
              {missingItems.length > 1 && (
                <p className="text-[12px] text-muted-foreground">
                  +{missingItems.length - 1} more item{missingItems.length > 2 ? "s" : ""} to complete below
                </p>
              )}
              {currentStage?.id === "awaiting_client_approval" && (
                <a href="/client-portal"
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full text-white text-[12px] font-bold no-underline transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)", boxShadow: "0 4px 14px rgba(0,174,239,0.3)" }}>
                  Review & Approve →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,174,239,0.12)" }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${completionPercentage || 0}%`,
              background: isBlocked
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : "linear-gradient(90deg, #0088CC, #00AEEF)",
              boxShadow: isBlocked ? "none" : "0 0 12px rgba(0,174,239,0.4)",
            }}
          />
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="space-y-1">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isPending = idx > activeIdx;
          const isLast = idx === STAGES.length - 1;

          return (
            <div key={stage.id}>
              <div className="flex items-start gap-4">
                {/* Connector + Icon */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300" style={{
                    background: isCompleted
                      ? "rgba(0,174,239,0.12)"
                      : isCurrent
                      ? "linear-gradient(135deg, #0088CC, #00AEEF)"
                      : isPending && isBlocked
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(0,0,0,0.04)",
                    border: isCurrent
                      ? "2px solid #00AEEF"
                      : isCompleted
                      ? "2px solid rgba(0,174,239,0.3)"
                      : "2px solid rgba(0,0,0,0.08)",
                    boxShadow: isCurrent ? "0 0 0 4px rgba(0,174,239,0.12)" : "none",
                  }}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#00AEEF" }} />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-white animate-pulse" />
                    ) : isPending && isBlocked ? (
                      <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} />
                    )}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 mt-1 mb-1 rounded-full" style={{
                      background: isCompleted
                        ? "linear-gradient(to bottom, rgba(0,174,239,0.4), rgba(0,174,239,0.1))"
                        : "rgba(0,0,0,0.06)",
                      minHeight: "28px",
                    }} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-[15px] font-bold transition-colors ${
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`} style={isCurrent ? { fontFamily: "Montserrat, sans-serif" } : {}}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{
                        background: "linear-gradient(135deg, #0088CC, #00AEEF)"
                      }}>
                        CURRENT
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-primary">✓ Done</span>
                    )}
                  </div>

                  <p className={`text-[13px] leading-relaxed mb-1.5 ${
                    isCurrent || isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                  }`}>
                    {stage.description}
                  </p>

                  {/* "What comes next" — only show for current stage */}
                  {isCurrent && !isLast && (
                    <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg" style={{
                      background: "rgba(0,174,239,0.06)",
                      border: "1px solid rgba(0,174,239,0.12)",
                    }}>
                      <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">What happens next</p>
                        <p className="text-[12px] text-foreground leading-relaxed">{stage.next}</p>
                      </div>
                    </div>
                  )}

                  {/* Current stage sub-progress */}
                  {isCurrent && onboarding.stage_progression && (
                    <p className="text-[11px] text-primary mt-1.5 font-medium">
                      Stage progress: {onboarding.completion_metrics?.completion_percentage || 0}%
                      {onboarding.completion_metrics?.completed_steps != null && onboarding.completion_metrics?.total_checklist_steps != null && (
                        <span className="text-muted-foreground ml-1">
                          ({onboarding.completion_metrics.completed_steps}/{onboarding.completion_metrics.total_checklist_steps} steps)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blockers */}
      {isBlocked && onboarding.blockers && onboarding.blockers.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border rounded-lg p-4" style={{ background: "rgba(239,68,68,0.04)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-[13px] font-bold text-destructive">Action Required</p>
          </div>
          {onboarding.blockers.map((blocker, idx) => (
            <div key={idx} className="text-[13px] text-foreground mb-2 flex items-start gap-2">
              <span className="text-destructive font-bold mt-0.5">•</span>
              <span>{blocker.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIONABLE CHECKLIST ── */}
      {missingItems.length > 0 && (
        <div className="mt-4 p-4 md:p-5 rounded-xl" style={{ background: "rgba(0,174,239,0.04)", border: "1px solid rgba(0,174,239,0.1)" }}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <p className="text-[12px] font-bold text-primary uppercase tracking-wider">Steps You Need to Complete</p>
          </div>
          <div className="space-y-2">
            {missingItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.6)" }}>
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{
                  borderColor: "rgba(0,174,239,0.3)",
                  background: "rgba(255,255,255,0.9)",
                }}>
                  <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                </div>
                <span className="text-[13px] text-foreground leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}