import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { key: "step_onboarding", label: "Onboarding Form", desc: "Your intake form has been received and reviewed by our team." },
  { key: "step_payment", label: "Payment Confirmed", desc: "Your payment has been processed and your account is active." },
  { key: "step_system_setup", label: "System Setup", desc: "We're configuring your full automation system." },
  { key: "step_sms", label: "SMS Connected", desc: "Your dedicated SMS line is being activated and tested." },
  { key: "step_email", label: "Email Connected", desc: "Your email automation sequences are being connected." },
  { key: "step_booking", label: "Booking Flow Live", desc: "Your booking calendar integration is going live." },
  { key: "step_followup", label: "Follow-Up Sequences Active", desc: "Your follow-up sequences are loaded and running." },
  { key: "step_live", label: "Full System Running", desc: "Everything is live and working for your business. 🎉" },
];

function StepRow({ step, index, isLast }) {
  const isComplete = step.status === "complete";
  const isInProgress = step.status === "in_progress";
  const isPending = step.status === "pending";

  return (
    <div className="flex items-start gap-4 relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-5 top-10 w-0.5 h-full -mb-2"
          style={{
            background: isComplete
              ? "linear-gradient(to bottom, #c8965c, #9a5c2e)"
              : "rgba(0,0,0,0.08)",
          }}
        />
      )}

      {/* Icon circle */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500"
        style={{
          background: isComplete
            ? "linear-gradient(135deg, #9a5c2e, #c8965c)"
            : isInProgress
            ? "rgba(154,92,46,0.12)"
            : "rgba(0,0,0,0.05)",
          border: isComplete
            ? "2px solid #c8965c"
            : isInProgress
            ? "2px solid rgba(154,92,46,0.5)"
            : "2px solid rgba(0,0,0,0.1)",
          boxShadow: isComplete ? "0 0 16px rgba(200,150,92,0.4)" : "none",
        }}
      >
        {isComplete && <CheckCircle2 className="w-5 h-5 text-white" />}
        {isInProgress && <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#9a5c2e" }} />}
        {isPending && <Clock className="w-4 h-4 text-muted-foreground/40" />}
      </div>

      {/* Content */}
      <div
        className="flex-1 pb-8 transition-all duration-500"
        style={{ opacity: isPending ? 0.4 : 1 }}
      >
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className="text-sm font-bold"
            style={{
              color: isComplete ? "#7a4825" : isInProgress ? "#9a5c2e" : "hsl(var(--muted-foreground))",
            }}
          >
            Step {index + 1}: {step.label}
          </span>
          {isComplete && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(154,92,46,0.12)", color: "#7a4825" }}
            >
              ✓ Complete
            </span>
          )}
          {isInProgress && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "rgba(154,92,46,0.1)", color: "#9a5c2e" }}
            >
              In Progress
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

export default function BuildTracker({ project: initialProject }) {
  const [project, setProject] = useState(initialProject);

  // Real-time subscription — updates instantly when admin marks a step complete
  useEffect(() => {
    const unsubscribe = base44.entities.ClientProject.subscribe((event) => {
      if (event.id === initialProject.id && event.type !== "delete") {
        setProject(event.data);
      }
    });
    return unsubscribe;
  }, [initialProject.id]);

  const steps = STEPS.map((s) => ({ ...s, status: project[s.key] || "pending" }));
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;
  const currentStep = steps.find((s) => s.status === "in_progress") || steps.find((s) => s.status === "pending");

  return (
    <div
      className="rounded-2xl p-8 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(154,92,46,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl font-semibold text-foreground">System Build Progress</h2>
        <span className="text-sm font-bold" style={{ color: "#9a5c2e" }}>
          {completedCount}/{steps.length} complete
        </span>
      </div>

      {allDone ? (
        <p className="text-sm font-semibold mb-5" style={{ color: "#7a4825" }}>
          🎉 Your system is fully live and running!
        </p>
      ) : currentStep ? (
        <p className="text-xs text-muted-foreground mb-5">
          {currentStep.status === "in_progress" ? "Currently working on: " : "Next up: "}
          <span className="font-semibold text-foreground">{currentStep.label}</span>
        </p>
      ) : null}

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #7a4825, #c8965c)",
            boxShadow: progressPct > 0 ? "0 0 8px rgba(200,150,92,0.5)" : "none",
          }}
        />
      </div>

      {/* Steps list */}
      <div>
        {steps.map((step, i) => (
          <StepRow key={step.key} step={step} index={i} isLast={i === steps.length - 1} />
        ))}
      </div>

      {/* Go-live target */}
      {project.go_live_date && !allDone && (
        <div
          className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.15)" }}
        >
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#9a5c2e" }} />
          <span className="text-foreground/70">
            Target go-live: <span className="font-semibold" style={{ color: "#7a4825" }}>{project.go_live_date}</span>
          </span>
        </div>
      )}
    </div>
  );
}