import { useState } from "react";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TrackCLeadTruthCleanupPanel({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runCleanup = async (dryRun) => {
    setRunning(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke("trackCLeadTruthCleanup", { dry_run: dryRun });
      const data = response?.data || response;
      setResult(data);
      if (!dryRun && data?.success) onComplete?.();
    } catch (error) {
      setResult({ success: false, error: error?.message || "Cleanup failed" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
            <h3 className="text-base font-semibold text-blue-950">Track C Cleanup Runner</h3>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-blue-800">
            Admin-only controlled runner for the six known CRM cleanup records. It updates quality/audit fields only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runCleanup(true)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Preview
          </button>
          <button
            type="button"
            onClick={() => runCleanup(false)}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Run Cleanup
          </button>
        </div>
      </div>

      {result && (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${result.success ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {result.error ? (
            <p className="font-semibold">{result.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold">{result.dry_run ? "Preview complete" : "Cleanup complete"}</p>
              <p>
                Targets: {result.target_count || 0} · Updated: {result.updated || 0} · Already done: {result.already_quarantined || 0} · Not found: {result.not_found || 0} · Failed: {result.failed || 0}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
