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
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Estimated LTV</p>
      <p className="text-3xl font-extrabold text-emerald-500 mb-1">${totalLTV.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">Order-derived estimate · Avg ${avgLTV.toLocaleString()} / client · {orders.length} paid orders</p>
      <p className="mt-2 text-[11px] text-amber-600">Needs Stripe/subscription reconciliation before treating as collected revenue proof.</p>
    </div>
  );
}

// #270: Churn Risk Panel
export function ChurnRiskPanel({ orders = [] }) {
  const [risks, setRisks] = useState([]);
  const [hasInstrumentedRisk, setHasInstrumentedRisk] = useState(false);

  useEffect(() => {
    const instrumented = orders.some((o) => Number.isFinite(Number(o.churn_risk_score)));
    const flagged = orders
      .filter((o) => Number.isFinite(Number(o.churn_risk_score)) && Number(o.churn_risk_score) > 70)
      .sort((a, b) => Number(b.churn_risk_score || 0) - Number(a.churn_risk_score || 0));
    setHasInstrumentedRisk(instrumented);
    setRisks(flagged);
  }, [orders]);

  if (!hasInstrumentedRisk) return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-5">
      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Churn risk needs instrumentation</p>
      <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">No proven churn_risk_score source is present on the loaded paid orders. Do not read this as “no churn risk detected.”</p>
    </div>
  );

  if (!risks.length) return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-sm font-semibold text-foreground">No high churn risk in instrumented orders</p>
      <p className="mt-1 text-xs text-muted-foreground">Only orders with a numeric churn_risk_score were evaluated.</p>
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

// Install Status Table — uses ClientInstallationOS as the dashboard source of truth.
export function InstallStatusTable({ onboardings = [] }) {
  const [installRecords, setInstallRecords] = useState([]);
  const [installLoading, setInstallLoading] = useState(false);
  const [installError, setInstallError] = useState("");
  const cols = [
    { key: "website_status", label: "Website" },
    { key: "activation_status", label: "Activation" },
    { key: "workflow_stage", label: "Stage" },
  ];
  const hasInstallFields = onboardings.some((o) =>
    cols.some((c) => Object.prototype.hasOwnProperty.call(o || {}, c.key))
  );
  const shouldFetchInstallRecords = onboardings.length === 0 || !hasInstallFields;

  useEffect(() => {
    let cancelled = false;

    async function loadInstallRecords() {
      if (!shouldFetchInstallRecords) return;

      setInstallLoading(true);
      setInstallError("");
      try {
        const records = await base44.entities.ClientInstallationOS.list("-created_date", 100);
        if (!cancelled) setInstallRecords(records || []);
      } catch (err) {
        if (!cancelled) {
          console.error("InstallStatusTable: failed to load ClientInstallationOS records", err);
          setInstallError("Unable to load ClientInstallationOS install records.");
        }
      } finally {
        if (!cancelled) setInstallLoading(false);
      }
    }

    loadInstallRecords();
    return () => {
      cancelled = true;
    };
  }, [shouldFetchInstallRecords]);

  const sourceRecords = hasInstallFields ? onboardings : installRecords;
  const sourceLabel = hasInstallFields ? "ClientInstallationOS-compatible records" : "ClientInstallationOS fallback query";

  if (installError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-5">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Install status unavailable</p>
        <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">{installError}</p>
      </div>
    );
  }

  if (installLoading && sourceRecords.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5">
        <p className="text-sm font-semibold text-foreground">Loading install status...</p>
        <p className="mt-1 text-xs text-muted-foreground">Source: ClientInstallationOS</p>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>Install Status</p>
        <p style={{ color: "#9CA3AF", fontSize: 11, margin: "4px 0 0" }}>Source: {sourceLabel}</p>
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
            {sourceRecords.length === 0 && (
              <tr><td colSpan={cols.length + 1} style={{ padding: "16px", color: "#6B7280", textAlign: "center" }}>No ClientInstallationOS install records available yet</td></tr>
            )}
            {sourceRecords.slice(0, 20).map(o => (
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

function summarizeActionResult(result) {
  const data = result?.data || result || {};
  const proofId = data.communication_event_id || data.communicationEventId || data.event_id || data.eventId || data.job_id || data.jobId || data.audit_log_id || data.auditLogId;
  const providerId = data.provider_message_id || data.providerMessageId || data.message_id || data.messageId;
  const status = data.status || data.result || "completed";
  const details = [
    proofId ? `proof ${proofId}` : null,
    providerId ? `provider ${providerId}` : null,
  ].filter(Boolean).join(" · ");

  return details ? `${status} · ${details}` : status;
}

// Quick Actions
export function AdminQuickActions({ order, onRefresh }) {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  const act = async (key, fnName, body) => {
    setLoading(l => ({ ...l, [key]: true }));
    setResults(r => ({ ...r, [key]: { type: "pending", text: "Running action..." } }));
    try {
      const result = await base44.functions.invoke(fnName, body);
      setResults(r => ({ ...r, [key]: { type: "success", text: summarizeActionResult(result) } }));
      onRefresh?.();
    } catch (err) {
      console.error(`AdminQuickActions: ${fnName} failed`, err);
      setResults(r => ({
        ...r,
        [key]: {
          type: "error",
          text: err?.message || "Action failed. Check function logs before retrying.",
        },
      }));
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      {Object.entries(results).length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {actions.filter(a => results[a.key]).map(a => {
            const result = results[a.key];
            const color = result.type === "success" ? "#10B981" : result.type === "error" ? "#EF4444" : "#9CA3AF";
            return (
              <div key={a.key} style={{ color, fontSize: 11, lineHeight: 1.4 }}>
                <strong>{a.label}:</strong> {result.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}