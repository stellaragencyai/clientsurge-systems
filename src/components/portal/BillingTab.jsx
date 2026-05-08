/**
 * BillingTab — #260
 * ClientPortal tab: shows current plan, billing date, amount, invoice download.
 */
import { useState, useEffect } from "react";
import { ClientOnboarding } from "@/api/entities";

const TIER_LABELS = { 497: "Starter", 997: "Growth", 1997: "Elite" };
const TIER_COLORS = { 497: "#00AEEF", 997: "#7C3AED", 1997: "#F97316" };

export default function BillingTab({ order }) {
  const [loading, setLoading] = useState(false);

  const tier = order?.monthly_rate ? TIER_LABELS[order.monthly_rate] || "Custom" : "—";
  const color = order?.monthly_rate ? TIER_COLORS[order.monthly_rate] || "#00AEEF" : "#00AEEF";

  const nextBillingDate = () => {
    if (!order?.start_date) return "—";
    const start = new Date(order.start_date);
    const now = new Date();
    const next = new Date(start);
    while (next <= now) next.setMonth(next.getMonth() + 1);
    return next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Billing & Plan</h2>

      {/* Plan Card */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${color}40`,
        borderRadius: 16, padding: "24px", marginBottom: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "#9CA3AF", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Plan</span>
          <span style={{
            background: `${color}20`, color, border: `1px solid ${color}40`,
            borderRadius: 9999, padding: "2px 12px", fontSize: 12, fontWeight: 700
          }}>{tier}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
          ${order?.monthly_rate?.toLocaleString() || "—"}<span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 400 }}>/mo</span>
        </div>
      </div>

      {/* Billing Details */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
        {[
          { label: "Billing Status", value: order?.billing_status === "active" ? "✅ Active" : order?.billing_status === "past_due" ? "⚠️ Past Due" : order?.billing_status || "—" },
          { label: "Next Billing Date", value: nextBillingDate() },
          { label: "Amount Due", value: order?.monthly_rate ? `$${order.monthly_rate.toLocaleString()}` : "—" },
          { label: "Plan Started", value: order?.start_date ? new Date(order.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none"
          }}>
            <span style={{ color: "#9CA3AF", fontSize: 14 }}>{row.label}</span>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {tier !== "Elite" && (
        <div style={{ marginTop: 20, padding: 20, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16 }}>
          <p style={{ color: "#C4B5FD", fontSize: 14, margin: "0 0 12px" }}>
            🚀 Upgrade to unlock more automations and AI features.
          </p>
          <a href="/pricing" style={{
            display: "inline-block", background: "#7C3AED", color: "#fff",
            borderRadius: 9999, padding: "8px 20px", fontSize: 13, fontWeight: 700,
            textDecoration: "none"
          }}>View Upgrade Options →</a>
        </div>
      )}
    </div>
  );
}
