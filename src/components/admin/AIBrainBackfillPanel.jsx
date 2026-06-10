/**
 * AIBrainBackfillPanel — Admin-only UI for runAIBrainInstallerBackfill.
 * Shows dry-run preview, live run, and per-order results.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Loader2, Brain, PlayCircle, Eye, AlertTriangle } from "lucide-react";

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    red:   "bg-red-100 text-red-800 border-red-200",
    blue:  "bg-blue-100 text-blue-800 border-blue-200",
    gray:  "bg-muted text-muted-foreground border-border",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, color = "gray" }) {
  const colors = {
    gray:  "border-border bg-card text-foreground",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red:   "border-red-200 bg-red-50 text-red-900",
    blue:  "border-blue-200 bg-blue-50 text-blue-900",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}

export default function AIBrainBackfillPanel() {
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState("");

  const handleDryRun = async () => {
    setLoading(true);
    setError("");
    setDryRunResult(null);
    setRunResult(null);
    try {
      const res = await base44.functions.invoke("runAIBrainInstallerBackfill", { dry_run: true, limit: 50 });
      setDryRunResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Dry run failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!window.confirm(`Run AI Brain Backfill on ${dryRunResult?.eligible_count ?? "all eligible"} orders? This will mark services Live and finalize ClientProjects.`)) return;
    setLoading(true);
    setError("");
    setRunResult(null);
    try {
      const res = await base44.functions.invoke("runAIBrainInstallerBackfill", { dry_run: false, limit: 50 });
      setRunResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Run failed");
    } finally {
      setLoading(false);
    }
  };

  const results = runResult?.results || [];
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Run AI Brain Backfill</h3>
            <Badge color="blue">Admin-only</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Finds paid, non-QA orders not yet fully live and runs the full install pipeline — AutomationJobs, default config, test lead, service activation, ClientProject finalization, and AuditLog.
          </p>
        </div>
      </div>

      {/* Safety notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-900">
          <strong>Idempotent</strong> — safe to re-run. QA/test orders (<code className="bg-amber-100 px-1 rounded text-xs">clientsurge.test</code>, <code className="bg-amber-100 px-1 rounded text-xs">handoff-smoke</code>, <code className="bg-amber-100 px-1 rounded text-xs">stripe-*-proof</code>) are excluded. Run <strong>Dry Run</strong> first to preview eligible orders.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDryRun}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 h-10 text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Dry Run (Preview)
        </button>

        <button
          onClick={handleRun}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-10 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Run Backfill
        </button>
      </div>

      {/* Dry run preview */}
      {dryRunResult && !runResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground text-sm">Dry Run Preview</h4>
            <Badge color="blue">{dryRunResult.eligible_count} eligible</Badge>
          </div>
          {(dryRunResult.eligible_orders || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No eligible orders found — all paid orders are already fully live.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Business</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Services</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dryRunResult.eligible_orders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-foreground">{o.business || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{o.email}</td>
                      <td className="px-4 py-2.5">
                        <Badge color="amber">{o.order_status || o.payment_status}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(o.service_keys || []).map((sk) => (
                            <span key={sk} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{sk}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Run results */}
      {runResult && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground text-sm">Backfill Results</h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Processed" value={runResult.processed} />
            <StatCard label="Succeeded" value={runResult.succeeded} color="green" />
            <StatCard label="Failed" value={runResult.failed} color={runResult.failed > 0 ? "red" : "gray"} />
            <StatCard label="Skipped (already live)" value={(runResult.processed || 0) - (runResult.succeeded || 0) - (runResult.failed || 0)} />
          </div>

          {/* Per-order details */}
          {results.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-6"></th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Business</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Services</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Jobs</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Test Lead</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => (
                    <tr key={r.order_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        {r.success
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <XCircle className="h-4 w-4 text-red-500" />}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.business || r.email || r.order_id}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(r.service_keys || []).map((sk) => (
                            <span key={sk} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{sk}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {r.jobs ? `+${r.jobs.created?.length ?? 0} / ${r.jobs.skipped?.length ?? 0} skip` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {r.test_lead?.reused ? "reused" : r.test_lead?.created ? "created" : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-red-600">
                        {r.error || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}