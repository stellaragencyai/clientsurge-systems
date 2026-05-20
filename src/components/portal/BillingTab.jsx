/**
 * BillingTab
 * Renders billing data directly from the order contract without inventing plan
 * tiers from legacy monthly-rate values.
 */
import {
  getPackageDisplayLabel,
  getPackageOffer,
  normalizePackageKey,
} from "@/lib/salesCatalog";

function formatMoney(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "—";
  }

  return `$${Number(amount).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getPackageKey(order) {
  return normalizePackageKey(
    order?.pricing_summary?.package_key ||
      order?.selected_package_type ||
      order?.package_type ||
      order?.plan_type ||
      ""
  );
}

function getMonthlyAmount(order, packageOffer) {
  return (
    order?.total_monthly ??
    order?.monthly_rate ??
    packageOffer?.monthly_total ??
    null
  );
}

function getSetupAmount(order, packageOffer) {
  return (
    order?.total_setup ??
    order?.setup_fee ??
    packageOffer?.setup_total ??
    null
  );
}

function nextBillingDate(order) {
  const knownDate =
    order?.next_billing_date ||
    order?.current_period_end ||
    order?.subscription_current_period_end;

  if (knownDate) {
    return formatDate(knownDate);
  }

  if (!order?.start_date) {
    return "—";
  }

  const start = new Date(order.start_date);
  const now = new Date();
  const next = new Date(start);

  while (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }

  return formatDate(next.toISOString());
}

export default function BillingTab({ order }) {
  const packageKey = getPackageKey(order);
  const packageOffer = getPackageOffer(packageKey);
  const planLabel =
    getPackageDisplayLabel(order?.pricing_summary) ||
    packageOffer?.name ||
    "Custom Service Bundle";
  const monthlyAmount = getMonthlyAmount(order, packageOffer);
  const setupAmount = getSetupAmount(order, packageOffer);
  const statusColor =
    order?.billing_status === "past_due"
      ? "#F97316"
      : order?.billing_status === "active" || order?.payment_status === "paid"
      ? "#10B981"
      : "#00AEEF";

  return (
    <div style={{ padding: "24px 0", maxWidth: 560 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 20,
        }}
      >
        Billing & Plan
      </h2>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${statusColor}40`,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              color: "#9CA3AF",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Current Plan
          </span>
          <span
            style={{
              background: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
              borderRadius: 9999,
              padding: "2px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {packageOffer?.name || "Custom"}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
          {planLabel}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            marginTop: 10,
          }}
        >
          {formatMoney(monthlyAmount)}
          <span
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              fontWeight: 400,
            }}
          >
            /mo
          </span>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {[
          {
            label: "Billing Status",
            value:
              order?.billing_status ||
              order?.payment_status ||
              order?.order_status ||
              "—",
          },
          { label: "Next Billing Date", value: nextBillingDate(order) },
          {
            label: "Monthly Service",
            value: formatMoney(monthlyAmount),
          },
          {
            label: "Setup Fee",
            value: formatMoney(setupAmount),
          },
          {
            label: "Plan Started",
            value: formatDate(order?.start_date || order?.paid_at),
          },
        ].map((row, index) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom:
                index < 4 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <span style={{ color: "#9CA3AF", fontSize: 14 }}>{row.label}</span>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {packageOffer?.package_key !== "elite_system" ? (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 16,
          }}
        >
          <p style={{ color: "#C4B5FD", fontSize: 14, margin: "0 0 12px" }}>
            Upgrade options should match the same package catalog used by
            checkout and fulfillment.
          </p>
          <a
            href="/pricing"
            style={{
              display: "inline-block",
              background: "#7C3AED",
              color: "#fff",
              borderRadius: 9999,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View Upgrade Options →
          </a>
        </div>
      ) : null}
    </div>
  );
}
