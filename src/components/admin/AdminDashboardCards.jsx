/**
 * AdminDashboardCards — #269 #270 #273 #274
 * LTV card, Churn Risk panel, Install Status table, Quick Actions
 */
import { useState, useEffect } from "react";

// #269: LTV Card
export function LTVCard({ orders = [] }) {
  const totalLTV = orders.reduce((sum, o) => {
    const months = o.start_date
      ? Math.max(1, Math.round((Date.now() - new Date(o.start_date).getTime()) / (30 * 24 * 3600000)))
      : 1;
    return sum + ((o.monthly_rate || 0) * months);
  }, 0);
  const avgLTV = orders.length > 0 ? Math.round(totalLTV / orders.length) : 0;

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
      <p style={{ color: "#9CA3AF", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Total LTV</p>
      <p style={{ color: "#00FFB3", fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>${totalLTV.toLocaleString()}</p>
      <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>Avg ${avgLTV.toLocaleString()} / client · {orders.length} clients</p>
    </div>
  );
}

// #270: Churn Risk Panel
export function ChurnRiskPanel({ orders = [] }) {
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    // Flag orders that are past_due or haven't had activity in >30 days
    const flagged = orders.filter(o =>
      o.billing_status === "past_due" ||
      (o.updated_date && (Date.now() - new Date(o.updated_date).getTime()) > 30 * 24 * 3600000 && o.payment_status === "active")
    );
    setRisks(flagged);
  }, [orders]);

  if (!risks.length) return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
      <p style={{ color: "#00FFB3", fontSize: 14, margin: 0 }}>✅ No churn risk detected</p>
    </div>
  );

  return (
    <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 20 }}>
      <p style={{ color: "#FCA5A5", fontWeight: 700, fontSize: 14, margin: "0 0 12px" }}>
        ⚠️ Churn Risk ({risks.length})
      </p>
      {risks.map(o => (
        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ color: "#D1D5DB", fontSize: 13 }}>{o.business_name}</span>
          <span style={{ color: "#EF4444", fontSize: 12 }}>{o.billing_status === "past_due" ? "Past Due" : "No activity 30d+"}</span>
        </div>
      ))}
    </div>
  );
}

// #273: Install Status Table
export function InstallStatusTable({ onboardings = [] }) {
  const fields = ["twilio_configured","instant_response_built","missed_call_textback","followup_sequence_built","went_live"];
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
              {["Twilio","Instant","Missed Call","Follow-Up","Live"].map(h => (
                <th key={h} style={{ padding: "8px 10px", color: "#9CA3AF", textAlign: "center", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {onboardings.map(o => (
              <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 16px", color: "#D1D5DB" }}>{o.business_name || o.client_name}</td>
                {fields.map(f => (
                  <td key={f} style={{ padding: "10px", textAlign: "center" }}>
                    <span style={{ color: o[f] ? "#00FFB3" : "#374151", fontSize: 14 }}>{o[f] ? "✓" : "○"}</span>
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

// #274: Quick Actions
export function AdminQuickActions({ order, onRefresh }) {
  const [loading, setLoading] = useState({});

  const act = async (key, endpoint, body) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      await fetch(`/api/functions/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onRefresh?.();
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  const actions = [
    { key: "day1",    label: "Send Day 1 Email",  fn: () => act("day1", "sendDripEmail", { order_id: order.id, step: "day1" }) },
    { key: "followup",label: "Trigger Follow-Up", fn: () => act("followup", "processAutomationJobs", { order_id: order.id, force: true }) },
    { key: "live",    label: "Mark as Live",       fn: () => act("live", "markClientLive", { order_id: order.id }) },
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
