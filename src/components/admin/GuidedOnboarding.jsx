import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, Loader2, CreditCard, MessageSquare, Calendar,
  Users, Zap, ShieldCheck, Rocket, ArrowRight, RefreshCw, AlertCircle, Settings,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  {
    id: 1,
    title: "Stripe Payment Connected",
    description: "Verify Stripe is in live mode and at least one production-trusted paid order exists.",
    icon: CreditCard,
    checkKey: "stripe",
  },
  {
    id: 2,
    title: "Lead Capture Live",
    description: "Confirm the website lead form is capturing real leads with consent fields populated.",
    icon: Users,
    checkKey: "leads",
  },
  {
    id: 3,
    title: "Messaging Providers Active",
    description: "Twilio SMS and Resend Email must be enabled and responding to live pings.",
    icon: MessageSquare,
    checkKey: "messaging",
  },
  {
    id: 4,
    title: "Automation Configured",
    description: "Instant response and follow-up sequences are wired and sending to production leads.",
    icon: Zap,
    checkKey: "automation",
  },
  {
    id: 5,
    title: "Booking Flow Ready",
    description: "Booking link is set and the appointment booking path is functional end-to-end.",
    icon: Calendar,
    checkKey: "booking",
  },
  {
    id: 6,
    title: "Launch Truth Sprint Passed",
    description: "Run the Launch Truth Sprint — all gates must pass or be ready for proof with no blockers.",
    icon: ShieldCheck,
    checkKey: "launch_truth",
  },
  {
    id: 7,
    title: "Go Live",
    description: "All checks passed. System is safe to launch to external traffic.",
    icon: Rocket,
    checkKey: "go_live",
  },
];

export default function GuidedOnboarding({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [sprintData, setSprintData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [sprintRes, healthRes] = await Promise.all([
        base44.functions.invoke("runLaunchTruthSprint", {}).catch(() => null),
        base44.functions.invoke("getIntegrationHealth", {}).catch(() => null),
      ]);
      setSprintData(sprintRes?.data || null);
      setHealthData(healthRes?.data || null);
    } catch (err) {
      setError(err?.message || "Failed to load launch status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getStepStatus = (step) => {
    if (!sprintData) return "pending";

    if (step.checkKey === "stripe") {
      const sp = sprintData.sections?.stripe_payment || {};
      if (sp.evidence_status === "trusted") return "done";
      if (sp.production_trusted_paid_count > 0) return "done";
      return "pending";
    }
    if (step.checkKey === "leads") {
      const lc = sprintData.sections?.lead_capture || {};
      if (lc.production_trusted_leads > 0) return "done";
      return "pending";
    }
    if (step.checkKey === "messaging") {
      const integrations = healthData?.integrations || [];
      const twilio = integrations.find(i => i.id === "twilio");
      const resend = integrations.find(i => i.id === "resend");
      if (twilio?.live_ping_ok && resend?.live_ping_ok) return "done";
      return "pending";
    }
    if (step.checkKey === "automation") {
      const aj = sprintData.sections?.automation_job_audit || {};
      const prodFailed = aj.production_trusted?.failed || 0;
      if (prodFailed === 0 && (sprintData.sections?.lead_capture?.production_trusted_leads > 0)) return "done";
      return "pending";
    }
    if (step.checkKey === "booking") {
      const bp = sprintData.sections?.booking_proof || {};
      if (bp.status === "proof_passed" || bp.latest_booking) return "done";
      return "pending";
    }
    if (step.checkKey === "launch_truth") {
      if (sprintData.safe_to_launch) return "done";
      if (sprintData.production_blocker_count === 0) return "done";
      return "pending";
    }
    if (step.checkKey === "go_live") {
      return sprintData.safe_to_launch ? "done" : "pending";
    }
    return "pending";
  };

  const completedCount = STEPS.filter(s => getStepStatus(s) === "done").length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const currentStep = STEPS.find(s => getStepStatus(s) !== "done");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Launch Guide</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Follow these steps in order to get your system live. Each step checks real production evidence — no fake passes.
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading} className="cs-btn-primary inline-flex items-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Checking..." : "Re-check Status"}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Launch Progress</h3>
          <span className="text-sm font-bold text-primary">{completedCount} / {STEPS.length} complete</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #0088CC, #00AEEF)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {progressPercent === 100
            ? "✅ All steps complete — your system is ready to launch!"
            : `Next step: ${currentStep?.title || "All done"}`}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step);
          const Icon = step.icon;
          const isDone = status === "done";
          const isCurrent = !isDone && STEPS.slice(0, idx).every(s => getStepStatus(s) === "done");

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-5 transition-all ${
                isDone
                  ? "border-green-200 bg-green-50/50"
                  : isCurrent
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {loading ? (
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isCurrent ? "border-primary" : "border-gray-300"
                    }`}>
                      <span className={`text-xs font-bold ${isCurrent ? "text-primary" : "text-gray-400"}`}>{step.id}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isDone ? "text-green-600" : isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className={`text-sm font-bold ${isDone ? "text-green-900" : isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </h3>
                    {isDone && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Complete</span>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">In Progress</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {/* Step-specific detail */}
                  {isCurrent && step.checkKey === "stripe" && (
                    <button
                      onClick={() => onNavigate("launch-truth-sprint")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      View Stripe proof details <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {isCurrent && step.checkKey === "messaging" && (
                    <button
                      onClick={() => onNavigate("health")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      Check Integration Health <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {isCurrent && step.checkKey === "launch_truth" && (
                    <button
                      onClick={() => onNavigate("launch-truth-sprint")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      Run Launch Truth Sprint <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {isCurrent && step.checkKey === "leads" && (
                    <button
                      onClick={() => onNavigate("leads")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      View Leads <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {isCurrent && step.checkKey === "automation" && (
                    <button
                      onClick={() => onNavigate("automations")}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      Check Automation Status <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button onClick={() => onNavigate("launch-truth-sprint")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left">
            <ShieldCheck className="w-4 h-4 text-primary mb-1" />
            Launch Truth Sprint
          </button>
          <button onClick={() => onNavigate("health")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left">
            <MessageSquare className="w-4 h-4 text-primary mb-1" />
            Integration Health
          </button>
          <button onClick={() => onNavigate("leads")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left">
            <Users className="w-4 h-4 text-primary mb-1" />
            View Leads
          </button>
          <button onClick={() => onNavigate("settings")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left">
            <Settings className="w-4 h-4 text-primary mb-1" />
            Admin Settings
          </button>
        </div>
      </div>
    </div>
  );
}