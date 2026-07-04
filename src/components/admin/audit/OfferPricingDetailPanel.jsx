import {
  DollarSign,
  Package,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_COLORS = {
  ok: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
};

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color: color || "#000", fontFamily: "Montserrat, sans-serif" }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function OfferPricingDetailPanel({ detail }) {
  if (!detail) return null;
  const packages = detail.package_summary || [];
  const counts = detail.order_counts || {};

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Offer / Pricing Detail
        </h3>
      </div>

      {/* Order count pills */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatPill label="Total Orders" value={counts.total || 0} />
        <StatPill label="Production" value={counts.production || 0} color="#16a34a" />
        <StatPill label="Missing Pricing" value={counts.missing_pricing_summary || 0} color={counts.missing_pricing_summary > 0 ? "#d97706" : "#16a34a"} />
        <StatPill label="Type Mismatch" value={counts.package_type_mismatch || 0} color={counts.package_type_mismatch > 0 ? "#d97706" : "#16a34a"} />
        <StatPill label="Math Issues" value={counts.math_issues || 0} color={counts.math_issues > 0 ? "#dc2626" : "#16a34a"} />
        <StatPill label="Missing Funnel ID" value={counts.missing_funnel_identity || 0} color={counts.missing_funnel_identity > 0 ? "#d97706" : "#16a34a"} />
      </div>

      {/* Package table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Package</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Setup Fee</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Monthly Fee</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Orders</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Stripe Map</th>
              <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Plan Map</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.key} className="border-t border-border">
                <td className="px-3 py-2 font-semibold text-foreground">{pkg.label}</td>
                <td className="px-3 py-2 text-right text-foreground">${pkg.setup_fee}</td>
                <td className="px-3 py-2 text-right text-foreground">${pkg.monthly_fee}</td>
                <td className="px-3 py-2 text-center text-foreground">{pkg.order_count}</td>
                <td className="px-3 py-2 text-center">
                  {pkg.stripe_mapping_exists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 inline" style={{ color: STATUS_COLORS.ok }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 inline" style={{ color: STATUS_COLORS.warning }} />
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {pkg.plan_mapping_exists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 inline" style={{ color: STATUS_COLORS.ok }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 inline" style={{ color: STATUS_COLORS.warning }} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Included service keys */}
      <div className="mt-3 grid md:grid-cols-3 gap-3">
        {packages.map((pkg) => (
          <div key={pkg.key} className="rounded-lg border border-border p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{pkg.label}</p>
            <div className="flex flex-wrap gap-1">
              {(pkg.included_service_keys || []).map((k) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{k}</span>
              ))}
              {(pkg.add_on_service_keys || []).map((k) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">+{k}</span>
              ))}
              {(!pkg.included_service_keys || pkg.included_service_keys.length === 0) && (
                <span className="text-[10px] text-muted-foreground italic">No service keys mapped</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}