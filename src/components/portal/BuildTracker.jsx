import { CheckCircle2, Clock, Loader2 } from "lucide-react";

const STEPS = [
  { key: "step_onboarding", label: "Onboarding Form", desc: "Your intake form has been received." },
  { key: "step_payment", label: "Payment Confirmed", desc: "Your payment has been processed." },
  { key: "step_system_setup", label: "System Setup", desc: "We're configuring your automation system." },
  { key: "step_sms", label: "SMS Connected", desc: "Your SMS line is being activated and tested." },
  { key: "step_email", label: "Email Connected", desc: "Your email automation is being connected." },
  { key: "step_booking", label: "Booking Flow Live", desc: "Your booking calendar integration is going live." },
  { key: "step_followup", label: "Follow-Up Sequences Active", desc: "Your follow-up sequences are being loaded and tested." },
  { key: "step_live", label: "Full System Running", desc: "Everything is live and working for your business." },
];

function StepIcon({ status }) {
  if (status === "complete") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
  if (status === "in_progress") return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
  return <Clock className="w-6 h-6 text-muted-foreground/40" />;
}

export default function BuildTracker({ project }) {
  const steps = STEPS.map(s => ({ ...s, status: project[s.key] || "pending" }));
  const completedCount = steps.filter(s => s.status === "complete").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const currentStep = steps.find(s => s.status === "in_progress") || steps.find(s => s.status === "pending");

  return (
    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl font-semibold text-foreground">System Build Progress</h2>
        <span className="text-sm font-bold text-primary">{completedCount}/{steps.length} complete</span>
      </div>
      {currentStep && currentStep.status === "in_progress" && (
        <p className="text-xs text-muted-foreground mb-4">
          Currently working on: <span className="font-semibold text-foreground">{currentStep.label}</span>
        </p>
      )}
      {completedCount === steps.length && (
        <p className="text-xs font-semibold text-green-600 mb-4">🎉 Your system is fully live!</p>
      )}

      {/* Progress bar */}
      <div className="h-2.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #9a5c2e, #c8965c)" }}
        />
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
        <div className="space-y-5">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-start gap-4 relative">
              <div className="flex-shrink-0 z-10 bg-white">
                <StepIcon status={step.status} />
              </div>
              <div className={`flex-1 pb-1 ${step.status === "pending" ? "opacity-45" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${step.status === "complete" ? "text-foreground" : step.status === "in_progress" ? "text-primary" : "text-muted-foreground"}`}>
                    Step {i + 1}: {step.label}
                  </p>
                  {step.status === "in_progress" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">In Progress</span>
                  )}
                  {step.status === "complete" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Done</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}