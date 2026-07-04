import {
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Link2,
  DollarSign,
} from "lucide-react";

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color: color || "#000", fontFamily: "Montserrat, sans-serif" }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ChainRow({ label, passed, detail }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30">
      <div className="flex items-center gap-2">
        {passed ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} /> : <XCircle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold" style={{ color: passed ? "#16a34a" : "#dc2626" }}>{detail}</span>
    </div>
  );
}

export default function CheckoutRevenueDetailPanel({ detail }) {
  if (!detail) return null;
  const counts = detail.order_counts || {};
  const latest = detail.latest_paid_order;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Checkout / Revenue Detail
        </h3>
      </div>

      {/* Count pills */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatPill label="Checkout Clicks" value={detail.checkout_click_events || 0} color={detail.checkout_click_events > 0 ? "#16a34a" : "#d97706"} />
        <StatPill label="Total Orders" value={counts.total || 0} />
        <StatPill label="Prod Paid" value={counts.production_paid || 0} color="#16a34a" />
        <StatPill label="Pending" value={counts.pending || 0} color="#d97706" />
        <StatPill label="Missing Session" value={counts.missing_session || 0} color={counts.missing_session > 0 ? "#d97706" : "#16a34a"} />
        <StatPill label="Missing Sub" value={counts.missing_subscription || 0} color={counts.missing_subscription > 0 ? "#dc2626" : "#16a34a"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Latest paid order */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Latest Production Paid Order</p>
          {latest ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Customer</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2">{latest.customer_email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Business</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2">{latest.business_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment Status</span>
                <span className="text-xs font-bold" style={{ color: latest.payment_status === "paid" ? "#16a34a" : "#dc2626" }}>{latest.payment_status || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Order Status</span>
                <span className="text-xs font-semibold text-foreground">{latest.order_status || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Setup</span>
                <span className="text-xs font-semibold text-foreground">${latest.total_setup || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Monthly</span>
                <span className="text-xs font-semibold text-foreground">${latest.total_monthly || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs font-semibold text-foreground">{latest.created_date ? new Date(latest.created_date).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No production-trusted paid order found.</p>
          )}
        </div>

        {/* Revenue flow chain validation */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Revenue Flow Chain Validation</p>
          <div className="space-y-0.5">
            <ChainRow label="Checkout Click Events" passed={detail.checkout_click_events > 0} detail={detail.checkout_click_events > 0 ? "Tracked" : "None"} />
            <ChainRow label="Session ID Stored" passed={counts.missing_session === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_session || 0)}/${counts.production_paid}`} />
            <ChainRow label="Customer ID Linked" passed={counts.missing_customer_id === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_customer_id || 0)}/${counts.production_paid}`} />
            <ChainRow label="Subscription Linked" passed={counts.missing_subscription === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_subscription || 0)}/${counts.production_paid}`} />
            <ChainRow label="Funnel Identity" passed={counts.missing_funnel_identity === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_funnel_identity || 0)}/${counts.production_paid}`} />
            <ChainRow label="Client Link" passed={counts.missing_client_link === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_client_link || 0)}/${counts.production_paid}`} />
            <ChainRow label="Onboarding Handoff" passed={counts.missing_onboarding_handoff === 0 && counts.production_paid > 0} detail={`${counts.production_paid - (counts.missing_onboarding_handoff || 0)}/${counts.production_paid}`} />
            <ChainRow label="Status Consistency" passed={counts.status_inconsistencies === 0 && counts.production_paid > 0} detail={counts.status_inconsistencies === 0 ? "Consistent" : `${counts.status_inconsistencies} issues`} />
          </div>
        </div>
      </div>
    </div>
  );
}