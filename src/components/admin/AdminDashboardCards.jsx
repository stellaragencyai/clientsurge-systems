import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const TRUTH_STATUS_LABELS = {
  trusted: "Trusted",
  warning: "Warning",
  blocked: "Blocked",
  unknown: "Unknown",
};

const TRUTH_STATUS_CLASSES = {
  trusted: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300",
  blocked: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300",
  unknown: "border-border bg-muted/30 text-muted-foreground",
};

export function DashboardTruthBanner() {
  const [truthCheck, setTruthCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardTruth() {
      setLoading(true);
      setError("");
      try {
        const records = await base44.entities.DashboardTruthCheck.filter(
          { scope: "admin_dashboard" },
          "-last_checked_at",
          1
        );
        if (!cancelled) setTruthCheck((records || [])[0] || null);
      } catch (err) {
        if (!cancelled) {
          console.error("DashboardTruthBanner: failed to load DashboardTruthCheck", err);
          setError("Unable to load dashboard truth check.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboardTruth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dashboard Truth Status</p>
        <p className="mt-2 text-sm text-muted-foreground">Loading latest DashboardTruthCheck...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
        <p className="text-xs font-semibold uppercase tracking-wide">Dashboard Truth Status</p>
        <p className="mt-2 text-sm font-medium">{error}</p>
        <p className="mt-1 text-xs">Treat dashboard claims as unverified until this source loads.</p>
      </div>
    );
  }

  if (!truthCheck) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
        <p className="text-xs font-semibold uppercase tracking-wide">Dashboard Truth Status</p>
        <p className="mt-2 text-sm font-medium">Needs Instrumentation</p>
        <p className="mt-1 text-xs">No admin_dashboard DashboardTruthCheck record exists yet. Do not treat dashboard metrics as trusted.</p>
      </div>
    );
  }

  const status = truthCheck.truth_status || "unknown";
  const safeToAdmin = truthCheck.safe_to_show_admin ? "Safe for admin visibility" : "Not cleared for admin visibility";
  const safeToLaunch = truthCheck.safe_to_launch ? "Safe to launch" : "Not safe to launch";
  const lastChecked = truthCheck.last_checked_at ? new Date(truthCheck.last_checked_at).toLocaleString() : "Not checked";
  const blockerCount = Number(truthCheck.blocker_count || 0);
  const warningCount = Number(truthCheck.warning_count || 0);

  return (
    <div className={`rounded-xl border p-4 ${TRUTH_STATUS_CLASSES[status] || TRUTH_STATUS_CLASSES.unknown}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Dashboard Truth Status</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-foreground dark:bg-black/20 dark:text-white">
              {TRUTH_STATUS_LABELS[status] || "Unknown"}
            </span>
            <span className="text-xs font-medium">{blockerCount} blockers · {warningCount} warnings</span>
          </div>
          <p className="mt-2 text-sm font-medium">{truthCheck.evidence_summary || "No evidence summary recorded."}</p>
          <p className="mt-1 text-xs opacity-80">Last checked: {lastChecked}</p>
        </div>
        <div className="min-w-[190px] rounded-lg bg-white/50 p-3 text-xs dark:bg-black/10">
          <p className="font-semibold">{safeToAdmin}</p>
          <p className="mt-1 font-semibold">{safeToLaunch}</p>
          <p className="mt-2 opacity-80">Source: DashboardTruthCheck · scope=admin_dashboard</p>
        </div>
      </div>
    </div>
  );
}

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