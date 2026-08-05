import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  APPROVAL_REQUIRED_ACTIONS,
  ALLOWED_AUTOMATIC_ACTIONS,
  buildLaunchCommandCenterSnapshot,
} from "@/lib/launchGates";

const statusTone = {
  locked: "bg-red-50 text-red-800 border-red-200",
  blocked: "bg-amber-50 text-amber-800 border-amber-200",
  partial: "bg-blue-50 text-blue-800 border-blue-200",
  ready_for_proof: "bg-slate-50 text-slate-700 border-slate-200",
  proof_running: "bg-indigo-50 text-indigo-800 border-indigo-200",
  proof_failed: "bg-red-50 text-red-800 border-red-200",
  proof_passed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  waived: "bg-purple-50 text-purple-800 border-purple-200",
};

const severityTone = {
  advisory: "bg-slate-100 text-slate-700",
  launch_blocker: "bg-amber-100 text-amber-800",
  critical_blocker: "bg-red-100 text-red-800",
};

function labelize(value) {
  return String(value || "").replace(/_/g, " ");
}

function StatusPill({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[value] || statusTone.ready_for_proof}`}>
      {labelize(value)}
    </span>
  );
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function VerdictCard({ icon: Icon, label, active, detail }) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-primary bg-primary/8" : "border-border bg-white"}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function GateRow({ gate }) {
  const proofPreview = gate.proof_results?.slice(0, 3) || [];
  const remainingProofs = Math.max(0, (gate.proof_results?.length || 0) - proofPreview.length);

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.9fr,1.5fr]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{gate.section_label}</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">{gate.gate_name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill value={gate.status} />
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityTone[gate.severity] || severityTone.launch_blocker}`}>
              {labelize(gate.severity)}
            </span>
            {gate.approval_required ? (
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                approval required
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Completion</span>
              <span>{gate.completion_percent}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={gate.completion_percent} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Proof</span>
              <span>{gate.proof_percent}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={gate.proof_percent} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Last checked {new Date(gate.last_checked_at).toLocaleString()}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current blocker</p>
            <p className="mt-1 text-sm text-foreground">{gate.current_blocker || "No blocker recorded."}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</p>
            <p className="mt-1 text-sm text-muted-foreground">{gate.next_action}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-border pt-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence summary</p>
          <p className="mt-1 text-sm text-muted-foreground">{gate.evidence_summary || "No passing proof evidence attached."}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proof checks</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {proofPreview.map((proof) => (
              <span key={proof.key} className={`rounded-full border px-2 py-1 text-xs font-medium ${statusTone[proof.status] || statusTone.ready_for_proof}`}>
                {proof.label}
              </span>
            ))}
            {remainingProofs ? (
              <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                +{remainingProofs} more
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaunchGatesPanel({ initialSnapshot = null } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [lastRefresh, setLastRefresh] = useState("");

  const loadApprovalRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const entities = base44.admin?.entities || base44.entities;
      const records = entities?.LaunchApproval?.list
        ? await entities.LaunchApproval.list("-requested_at", 200)
        : [];
      setApprovals(records || []);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      setError(err?.message || "Unable to load launch approval records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSnapshot) {
      loadApprovalRecords();
    }
  }, []);

  const snapshot = useMemo(() => {
    if (initialSnapshot) return initialSnapshot;
    return buildLaunchCommandCenterSnapshot({ approvalInputs: approvals });
  }, [approvals, initialSnapshot]);

  const gates = snapshot.gates || [];
  const criticalBlockers = gates.filter((gate) => gate.severity === "critical_blocker" && !["proof_passed", "approved", "waived"].includes(gate.status));
  const approvedCount = gates.filter((gate) => gate.status === "approved").length;
  const proofPassedCount = gates.filter((gate) => gate.status === "proof_passed").length;
  const averageProof = gates.length
    ? Math.round(gates.reduce((total, gate) => total + gate.proof_percent, 0) / gates.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Launch Gates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {snapshot.verdict.verdict}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Generated {new Date(snapshot.generated_at).toLocaleString()}
            {lastRefresh ? ` · approvals refreshed ${new Date(lastRefresh).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <button
          onClick={loadApprovalRecords}
          disabled={loading || Boolean(initialSnapshot)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VerdictCard
          icon={Lock}
          label="Launch lock"
          active={snapshot.verdict.launch_locked}
          detail={snapshot.verdict.next_action}
        />
        <VerdictCard
          icon={ClipboardCheck}
          label="25-lead test"
          active={snapshot.verdict.ready_for_25_lead_test}
          detail={snapshot.verdict.ready_for_25_lead_test ? "Prerequisite gates are unlocked." : "Email, Booking, CRM, Outreach, Website, and Security must pass."}
        />
        <VerdictCard
          icon={ShieldCheck}
          label="Live payments"
          active={snapshot.verdict.ready_for_live_payments}
          detail={snapshot.verdict.ready_for_live_payments ? "Stripe proof is passed and approved." : "Stripe requires proof plus manual approval."}
        />
        <VerdictCard
          icon={CheckCircle2}
          label="Full campaign"
          active={snapshot.verdict.ready_for_full_campaign}
          detail={snapshot.verdict.ready_for_full_campaign ? "25 and 50-lead proofs are attached." : "Campaign expansion remains locked."}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critical blockers</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{criticalBlockers.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved gates</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{approvedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proof passed</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{proofPassedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average proof</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{averageProof}%</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-semibold text-foreground">Approval-required actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {APPROVAL_REQUIRED_ACTIONS.map((action) => (
              <span key={action} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
                {labelize(action)}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-semibold text-foreground">Allowed automatic actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALLOWED_AUTOMATIC_ACTIONS.map((action) => (
              <span key={action} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {labelize(action)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {gates.map((gate) => <GateRow key={gate.gate_key} gate={gate} />)}
      </div>
    </div>
  );
}
