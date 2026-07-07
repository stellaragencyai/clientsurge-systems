/**
 * PortalStatusTimeline — Enhancement #13
 * Visual status timeline: Payment → Setup → Testing → Live → Monitoring
 * Derives current stage from real project/order status. Never fakes completion.
 */
import { CreditCard, Wrench, FlaskConical, Rocket, Activity, CheckCircle2 } from "lucide-react";

const STAGES = [
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "setup", label: "Setup", icon: Wrench },
  { key: "testing", label: "Testing", icon: FlaskConical },
  { key: "live", label: "Live", icon: Rocket },
  { key: "monitoring", label: "Monitoring", icon: Activity },
];

const STATUS_TO_STAGE_INDEX = {
  "Payment Received": 0,
  "Onboarding Pending": 1,
  "Access Requested": 1,
  "Access Verified": 1,
  "Setup In Progress": 1,
  "QA In Progress": 2,
  "Awaiting Client Approval": 2,
  "Go-Live Scheduled": 2,
  "Live": 3,
  "Monitoring": 4,
  "Monthly Support": 4,
};

export default function PortalStatusTimeline({ project, portalOrder }) {
  const projectStatus = project?.client_project_status || "Payment Received";
  const stageIndex = STATUS_TO_STAGE_INDEX[projectStatus] ?? 0;
  const isBlocked = projectStatus === "Blocked";
  const isPaused = projectStatus === "Paused";
  const isCanceled = projectStatus === "Canceled";

  // Setup sub-step completion for granular progress
  const setupSteps = [
    { key: "step_onboarding", label: "Onboarding" },
    { key: "step_payment", label: "Payment" },
    { key: "step_system_setup", label: "System" },
    { key: "step_sms", label: "SMS" },
    { key: "step_email", label: "Email" },
    { key: "step_booking", label: "Booking" },
    { key: "step_followup", label: "Follow-Up" },
    { key: "step_live", label: "Live" },
  ];
  const completedSetupSteps = setupSteps.filter((s) => project?.[s.key] === "complete");
  const setupProgressPct = Math.round((completedSetupSteps.length / setupSteps.length) * 100);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF] mb-0.5">System Status</p>
          <h3 className="text-base font-bold text-gray-900 font-display">Launch Timeline</h3>
        </div>
        {isBlocked && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-red-600 bg-red-50 border border-red-200">Blocked</span>
        )}
        {isPaused && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">Paused</span>
        )}
        {isCanceled && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200">Canceled</span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between mb-5">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < stageIndex;
          const isCurrent = idx === stageIndex && !isCanceled;
          const Icon = stage.icon;
          const stageColor = isCompleted ? "#10B981" : isCurrent ? "#00AEEF" : "#D1D5DB";
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: isCompleted ? "#10B98115" : isCurrent ? "#00AEEF15" : "#F3F4F6",
                    border: `2px solid ${stageColor}`,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: stageColor }} />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: stageColor }} />
                  )}
                </div>
                <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: stageColor }}>
                  {stage.label}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 rounded-full transition-colors"
                  style={{
                    background: idx < stageIndex ? "#10B981" : "#E5E7EB",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Setup sub-steps (only show if in Setup or beyond) */}
      {stageIndex >= 1 && stageIndex <= 2 && !isCanceled && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">Setup Progress</p>
            <span className="text-xs font-bold text-gray-700">{setupProgressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${setupProgressPct}%`, background: "linear-gradient(90deg,#0088CC,#00AEEF)" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {setupSteps.map((step) => {
              const done = project?.[step.key] === "complete";
              const inProgress = project?.[step.key] === "in_progress";
              return (
                <span
                  key={step.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: done ? "#10B98110" : inProgress ? "#00AEEF10" : "#F3F4F6",
                    color: done ? "#059669" : inProgress ? "#0088CC" : "#9CA3AF",
                  }}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Current stage description */}
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-gray-500">
          {isCanceled ? (
            "This project has been canceled."
          ) : isBlocked ? (
            "There's an issue blocking progress. Our team is working on it."
          ) : stageIndex === 0 ? (
            "Payment received. Your onboarding will begin shortly."
          ) : stageIndex === 1 ? (
            "Your system is being configured. Complete your Quick Start to accelerate setup."
          ) : stageIndex === 2 ? (
            "Your system is in QA testing. We're verifying everything works correctly."
          ) : stageIndex === 3 ? (
            "Your system is live and running. Welcome to ClientSurge!"
          ) : (
            "Your system is live and under active monitoring."
          )}
        </p>
      </div>
    </div>
  );
}