import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, AlertTriangle, Loader2, RefreshCw, Lock } from "lucide-react";

const STATUS_STYLES = {
  BLOCKED: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", dot: "#DC2626" },
  PARTIAL: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B" },
  READY_FOR_LIVE_PROOF: { bg: "#F0FDF4", border: "#86EFAC", text: "#166534", dot: "#22C55E" },
};

function MetricRow({ label, value, warning }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-xs font-bold ${warning ? "text-red-600" : value > 0 ? "text-gray-900" : "text-gray-400"}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function InboundLeadReadinessCard() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getInboundLeadReadiness", {});
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load readiness data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadiness(); }, [fetchReadiness]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setError(null);
    try {
      await base44.functions.invoke("seedDefaultRateLimitConfig", {});
      await fetchReadiness();
    } catch (err) {
      setError(err.message || "Failed to seed default rate limit config");
    } finally {
      setSeeding(false);
    }
  }, [fetchReadiness]);

  const status = data?.status || "BLOCKED";
  const style = STATUS_STYLES[status] || STATUS_STYLES.BLOCKED;
  const counts = data?.counts || {};

  const REMEDIATION_STEPS = [
    "Backfill WebsiteLead tenant scope (client_id / client_project_id)",
    "Backfill WebsiteLead dedupe keys (dedup_key)",
    "Link WebsiteLead to canonical Leads records (crm_lead_id)",
    "Add idempotency before live sends (IdempotencyKey)",
    "Resolve pending dead letters (DeadLetterLog status=pending_review)",
    "Repair failed/stale AutomationJob records",
    "Generate LeadNextBestAction records for active leads",
    "Run live-safe provider proof only after simulation passes",
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Inbound Lead Readiness</h3>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
              {status.replace(/_/g, " ")}
            </span>
          )}
          <button
            onClick={fetchReadiness}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* Critical blockers */}
            {data?.critical_blockers?.length > 0 && (
              <div className="mb-3 rounded-lg border p-3" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <p className="text-xs font-bold text-red-700">Critical Blockers</p>
                </div>
                <ul className="space-y-1">
                  {data.critical_blockers.map((b, i) => (
                    <li key={i} className="text-[11px] text-red-600 pl-4">• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Seed button if no rate limit config */}
            {counts.rate_limit_config === 0 && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="mb-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                {seeding ? "Seeding…" : "Create Default Rate Limit Config"}
              </button>
            )}

            {/* Guardrail counts */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Guardrails</p>
              <MetricRow label="Rate Limit Configs" value={counts.rate_limit_config || 0} warning={counts.rate_limit_config === 0} />
              <MetricRow label="Idempotency Keys" value={counts.idempotency_key || 0} warning={counts.idempotency_key === 0} />
              <MetricRow label="Lead Next-Best-Actions" value={counts.lead_next_best_action || 0} />
            </div>

            {/* Failure backlog */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Failure Backlog</p>
              <MetricRow label="Pending Dead Letters" value={counts.pending_dead_letter || 0} warning={counts.pending_dead_letter > 0} />
              <MetricRow label="Failed Automation Jobs" value={counts.failed_automation_job || 0} warning={counts.failed_automation_job > 0} />
              <MetricRow label="Stale Automation Jobs" value={counts.stale_automation_job || 0} warning={counts.stale_automation_job > 0} />
            </div>

            {/* WebsiteLead data gaps */}
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                WebsiteLead Data Gaps <span className="text-gray-300 normal-case">({counts.website_lead_total || 0} total)</span>
              </p>
              <MetricRow label="Missing client_id" value={counts.website_lead_missing_client_id || 0} warning={counts.website_lead_missing_client_id > 0} />
              <MetricRow label="Missing client_project_id" value={counts.website_lead_missing_client_project_id || 0} />
              <MetricRow label="Missing dedup_key" value={counts.website_lead_missing_dedup_key || 0} warning={counts.website_lead_missing_dedup_key > 0} />
              <MetricRow label="Missing crm_lead_id" value={counts.website_lead_missing_crm_lead_id || 0} />
            </div>

            {/* Remediation checklist */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Remediation Checklist</p>
              <ul className="space-y-1.5">
                {REMEDIATION_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                    <input type="checkbox" className="mt-0.5 w-3 h-3 rounded border-gray-300" disabled />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {data?.checked_at && (
              <p className="mt-3 text-[10px] text-gray-300">Checked: {new Date(data.checked_at).toLocaleString()}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}