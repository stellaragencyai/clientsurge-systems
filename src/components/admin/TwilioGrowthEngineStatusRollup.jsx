import {
  CheckCircle2, AlertTriangle, XCircle, ShieldAlert, ArrowRight, Trophy, AlertOctagon,
} from "lucide-react";

const STATUS_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.06)", label: "Complete" },
  yellow: { color: "#D97706", bg: "rgba(217,119,6,0.06)", label: "Partial" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", label: "Missing" },
};

export default function TwilioGrowthEngineStatusRollup({ data }) {
  if (!data) return null;

  const capabilities = data.capabilities || [];
  const proofByService = data.proof_by_service || {};
  const deliveryStats = data.delivery_stats || {};
  const eventStats = data.event_stats || {};
  const voiceReadiness = data.voice_readiness || {};
  const missedCallStats = data.missed_call_stats || {};

  const total = capabilities.length;
  const complete = capabilities.filter(c => c.status === "green").length;
  const partial = capabilities.filter(c => c.status === "yellow").length;
  const missing = capabilities.filter(c => c.status === "red").length;
  const overallPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

  // Critical blockers: count from capabilities with red status that have blockers
  let criticalBlockers = 0;
  const blockerReasons = [];
  for (const cap of capabilities) {
    if (cap.status === "red" && cap.blockers?.length > 0) {
      criticalBlockers += cap.blockers.length;
      for (const b of cap.blockers) {
        if (!blockerReasons.includes(b)) blockerReasons.push(b);
      }
    }
  }
  // Also count provider errors as critical blockers
  if (eventStats.twilio_400_errors > 0) criticalBlockers++;
  if (missedCallStats.has_404 || missedCallStats.has_405) criticalBlockers++;
  if (data.proof_logs_empty) criticalBlockers++;

  // Strongest evidence: find the capability with the most passed proof logs
  let strongestCap = null;
  let strongestProofCount = 0;
  for (const [sk, proof] of Object.entries(proofByService)) {
    if (proof.passed > strongestProofCount) {
      strongestProofCount = proof.passed;
      const cap = capabilities.find(c => c.service_key === sk);
      strongestCap = cap ? cap.label : sk;
    }
  }
  // If no proof logs passed, check delivery stats as alternative evidence
  let strongestEvidenceText = "No proof records passed yet";
  if (strongestCap && strongestProofCount > 0) {
    strongestEvidenceText = `${strongestCap} — ${strongestProofCount} passed AutomationProofLog record(s)`;
  } else if (deliveryStats.delivered > 0) {
    strongestEvidenceText = `${deliveryStats.delivered} delivered SMS in CommunicationLog (medium evidence, no formal proof log)`;
  } else if (deliveryStats.with_provider_message_id > 0) {
    strongestEvidenceText = `${deliveryStats.with_provider_message_id} SMS logs with provider_message_id (medium evidence)`;
  }

  // Weakest evidence area: find the capability with the lowest proof coverage
  let weakestCap = null;
  let weakestScore = Infinity;
  for (const cap of capabilities) {
    const proof = cap.proof || { total: 0, passed: 0 };
    const score = proof.total === 0 ? 0 : proof.passed / proof.total;
    if (score < weakestScore) {
      weakestScore = score;
      weakestCap = cap.label;
    }
  }
  const weakestEvidenceText = weakestCap
    ? `${weakestCap} — ${weakestScore === 0 ? "0 proof records" : "no passed proof records"}`
    : "Unable to determine";

  // Recommended next internal action — based on lowest-scoring area
  let nextAction = "Maintain current proof records and monitoring.";
  let nextActionReason = "";

  if (data.proof_logs_empty) {
    nextAction = "Create AutomationProofLog pass records for instant_lead_response and missed_call_text_back.";
    nextActionReason = "AutomationProofLog is empty — no capability can be trusted without proof.";
  } else if (missedCallStats.has_404 || missedCallStats.has_405) {
    nextAction = `Repair missed-call webhook returning ${missedCallStats.has_404 ? "404" : "405"} in Twilio console.`;
    nextActionReason = "Missed-call recovery route is broken — Twilio cannot reach the function.";
  } else if (eventStats.twilio_400_errors > 0) {
    nextAction = "Inspect Twilio 400 errors in CommunicationEvent and fix request payloads/sender permissions.";
    nextActionReason = `${eventStats.twilio_400_errors} provider error(s) present in logs.`;
  } else if (!voiceReadiness.has_elevenlabs_agent_ids && capabilities.find(c => c.key === "ai_voice_receptionist" && c.status !== "green")) {
    nextAction = "Configure ElevenLabs agent IDs and phone number IDs before enabling voice workflows.";
    nextActionReason = "Voice assistant prerequisites are missing.";
  } else if (deliveryStats.weak_proof_count > 0 || deliveryStats.without_provider_message_id > 0) {
    nextAction = "Resolve weak/null provider_message_id records in CommunicationLog before expanding automations.";
    nextActionReason = `${deliveryStats.weak_proof_count} weak-proof, ${deliveryStats.without_provider_message_id} without provider_message_id.`;
  } else if (data.quarantine?.excluded_leads_count > 0) {
    nextAction = "Review excluded test/internal records to ensure they stay quarantined from production KPIs.";
    nextActionReason = `${data.quarantine.excluded_leads_count} test/internal records in the sample.`;
  } else {
    const redCaps = capabilities.filter(c => c.status === "red" && c.key !== "automation_proof_logs");
    if (redCaps.length > 0) {
      nextAction = `Create real evidence for: ${redCaps.map(c => c.label).join(", ")}.`;
      nextActionReason = `${redCaps.length} capability(ies) have no usable evidence.`;
    }
  }

  const safeClaims = complete;
  const unsafeClaims = partial + missing;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Status Rollup
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Admin only — computed from live app data. No status is complete unless proven by evidence.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{overallPercent}%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{complete}/{total} proven</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
          <div style={{ width: `${(complete / total) * 100}%`, background: "#059669" }} />
          <div style={{ width: `${(partial / total) * 100}%`, background: "#D97706" }} />
          <div style={{ width: `${(missing / total) * 100}%`, background: "#DC2626" }} />
        </div>
      </div>

      {/* Stat grid */}
      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <RollupStat label="Total Capabilities" value={total} color="#111827" />
        <RollupStat label="Complete" value={complete} color="#059669" icon={CheckCircle2} />
        <RollupStat label="Partial" value={partial} color="#D97706" icon={AlertTriangle} />
        <RollupStat label="Missing" value={missing} color="#DC2626" icon={XCircle} />
        <RollupStat label="Critical Blockers" value={criticalBlockers} color="#DC2626" icon={AlertOctagon} />
        <RollupStat label="Safe Public Claims" value={safeClaims} color="#059669" />
        <RollupStat label="Unsafe Claims" value={unsafeClaims} color="#DC2626" />
      </div>

      {/* Evidence summary */}
      <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-green-600" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">Strongest Evidence Found</p>
          </div>
          <p className="text-xs text-green-800 font-medium leading-relaxed">{strongestEvidenceText}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Weakest Evidence Area</p>
          </div>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">{weakestEvidenceText}</p>
        </div>
      </div>

      {/* Recommended next action */}
      <div className="px-5 pb-5">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-0.5">Recommended Next Internal Action</p>
            <p className="text-sm font-bold text-blue-900">{nextAction}</p>
            {nextActionReason && <p className="text-xs text-blue-700 mt-1">{nextActionReason}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RollupStat({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3 h-3" style={{ color }} />}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}