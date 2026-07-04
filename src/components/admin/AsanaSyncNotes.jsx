import { CheckCircle2, XCircle } from "lucide-react";

const STATUS_MAP = {
  green: { label: "Complete", color: "#059669" },
  yellow: { label: "Partial", color: "#D97706" },
  red: { label: "Missing", color: "#DC2626" },
};

export default function AsanaSyncNotes({ data }) {
  const caps = data?.capabilities || [];
  const findCap = (key) => caps.find(c => c.key === key);

  const workstreams = [
    {
      name: "Audit & Truth Mapping",
      caps: [findCap("automation_proof_logs")],
      evidence: "Capability status, evidence source, blocker, and next action shown in the audit matrix.",
      needsProof: "All capabilities must have at least one passed proof log.",
    },
    {
      name: "AI Receptionist / Voice Agent",
      caps: [findCap("ai_voice_receptionist")],
      evidence: "ElevenLabs agent IDs, inbound voice flag, transcript proof.",
      needsProof: "Real call transcript and a passed AutomationProofLog.",
    },
    {
      name: "Missed Call Recovery",
      caps: [findCap("missed_call_text_back")],
      evidence: "Webhook health, missed-call SMS attempt logs.",
      needsProof: "Clean webhook (no 404/405) and a delivered recovery SMS tied to a real lead.",
    },
    {
      name: "Speed-to-Lead & Follow-Up",
      caps: [findCap("instant_lead_response"), findCap("nurture_sequence_14d")],
      evidence: "Delivered SMS with provider_message_id, sequence enrollment records.",
      needsProof: "Real eligible lead with first-response delivery proof and sequence readiness.",
    },
    {
      name: "Review, Referral & Client Communication",
      caps: [findCap("review_request"), findCap("lead_reactivation"), findCap("inbound_sms_assistant")],
      evidence: "Review/referral configuration and outbound communication evidence.",
      needsProof: "Real workflow evidence — not just a schema/service key.",
    },
    {
      name: "Compliance, Reliability & QA",
      caps: [findCap("automation_proof_logs")],
      evidence: "Test data exclusion rules, provider error surfacing, weak-proof detection.",
      needsProof: "Internal records excluded, provider errors resolved, incomplete proof stays blocked.",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Asana Sync Notes — Admin Only</h3>
      <p className="text-xs text-gray-400 mb-4">
        Implementation workstreams mapped to app evidence. Do not mark an Asana task complete unless the app proves it.
      </p>
      <div className="space-y-3">
        {workstreams.map((ws, i) => {
          const validCaps = ws.caps.filter(Boolean);
          const allGreen = validCaps.length > 0 && validCaps.every(c => c.status === "green");
          const anyYellow = validCaps.some(c => c.status === "yellow");
          const status = allGreen ? "green" : anyYellow ? "yellow" : "red";
          const style = STATUS_MAP[status];
          return (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900">{ws.name}</p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
                  style={{ color: style.color, background: `${style.color}11`, border: `1px solid ${style.color}30` }}
                >
                  {style.label}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-600"><span className="font-semibold text-gray-400">Evidence exists: </span>{ws.evidence}</p>
                <p className="text-gray-600"><span className="font-semibold text-gray-400">Still needs proof: </span>{ws.needsProof}</p>
                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100">
                  <span className="font-semibold text-gray-400">Asana task complete?</span>
                  {allGreen ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-3 h-3" /> Yes</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><XCircle className="w-3 h-3" /> No</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}