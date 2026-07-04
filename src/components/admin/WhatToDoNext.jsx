import { AlertTriangle, ArrowRight } from "lucide-react";

export default function WhatToDoNext({ data }) {
  const caps = data?.capabilities || [];
  const ds = data?.delivery_stats || {};
  const es = data?.event_stats || {};
  const vr = data?.voice_readiness || {};
  const mc = data?.missed_call_stats || {};
  const q = data?.quarantine || {};

  const suggestions = [];

  // Priority 1: Missed-call webhook broken
  if (mc.has_404 || mc.has_405) {
    suggestions.push({
      priority: 1,
      action: `Repair missed-call webhook — it is returning ${mc.has_404 ? "404" : "405"}.`,
      reason: "Twilio cannot reach the missed-call handler, so the entire missed-call recovery flow is broken.",
    });
  }

  // Priority 1: No proof records
  const proofCap = caps.find(c => c.key === "automation_proof_logs");
  if (data?.proof_logs_empty || proofCap?.status === "red") {
    suggestions.push({
      priority: 1,
      action: "Create AutomationProofLog pass records for instant_lead_response and missed_call_text_back before enabling trust labels.",
      reason: "No proof records exist — no capability can be marked complete.",
    });
  } else if (proofCap?.status === "yellow") {
    suggestions.push({
      priority: 1,
      action: "Resolve pending/failed proof logs before trusting any capability.",
      reason: "Proof logs exist but none have passed.",
    });
  }

  // Priority 2: Provider errors
  if ((es.twilio_400_errors || 0) > 0) {
    suggestions.push({
      priority: 2,
      action: `Review ${es.twilio_400_errors} Twilio 400 error(s) in CommunicationEvent before expanding automations.`,
      reason: "Provider errors indicate configuration or payload issues that will affect new automations.",
    });
  }
  if ((ds.failed || 0) > 0) {
    suggestions.push({
      priority: 2,
      action: `Review ${ds.failed} failed SMS delivery record(s) before expanding automations.`,
      reason: "Failed deliveries indicate provider or recipient issues.",
    });
  }

  // Priority 3: Voice prerequisites
  if (!vr.has_elevenlabs_agent_ids || !vr.inbound_voice_enabled) {
    suggestions.push({
      priority: 3,
      action: "Complete voice prerequisites (ElevenLabs agent IDs, phone IDs) before activating voice workflows.",
      reason: "Voice capabilities cannot function without agent and phone number configuration.",
    });
  }
  if (!vr.has_transcript_proof) {
    suggestions.push({
      priority: 3,
      action: "Run a real inbound call test to generate transcript proof before claiming voice readiness.",
      reason: "No transcript evidence exists for voice agent capabilities.",
    });
  }

  // Priority 4: Test data contamination
  if ((q.excluded_leads_count || 0) > 0) {
    suggestions.push({
      priority: 4,
      action: `Fix data exclusions — ${q.excluded_leads_count} test/internal record(s) are present in the sample.`,
      reason: "Internal records in production views will inflate metrics and break trust.",
    });
  }
  if ((ds.weak_proof_count || 0) > 0) {
    suggestions.push({
      priority: 4,
      action: `Resolve ${ds.weak_proof_count} weak-proof SMS log(s) — these have no provider_message_id.`,
      reason: "Weak proof records do not confirm delivery and should not count as production evidence.",
    });
  }

  // Priority 5: Review/referral
  const reviewCap = caps.find(c => c.key === "review_request");
  const referralCap = caps.find(c => c.key === "lead_reactivation");
  if (reviewCap?.status === "red" || referralCap?.status === "red") {
    suggestions.push({
      priority: 5,
      action: "Leave review/referral rows as missing until a real workflow with evidence exists.",
      reason: "No evidence record exists for these workflows — do not mark them as active.",
    });
  }

  suggestions.sort((a, b) => a.priority - b.priority);

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-green-600" />
        <p className="text-xs text-green-700 font-semibold">No immediate blockers detected. Continue maintaining proof records.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-1">What To Do Next — Admin Only</h3>
      <p className="text-xs text-gray-400 mb-4">
        Next best internal action based on the lowest-scoring readiness category. This panel does not trigger any external system.
      </p>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex gap-3 items-start rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">{i + 1}</span>
            <div>
              <p className="text-xs font-semibold text-gray-900 flex items-start gap-1">
                <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                {s.action}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 ml-4">{s.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}