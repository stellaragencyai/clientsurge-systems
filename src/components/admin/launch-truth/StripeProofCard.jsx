import { CreditCard, CheckCircle2, XCircle, ExternalLink, RefreshCw } from "lucide-react";

const CHECKLIST = [
  { step: 1, text: "Open the public pricing page (/pricing or /store)", done: null },
  { step: 2, text: "Select Starter, Growth, or Elite package", done: null },
  { step: 3, text: "Complete Stripe checkout using a real, non-test email and real business name", done: null },
  { step: 4, text: "Confirm Order record is created with payment_status = paid", done: null },
  { step: 5, text: "Confirm Order is NOT excluded by production trust filters", done: null },
  { step: 6, text: "Confirm Client / ClientProject / ClientInstallationOS / AutomationChecklist were created or linked", done: null },
];

function Row({ label, value, good, bad }) {
  if (value === null || value === undefined) return null;
  const showIcon = good !== undefined || bad !== undefined;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-foreground text-right flex items-center gap-1">
        {showIcon && (good ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : bad ? <XCircle className="w-3 h-3 text-red-500" /> : null)}
        {String(value)}
      </span>
    </div>
  );
}

export default function StripeProofCard({ stripeData, onboardingData, onRerun, loading }) {
  const order = stripeData?.latest_paid_order;
  const install = onboardingData?.latest_install_os;
  const checklist = onboardingData?.latest_automation_checklist;
  const project = onboardingData?.latest_client_project;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">A. Real Stripe Checkout Proof</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${stripeData?.production_trusted_paid_count > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {stripeData?.production_trusted_paid_count > 0 ? "Proof Found" : "Blocked — No Proof"}
        </span>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {CHECKLIST.map(item => {
          let done = null;
          if (item.step === 4) done = Boolean(order && order.payment_status === "paid");
          if (item.step === 5) done = Boolean(order && !order.exclusion_reason);
          if (item.step === 6) done = Boolean(install || checklist || project);
          return (
            <div key={item.step} className="flex items-start gap-2 text-xs">
              {done === true ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                : done === false ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />}
              <span className={done === true ? "text-green-700" : "text-muted-foreground"}>
                <span className="font-semibold">{item.step}.</span> {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Latest matching order */}
      {order ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Latest Matching Order</p>
          <Row label="Business Name" value={order.business_name} />
          <Row label="Customer Email" value={order.customer_email} />
          <Row label="Payment Status" value={order.payment_status} good={order.payment_status === "paid"} />
          <Row label="Order Status" value={order.order_status} />
          <Row label="Pipeline Status" value={order.pipeline_status} />
          <Row label="Environment" value={order.environment} good={order.environment === "production" || order.environment === "unknown"} bad={order.environment === "smoke" || order.environment === "test"} />
          <Row label="Stripe Session ID" value={order.stripe_session_id ? "✓ Present" : "✗ Missing"} good={Boolean(order.stripe_session_id)} bad={!order.stripe_session_id} />
          <Row label="Stripe Subscription ID" value={order.stripe_subscription_id ? "✓ Present" : "✗ Not applicable"} good={Boolean(order.stripe_subscription_id)} />
          <Row label="Exclusion Reason" value={order.exclusion_reason || "None (production-trusted)"} good={!order.exclusion_reason} />
          <Row label="Client Project ID" value={order.client_project_id || "✗ Not linked"} good={Boolean(order.client_project_id)} />
          <Row label="Onboarding Client ID" value={order.onboarding_client_id || "✗ Not linked"} good={Boolean(order.onboarding_client_id)} />
          <Row label="Created Date" value={new Date(order.created_date).toLocaleString()} />
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 font-semibold">⚠ No production-trusted paid Order records found.</p>
          <p className="text-xs text-red-600 mt-1">{stripeData?.next_action}</p>
        </div>
      )}

      {/* Onboarding linkage */}
      {(install || checklist) && (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Onboarding Linkage</p>
          {install && <Row label="ClientInstallationOS" value={`${install.business_name} — ${install.workflow_stage} (${install.activation_status})`} />}
          {checklist && <Row label="AutomationChecklist" value={`${checklist.business_name} — ${checklist.service_key} (Twilio: ${checklist.twilio_configured ? "✓" : "✗"}, Resend: ${checklist.resend_configured ? "✓" : "✗"})`} />}
        </div>
      )}

      {/* Excluded orders */}
      {stripeData?.paid_but_excluded?.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-bold text-yellow-800 mb-1">⚠ {stripeData.paid_but_excluded.length} Paid Order(s) Excluded as Internal/Test</p>
          {stripeData.paid_but_excluded.map((o, i) => (
            <p key={i} className="text-xs text-yellow-700">{o.business_name} — {o.exclusion_reason}</p>
          ))}
        </div>
      )}

      {/* Rerun button */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={onRerun} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Re-run Stripe Proof
        </button>
        <a href="/pricing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3.5 h-3.5" /> Open Pricing Page
        </a>
      </div>
    </div>
  );
}