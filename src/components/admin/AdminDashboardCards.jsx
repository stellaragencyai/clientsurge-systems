import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// #269: LTV Card
export function LTVCard({ orders = [] }) {
  const totalLTV = orders.reduce((sum, o) => {
    const startedAt = o.went_live_at || o.current_period_start || o.paid_at || o.created_date;
    const months = startedAt
      ? Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / (30 * 24 * 3600000)))
      : 1;
    const monthly = o.total_monthly ?? o.pricing_summary?.total_monthly ?? 0;
    const setup = o.total_setup ?? o.pricing_summary?.total_setup ?? 0;
    return sum + setup + (monthly * months);
  }, 0);
  const avgLTV = orders.length > 0 ? Math.round(totalLTV / orders.length) : 0;

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Total LTV</p>
      <p className="text-3xl font-extrabold text-emerald-500 mb-1">${totalLTV.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">Avg ${avgLTV.toLocaleString()} / client · {orders.length} clients</p>
    </div>
  );
}

// #270: Churn Risk Panel
export function ChurnRiskPanel({ orders = [] }) {
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    const flagged = orders
      .filter((o) => Number(o.churn_risk_score || 0) > 70)
      .sort((a, b) => Number(b.churn_risk_score || 0) - Number(a.churn_risk_score || 0));
    setRisks(flagged);
  }, [orders]);

  if (!risks.length) return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-sm font-semibold text-emerald-600">✅ No churn risk detected</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-5">
      <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">
        ⚠️ Churn Risk ({risks.length})
      </p>
      {risks.map(o => (
        <div key={o.id} className="flex items-center justify-between py-2 border-b border-red-100 dark:border-red-900 last:border-0">
          <span className="text-sm text-foreground">{o.business_name || o.customer_name || "Unknown client"}</span>
          <span className="text-xs font-semibold text-red-600">Score {o.churn_risk_score}</span>
        </div>
      ))}
    </div>
  );
}

// Install Status Table — uses actual OnboardingClient entity fields
export function InstallStatusTable({ onboardings = [] }) {
  // Use real entity fields from OnboardingClient schema
  const cols = [
    { key: "website_status", label: "Website" },
    { key: "activation_status", label: "Activation" },
    { key: "workflow_stage", label: "Stage" },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>Install Status</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "8px 16px", color: "#9CA3AF", textAlign: "left", fontWeight: 600 }}>Client</th>
              {cols.map(c => (
                <th key={c.key} style={{ padding: "8px 10px", color: "#9CA3AF", textAlign: "center", fontWeight: 600 }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {onboardings.length === 0 && (
              <tr><td colSpan={cols.length + 1} style={{ padding: "16px", color: "#6B7280", textAlign: "center" }}>No onboarding records yet</td></tr>
            )}
            {onboardings.map(o => (
              <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 16px", color: "#D1D5DB" }}>{o.business_name || o.client_name || "Unknown"}</td>
                {cols.map(c => (
                  <td key={c.key} style={{ padding: "10px", textAlign: "center" }}>
                    <span style={{ color: o[c.key] && o[c.key] !== "not_started" ? "#00FFB3" : "#374151", fontSize: 11 }}>
                      {o[c.key] || "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Quick Actions
export function AdminQuickActions({ order, onRefresh }) {
  const [loading, setLoading] = useState({});

  const act = async (key, fnName, body) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      await base44.functions.invoke(fnName, body);
      onRefresh?.();
    } catch (err) {
      console.error(`AdminQuickActions: ${fnName} failed`, err);
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  const actions = [
    { key: "day1",    label: "Send Day 1 Email",  fn: () => act("day1", "sendEmailDripStep", { order_id: order.id, step: "day1" }) },
    { key: "followup",label: "Trigger Follow-Up", fn: () => act("followup", "processAutomationJobs", { order_id: order.id, force: true }) },
    { key: "live",    label: "Mark as Live",       fn: () => act("live", "sendWentLiveEmail", { order_id: order.id }) },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {actions.map(a => (
        <button key={a.key} onClick={a.fn} disabled={loading[a.key]} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#D1D5DB", borderRadius: 9999, padding: "7px 16px", fontSize: 12,
          fontWeight: 600, cursor: loading[a.key] ? "not-allowed" : "pointer",
        }}>
          {loading[a.key] ? "..." : a.label}
        </button>
      ))}
    </div>
  );
}