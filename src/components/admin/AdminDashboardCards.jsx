import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

function currency(value) {
  return Number(value || 0).toLocaleString();
}

function titleizeStatus(value) {
  if (!value) return "—";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized || ["not_started", "not ready", "not_ready", "pending", "todo"].includes(normalized)) {
    return "border-gray-200 bg-gray-50 text-gray-500";
  }
  if (["ready", "active", "live", "complete", "completed", "installed", "approved"].some((token) => normalized.includes(token))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["blocked", "failed", "error", "issue"].some((token) => normalized.includes(token))) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (["progress", "working", "started", "install"].some((token) => normalized.includes(token))) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function recordTimestamp(record) {
  const value = record?.updated_date || record?.updated_at || record?.created_date || record?.created_at;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function clientKey(record) {
  const stableId = record?.client_project_id || record?.project_id || record?.order_id || record?.client_id || record?.customer_email || record?.email;
  if (stableId) return String(stableId).trim().toLowerCase();

  const name = record?.business_name || record?.client_name || record?.customer_name;
  if (name) return String(name).trim().toLowerCase();

  return record?.id || Math.random().toString(36);
}

function collapseLatestByClient(records = []) {
  const grouped = new Map();

  records.forEach((record) => {
    if (!record) return;
    const key = clientKey(record);
    const existing = grouped.get(key);
    if (!existing || recordTimestamp(record) >= recordTimestamp(existing)) {
      grouped.set(key, {
        ...record,
        _mergedCount: (existing?._mergedCount || 0) + 1,
      });
    } else {
      grouped.set(key, {
        ...existing,
        _mergedCount: (existing?._mergedCount || 1) + 1,
      });
    }
  });

  return Array.from(grouped.values()).sort((left, right) => recordTimestamp(right) - recordTimestamp(left));
}

function StatusPill({ value }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none ${statusTone(value)}`}>
      {titleizeStatus(value)}
    </span>
  );
}

// #269: LTV Card
export function LTVCard({ orders = [] }) {
  const totalLTV = orders.reduce((sum, order) => {
    const startedAt = order.went_live_at || order.current_period_start || order.paid_at || order.created_date;
    const months = startedAt
      ? Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / (30 * 24 * 3600000)))
      : 1;
    const monthly = order.total_monthly ?? order.pricing_summary?.total_monthly ?? 0;
    const setup = order.total_setup ?? order.pricing_summary?.total_setup ?? 0;
    return sum + setup + (monthly * months);
  }, 0);
  const avgLTV = orders.length > 0 ? Math.round(totalLTV / orders.length) : 0;

  return (
    <div className="relative min-h-[132px] overflow-hidden rounded-xl">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-100/70 blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-400">Estimated LTV</p>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Estimate
          </span>
        </div>
        <p className="text-4xl font-black tracking-tight text-emerald-600">${currency(totalLTV)}</p>
        <p className="mt-2 text-xs font-medium leading-5 text-gray-500">
          Avg ${currency(avgLTV)} per client · {orders.length} paid {orders.length === 1 ? "order" : "orders"}
        </p>
        <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-[11px] font-medium leading-4 text-amber-700">
          Reconcile Stripe subscriptions before treating this as collected revenue proof.
        </p>
      </div>
    </div>
  );
}

// #270: Churn Risk Panel
export function ChurnRiskPanel({ orders = [] }) {
  const [risks, setRisks] = useState([]);
  const [hasInstrumentedRisk, setHasInstrumentedRisk] = useState(false);

  useEffect(() => {
    const instrumented = orders.some((order) => Number.isFinite(Number(order.churn_risk_score)));
    const flagged = orders
      .filter((order) => Number.isFinite(Number(order.churn_risk_score)) && Number(order.churn_risk_score) > 70)
      .sort((left, right) => Number(right.churn_risk_score || 0) - Number(left.churn_risk_score || 0));

    setHasInstrumentedRisk(instrumented);
    setRisks(flagged);
  }, [orders]);

  if (!hasInstrumentedRisk) {
    return (
      <div className="flex min-h-[132px] flex-col justify-between rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-gray-950">Churn Risk</p>
            <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Not configured
            </span>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            No numeric churn risk score is available on paid orders yet. This panel is intentionally neutral until a trusted risk signal exists.
          </p>
        </div>
        <p className="mt-4 text-[11px] font-semibold text-amber-700">Next: wire churn_risk_score from usage, billing, or support signals.</p>
      </div>
    );
  }

  if (!risks.length) {
    return (
      <div className="flex min-h-[132px] flex-col justify-between rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-gray-950">Churn Risk</p>
            <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Clear
            </span>
          </div>
          <p className="text-xs leading-5 text-gray-500">No high-risk clients were found among orders with instrumented churn scores.</p>
        </div>
        <p className="mt-4 text-[11px] font-semibold text-emerald-700">Only orders with numeric churn_risk_score were evaluated.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-gray-950">Churn Risk</p>
        <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
          {risks.length} flagged
        </span>
      </div>
      <div className="space-y-2">
        {risks.slice(0, 4).map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-white/80 px-3 py-2">
            <span className="truncate text-xs font-semibold text-gray-800">{order.business_name || order.customer_name || "Unknown client"}</span>
            <span className="text-xs font-black text-red-600">{order.churn_risk_score}</span>
          </div>
        ))}
      </div>
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
  const hasInstallFields = onboardings.some((record) =>
    cols.some((column) => Object.prototype.hasOwnProperty.call(record || {}, column.key))
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
          setInstallError("Unable to load install records right now.");
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
  const displayRecords = collapseLatestByClient(sourceRecords);
  const mergedCount = Math.max(0, sourceRecords.length - displayRecords.length);
  const sourceLabel = hasInstallFields ? "Onboarding install fields" : "ClientInstallationOS";

  if (installError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-extrabold text-red-700">Install status unavailable</p>
        <p className="mt-1 text-xs leading-5 text-red-700/80">{installError}</p>
      </div>
    );
  }

  if (installLoading && displayRecords.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-extrabold text-gray-950">Loading install status...</p>
        <p className="mt-1 text-xs text-gray-500">Source: ClientInstallationOS</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-gray-950">Install Status</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Source: {sourceLabel}{mergedCount ? ` · ${mergedCount} duplicate ${mergedCount === 1 ? "row" : "rows"} merged` : ""}
            </p>
          </div>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
            Latest
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-gray-500">Client</th>
              {cols.map((column) => (
                <th key={column.key} className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-wide text-gray-500">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRecords.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} className="px-4 py-6 text-center text-sm text-gray-400">
                  No install records are available yet.
                </td>
              </tr>
            )}
            {displayRecords.slice(0, 12).map((record) => (
              <tr key={record.id || clientKey(record)} className="border-t border-gray-100 transition-colors hover:bg-slate-50/80">
                <td className="max-w-[180px] px-4 py-3 text-left">
                  <div className="truncate font-bold text-gray-800">{record.business_name || record.client_name || record.customer_name || "Unknown"}</div>
                  {record._mergedCount > 1 && (
                    <div className="mt-0.5 text-[10px] font-semibold text-gray-400">{record._mergedCount} records merged</div>
                  )}
                </td>
                {cols.map((column) => (
                  <td key={column.key} className="px-3 py-3 text-center">
                    <StatusPill value={record[column.key]} />
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
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      await base44.functions.invoke(fnName, body);
      onRefresh?.();
    } catch (err) {
      console.error(`AdminQuickActions: ${fnName} failed`, err);
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  };

  const actions = [
    { key: "day1", label: "Send Day 1 Email", fn: () => act("day1", "sendEmailDripStep", { order_id: order.id, step: "day1" }) },
    { key: "followup", label: "Trigger Follow-Up", fn: () => act("followup", "processAutomationJobs", { order_id: order.id, force: true }) },
    { key: "live", label: "Mark as Live", fn: () => act("live", "sendWentLiveEmail", { order_id: order.id }) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={action.fn}
          disabled={loading[action.key]}
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading[action.key] ? "..." : action.label}
        </button>
      ))}
    </div>
  );
}
