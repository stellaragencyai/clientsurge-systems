import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, ArrowRight } from "lucide-react";

const STATUS_STYLES = {
  green: { color: "#059669", icon: CheckCircle2, label: "Proven" },
  yellow: { color: "#D97706", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", icon: XCircle, label: "Not Done" },
};

export default function StatusRollup({ data }) {
  if (!data) return null;
  const caps = data.capabilities || [];
  const total = caps.length;
  const complete = caps.filter(c => c.status === "green").length;
  const partial = caps.filter(c => c.status === "yellow").length;
  const missing = caps.filter(c => c.status === "red").length;
  const criticalBlockers = caps.filter(c => c.blockers?.length > 0 && (c.status === "red" || c.key === "missed_call_text_back")).length;

  // Strongest evidence found
  let strongest = { cap: null, score: -1 };
  for (const cap of caps) {
    let score = 0;
    if (cap.proof?.passed > 0) score += 3;
    if (cap.proof?.total > 0) score += 1;
    if (cap.evidence_sources?.length > 0) score += 1;
    const hasPositiveEvidence = (cap.evidence_sources || []).some(s => !/0 passed|0 delivered|No evidence/i.test(s));
    if (hasPositiveEvidence) score += 1;
    if (score > strongest.score) strongest = { cap, score };
  }

  // Weakest evidence area
  let weakest = { cap: null, score: 99 };
  for (const cap of caps) {
    let score = 10;
    if (cap.proof?.passed > 0) score -= 5;
    if (cap.proof?.total > 0) score -= 1;
    if (cap.blockers?.length > 0) score += cap.blockers.length;
    if (cap.status === "red") score += 5;
    if (score < weakest.score) weakest = { cap, score };
  }

  // Recommended next action
  const proofEmpty = data.proof_logs_empty;
  const hasProviderErrors = (data.event_stats?.twilio_400_errors > 0) || (data.delivery_stats?.failed > 0);
  const voiceMissing = !data.voice_readiness?.has_elevenlabs_agent_ids;
  const hasTestData = (data.quarantine?.excluded_leads_count || 0) > 0;
  const reviewMissing = !data.proof_by_service?.review_request?.passed;

  let nextAction = "";
  if (proofEmpty) nextAction = "Create AutomationProofLog pass records for instant_lead_response and missed_call_text_back — no proof exists yet.";
  else if (hasProviderErrors) nextAction = "Review provider error logs (Twilio 400s, failed deliveries) before expanding automations.";
  else if (voiceMissing) nextAction = "Complete voice prerequisites (ElevenLabs agent IDs, phone number IDs) before activating voice workflows.";
  else if (hasTestData) nextAction = "Fix test data exclusions before trusting production metrics.";
  else if (reviewMissing) nextAction = "Leave review/referral rows as 'missing' until a real workflow and proof record exist.";
  else nextAction = "No critical blockers — continue maintaining proof records for all capabilities.";

  const stats = [
    { label: "Total Capabilities", value: total, color: "#111827" },
    { label: "Complete (Proven)", value: complete, color: "#059669" },
    { label: "Partial", value: partial, color: "#D97706" },
    { label: "Missing", value: missing, color: "#DC2626" },
    { label: "Critical Blockers", value: criticalBlockers, color: "#DC2626" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Status Rollup</h3>
        <span className="text-[11px] text-gray-400 ml-1">Admin only — computed from live data</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-green-100 bg-green-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-green-500 mb-1">Strongest Evidence Found</p>
          {strongest.cap ? (
            <>
              <p className="text-sm font-bold text-gray-900">{strongest.cap.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{strongest.cap.evidence_sources?.[0] || "Evidence exists"}</p>
            </>
          ) : (
            <p className="text-xs text-gray-400">No strong evidence found</p>
          )}
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Weakest Evidence Area</p>
          {weakest.cap ? (
            <>
              <p className="text-sm font-bold text-gray-900">{weakest.cap.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{weakest.cap.blockers?.[0] || "No blockers listed"}</p>
            </>
          ) : (
            <p className="text-xs text-gray-400">No weak areas detected</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 flex items-start gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-0.5">Recommended Next Internal Action</p>
          <p className="text-xs text-blue-700 font-medium">{nextAction}</p>
        </div>
      </div>
    </div>
  );
}