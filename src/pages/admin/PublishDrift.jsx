import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, GitCommit, RefreshCw, Server } from "lucide-react";
import BuildVersionBeacon from "@/components/system/BuildVersionBeacon";

function Value({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-sm font-semibold text-slate-950 ${mono ? "font-mono break-all" : ""}`}>{value || "—"}</p>
    </div>
  );
}

export default function PublishDrift() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("getPublishDrift", {});
      setData(response?.data || response || {});
    } catch (err) {
      setError(err?.data?.error || err?.message || "Unable to load publish drift diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const build = data?.build || {};
  const commitKnown = build.git_commit && build.git_commit !== "unknown";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Release Control</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Publish Drift</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Compare deployed build identifiers, critical function inventory, and recent evidence so GitHub/Base44 drift is visible instead of guessed.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mr-2 inline h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">Loading release diagnostics...</div>
        ) : (
          <>
            <div className={`rounded-2xl border p-4 text-sm font-semibold ${commitKnown ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {commitKnown ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : <AlertTriangle className="mr-2 inline h-4 w-4" />}
              {data?.recommendation || "No recommendation returned."}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Value label="App Version" value={build.app_version} />
              <Value label="Git Commit" value={build.git_commit} mono />
              <Value label="Build Time" value={build.build_time} />
              <Value label="Base44 App ID" value={build.base44_app_id} mono />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Server className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-950">Critical Functions</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(data?.critical_functions || []).map((fn) => (
                  <div key={fn.name} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                    <span className="font-mono font-semibold text-slate-800">{fn.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${fn.expected_request_tracing ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{fn.expected_request_tracing ? "traced" : "watch"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <GitCommit className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-950">Recent Evidence</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Value label="Checked At" value={data?.checked_at ? new Date(data.checked_at).toLocaleString() : "—"} />
                <Value label="Audit Rows Scanned" value={data?.recent_evidence?.audit_rows_scanned ?? "—"} />
                <Value label="Last Credentials Audit" value={data?.recent_evidence?.last_credentials_submission_audit?.record_id || "None found"} mono />
              </div>
            </div>
          </>
        )}
      </div>
      <BuildVersionBeacon />
    </div>
  );
}
