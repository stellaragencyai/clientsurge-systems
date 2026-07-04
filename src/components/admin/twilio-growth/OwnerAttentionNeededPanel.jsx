import { UserCog, AlertTriangle } from "lucide-react";

const HUMAN_DECISION_KEYWORDS = [
  "owner decision",
  "business decision",
  "confirm",
  "approve",
  "decide",
  "choose",
  "select",
  "whether to",
  "should we",
  "policy",
  "priority",
  "budget",
  "timeline",
  "scope",
  "client",
  "legal",
  "compliance",
];

function isHumanDecision(nextAction) {
  if (!nextAction) return false;
  const lower = nextAction.toLowerCase();
  return HUMAN_DECISION_KEYWORDS.some((kw) => lower.includes(kw));
}

const SAFE_DEFAULTS = {
  instant_lead_response: "Keep status untrusted until a delivered SMS proof log exists.",
  missed_call_text_back: "Keep blocked until webhook returns 200 and a recovery SMS is logged.",
  ai_voice_receptionist: "Keep disabled until ElevenLabs agent IDs are configured and a transcript is captured.",
  nurture_sequence_14d: "Keep untrusted until sequence enrollment and step proofs exist.",
  review_request: "Keep untrusted until a review link is set and an outbound event is logged.",
  lead_reactivation: "Keep blocked until a reactivation workflow event is logged.",
  inbound_sms_assistant: "Keep untrusted until an inbound SMS classification record exists.",
  automation_proof_logs: "Keep all capabilities untrusted until proof logs are created.",
};

export default function OwnerAttentionNeededPanel({ data }) {
  const caps = data?.capabilities || [];
  const items = caps
    .filter((c) => isHumanDecision(c.next_action))
    .map((c) => ({
      key: c.key,
      label: c.label,
      decision: c.next_action,
      safeDefault: SAFE_DEFAULTS[c.key] || "Keep current status until evidence is confirmed by an admin.",
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-bold text-gray-900">Owner Attention Needed — Admin Only</h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{
            color: items.length > 0 ? "#7C3AED" : "#6B7280",
            background: items.length > 0 ? "rgba(124,58,237,0.08)" : "rgba(107,114,128,0.08)",
            border: `1px solid ${items.length > 0 ? "rgba(124,58,237,0.25)" : "rgba(107,114,128,0.2)"}`,
          }}
        >
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Items where the next action requires a human or business decision rather than code or configuration.
      </p>

      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-gray-300" />
          <p className="text-xs text-gray-400">No items currently require owner attention.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-sm font-semibold text-gray-900 mb-1">{item.label}</p>
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-500">Decision Needed</span>
                  <p className="text-xs text-gray-600 mt-0.5">{item.decision}</p>
                </div>
                <div className="pt-1.5 border-t border-gray-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Safe Default</span>
                  <p className="text-xs text-gray-500 mt-0.5">{item.safeDefault}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}