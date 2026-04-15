import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowRight } from "lucide-react";

const PLANS = [
  {
    name: "Starter System",
    monthly: "$397/mo",
    features: ["Instant SMS response", "Confirmation email", "1 follow-up SMS + email", "Booking link integration"],
  },
  {
    name: "Growth System",
    monthly: "$797/mo",
    badge: "Most Popular",
    features: ["Everything in Starter", "Full follow-up sequence", "Missed call text-back", "Smart lead response logic", "Monthly check-in"],
  },
  {
    name: "Pro System",
    monthly: "$1,500/mo",
    features: ["Everything in Growth", "Old lead reactivation", "Advanced nurture flows", "Priority support", "Monthly strategy session"],
  },
];

export default function PlanManager({ project, onUpdated }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequest = async () => {
    if (!selected || selected === project.plan) return;
    setSaving(true);
    await base44.entities.ClientProject.update(project.id, { plan_change_request: selected });
    setSaving(false);
    setSuccess(true);
    onUpdated?.();
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
      <h2 className="font-display text-xl font-semibold text-foreground mb-1">Your Plan</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Current plan: <span className="font-bold text-foreground">{project.plan}</span>
        {project.plan_change_request && project.plan_change_request !== "None" && (
          <span className="ml-2 text-primary font-semibold">· Change to {project.plan_change_request} pending review</span>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === project.plan;
          const isSelected = plan.name === selected;
          return (
            <button
              key={plan.name}
              onClick={() => !isCurrent && setSelected(plan.name)}
              disabled={isCurrent}
              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                isCurrent
                  ? "border-green-400 bg-green-50 cursor-default"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-foreground">{plan.name}</p>
                {isCurrent && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Current</span>}
                {plan.badge && !isCurrent && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{plan.badge}</span>}
              </div>
              <p className="text-sm font-semibold text-primary mb-3">{plan.monthly}</p>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/70">{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {selected && selected !== project.plan && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Request plan change to <span className="text-primary">{selected}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Our team will review and confirm within 24 hours.</p>
          </div>
          <button
            onClick={handleRequest}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
          >
            {saving ? "Sending..." : "Request Change"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4" />
          <p className="text-sm font-semibold">Plan change requested! We'll confirm within 24 hours.</p>
        </div>
      )}
    </div>
  );
}