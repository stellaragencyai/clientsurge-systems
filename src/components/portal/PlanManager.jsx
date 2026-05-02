import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ArrowRight, Loader2, CircleAlert } from "lucide-react";

const PLANS = [
  {
    name: "Starter System",
    monthly: "$197/mo",
    features: ["Instant lead response", "AI booking handoff"],
  },
  {
    name: "Growth System",
    monthly: "$349/mo",
    badge: "Most Popular",
    features: ["Starter + missed-call text-back", "14-day nurture sequence"],
  },
  {
    name: "Elite System",
    monthly: "$469/mo",
    features: ["Growth + lead reactivation", "Review request automation"],
  },
];

const PLAN_RANK = {
  "Starter System": 1,
  "Growth System": 2,
  "Elite System": 3,
};

function formatDate(value) {
  if (!value) return "Unavailable";
  return new Date(value).toLocaleDateString();
}

export default function PlanManager({ project, subscription, onUpdated }) {
  const currentPlan = subscription?.plan_type || project.plan;
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submitRequest = async (requestType, requestedPlanType = "") => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      await base44.functions.invoke("requestSubscriptionChange", {
        request_type: requestType,
        requested_plan_type: requestedPlanType,
      });
      setSelected(null);
      setSuccess(
        requestType === "cancel"
          ? "Cancellation request submitted for operator review."
          : `Plan change request to ${requestedPlanType} submitted for operator review.`
      );
      onUpdated?.();
      setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError?.data?.error || requestError?.message || "Unable to submit subscription request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
      <h2 className="font-display text-xl font-semibold text-foreground mb-1">Subscription & Plan</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Current plan: <span className="font-bold text-foreground">{currentPlan || project.plan}</span>
        {subscription?.change_request_status === "pending_review" && (
          <span className="ml-2 text-primary font-semibold">
            · {subscription.change_request_type === "cancel"
              ? "Cancellation pending review"
              : `Change to ${subscription.requested_plan_type || "requested plan"} pending review`}
          </span>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Billing Status" value={subscription?.status || "Unavailable"} />
        <SummaryCard label="Renews" value={formatDate(subscription?.current_period_end)} />
        <SummaryCard label="Services Included" value={String(subscription?.services_included?.length || 0)} />
        <SummaryCard label="Plan Requests" value={subscription?.change_request_status || "None"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          const isSelected = plan.name === selected;
          return (
            <button
              key={plan.name}
              onClick={() => !isCurrent && setSelected(plan.name)}
              disabled={isCurrent || saving}
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
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {selected && selected !== currentPlan && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Request plan change to <span className="text-primary">{selected}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This only creates an operator-reviewed request. Billing changes stay manual until approved.
            </p>
          </div>
          <button
            onClick={() =>
              submitRequest(
                (PLAN_RANK[selected] || 0) > (PLAN_RANK[currentPlan] || 0) ? "upgrade" : "downgrade",
                selected
              )
            }
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Change"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="w-4 h-4 text-amber-700 mt-0.5" />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Cancellation</p>
              <p className="text-xs text-amber-800 mt-1">
                Cancellation requests are reviewed manually. Data is preserved and services are disabled safely after the billing change is confirmed.
              </p>
            </div>
            <button
              onClick={() => submitRequest("cancel")}
              disabled={saving || subscription?.change_request_type === "cancel"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Request Cancellation
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}
