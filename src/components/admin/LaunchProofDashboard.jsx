import { useState, useCallback, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  verified: { label: "Verified", icon: ShieldCheck, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  trusted: { label: "Trusted", icon: ShieldCheck, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  configured: { label: "Configured", icon: AlertTriangle, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  manual_required: { label: "Manual Proof", icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  blocked: { label: "Blocked", icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  not_configured: { label: "Not Configured", icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  unknown: { label: "Unknown", icon: HelpCircle, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
};

const STATUS_ORDER = {
  failed: 0,
  blocked: 1,
  not_configured: 2,
  manual_required: 3,
  configured: 4,
  unknown: 5,
  verified: 6,
  trusted: 7,
};

function getConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
}

function StatusBadge({ status }) {
  const config = getConfig(status);
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.bg} ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, status = "unknown" }) {
  const config = getConfig(status);
  return (
    <div className={`rounded-lg border p-3 text-center ${config.bg} ${config.border}`}>
      <p className={`text-2xl font-bold ${config.color}`}>{value}</p>
      <p className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{label}</p>
    </div>
  );
}

function CheckRow({ check }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{check.check_name}</h3>
            <StatusBadge status={check.status} />
            {check.critical !== false && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">Critical</span>
            )}
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {check.provider || "base44"} · {check.category || "system"}
          </p>
        </div>
        {check.evidence_url && (
          <a
            href={check.evidence_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Evidence <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {check.evidence_summary && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{check.evidence_summary}</p>
      )}

      {(check.failure_reason || check.manual_steps_required) && (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Next action</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
            {check.manual_steps_required || check.failure_reason}
          </p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">Last checked: {check.last_checked_at || "Never"}</p>
    </div>
  );
}

export default function LaunchProofDashboard() {
  const [data, setData] = useState(null);
  const [legacyData, setLegacyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProof = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("runLaunchValidationEngine", {});
      setData(res?.data || res);

      try {
        const legacy = await base44.functions.invoke("runLaunchTruthSprint", {});
        setLegacyData(legacy?.data || legacy);
      } catch {
        setLegacyData(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to load launch validation data.");
      try {
        const legacy = await base44.functions.invoke("runLaunchTruthSprint", {});
        setLegacyData(legacy?.data || legacy);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProof();
  }, [fetchProof]);

  const checks = (data?.checks || []).slice().sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 99;
    const orderB = STATUS_ORDER[b.status] ?? 99;
    return orderA - orderB;
  });

  const counts = data?.counts || {
    total: checks.length,
    verified: checks.filter((check) => check.status === "verified" || check.status === "trusted").length,
    manual_required: checks.filter((check) => check.status === "manual_required").length,
    failed: checks.filter((check) => check.status === "failed" || check.status === "blocked" || check.status === "not_configured").length,
    blockers: checks.filter((check) => check.critical !== false && check.safe_to_launch !== true).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Launch Validation Engine</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence-based launch checks across Base44, GA4, Stripe, Resend, Twilio, and manual Google proof items.
          </p>
          {data?.run_at && <p className="mt-1 text-xs text-muted-foreground">Last run: {data.run_at}</p>}
        </div>
        <button
          onClick={fetchProof}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? "Checking..." : "Re-verify All"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Verified" value={counts.verified || 0} status="verified" />
        <StatCard label="Manual Proof" value={counts.manual_required || 0} status="manual_required" />
        <StatCard label="Failed" value={counts.failed || 0} status="failed" />
        <StatCard label="Blockers" value={counts.blockers || 0} status={counts.blockers > 0 ? "blocked" : "verified"} />
        <StatCard label="Total" value={counts.total || 0} status="unknown" />
      </div>

      {data && (
        <div className={`rounded-xl border p-4 ${data.safe_to_launch ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center gap-2">
            {data.safe_to_launch ? <ShieldCheck className="h-5 w-5 text-green-700" /> : <XCircle className="h-5 w-5 text-red-700" />}
            <h3 className={`font-bold ${data.safe_to_launch ? "text-green-800" : "text-red-800"}`}>
              {data.safe_to_launch ? "Launch-ready" : "Not launch-ready"}
            </h3>
          </div>
          <p className={`mt-1 text-sm ${data.safe_to_launch ? "text-green-800" : "text-red-800"}`}>{data.next_action}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          {legacyData && <p className="mt-2">Fallback Launch Truth Sprint data loaded, but the new validation engine did not respond.</p>}
        </div>
      )}

      {checks.length > 0 ? (
        <div className="space-y-3">
          {checks.map((check) => <CheckRow key={check.check_key} check={check} />)}
        </div>
      ) : !loading ? (
        <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
          No launch validation checks returned yet. Click Re-verify All after the backend function deploys.
        </div>
      ) : null}

      {legacyData && (
        <details className="rounded-xl border border-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-foreground">Legacy Launch Truth Sprint summary</summary>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
            <div>Safe to launch: <strong>{String(Boolean(legacyData.safe_to_launch))}</strong></div>
            <div>Total gates: <strong>{legacyData.total_gates ?? "—"}</strong></div>
            <div>Blocked: <strong>{legacyData.gates_blocked ?? "—"}</strong></div>
            <div>Ready for proof: <strong>{legacyData.gates_ready_for_proof ?? "—"}</strong></div>
          </div>
        </details>
      )}

      {loading && !data && (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Verifying launch proof...</p>
        </div>
      )}
    </div>
  );
}
