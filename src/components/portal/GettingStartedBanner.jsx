import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react";
import { useState } from "react";

const STEPS = [
  { id: "order", label: "Order placed", detail: "Your package is confirmed" },
  { id: "intake", label: "Complete intake form", detail: "Tell us about your business" },
  { id: "setup", label: "Remote setup in progress", detail: "We configure your automations" },
  { id: "testing", label: "Testing & launch", detail: "We verify everything works" },
  { id: "live", label: "System goes live", detail: "Leads start flowing automatically" },
];

function resolveStep(project, order) {
  const status = order?.pipeline_status || project?.pipeline_status || "";
  const installStatus = order?.services?.[0]?.install_status || "";

  if (["Live"].includes(installStatus) || status === "fully_live") return 5;
  if (["Testing"].includes(installStatus)) return 3;
  if (["Configuring", "Ready for Install"].includes(installStatus)) return 2;
  if (order?.id) return 1;
  return 0;
}

export default function GettingStartedBanner({ project, order, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const currentStep = resolveStep(project, order);

  // Don't show if live or dismissed
  if (dismissed || currentStep >= 5) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className="rounded-xl border mb-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(0,136,204,0.06) 0%, rgba(0,59,143,0.03) 100%)",
        borderColor: "rgba(0,174,239,0.2)",
      }}
    >
      {/* Top accent bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, #003B8F, #00AEEF, #66D9FF)" }} />

      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Getting Started</p>
            <p className="text-base font-semibold text-foreground">
              Your system is on step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentStep < STEPS.length ? STEPS[Math.min(currentStep, STEPS.length - 1)]?.detail : "Almost there!"}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            style={{ minHeight: "unset", minWidth: "unset" }}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step track */}
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 px-2 min-w-[72px]">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: done
                        ? "#00AEEF"
                        : active
                        ? "linear-gradient(135deg,#0088CC,#003B8F)"
                        : "transparent",
                      border: done || active ? "none" : "2px solid rgba(0,174,239,0.25)",
                    }}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : active ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: done || active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", opacity: done || active ? 1 : 0.5 }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-0.5 w-4 flex-shrink-0 mb-4 rounded"
                    style={{ background: i < currentStep ? "#00AEEF" : "rgba(0,174,239,0.15)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Next action */}
        {currentStep === 1 && (
          <a
            href="mailto:support@clientsurgesystems.com?subject=Onboarding%20Intake"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Complete your intake form <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}