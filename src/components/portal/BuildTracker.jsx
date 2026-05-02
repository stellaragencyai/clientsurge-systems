import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { key: "step_onboarding", label: "Onboarding Form", desc: "Your intake form has been received and reviewed by our team." },
  { key: "step_payment", label: "Payment Confirmed", desc: "Your payment has been processed and your account is active." },
  { key: "step_system_setup", label: "System Setup", desc: "We're configuring your full automation system." },
  { key: "step_sms", label: "SMS Connected", desc: "Your dedicated SMS line is being activated and tested." },
  { key: "step_email", label: "Email Connected", desc: "Your email automation sequences are being connected." },
  { key: "step_booking", label: "Booking Flow Setup", desc: "Your booking flow is being configured and verified." },
  { key: "step_followup", label: "Follow-Up Setup", desc: "Your follow-up sequences are being loaded and checked." },
  { key: "step_live", label: "System Live", desc: "Your paid setup order has been marked live after verification." },
];

const STATUS_STYLES = {
  Paid: "bg-slate-100 text-slate-700",
  "Ready for Install": "bg-blue-50 text-blue-700",
  Configuring: "bg-amber-50 text-amber-700",
  Testing: "bg-purple-50 text-purple-700",
  Live: "bg-green-50 text-green-700",
  Error: "bg-red-50 text-red-700",
};

const CUSTOMER_PIPELINE_LABELS = {
  Paid: "Paid",
  "Ready for Install": "Ready for setup",
  Configuring: "Setup in progress",
  Testing: "Verification in progress",
  Live: "Live after review",
  Error: "Needs attention",
};

const CUSTOMER_INSTALL_STATUS_LABELS = {
  Paid: "Paid",
  "Ready for Install": "Queued for setup",
  Configuring: "Setup in progress",
  Testing: "Testing in progress",
  Live: "Live after review",
  Error: "Needs operator review",
};

function formatPortalDate(value) {
  if (!value) return null;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCustomerPipelineLabel(value) {
  return CUSTOMER_PIPELINE_LABELS[value] || value;
}

function getCustomerInstallStatusLabel(value) {
  return CUSTOMER_INSTALL_STATUS_LABELS[value] || value;
}

function StepRow({ step, index, isLast, reduceMotion }) {
  const isComplete = step.status === "complete";
  const isInProgress = step.status === "in_progress";
  const isPending = step.status === "pending";

  return (
    <div className="relative flex items-start gap-4">
      {!isLast && (
        <div
          className="absolute left-5 top-10 h-full w-0.5 -mb-2"
          style={{
            background: isComplete
              ? "linear-gradient(to bottom, #c8965c, #9a5c2e)"
              : "rgba(0,0,0,0.08)",
          }}
        />
      )}

      <div
        className="z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-500"
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
        {isComplete && <CheckCircle2 className="h-5 w-5 text-white" />}
        {isInProgress && <Loader2 className={`h-5 w-5 ${reduceMotion ? "" : "animate-spin"}`} style={{ color: "#9a5c2e" }} />}
        {isPending && <Clock className="h-4 w-4 text-muted-foreground/40" />}
      </div>

      <div
        className="flex-1 pb-8 transition-all duration-500"
        style={{ opacity: isPending ? 0.4 : 1 }}
      >
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
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
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: "rgba(154,92,46,0.12)", color: "#7a4825" }}
            >
              Complete
            </span>
          )}
          {isInProgress && (
            <span
              className={`${reduceMotion ? "" : "animate-pulse"} rounded-full px-2 py-0.5 text-xs font-bold`}
              style={{ background: "rgba(154,92,46,0.1)", color: "#9a5c2e" }}
            >
              In Progress
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
      </div>
    </div>
  );
}

function OrderStatusBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[value] || "bg-slate-100 text-slate-700"}`}
    >
      {getCustomerPipelineLabel(value)}
    </span>
  );
}

export default function BuildTracker({ project: initialProject, order, testMode = false }) {
  const [project, setProject] = useState(initialProject);
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (testMode) {
      return undefined;
    }

    const unsubscribe = base44.entities.ClientProject.subscribe((event) => {
      if (event.id === initialProject.id && event.type !== "delete") {
        setProject(event.data);
      }
    });
    return unsubscribe;
  }, [initialProject.id, testMode]);

  const steps = STEPS.map((step) => ({ ...step, status: project[step.key] || "pending" }));
  const completedCount = steps.filter((step) => step.status === "complete").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;
  const currentStep =
    steps.find((step) => step.status === "in_progress") ||
    steps.find((step) => step.status === "pending");

  return (
    <div
      className="rounded-2xl p-8 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(154,92,46,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {order && (
        <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Canonical Setup Status</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Your paid setup order is the live source of truth</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This status comes directly from your paid order and the real remote setup workflow our team is using.
              </p>
            </div>
            <OrderStatusBadge value={order.pipeline_status} />
          </div>

          {order.services?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {order.services.map((service) => (
                <span
                  key={service.service_key}
                  className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
                >
                  {service.display_name}: {getCustomerInstallStatusLabel(service.install_status)}
                </span>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            The build checklist below is still useful for high-level visibility, but the status above is the most accurate view of your remote setup progress.
          </p>
        </div>
      )}

      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Customer Setup Checklist</h2>
        <span className="text-sm font-bold" style={{ color: "#9a5c2e" }}>
          {completedCount}/{steps.length} complete
        </span>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        This checklist mirrors the customer-facing milestones behind your paid setup order. For exact service state, use the canonical setup status above.
      </p>

      {allDone ? (
        <p className="mb-5 text-sm font-semibold" style={{ color: "#7a4825" }}>
          Your paid setup order is marked live.
        </p>
      ) : currentStep ? (
        <p className="mb-5 text-xs text-muted-foreground">
          {currentStep.status === "in_progress" ? "Currently working on: " : "Next up: "}
          <span className="font-semibold text-foreground">{currentStep.label}</span>
        </p>
      ) : null}

      <div className="mb-8 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #7a4825, #c8965c)",
            boxShadow: progressPct > 10 ? "0 0 8px rgba(200,150,92,0.5)" : "none",
          }}
        />
      </div>

      <div>
        {steps.map((step, index) => (
          <StepRow key={step.key} step={step} index={index} isLast={index === steps.length - 1} reduceMotion={reduceMotion} />
        ))}
      </div>

      {project.go_live_date && !allDone && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.15)" }}
        >
          <Zap className="h-4 w-4 flex-shrink-0" style={{ color: "#9a5c2e" }} />
          <span className="text-foreground/70">
            Target live review: <span className="font-semibold" style={{ color: "#7a4825" }}>{formatPortalDate(project.go_live_date)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
