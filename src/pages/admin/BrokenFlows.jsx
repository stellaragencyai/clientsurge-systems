import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import BuildVersionBeacon from "@/components/system/BuildVersionBeacon";

function severityClasses(severity) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function FlowCard({ flow }) {
  const Icon = flow.severity === "info" ? CheckCircle2 : ShieldAlert;
  return (
    <div className={`rounded-2xl border p-4 ${severityClasses(flow.severity)}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{flow.title}</h3>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{flow.severity}</span>
          </div>
          <p className="mt-1 text-sm opacity-90">{flow.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-80">
            {flow.entity_name && <span>{flow.entity_name}</span>}
            {flow.record_id && <span className="font-mono">{flow.record_id}</span>}
            {flow.age_hours !== null && flow.age_hours !== undefined && <span>{flow.age_hours}h old</span>}
          </div>
        </div>
        {flow.route_hint && (
          <a href={flow.route_hint} className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold hover:bg-white">
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function BrokenFlows() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("getBrokenFlows", {});
      setData(response?.data || response || {});
    } catch (err) {
      setError(err?.data?.error || err?.message || "Unable to load broken flow diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flows = data?.flows || [];
  const criticalCount = useMemo(() => flows.filter((flow) => flow.severity === "critical").length, [flows]);
  const warningCount = useMemo(() => flows.filter((flow) => flow.severity === "warning").length, [flows]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Operations Truth</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Broken Flows</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Paid-order, credentials, install OS, dead-letter, and system execution issues that need attention. This panel is intentionally blunt.
            </p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Broken</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.summary?.broken_flow_count ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-500">Critical</p>
            <p className="mt-2 text-2xl font-semibold text-red-900">{criticalCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Warnings</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">{warningCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Scanned Orders</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.summary?.paid_orders_scanned ?? "—"}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="mr-2 inline h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">Loading diagnostics...</div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => <FlowCard key={flow.id} flow={flow} />)}
          </div>
        )}
      </div>
      <BuildVersionBeacon />
    </div>
  );
}
