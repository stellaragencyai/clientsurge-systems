import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, RefreshCw, Database, ShieldAlert, Wrench } from "lucide-react";

export default function TenantScopeAuditPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getTenantScopeAudit", {});
      setData(res?.data || res);
    } catch (err) {
      console.error("Tenant scope audit failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const handleBackfill = async (entity) => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await base44.functions.invoke("backfillTenantScope", {
        action: "backfill",
        entity,
        limit: 100,
      });
      setBackfillResult(res?.data || res);
      fetchAudit();
    } catch (err) {
      setBackfillResult({ error: err?.message || "Backfill failed" });
    } finally {
      setBackfilling(false);
    }
  };

  const totalMissing = data?.total_missing || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Tenant Scope Audit
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Records missing <code className="text-xs bg-gray-100 px-1 rounded">client_id</code> are not safe for multi-client scaling.
            Backfill infers from lead/order/client relationships.
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

      {/* Summary banner */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: totalMissing > 0
            ? "linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))"
            : "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))",
          border: `1px solid ${totalMissing > 0 ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.2)"}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: totalMissing > 0 ? "rgba(217,119,6,0.1)" : "rgba(5,150,105,0.1)",
          }}
        >
          {totalMissing > 0
            ? <AlertTriangle className="w-5 h-5 text-amber-600" />
            : <ShieldAlert className="w-5 h-5 text-green-600" />
          }
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: totalMissing > 0 ? "#D97706" : "#059669" }}>
            {totalMissing > 0
              ? `${totalMissing} records missing tenant scope`
              : "All records have tenant scope"
            }
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalMissing > 0
              ? "These records cannot be safely attributed to a specific client. Run backfill to infer from lead/order relationships."
              : "Every communication and automation record has a client_id assigned."
            }
          </p>
        </div>
      </div>

      {/* Entity table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Records Missing client_id by Entity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Scanning entities…</p>
            </div>
          ) : !data?.entities?.length ? (
            <div className="p-6 text-center text-sm text-gray-400">No data available.</div>
          ) : (
            data.entities.map((row) => (
              <div key={row.entity} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.entity}</p>
                  <p className="text-xs text-gray-400">
                    {row.error ? row.error : `${row.missing_count || 0} missing of ${row.total_count || 0} total`}
                  </p>
                </div>
                {row.missing_count > 0 && !row.error && (
                  <button
                    onClick={() => handleBackfill(row.entity)}
                    disabled={backfilling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-60"
                  >
                    <Wrench className="w-3 h-3" />
                    Backfill
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Backfill result */}
      {backfillResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Backfill Result</h3>
          {backfillResult.error ? (
            <p className="text-sm text-red-600">{backfillResult.error}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-lg font-bold text-green-700">{backfillResult.updated || 0}</p>
                <p className="text-xs text-green-600 mt-0.5">Scoped</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-lg font-bold text-amber-700">{backfillResult.manual_review || 0}</p>
                <p className="text-xs text-amber-600 mt-0.5">Manual Review</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-lg font-bold text-gray-700">{backfillResult.errors || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Errors</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Scanned: {backfillResult.scanned || 0} records in {backfillResult.entity || "—"}
          </p>
        </div>
      )}
    </div>
  );
}