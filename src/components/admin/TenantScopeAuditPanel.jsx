import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Database, Wrench,
} from "lucide-react";

const AUDIT_ENTITIES = [
  "CommunicationLog", "CommunicationEvent", "Messages", "Emails",
  "AutomationJob", "EmailCampaignRecipient", "DripCampaign", "NurtureCampaign",
  "EmailDripCampaign", "WebsiteLead", "Alert", "DemoRequest",
  "LeadRevenue", "LeadReactivation",
];

const STATUS_STYLES = {
  trusted: { color: "#059669", icon: ShieldCheck, label: "Trusted" },
  warning: { color: "#D97706", icon: AlertTriangle, label: "Warning" },
  blocked: { color: "#DC2626", icon: ShieldAlert, label: "Blocked" },
};

export default function TenantScopeAuditPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backfillEntity, setBackfillEntity] = useState("CommunicationLog");
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("auditTenantScope", {});
      setData(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load tenant scope audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const handleBackfill = async () => {
    setBackfillLoading(true);
    setBackfillResult(null);
    try {
      const res = await base44.functions.invoke("backfillTenantScope", {
        entity_name: backfillEntity,
        limit: 100,
        dry_run: false,
      });
      setBackfillResult(res?.data || res);
      // Refresh audit after backfill
      setTimeout(() => fetchAudit(), 1000);
    } catch (err) {
      setBackfillResult({ error: err?.data?.error || err?.message || "Backfill failed." });
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleDryRun = async () => {
    setBackfillLoading(true);
    setBackfillResult(null);
    try {
      const res = await base44.functions.invoke("backfillTenantScope", {
        entity_name: backfillEntity,
        limit: 50,
        dry_run: true,
      });
      setBackfillResult(res?.data || res);
    } catch (err) {
      setBackfillResult({ error: err?.data?.error || err?.message || "Dry run failed." });
    } finally {
      setBackfillLoading(false);
    }
  };

  const overallStatus = data?.dashboard_truth_status || "unknown";
  const statusStyle = STATUS_STYLES[overallStatus] || STATUS_STYLES.blocked;
  const OverallIcon = statusStyle.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tenant Scope Audit</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Multi-client isolation health. Records missing <code className="text-xs">client_id</code> are blocked from dashboard proof.
          </p>
        </div>
        <button
          onClick={fetchAudit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      {!loading && data && (
        <div
          className="rounded-xl p-5 flex items-start gap-3"
          style={{
            background: overallStatus === "trusted" ? "rgba(5,150,105,0.06)" : overallStatus === "warning" ? "rgba(217,119,6,0.06)" : "rgba(220,38,38,0.06)",
            border: `1px solid ${statusStyle.color}33`,
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${statusStyle.color}1a` }}
          >
            <OverallIcon className="w-4 h-4" style={{ color: statusStyle.color }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: statusStyle.color }}>
              Dashboard Truth Status: {statusStyle.label}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {data.total_missing} record(s) missing client_id across {AUDIT_ENTITIES.length} entities.
              {data.total_manual_review} record(s) need manual review.
              {" "}
              {overallStatus === "trusted"
                ? "All communication metrics are safe to display as trusted proof."
                : "Communication metrics from unscoped records must NOT be shown as trusted proof."}
            </p>
          </div>
        </div>
      )}

      {/* Entity breakdown */}
      {!loading && data && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Entity Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Records missing tenant scope per entity.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {data.entities?.map((entity) => {
              const hasGaps = entity.missing_client_id > 0;
              const hasReview = entity.manual_review > 0;
              return (
                <div key={entity.entity_name} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 truncate">{entity.entity_name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Scoped</span>
                      <span className="text-sm font-bold text-green-600">{entity.scoped}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Missing</span>
                      <span className="text-sm font-bold" style={{ color: hasGaps ? "#DC2626" : "#9ca3af" }}>
                        {entity.missing_client_id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Review</span>
                      <span className="text-sm font-bold" style={{ color: hasReview ? "#D97706" : "#9ca3af" }}>
                        {entity.manual_review}
                      </span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        color: entity.truth_status === "trusted" ? "#059669" : "#DC2626",
                        background: entity.truth_status === "trusted" ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
                      }}
                    >
                      {entity.truth_status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backfill controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Safe Backfill / Reconciliation</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Infers <code className="text-xs">client_id</code> from lead_id, order_id, client_email, or onboarding links.
          Confident matches are updated to <code className="text-xs">scoped</code>; ambiguous or unmatched records are marked <code className="text-xs">manual_review</code>.
          No records are deleted.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={backfillEntity}
            onChange={(e) => setBackfillEntity(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white"
          >
            {AUDIT_ENTITIES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <button
            onClick={handleDryRun}
            disabled={backfillLoading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {backfillLoading ? "Running..." : "Dry Run (Preview)"}
          </button>
          <button
            onClick={handleBackfill}
            disabled={backfillLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: backfillLoading ? "#9cb3c9" : "#005691" }}
          >
            {backfillLoading ? "Running..." : "Apply Backfill"}
          </button>
        </div>

        {/* Backfill result */}
        {backfillResult && (
          <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            {backfillResult.error ? (
              <p className="text-sm text-red-600 font-semibold">{backfillResult.error}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">Entity: <strong className="text-gray-700">{backfillResult.entity_name}</strong></span>
                  <span className="text-gray-400">Scanned: <strong className="text-gray-700">{backfillResult.scanned}</strong></span>
                  <span className="text-green-600">Scoped: <strong>{backfillResult.scoped}</strong></span>
                  <span className="text-amber-600">Manual Review: <strong>{backfillResult.manual_review}</strong></span>
                  <span className="text-red-600">No Match: <strong>{backfillResult.no_match}</strong></span>
                  {backfillResult.dry_run && <span className="text-blue-600 font-semibold">(DRY RUN)</span>}
                </div>
                {backfillResult.updates?.slice(0, 10).map((u, i) => (
                  <div key={i} className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="text-gray-300">•</span>
                    <span className="font-mono text-gray-600">{u.id?.slice(-8)}</span>
                    <span className={`font-semibold ${u.action === "scoped" ? "text-green-600" : "text-amber-600"}`}>{u.action}</span>
                    {u.source && <span className="text-gray-400">via {u.source}</span>}
                    {u.reason && <span className="text-gray-400">({u.reason})</span>}
                  </div>
                ))}
                {backfillResult.updates?.length > 10 && (
                  <p className="text-xs text-gray-400">...and {backfillResult.updates.length - 10} more</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Auditing tenant scope across {AUDIT_ENTITIES.length} entities...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}