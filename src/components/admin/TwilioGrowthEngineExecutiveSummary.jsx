import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, ArrowRight } from "lucide-react";

export default function TwilioGrowthEngineExecutiveSummary({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const green = caps.filter(c => c.status === "green");
  const yellow = caps.filter(c => c.status === "yellow");
  const red = caps.filter(c => c.status === "red");
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const proofEmpty = data.proof_logs_empty;

  // Biggest blocker: prioritize 404/405 webhook, then missing proof, then most common blocker
  let biggestBlocker = null;
  if (missed.has_404 || missed.has_405) {
    biggestBlocker = `Twilio missed-call webhook returning ${missed.has_404 ? "404" : "405"} — no missed-call recovery can work until repaired.`;
  } else if (proofEmpty) {
    biggestBlocker = "AutomationProofLog is empty — no capability has formal proof evidence.";
  } else if (delivery.without_provider_message_id > 0) {
    biggestBlocker = `${delivery.without_provider_message_id} SMS logs missing provider_message_id — delivery cannot be verified.`;
  } else if (!voice.has_elevenlabs_agent_ids) {
    biggestBlocker = "ElevenLabs agent IDs not configured — AI voice receptionist cannot function.";
  } else {
    const allBlockers = caps.flatMap(c => (c.blockers || []).map(b => ({ cap: c.label, blocker: b })));
    if (allBlockers.length > 0) {
      biggestBlocker = `${allBlockers[0].cap}: ${allBlockers[0].blocker}`;
    }
  }

  // Next best action: first red/yellow capability's next_action
  let nextAction = null;
  const firstNonGreen = yellow[0] || red[0];
  if (firstNonGreen) {
    nextAction = firstNonGreen.next_action || "Review all capabilities and create proof records.";
  } else if (green.length === caps.length) {
    nextAction = "All capabilities proven. Maintain proof records and monitor for regressions.";
  }

  const sections = [
    {
      label: "Working / Proven",
      count: green.length,
      items: green.map(c => c.label),
      icon: CheckCircle2,
      color: "#059669",
      bg: "rgba(5,150,105,0.05)",
      border: "rgba(5,150,105,0.15)",
      empty: "No capabilities are proven yet.",
    },
    {
      label: "Partially Built",
      count: yellow.length,
      items: yellow.map(c => c.label),
      icon: AlertTriangle,
      color: "#D97706",
      bg: "rgba(217,119,6,0.05)",
      border: "rgba(217,119,6,0.15)",
      empty: "No partial capabilities.",
    },
    {
      label: "Not Ready",
      count: red.length,
      items: red.map(c => c.label),
      icon: XCircle,
      color: "#DC2626",
      bg: "rgba(220,38,38,0.04)",
      border: "rgba(220,38,38,0.12)",
      empty: "No blocked capabilities.",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900">Executive Summary — Admin Only</h3>
      </div>

      {/* Status sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <p className="text-xs font-bold text-gray-900">{s.label}</p>
                <span className="ml-auto text-lg font-bold" style={{ color: s.color }}>{s.count}</span>
              </div>
              {s.items.length > 0 ? (
                <ul className="space-y-0.5">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-[11px] text-gray-600 truncate">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-gray-400 italic">{s.empty}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Biggest blocker + next action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">Biggest Blocker</p>
          <p className="text-xs text-gray-700 leading-relaxed">
            {biggestBlocker || "No active blockers detected."}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500 mb-1">Next Best Action</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {nextAction || "Review all capabilities."}
            </p>
          </div>
        </div>
      </div>

      {/* Proof summary line */}
      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        {proofEmpty
          ? "⚠ No AutomationProofLog records exist — nothing is formally proven. Do not claim any capability as working."
          : `${green.length} of ${caps.length} capabilities have passed proof. ${yellow.length} partial, ${red.length} not ready.`}
      </p>
    </div>
  );
}