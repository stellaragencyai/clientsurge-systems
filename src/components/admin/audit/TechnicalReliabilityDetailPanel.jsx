import {
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Server,
  Database,
  Lock,
  GitBranch,
} from "lucide-react";

function StatusCard({ label, value, positive, neutral }) {
  const color = positive ? "#16a34a" : neutral ? "#d97706" : "#dc2626";
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function MetricRow({ label, value, warning }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-bold" style={{ color: warning ? "#d97706" : "#0f172a" }}>{value}</span>
    </div>
  );
}

export default function TechnicalReliabilityDetailPanel({ detail }) {
  const gates = detail?.launch_gate_summary || {};
  const readiness = detail?.launch_readiness || {};
  const truth = detail?.dashboard_truth || {};
  const recon = detail?.reconciliation || {};
  const eventQueue = detail?.event_queue || {};
  const deadLetters = detail?.dead_letters || {};
  const commEvents = detail?.communication_events || {};
  const envUnknown = detail?.environment_unknown || {};
  const truthUnknown = detail?.dashboard_truth_unknown || {};
  const routeAuth = detail?.route_auth || {};
  const releaseProof = detail?.release_proof || {};

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-primary" />
        <h3
          className="text-base font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Technical Reliability / Security / Release Control
        </h3>
      </div>

      {/* Top-level status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatusCard
          label="LaunchGate Status"
          value={gates.total > 0 ? `${gates.passed}/${gates.total} passed` : "No gates"}
          positive={gates.blocked === 0 && gates.total > 0}
          neutral={gates.blocked > 0 || gates.total === 0}
        />
        <StatusCard
          label="Readiness State"
          value={readiness.exists ? `${readiness.score}/100` : "Missing"}
          positive={readiness.exists && readiness.system_status === "ready"}
          neutral={!readiness.exists}
        />
        <StatusCard
          label="Dashboard Truth"
          value={truth.exists ? truth.truth_status : "Missing"}
          positive={truth.exists && truth.truth_status === "trusted"}
          neutral={!truth.exists || truth.truth_status === "warning"}
        />
        <StatusCard
          label="Release Proof"
          value={releaseProof.exists ? "Exists" : "Missing"}
          positive={releaseProof.exists}
          neutral={!releaseProof.exists}
        />
      </div>

      {/* Blocked gates alert */}
      {gates.blocked > 0 && (
        <div
          className="rounded-xl p-3 mb-4"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: "#dc2626" }}>
            ⚠ {gates.blocked} blocked LaunchGate(s):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gates.blocked_gate_keys?.map((key) => (
              <span key={key} className="text-[11px] px-2 py-0.5 rounded-full bg-white font-mono" style={{ color: "#dc2626" }}>
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* LaunchGate details */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> LaunchGate Summary
          </p>
          <MetricRow label="Total gates" value={gates.total || 0} />
          <MetricRow label="Passed (proof_passed)" value={gates.passed || 0} positive />
          <MetricRow label="Partial" value={gates.partial || 0} warning />
          <MetricRow label="Blocked" value={gates.blocked || 0} warning={gates.blocked > 0} />
        </div>

        {/* LaunchReadinessState */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> Launch Readiness
          </p>
          {readiness.exists ? (
            <>
              <MetricRow label="Score" value={`${readiness.score}/100`} positive={readiness.score >= 85} warning={readiness.score < 85} />
              <MetricRow label="System status" value={readiness.system_status || "—"} />
              <MetricRow label="Go/No-Go" value={readiness.go_no_go || "—"} />
              <MetricRow label="Last evaluated" value={readiness.last_evaluated ? new Date(readiness.last_evaluated).toLocaleString() : "—"} />
              {readiness.critical_blockers?.length > 0 && (
                <div className="mt-1.5">
                  <span className="text-[10px] text-muted-foreground">Critical blockers:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {readiness.critical_blockers.map((b, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-mono">{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-red-600 font-semibold">No LaunchReadinessState record found.</p>
          )}
        </div>

        {/* EventQueue health */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Server className="w-3 h-3" /> EventQueue & Dead Letters
          </p>
          <MetricRow label="Failed events" value={eventQueue.failed_count || 0} warning={eventQueue.failed_count > 0} />
          <MetricRow label="Dead-letter events" value={eventQueue.dead_letter_count || 0} warning={eventQueue.dead_letter_count > 0} />
          <MetricRow label="Unresolved dead letters" value={deadLetters.unresolved_count || 0} warning={deadLetters.unresolved_count > 0} />
          <MetricRow label="Failed communications" value={commEvents.failed_count || 0} warning={commEvents.failed_count > 0} />
          {commEvents.failed_by_provider && Object.keys(commEvents.failed_by_provider).length > 0 && (
            <div className="mt-1.5">
              <span className="text-[10px] text-muted-foreground">Failed by provider:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {Object.entries(commEvents.failed_by_provider).map(([provider, count]) => (
                  <span key={provider} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">
                    {provider}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Environment & truth status */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Database className="w-3 h-3" /> Environment & Truth Separation
          </p>
          <MetricRow label="Records with environment=unknown" value={envUnknown.total || 0} warning={envUnknown.total > 0} />
          {envUnknown.breakdown && Object.entries(envUnknown.breakdown).map(([entity, count]) => (
            <MetricRow key={entity} label={`  ↳ ${entity}`} value={count} warning={count > 0} />
          ))}
          <MetricRow label="Records with truth_status=unknown" value={truthUnknown.total || 0} warning={truthUnknown.total > 0} />
          {truthUnknown.breakdown && Object.entries(truthUnknown.breakdown).map(([entity, count]) => (
            <MetricRow key={entity} label={`  ↳ ${entity}`} value={count} warning={count > 0} />
          ))}
        </div>
      </div>

      {/* Route auth & security */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Route Auth Coverage
          </p>
          <MetricRow label="Admin routes protected" value={routeAuth.admin_routes_protected ? "Yes" : "No"} positive={routeAuth.admin_routes_protected} />
          <MetricRow label="Client portal safe entry" value={routeAuth.client_portal_safe_entry ? "Yes" : "No"} positive={routeAuth.client_portal_safe_entry} />
          <MetricRow label="Public routes intentional" value={routeAuth.public_routes_intentional ? "Yes" : "No"} positive={routeAuth.public_routes_intentional} />
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" /> Release & Reconciliation
          </p>
          <MetricRow label="Release proof exists" value={releaseProof.exists ? "Yes" : "No"} positive={releaseProof.exists} warning={!releaseProof.exists} />
          {releaseProof.latest_created && (
            <MetricRow label="Latest release proof" value={new Date(releaseProof.latest_created).toLocaleDateString()} />
          )}
          <MetricRow label="Reconciliation exists" value={recon.exists ? "Yes" : "No"} positive={recon.exists} warning={!recon.exists} />
          {recon.exists && (
            <MetricRow label="Latest recon status" value={recon.status || "—"} />
          )}
        </div>
      </div>

      {/* Dashboard truth details */}
      {truth.exists && (
        <div className="mt-4 rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Dashboard Truth Check Details
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Truth status:</span>
              <span className="font-bold ml-1" style={{ color: truth.truth_status === "trusted" ? "#16a34a" : truth.truth_status === "blocked" ? "#dc2626" : "#d97706" }}>
                {truth.truth_status}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Safe to launch:</span>
              <span className="font-bold ml-1" style={{ color: truth.safe_to_launch ? "#16a34a" : "#dc2626" }}>
                {truth.safe_to_launch ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Safe for client:</span>
              <span className="font-bold ml-1" style={{ color: truth.safe_to_show_client ? "#16a34a" : "#dc2626" }}>
                {truth.safe_to_show_client ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Blockers:</span>
              <span className="font-bold ml-1">{truth.blocker_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Warnings:</span>
              <span className="font-bold ml-1">{truth.warning_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last checked:</span>
              <span className="font-bold ml-1">{truth.last_checked ? new Date(truth.last_checked).toLocaleDateString() : "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}