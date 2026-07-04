import { Clock, Database, AlertTriangle, Info } from "lucide-react";

const DATA_SOURCES = [
  "AutomationProofLog",
  "CommunicationLog (channel=sms)",
  "CommunicationEvent (channel=sms)",
  "AdminSettings",
  "AutomationChecklist",
  "WebsiteLead",
];

function isStale(timestamp) {
  if (!timestamp) return true;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return ageMs > 60 * 60 * 1000; // stale if older than 1 hour
}

function timeAgo(timestamp) {
  if (!timestamp) return "never";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TruthAuditTimestamp({ data, loading }) {
  const auditTime = data?.timestamp;
  const stale = !loading && isStale(auditTime);

  const recordsScanned = {
    "AutomationProofLog": data?.proof_logs_empty ? 0 : (Object.values(data?.proof_by_service || {}).reduce((s, p) => s + (p.total || 0), 0)),
    "CommunicationLog (sms)": data?.delivery_stats?.total || 0,
    "CommunicationEvent (sms)": data?.event_stats?.total || 0,
    "AutomationChecklist": (data?.qa_checklists || []).length,
    "WebsiteLead": (data?.quarantine?.production_leads_count || 0) + (data?.quarantine?.excluded_leads_count || 0),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Truth Audit Timestamp</h3>
            <p className="text-[11px] text-gray-400">Admin only — status is only as current as the last computation</p>
          </div>
        </div>
        {stale ? (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Stale
          </span>
        ) : (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200">
            Current
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Last Computed</p>
          <p className="text-sm font-bold text-gray-900">{auditTime ? new Date(auditTime).toLocaleString() : "Not yet computed"}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(auditTime)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Records Scanned</p>
          <p className="text-sm font-bold text-gray-900">
            {Object.values(recordsScanned).reduce((s, v) => s + v, 0)} total records
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">across {DATA_SOURCES.length} data sources</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Data Sources Checked</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DATA_SOURCES.map(src => (
            <div key={src} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-2.5 py-1.5">
              <span className="text-[11px] font-mono text-gray-600 truncate">{src}</span>
              <span className="text-[11px] font-bold text-gray-700 ml-1.5 flex-shrink-0">{recordsScanned[src] ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {stale && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Stale data warning:</span> The last audit was computed {timeAgo(auditTime)}.
            Statuses below may not reflect recent changes. Click Refresh to recompute from live data.
          </p>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 flex items-start gap-2">
        <Info className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Status is only as current as the last computation. No real-time monitoring — refresh to get the latest.
        </p>
      </div>
    </div>
  );
}