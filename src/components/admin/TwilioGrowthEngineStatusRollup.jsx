import {
  CheckCircle2, AlertTriangle, XCircle, ShieldAlert, TrendingUp, TrendingDown,
} from "lucide-react";

const STATUS_LABELS = {
  green: "Complete",
  yellow: "Partial",
  red: "Missing",
};

export default function TwilioGrowthEngineStatusRollup({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const total = caps.length;
  const complete = caps.filter(c => c.status === "green").length;
  const partial = caps.filter(c => c.status === "yellow").length;
  const missing = caps.filter(c => c.status === "red").length;

  // Critical blockers = blockers on red capabilities
  const criticalBlockers = caps
    .filter(c => c.status === "red")
    .reduce((sum, c) => sum + (c.blockers?.length || 0), 0);

  // Strongest evidence = capability with most passed proof logs
  const proofByService = data.proof_by_service || {};
  let strongest = { label: "None", count: 0 };
  for (const [sk, proof] of Object.entries(proofByService)) {
    if (proof.passed > strongest.count) {
      const cap = caps.find(c => c.service_key === sk);
      strongest = { label: cap?.label || sk, count: proof.passed };
    }
  }
  if (strongest.count === 0 && data.delivery_stats?.delivered > 0) {
    strongest = { label: "CommunicationLog delivered SMS", count: data.delivery_stats.delivered };
  }

  // Weakest evidence = first red capability (already sorted by backend priority)
  const redCaps = caps.filter(c => c.status === "red");
  const weakest = redCaps.length > 0
    ? { label: redCaps[0].label, reason: redCaps[0].blockers?.[0] || "No evidence found" }
    : { label: "None — all capabilities have at least partial evidence", reason: "" };

  // Recommended next action = first red capability's next_action
  const nextAction = redCaps.length > 0
    ? redCaps[0].next_action
    : "No critical blockers. Continue maintaining proof records.";

  const overallPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900">Status Rollup</h3>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide ml-auto">Admin Only · Computed from live data</span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-gray-500">Overall Completion</p>
          <p className="text-xs font-bold text-gray-900">{overallPercent}%</p>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
          <div style={{ width: `${(complete / total) * 100}%`, background: "#059669" }} />
          <div style={{ width: `${(partial / total) * 100}%`, background: "#D97706" }} />
          <div style={{ width: `${(missing / total) * 100}%`, background: "#DC2626" }} />
        </div>
      </div>

      {/* Count grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        <RollupStat label="Total Capabilities" value={total} icon={ShieldAlert} color="#6B7280" />
        <RollupStat label="Complete" value={complete} icon={CheckCircle2} color="#059669" />
        <RollupStat label="Partial" value={partial} icon={AlertTriangle} color="#D97706" />
        <RollupStat label="Missing" value={missing} icon={XCircle} color="#DC2626" />
        <RollupStat label="Critical Blockers" value={criticalBlockers} icon={XCircle} color="#DC2626" />
        <RollupStat label="Proof Logs (passed)" value={Object.values(proofByService).reduce((s, p) => s + p.passed, 0)} icon={CheckCircle2} color="#059669" />
        <RollupStat label="Proof Logs Empty" value={data.proof_logs_empty ? "Yes" : "No"} icon={data.proof_logs_empty ? XCircle : CheckCircle2} color={data.proof_logs_empty ? "#DC2626" : "#059669"} />
      </div>

      {/* Strongest / Weakest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">Strongest Evidence Found</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{strongest.label}</p>
          <p className="text-xs text-green-700 mt-0.5">{strongest.count} passed proof record(s)</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Weakest Evidence Area</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{weakest.label}</p>
          <p className="text-xs text-red-600 mt-0.5">{weakest.reason}</p>
        </div>
      </div>

      {/* Next action */}
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Recommended Next Internal Action</p>
        <p className="text-xs text-blue-900 font-medium">{nextAction}</p>
      </div>
    </div>
  );
}

function RollupStat({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}