import { UserCog } from "lucide-react";

/**
 * Items where the next action requires a human/business decision
 * rather than code or config. Derived from current audit data.
 */
function buildOwnerItems(data) {
  const items = [];

  const caps = data?.capabilities || [];
  const ilr = caps.find(c => c.key === "instant_lead_response");
  if (ilr && ilr.status !== "green") {
    items.push({
      title: "Speed-to-Lead Go/No-Go",
      decision: "Decide whether to proceed with launch given current lead-response evidence.",
      safeDefault: "Hold — do not mark ready until delivery proof exists.",
    });
  }

  const mc = caps.find(c => c.key === "missed_call_text_back");
  if (mc && mc.status !== "green") {
    items.push({
      title: "Missed-Call Recovery Launch Decision",
      decision: "Decide whether missed-call text-back is trusted enough for production traffic.",
      safeDefault: "Keep blocked — treat as not-ready until webhook route is clean.",
    });
  }

  const voice = caps.find(c => c.key === "ai_voice_receptionist");
  if (voice && voice.status !== "green") {
    items.push({
      title: "AI Voice Receptionist Scope Decision",
      decision: "Decide whether voice is in-scope for first launch or deferred.",
      safeDefault: "Defer — block until transcript evidence exists.",
    });
  }

  if (data?.proof_logs_empty) {
    items.push({
      title: "Proof Logging Strategy",
      decision: "Decide which proof tests to run first and who owns recording them.",
      safeDefault: "Start with instant_lead_response and missed_call_text_back proof tests.",
    });
  }

  const reactivation = caps.find(c => c.key === "lead_reactivation");
  if (reactivation && reactivation.status !== "green") {
    items.push({
      title: "Lead Reactivation / Referral Scope",
      decision: "Decide whether reactivation is a first-launch feature or later-phase.",
      safeDefault: "Keep deferred — do not claim as active until evidence record exists.",
    });
  }

  return items;
}

export default function OwnerAttentionNeeded({ data }) {
  const items = buildOwnerItems(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <UserCog className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Owner Attention Needed</h3>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Admin Only</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{items.length}</span>
        <span className="text-xs text-gray-400">item{items.length === 1 ? "" : "s"} requiring a human/business decision</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-green-600 font-semibold">No owner-decision items — all remaining work is code/config.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-bold text-gray-900 mb-1">{item.title}</p>
              <div className="space-y-1">
                <p className="text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Decision: </span>
                  {item.decision}
                </p>
                <p className="text-[11px] text-amber-700">
                  <span className="font-semibold text-amber-400 uppercase tracking-wide text-[10px]">Safe Default: </span>
                  {item.safeDefault}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}