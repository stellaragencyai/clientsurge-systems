import { ArrowRight, Lightbulb } from "lucide-react";

function computeReadinessScores(data) {
  const caps = data.capabilities || [];
  const pbs = data.proof_by_service || {};
  const ds = data.delivery_stats || {};
  const es = data.event_stats || {};
  const vr = data.voice_readiness || {};
  const mc = data.missed_call_stats || {};
  const q = data.quarantine || {};

  const categories = [];

  // 1. Proof records
  const totalProofs = Object.values(pbs).reduce((s, p) => s + (p.total || 0), 0);
  const passedProofs = Object.values(pbs).reduce((s, p) => s + (p.passed || 0), 0);
  const proofScore = passedProofs > 0 ? 100 : totalProofs > 0 ? 40 : 0;
  categories.push({
    name: "Proof Records",
    score: proofScore,
    detail: `${passedProofs} passed / ${totalProofs} total`,
    action: "Create proof evidence before enabling trust labels.",
    condition: passedProofs === 0,
  });

  // 2. Provider errors
  const hasErrors = es.twilio_400_errors > 0 || ds.failed > 0 || es.failed_events > 0;
  const providerScore = hasErrors ? 20 : (es.total > 0 ? 100 : 0);
  categories.push({
    name: "Provider Errors",
    score: providerScore,
    detail: `${es.twilio_400_errors} Twilio 400s, ${ds.failed} failed SMS, ${es.failed_events} failed events`,
    action: "Review provider error logs before expanding automations.",
    condition: hasErrors,
  });

  // 3. Voice prerequisites
  const voiceChecks = [vr.has_elevenlabs_agent_ids, vr.has_elevenlabs_phone_number_ids, vr.has_transcript_proof, vr.inbound_voice_enabled];
  const voiceScore = Math.round((voiceChecks.filter(Boolean).length / 4) * 100);
  categories.push({
    name: "Voice Prerequisites",
    score: voiceScore,
    detail: `${voiceChecks.filter(Boolean).length}/4 prerequisites met`,
    action: "Complete prerequisites before activating voice workflows.",
    condition: voiceScore < 100,
  });

  // 4. Test data exclusion
  const hasTestData = (q.excluded_leads_count || 0) > 0;
  const testDataScore = hasTestData ? 30 : 100;
  categories.push({
    name: "Data Cleanliness",
    score: testDataScore,
    detail: `${q.excluded_leads_count || 0} test records in production view`,
    action: "Fix exclusions before trusting metrics.",
    condition: hasTestData,
  });

  // 5. Review/referral
  const reviewProof = pbs["review_request"]?.passed > 0;
  const referralProof = pbs["lead_reactivation"]?.passed > 0;
  const reviewScore = (reviewProof && referralProof) ? 100 : (reviewProof || referralProof) ? 50 : 0;
  categories.push({
    name: "Review/Referral Evidence",
    score: reviewScore,
    detail: `Review: ${reviewProof ? "proven" : "missing"}, Referral: ${referralProof ? "proven" : "missing"}`,
    action: "Leave those rows missing until a real workflow exists.",
    condition: !reviewProof && !referralProof,
  });

  return categories;
}

export default function WhatToDoNext({ data }) {
  if (!data) return null;
  const categories = computeReadinessScores(data);
  const lowest = [...categories].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900">What To Do Next</h3>
        <span className="text-[11px] text-gray-400 ml-1">Based on lowest-scoring readiness category</span>
      </div>

      {/* Next action highlight */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
        <ArrowRight className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-0.5">Next Best Internal Action</p>
          <p className="text-sm font-bold text-amber-800">{lowest.action}</p>
          <p className="text-xs text-amber-600 mt-1">
            Lowest category: <span className="font-semibold">{lowest.name}</span> ({lowest.score}%) — {lowest.detail}
          </p>
        </div>
      </div>

      {/* All categories */}
      <div className="space-y-2">
        {categories.sort((a, b) => a.score - b.score).map((cat, i) => {
          const color = cat.score === 100 ? "#059669" : cat.score >= 50 ? "#D97706" : "#DC2626";
          return (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">{cat.name}</p>
                <p className="text-[11px] text-gray-400">{cat.detail}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: color }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color }}>{cat.score}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}