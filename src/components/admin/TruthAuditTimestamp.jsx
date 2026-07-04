import { useState } from "react";
import { Clock, Database, RefreshCw, AlertTriangle, Info, Copy, Check } from "lucide-react";

export default function TruthAuditTimestamp({ data, onRefresh, loading }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const meta = data.audit_meta || {};
  const computedAt = meta.computed_at || data.timestamp;
  const sources = meta.data_sources_checked || [];
  const records = meta.records_scanned || {};
  const totalRecords = records.total || 0;

  const isStale = (() => {
    if (!computedAt) return true;
    const computed = new Date(computedAt).getTime();
    if (isNaN(computed)) return true;
    const hoursSince = (Date.now() - computed) / (1000 * 60 * 60);
    // Flag stale if older than 24 hours or if no evidence records exist at all
    return hoursSince > 24 || totalRecords === 0;
  })();

  const formattedTime = computedAt
    ? new Date(computedAt).toLocaleString()
    : "Never computed";

  const copySummary = () => {
    const lines = [
      `Twilio Growth Engine — Truth Audit Timestamp`,
      `Computed: ${formattedTime}`,
      `Stale: ${isStale ? "Yes" : "No"}`,
      `Total records scanned: ${totalRecords}`,
      ``,
      `Data sources checked:`,
      ...sources.map(s => `  - ${s}`),
      ``,
      `Records by source:`,
      ...Object.entries(records).filter(([k]) => k !== "total").map(([k, v]) => `  - ${k}: ${v}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: isStale ? "linear-gradient(135deg, rgba(217,119,6,0.05), rgba(217,119,6,0.01))" : "linear-gradient(135deg, rgba(5,150,105,0.04), rgba(5,150,105,0.01))",
        borderColor: isStale ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.18)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: isStale ? "rgba(217,119,6,0.1)" : "rgba(5,150,105,0.08)",
              border: `1px solid ${isStale ? "rgba(217,119,6,0.25)" : "rgba(5,150,105,0.2)"}`,
            }}
          >
            <Clock className="w-4 h-4" style={{ color: isStale ? "#D97706" : "#059669" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Truth Audit Timestamp</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Admin only — status is only as current as the last computation.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copySummary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Recompute
          </button>
        </div>
      </div>

      {/* Computed time + stale indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-gray-100 bg-white/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last Computed</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{formattedTime}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Records Scanned</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{totalRecords.toLocaleString()}</p>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: isStale ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.18)",
            background: isStale ? "rgba(217,119,6,0.04)" : "rgba(5,150,105,0.03)",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Data Freshness</p>
          <p
            className="text-sm font-bold mt-1 flex items-center gap-1.5"
            style={{ color: isStale ? "#D97706" : "#059669" }}
          >
            {isStale ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {isStale ? "Stale — recompute needed" : "Current"}
          </p>
        </div>
      </div>

      {/* Stale warning */}
      {isStale && (
        <div
          className="rounded-lg border p-3 mb-4 flex items-start gap-2"
          style={{
            background: "rgba(217,119,6,0.05)",
            borderColor: "rgba(217,119,6,0.2)",
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              {totalRecords === 0
                ? "No evidence records found — audit has no data to evaluate."
                : "Audit data may be stale."}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              {totalRecords === 0
                ? "No communication logs, proof records, or events were found. All capability statuses are computed from zero evidence and should be treated as missing."
                : "Status is only as current as the last computation. If provider configurations or records have changed since then, the statuses shown may not reflect the current state."}
            </p>
          </div>
        </div>
      )}

      {/* Data sources checked */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Database className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Data Sources Checked</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sources.map(src => (
            <span key={src} className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              {src}
            </span>
          ))}
        </div>
      </div>

      {/* Records by source */}
      {Object.keys(records).length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Records Scanned by Source</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(records)
              .filter(([k]) => k !== "total")
              .map(([key, count]) => (
                <div key={key} className="rounded-lg border border-gray-100 bg-white/60 px-2.5 py-1.5">
                  <p className="text-[10px] font-medium text-gray-400">{key.replace(/_/g, " ")}</p>
                  <p className="text-sm font-bold text-gray-700">{count.toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-600 leading-relaxed">
          This timestamp reflects when the audit function last ran. Capability statuses, evidence summaries, and blockers
          are only valid as of this computation. Click <strong>Recompute</strong> to refresh from live data.
        </p>
      </div>
    </div>
  );
}