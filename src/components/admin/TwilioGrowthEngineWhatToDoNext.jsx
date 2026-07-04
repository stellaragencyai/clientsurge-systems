import { ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";

const PRIORITY_ORDER = [
  { id: "proof_records", check: (d) => d.proof_logs_empty || Object.values(d.proof_by_service || {}).every(p => p.passed === 0) },
  { id: "provider_errors", check: (d) => (d.event_stats?.twilio_400_errors > 0) || (d.missed_call_stats?.has_404) || (d.missed_call_stats?.has_405) },
  { id: "voice_prereqs", check: (d) => { const vr = d.voice_readiness || {}; return vr.blockers && vr.blockers.length > 0; } },
  { id: "test_data", check: (d) => (d.quarantine?.excluded_leads_count || 0) > 0 },
  { id: "review_referral", check: (d) => { const p = d.proof_by_service || {}; return (p.review_request?.total === 0 || p.lead_reactivation?.total === 0); } },
];

const ACTION_MAP = {
  proof_records: {
    title: "Create proof evidence before enabling trust labels",
    detail: "AutomationProofLog has no passed records. No capability can be marked trusted until proof logs exist for instant_lead_response and missed_call_text_back at minimum.",
    category: "Proof Records Missing",
  },
  provider_errors: {
    title: "Review provider error logs before expanding automations",
    detail: "Twilio 400 errors or webhook 404/405 responses are present. Fix these before adding new automation flows — broken routes will silently fail.",
    category: "Provider Errors Exist",
  },
  voice_prereqs: {
    title: "Complete voice prerequisites before activating voice workflows",
    detail: "ElevenLabs agent IDs, phone number IDs, or transcript proof are missing. Do not enable inbound_voice_enabled until a real call test produces a transcript.",
    category: "Voice Prerequisites Missing",
  },
  test_data: {
    title: "Fix data exclusions before trusting metrics",
    detail: "Internal/test records are present in the production database. While excluded from metrics, they should be reviewed and confirmed quarantined.",
    category: "Internal Records in Production View",
  },
  review_referral: {
    title: "Leave review/referral rows missing until a real workflow exists",
    detail: "Review request and lead reactivation have no evidence records. Do not mark these as active until a real workflow with logged evidence exists.",
    category: "Review/Referral Lacks Evidence",
  },
};

export default function TwilioGrowthEngineWhatToDoNext({ data }) {
  if (!data) return null;

  // Find the first (highest priority) issue that matches
  const matched = PRIORITY_ORDER.find(p => {
    try { return p.check(data); } catch { return false; }
  });

  // If nothing matches, show "all clear" message
  if (!matched) {
    return (
      <div className="bg-white rounded-xl border border-green-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-bold text-gray-900">What To Do Next</h3>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">No critical blockers detected</p>
          <p className="text-xs text-green-600 mt-1">All readiness categories have at least partial evidence. Continue maintaining proof records and monitoring for new issues.</p>
        </div>
      </div>
    );
  }

  const action = ACTION_MAP[matched.id];

  // Gather supporting context
  const context = [];
  if (matched.id === "proof_records") {
    const pbs = data.proof_by_service || {};
    const missing = Object.entries(pbs).filter(([, p]) => p.passed === 0).map(([k]) => k);
    context.push(`Services with 0 passed proof logs: ${missing.join(", ") || "none"}`);
    context.push(`Proof logs empty: ${data.proof_logs_empty ? "Yes" : "No"}`);
  }
  if (matched.id === "provider_errors") {
    const es = data.event_stats || {};
    const mc = data.missed_call_stats || {};
    if (es.twilio_400_errors > 0) context.push(`${es.twilio_400_errors} Twilio 400 errors in CommunicationEvent`);
    if (mc.has_404) context.push("Missed-call webhook returning 404");
    if (mc.has_405) context.push("Missed-call webhook returning 405");
  }
  if (matched.id === "voice_prereqs") {
    const vr = data.voice_readiness || {};
    context.push(...(vr.blockers || []));
  }
  if (matched.id === "test_data") {
    context.push(`${data.quarantine?.excluded_leads_count || 0} test/internal records excluded from metrics`);
  }
  if (matched.id === "review_referral") {
    const pbs = data.proof_by_service || {};
    context.push(`Review request proof logs: ${pbs.review_request?.total || 0}`);
    context.push(`Lead reactivation proof logs: ${pbs.lead_reactivation?.total || 0}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-bold text-gray-900">What To Do Next</h3>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide ml-auto">Admin Only</span>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-0.5">{action.category}</p>
            <p className="text-sm font-bold text-gray-900">{action.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{action.detail}</p>
          </div>
        </div>
      </div>

      {context.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Supporting Context from App Data</p>
          <ul className="space-y-1">
            {context.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-300 mt-0.5">•</span>
                <span className="font-mono break-all">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3 italic">This is the highest-priority issue based on the lowest-scoring readiness category. Resolve it before moving to lower-priority items.</p>
    </div>
  );
}