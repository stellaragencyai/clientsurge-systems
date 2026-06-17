import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, ShieldAlert, RefreshCw, XCircle, ArrowRight } from "lucide-react";

export default function AdminReconciliationPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dryRun, setDryRun] = useState(true);

  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("runDashboardReconciliation", {
        run_type: "full_audit",
        dry_run: dryRun,
      });
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Reconciliation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Dashboard Truth &amp; Reconciliation</h2>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Dry Run (no writes)
          </label>
          <button
            onClick={runReconciliation}
            disabled={loading}
            className="cs-btn-primary"
            style={{ minHeight: "40px", fontSize: "0.8125rem" }}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {dryRun ? "Run Dry Reconciliation" : "Apply Reconciliation"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 text-sm font-semibold">
            <XCircle className="w-4 h-4" /> Reconciliation Error
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl border border-border p-6 bg-card">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {result.dry_run ? "Dry Run Results" : "Reconciliation Applied"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-foreground">{result.total_records_checked}</p>
                <p className="text-xs text-muted-foreground mt-1">Records Checked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">{result.blockers_found}</p>
                <p className="text-xs text-muted-foreground mt-1">Blockers Found</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-500">{result.warnings_found}</p>
                <p className="text-xs text-muted-foreground mt-1">Warnings</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-green-600">{result.records_updated}</p>
                <p className="text-xs text-muted-foreground mt-1">Records Updated</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{result.summary}</p>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-3">
            {result.blockers_found === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <CheckCircle className="w-3.5 h-3.5" /> Zero Blockers
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" /> {result.blockers_found} Blockers
              </span>
            )}
            {result.warnings_found > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5" /> {result.warnings_found} Warnings
              </span>
            )}
            {result.dry_run && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                Dry Run — No Changes Made
              </span>
            )}
          </div>

          {result.dry_run && result.blockers_found > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                Ready to apply fixes?
              </p>
              <p className="text-xs text-amber-700 mb-3">
                The dry run found {result.blockers_found} blockers. Switch to apply mode and run again to write environment classifications, normalize service keys, and create DashboardTruthCheck records.
              </p>
              <button
                onClick={() => { setDryRun(false); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
              >
                Switch to Apply Mode <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions when no result yet */}
      {!result && !error && (
        <div className="rounded-xl border border-border p-8 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            Dashboard Truth Reconciliation
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Run a reconciliation scan to classify QA/demo records, find paid orders missing client links, normalize service keys, and verify launch readiness. Start with a dry run to see what would change.
          </p>
        </div>
      )}
    </div>
  );
}