import { UserCheck, AlertTriangle } from "lucide-react";

/**
 * Admin-only "Owner Attention Needed" count.
 * Counts items where the next action requires a human/business decision
 * rather than code/config. Each shows title, decision needed, safe default.
 */
function deriveAttentionItems(data) {
  const items = [];
  const caps = data?.capabilities || [];
  const voiceReadiness = data?.voice_readiness || {};
  const missedCallStats = data?.missed_call_stats || {};
  const deliveryStats = data?.delivery_stats || {};

  // Capability-level: any red capability whose next_action is a business decision
  caps.forEach((c) => {
    if (c.status === "red" && c.next_action) {
      const na = c.next_action.toLowerCase();
      const isHuman = na.includes("approve") || na.includes("decide") || na.includes("confirm") || na.includes("connect") || na.includes("configure") || na.includes("provide") || na.includes("choose") || na.includes("select");
      if (isHuman) {
        items.push({
          title: c.label,
          decision: c.next_action,
          safeDefault: "Keep capability untrusted until the decision is made and proof exists.",
        });
      }
    }
  });

  // Voice: human must connect ElevenLabs agent IDs
  if (voiceReadiness && !voiceReadiness.has_elevenlabs_agent_ids) {
    items.push({
      title: "AI Voice Receptionist — ElevenLabs Agent IDs",
      decision: "Owner must create and connect ElevenLabs agent + phone number IDs for the target industry vertical.",
      safeDefault: "Keep inbound_voice_enabled = false. Do not claim voice receptionist as active.",
    });
  }

  // Missed-call: human must repair webhook URL in Twilio console
  if (missedCallStats.has_404 || missedCallStats.has_405) {
    items.push({
      title: "Missed-Call Webhook Route",
      decision: "Owner must paste the correct webhook URL into Twilio Console for the missed-call/voice fallback.",
      safeDefault: "Keep missed_call_text_back untrusted. Surface route error on dashboard.",
    });
  }

  // Delivery: weak provider IDs — owner must inspect Twilio credentials/sender permissions
  if (deliveryStats.without_provider_message_id > 0) {
    items.push({
      title: "Weak SMS Delivery Proof",
      decision: "Owner must inspect Twilio credentials, sender permissions, and request payloads for null provider IDs.",
      safeDefault: "Do not mark instant_lead_response as proven until provider message IDs are captured.",
    });
  }

  return items;
}

export default function OwnerAttentionNeeded({ data }) {
  const items = deriveAttentionItems(data);
  const count = items.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900">Owner Attention Needed — Admin Only</h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{
            color: count > 0 ? "#D97706" : "#059669",
            background: count > 0 ? "rgba(217,119,6,0.1)" : "rgba(5,150,105,0.1)",
            border: `1px solid ${count > 0 ? "rgba(217,119,6,0.25)" : "rgba(5,150,105,0.25)"}`,
          }}
        >
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Items where the next action requires a human or business decision — not just code or config.</p>

      {count === 0 ? (
        <p className="text-xs text-green-600 font-semibold">No owner-decision items pending.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
              <div className="flex items-start gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-gray-900">{it.title}</p>
              </div>
              <div className="ml-5 space-y-1">
                <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Decision needed:</span> {it.decision}</p>
                <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Safe default:</span> {it.safeDefault}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}