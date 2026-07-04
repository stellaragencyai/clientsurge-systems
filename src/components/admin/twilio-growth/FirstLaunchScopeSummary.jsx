import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Target, ListChecks } from "lucide-react";

/**
 * Private admin-only "First Launch Scope Summary" with five sections,
 * all derived from current audit data.
 */
export default function FirstLaunchScopeSummary({ data }) {
  const caps = data?.capabilities || [];
  const proofLogsEmpty = data?.proof_logs_empty;
  const deliveryStats = data?.delivery_stats || {};
  const missedCallStats = data?.missed_call_stats || {};
  const voiceReadiness = data?.voice_readiness || {};
  const quarantine = data?.quarantine || {};

  // --- Current readiness label ---
  const greenCaps = caps.filter((c) => c.status === "green");
  const redCaps = caps.filter((c) => c.status === "red");
  let readinessLabel;
  if (proofLogsEmpty || redCaps.length > 0) {
    readinessLabel = "Not Ready";
  } else if (greenCaps.length > 0 && greenCaps.length < caps.length) {
    readinessLabel = "Needs Review";
  } else if (greenCaps.length === caps.length && caps.length > 0) {
    readinessLabel = "Ready";
  } else {
    readinessLabel = "Not Ready";
  }

  // --- Supported by app data ---
  const supported = [];
  if ((deliveryStats.delivered || 0) > 0) supported.push("SMS delivery with delivery status tracking");
  if ((deliveryStats.with_provider_message_id || 0) > 0) supported.push("Provider message ID capture on outbound SMS");
  if ((missedCallStats.successful_sends || 0) > 0) supported.push("Missed-call text-back sends");
  if (!proofLogsEmpty) supported.push("AutomationProofLog records exist");
  if (voiceReadiness.has_elevenlabs_agent_ids) supported.push("ElevenLabs agent configuration");
  if (quarantine && quarantine.rules?.length > 0) supported.push("Internal/test record exclusion rules");
  caps.filter((c) => c.status === "green").forEach((c) => supported.push(`${c.label} — proven by evidence`));

  // --- Still missing ---
  const missing = [];
  if (proofLogsEmpty) missing.push("AutomationProofLog pass records for core capabilities");
  if (missedCallStats.has_404) missing.push("Missed-call webhook route (returning 404)");
  if (missedCallStats.has_405) missing.push("Missed-call webhook route (returning 405)");
  if ((deliveryStats.weak_proof_count || 0) > 0) missing.push("Weak proof records — clean up test/smoke data");
  if (!voiceReadiness.has_transcript_proof) missing.push("Voice transcript/summary evidence");
  if (!voiceReadiness.has_elevenlabs_agent_ids) missing.push("ElevenLabs agent + phone number IDs");
  caps.filter((c) => c.status === "red").forEach((c) => missing.push(`${c.label} — no usable evidence`));
  if (supported.length === 0) missing.push("No production evidence found at all");

  // --- Highest priority gap ---
  let highestGap = "No gaps detected";
  if (proofLogsEmpty) {
    highestGap = "No proof logs exist — cannot trust any automation";
  } else if (missedCallStats.has_404 || missedCallStats.has_405) {
    highestGap = "Missed-call webhook route is broken — recovery flow is unreliable";
  } else if ((deliveryStats.without_provider_message_id || 0) > 0) {
    highestGap = "Outbound SMS logs missing provider message IDs — delivery unverified";
  } else if (redCaps.length > 0) {
    highestGap = `${redCaps[0].label} has no usable evidence`;
  } else if (missing.length > 0) {
    highestGap = missing[0];
  }

  // --- Next internal action ---
  let nextAction;
  if (proofLogsEmpty) {
    nextAction = "Create AutomationProofLog pass records for instant_lead_response and missed_call_text_back.";
  } else if (missedCallStats.has_404 || missedCallStats.has_405) {
    nextAction = "Repair the missed-call webhook URL in Twilio console.";
  } else if ((deliveryStats.without_provider_message_id || 0) > 0) {
    nextAction = "Inspect SMS logs without provider message IDs — check credentials and sender permissions.";
  } else if (redCaps.length > 0) {
    nextAction = redCaps[0]?.next_action || `Address blocker for ${redCaps[0].label}.`;
  } else if (yellowCaps(caps).length > 0) {
    nextAction = "Complete partial evidence for yellow-status capabilities.";
  } else {
    nextAction = "Maintain proof records and monitor for regressions.";
  }

  const Section = ({ icon: Icon, title, items, color }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">None</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-300 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const labelColor = readinessLabel === "Ready" ? "#059669" : readinessLabel === "Needs Review" ? "#D97706" : "#DC2626";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900">First Launch Scope Summary — Admin Only</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Current Readiness Label</p>
          <span
            className="rounded-full px-3 py-1 text-sm font-bold"
            style={{ color: labelColor, background: `${labelColor}11`, border: `1px solid ${labelColor}30` }}
          >
            {readinessLabel}
          </span>
        </div>

        <Section
          icon={CheckCircle2}
          title="Supported by App Data"
          items={supported}
          color="#059669"
        />

        <Section
          icon={XCircle}
          title="Still Missing"
          items={missing}
          color="#DC2626"
        />

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Highest Priority Gap</p>
          </div>
          <p className="text-xs text-amber-700 font-medium leading-relaxed">{highestGap}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Next Internal Action</p>
          </div>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">{nextAction}</p>
        </div>
      </div>
    </div>
  );
}

function yellowCaps(caps) {
  return caps.filter((c) => c.status === "yellow");
}