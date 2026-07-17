/**
 * PortalStatusTimeline — premium installation timeline.
 * Derives current stage from real project/order status and never fabricates completion.
 */
import { CreditCard, Wrench, FlaskConical, Rocket, Activity, CheckCircle2 } from "lucide-react";

const STAGES = [
  { key: "payment", label: "Payment", detail: "Confirmed", icon: CreditCard },
  { key: "setup", label: "Setup", detail: "Configured", icon: Wrench },
  { key: "testing", label: "Testing", detail: "Verified", icon: FlaskConical },
  { key: "live", label: "Launch", detail: "Activated", icon: Rocket },
  { key: "monitoring", label: "Monitoring", detail: "Protected", icon: Activity },
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

  const completedSetupSteps = setupSteps.filter((step) => project?.[step.key] === "complete");
  const setupProgressPct = Math.round((completedSetupSteps.length / setupSteps.length) * 100);
  const overallProgress = Math.min(100, Math.max(8, Math.round(((stageIndex + 0.35) / STAGES.length) * 100)));

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#0A4F98]/15 bg-white p-5 shadow-[0_20px_60px_rgba(0,59,143,0.10)] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />

      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0088CC]">Installation journey</p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-gray-950">Launch Timeline</h3>
          <p className="mt-1 text-xs text-gray-500">Every stage is based on verified project status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Overall progress</p>
            <p className="text-xl font-black text-[#003B8F]">{overallProgress}%</p>
          </div>
          {isBlocked && <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Blocked</span>}
          {isPaused && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">Paused</span>}
          {isCanceled && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">Canceled</span>}
        </div>
      </div>

      <div className="relative z-10 mb-6 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#003B8F,#00AEEF)] transition-all duration-700" style={{ width: `${overallProgress}%` }} />
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-5">
        {STAGES.map((stage, index) => {
          const completed = index < stageIndex;
          const current = index === stageIndex && !isCanceled;
          const Icon = stage.icon;
          const accent = completed ? "#10B981" : current ? "#00AEEF" : "#CBD5E1";

          return (
            <div
              key={stage.key}
              className="relative rounded-2xl border p-4 transition-all"
              style={{
                background: completed
                  ? "linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.96))"
                  : current
                    ? "linear-gradient(180deg,rgba(0,174,239,0.10),rgba(255,255,255,0.98))"
                    : "linear-gradient(180deg,#ffffff,#f8fafc)",
                borderColor: completed ? "rgba(16,185,129,0.22)" : current ? "rgba(0,174,239,0.28)" : "rgba(148,163,184,0.18)",
                boxShadow: current ? "0 14px 34px rgba(0,174,239,0.12)" : "0 8px 24px rgba(15,23,42,0.04)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}16`, border: `1px solid ${accent}38` }}>
                  {completed ? <CheckCircle2 className="h-5 w-5" style={{ color: accent }} /> : <Icon className="h-5 w-5" style={{ color: accent }} />}
                </div>
                <span className="text-[10px] font-black" style={{ color: accent }}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <p className="text-sm font-black text-gray-950">{stage.label}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: accent }}>
                {completed ? "Complete" : current ? "In progress" : stage.detail}
              </p>
            </div>
          );
        })}
      </div>

      {stageIndex >= 1 && stageIndex <= 2 && !isCanceled && (
        <div className="relative z-10 mt-5 rounded-2xl border border-sky-100 bg-sky-50/45 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black text-gray-700">Configuration checklist</p>
            <span className="text-xs font-black text-[#006BB0]">{setupProgressPct}% complete</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0088CC,#00AEEF)] transition-all duration-500" style={{ width: `${setupProgressPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {setupSteps.map((step) => {
              const done = project?.[step.key] === "complete";
              const inProgress = project?.[step.key] === "in_progress";
              return (
                <span
                  key={step.key}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    background: done ? "rgba(16,185,129,0.10)" : inProgress ? "rgba(0,174,239,0.10)" : "rgba(255,255,255,0.92)",
                    color: done ? "#059669" : inProgress ? "#0088CC" : "#94A3B8",
                    border: `1px solid ${done ? "rgba(16,185,129,0.18)" : inProgress ? "rgba(0,174,239,0.18)" : "rgba(148,163,184,0.15)"}`,
                  }}
                >
                  {done && <CheckCircle2 className="h-3 w-3" />}
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-5 border-t border-gray-100 pt-4">
        <p className="text-xs leading-5 text-gray-500">
          {isCanceled
            ? "This project has been canceled."
            : isBlocked
              ? "There is an issue blocking progress. Our team is working on it."
              : stageIndex === 0
                ? "Payment received. Your onboarding will begin shortly."
                : stageIndex === 1
                  ? "Your system is being configured. Complete your Quick Start to accelerate setup."
                  : stageIndex === 2
                    ? "Your system is in QA testing. We are verifying every connected workflow."
                    : stageIndex === 3
                      ? "Your system is live and running. Monitoring begins next."
                      : "Your system is live and under active monitoring."}
        </p>
      </div>
    </section>
  );
}
