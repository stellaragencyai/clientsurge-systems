import { CreditCard, CheckCircle2, XCircle, AlertTriangle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { getPackageDisplayName } from "@/lib/packageDisplayNames";

const STATUS_CONFIG = {
  trusted: { label: "Trusted", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  warning: { label: "Warning", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700", icon: XCircle },
  unknown: { label: "Unknown", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function Row({ label, value, good, bad }) {
  if (value === null || value === undefined || value === "") return null;
  const display = value instanceof Date ? value.toLocaleString() : String(value);
  const showIcon = good !== undefined || bad !== undefined;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-foreground text-right flex items-center gap-1 break-all">
        {showIcon && (good ? <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" /> : bad ? <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" /> : null)}
        {display}
      </span>
    </div>
  );
}

function formatDateSafe(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString();
  } catch {
    return null;
  }
}

export default function StripeProofCard({ stripeData, onboardingData, onRerun, loading }) {
  const order = stripeData?.latest_paid_order;
  const evidenceStatus = stripeData?.evidence_status || "unknown";
  const missingHandoffFields = stripeData?.missing_handoff_fields || [];
  const recentOrders = stripeData?.recent_orders || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">A. Stripe Payment Proof</h3>
        </div>
        <StatusBadge status={evidenceStatus} />
      </div>

      {/* Webhook Configuration Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
        <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Stripe Webhook Endpoint
        </p>
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Canonical Dashboard endpoint:</span>{" "}
          <code className="bg-blue-100 px-1 rounded text-[10px] break-all">https://clientsurgesystems.com/api/functions/stripeWebhookOrders</code>
        </p>
        <p className="text-xs text-blue-700">
          The Base44 app/preview URL is <span className="font-semibold">fallback/testing only</span> and must not be used as the active Stripe Dashboard endpoint.
        </p>
        <p className="text-xs text-blue-700">
          {stripeData?.webhook_delivery_proven
            ? "✅ Webhook delivery proven — at least one Stripe event has been received and logged in Base44 records."
            : "⚠ Webhook URL configured, delivery not yet proven — no Stripe event delivery evidence found in Base44 records."}
        </p>
      </div>

      {/* Pending Checkout Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Note:</span> Pending checkout records with no event proof should be treated as{" "}
          <span className="font-semibold">incomplete checkout attempts</span>, not automatically as webhook failures.
          A pending order only becomes a webhook concern if a successful Stripe checkout was completed but no webhook event arrived.
        </p>
      </div>

      {/* Latest Paid Order — Full Field Display */}
      {order ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Latest Production-Trusted Paid Order</p>
          <Row label="Order ID" value={order.id} />
          <Row label="Customer Name" value={order.customer_name} />
          <Row label="Customer Email" value={order.customer_email} />
          <Row label="Business Name" value={order.business_name} />
          <Row label="Package" value={getPackageDisplayName(order.selected_package_type)} />
          <Row label="Payment Status" value={order.payment_status} good={order.payment_status === "paid"} bad={order.payment_status !== "paid"} />
          <Row label="Order Status" value={order.order_status} />
          <Row label="Billing Status" value={order.billing_status} />
          <Row label="Pipeline Status" value={order.pipeline_status} />
          <Row label="Stripe Session ID" value={order.stripe_session_id || "✗ Missing"} good={Boolean(order.stripe_session_id)} bad={!order.stripe_session_id} />
          <Row label="Stripe Customer ID" value={order.stripe_customer_id || "✗ Missing"} good={Boolean(order.stripe_customer_id)} bad={!order.stripe_customer_id} />
          <Row label="Stripe Subscription ID" value={order.stripe_subscription_id || "N/A (one-time)"} good={Boolean(order.stripe_subscription_id)} />
          <Row label="Subscription ID" value={order.subscription_id || "N/A"} good={Boolean(order.subscription_id)} />
          <Row label="Client ID" value={order.client_id || "✗ Not linked"} good={Boolean(order.client_id)} bad={!order.client_id} />
          <Row label="Client Project ID" value={order.client_project_id || "✗ Not linked"} good={Boolean(order.client_project_id)} bad={!order.client_project_id} />
          <Row label="Onboarding Client ID" value={order.onboarding_client_id || "✗ Not linked"} good={Boolean(order.onboarding_client_id)} bad={!order.onboarding_client_id} />
          <Row label="Install Initialized At" value={formatDateSafe(order.install_initialized_at) || "✗ Not initialized"} good={Boolean(order.install_initialized_at)} bad={!order.install_initialized_at} />
          <Row label="Last Install Event At" value={formatDateSafe(order.last_install_event_at) || "—"} />
          <Row label="Environment" value={order.environment} good={order.environment === "production" || order.environment === "unknown"} bad={["test","smoke","internal","qa","demo"].includes(order.environment)} />
          <Row label="Exclusion Reason" value={order.exclusion_reason || "None (production-trusted)"} good={!order.exclusion_reason} />
          <Row label="Created Date" value={formatDateSafe(order.created_date) || "—"} />
          <Row label="Updated Date" value={formatDateSafe(order.updated_date) || "—"} />
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 font-semibold">⚠ No production-trusted paid Order records found.</p>
        </div>
      )}

      {/* Missing Handoff Fields */}
      {missingHandoffFields.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-bold text-yellow-800 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Missing Handoff Fields ({missingHandoffFields.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingHandoffFields.map(field => (
              <span key={field} className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 font-medium">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Action */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p className="text-xs text-primary font-semibold">
          <span className="font-bold uppercase">Next:</span> {stripeData?.next_action}
        </p>
      </div>

      {/* Excluded Orders */}
      {stripeData?.paid_but_excluded?.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-bold text-yellow-800 mb-1">⚠ {stripeData.paid_but_excluded.length} Paid Order(s) Excluded as Internal/Test</p>
          {stripeData.paid_but_excluded.map((o, i) => (
            <p key={i} className="text-xs text-yellow-700">{o.business_name} — {o.exclusion_reason}</p>
          ))}
        </div>
      )}

      {/* Payment Pipeline Evidence Table */}
      {recentOrders.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 border-b border-border">
            <p className="text-xs font-bold uppercase text-muted-foreground">Payment Pipeline Evidence — 10 Most Recent Orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Created</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Email</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Business</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Payment</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Order</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Billing</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Pipeline</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Env</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground whitespace-nowrap">Prod Evidence</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Missing Handoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{formatDateSafe(o.created_date) || "—"}</td>
                    <td className="px-2 py-1.5 text-foreground truncate max-w-[120px]" title={o.customer_email}>{o.customer_email}</td>
                    <td className="px-2 py-1.5 text-foreground truncate max-w-[120px]" title={o.business_name}>{o.business_name}</td>
                    <td className="px-2 py-1.5">
                      <span className={o.payment_status === "paid" ? "text-green-600 font-semibold" : o.payment_status === "failed" ? "text-red-600" : "text-muted-foreground"}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground">{o.order_status}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{o.billing_status}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{o.pipeline_status}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{o.environment}</td>
                    <td className="px-2 py-1.5 text-center">
                      {o.production_evidence
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 inline" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 inline" />}
                    </td>
                    <td className="px-2 py-1.5">
                      {o.missing_handoff_fields.length > 0
                        ? <span className="text-yellow-700 text-[10px]">{o.missing_handoff_fields.length} missing</span>
                        : <span className="text-green-600 text-[10px]">complete</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer actions */}
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