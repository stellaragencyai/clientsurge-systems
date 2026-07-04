import { CheckCircle2, XCircle, AlertTriangle, Rocket } from "lucide-react";

const STATUS_STYLES = {
  ready: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  blocked: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Blocked" },
};

function evaluateItem(key, data) {
  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const quarantine = data.quarantine || {};
  const proofEmpty = data.proof_logs_empty;

  const findCap = (k) => caps.find(c => c.key === k);

  switch (key) {
    case "speed_to_lead": {
      const cap = findCap("instant_lead_response");
      const hasDelivered = delivery.delivered > 0;
      const hasProviderId = delivery.with_provider_message_id > 0;
      const hasProof = cap?.proof?.passed > 0;
      if (hasProof && hasDelivered && hasProviderId) {
        return { status: "ready", blocker: null, nextAction: "Maintain speed-to-lead monitoring." };
      }
      const blockers = [];
      if (!hasProof) blockers.push("No AutomationProofLog pass for instant_lead_response");
      if (!hasDelivered) blockers.push("No delivered Twilio SMS proof");
      if (!hasProviderId) blockers.push("Missing provider_message_id on SMS logs");
      return {
        status: hasDelivered || cap?.status === "yellow" ? "partial" : "blocked",
        blocker: blockers.join("; "),
        nextAction: "Trigger a real lead and confirm delivered Twilio SMS with provider_message_id, then create a passing AutomationProofLog.",
      };
    }
    case "missed_call": {
      const cap = findCap("missed_call_text_back");
      const hasProof = cap?.proof?.passed > 0;
      const hasAttempts = missed.sms_attempts > 0;
      const hasSuccess = missed.successful_sends > 0;
      const webhookBlocked = missed.has_404 || missed.has_405;
      if (hasProof && hasAttempts && hasSuccess && !webhookBlocked) {
        return { status: "ready", blocker: null, nextAction: "Maintain missed-call webhook monitoring." };
      }
      const blockers = [];
      if (webhookBlocked) blockers.push(`Webhook returning ${missed.has_404 ? "404" : "405"}`);
      if (!hasProof) blockers.push("No AutomationProofLog pass for missed_call_text_back");
      if (!hasAttempts) blockers.push("No missed-call SMS attempts logged");
      return {
        status: hasAttempts || cap?.status === "yellow" ? "partial" : "blocked",
        blocker: blockers.join("; "),
        nextAction: "Repair webhook (if blocked), trigger a test missed call, and create a passing AutomationProofLog.",
      };
    }
    case "proof_logging": {
      const cap = findCap("automation_proof_logs");
      const hasPassed = cap?.proof?.passed > 0;
      const hasRecords = cap?.proof?.total > 0;
      if (hasPassed) {
        return { status: "ready", blocker: null, nextAction: "Continue maintaining proof logs for all automations." };
      }
      if (hasRecords) {
        return { status: "partial", blocker: "Proof logs exist but none passed", nextAction: "Review pending/failed proof logs and resolve blockers." };
      }
      return { status: "blocked", blocker: "AutomationProofLog is empty", nextAction: "Create AutomationProofLog records for instant_lead_response and missed_call_text_back." };
    }
    case "test_exclusion": {
      const hasRules = quarantine.rules && quarantine.rules.length > 0;
      const hasExcluded = quarantine.excluded_leads_count !== undefined;
      const hasWeakProof = delivery.weak_proof_count > 0;
      if (hasRules && hasExcluded && !hasWeakProof) {
        return { status: "ready", blocker: null, nextAction: "Maintain test data exclusion rules." };
      }
      const blockers = [];
      if (!hasRules) blockers.push("No exclusion rules configured");
      if (hasWeakProof) blockers.push(`${delivery.weak_proof_count} weak-proof records detected (provider_message_id=null + status=sent)`);
      return {
        status: hasRules ? "partial" : "blocked",
        blocker: blockers.join("; "),
        nextAction: "Configure exclusion rules and resolve weak-proof records so test data does not pollute production metrics.",
      };
    }
    case "repair_queue": {
      const repairItems = data.repair_items || [];
      const criticalCount = repairItems.filter(r => r.severity === "critical").length;
      if (criticalCount === 0 && repairItems.length === 0) {
        return { status: "ready", blocker: null, nextAction: "Keep repair queue clear of critical items." };
      }
      if (criticalCount === 0) {
        return { status: "partial", blocker: `${repairItems.length} non-critical repair items in queue`, nextAction: "Review and resolve remaining repair items." };
      }
      return { status: "blocked", blocker: `${criticalCount} critical repair items blocking launch`, nextAction: "Resolve all critical-severity repair items before launch." };
    }
    default:
      return { status: "blocked", blocker: "Unknown checklist item", nextAction: "Define evaluation criteria." };
  }
}

const CHECKLIST_ITEMS = [
  { key: "speed_to_lead", label: "Website Speed-to-Lead Readiness", evidence: "Delivered Twilio SMS with provider_message_id on a real (non-test) lead + AutomationProofLog pass for instant_lead_response." },
  { key: "missed_call", label: "Missed Call Recovery Readiness", evidence: "Webhook returning 200 (no 404/405) + missed-call SMS attempt logged + AutomationProofLog pass for missed_call_text_back." },
  { key: "proof_logging", label: "Evidence / Proof Logging Readiness", evidence: "At least one AutomationProofLog record with status=pass exists in the system." },
  { key: "test_exclusion", label: "Internal / Test Record Exclusion Readiness", evidence: "Exclusion rules configured + no weak-proof records (provider_message_id=null + status=sent) in production metrics." },
  { key: "repair_queue", label: "Repair Queue Visibility", evidence: "Zero critical-severity repair items in the Repair Queue." },
];

export default function FirstLaunchChecklist({ data }) {
  if (!data) return null;

  const evaluated = CHECKLIST_ITEMS.map(item => {
    const result = evaluateItem(item.key, data);
    return { ...item, ...result };
  });

  const canLaunch = evaluated.every(e => e.status === "ready");
  const blockedCount = evaluated.filter(e => e.status === "blocked").length;
  const partialCount = evaluated.filter(e => e.status === "partial").length;

  return (
    <div className="space-y-4">
      {/* Launch verdict */}
      <div
        className="rounded-xl p-5 flex items-start gap-3"
        style={{
          background: canLaunch
            ? "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))"
            : "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))",
          border: `1px solid ${canLaunch ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: canLaunch ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
            border: `1px solid ${canLaunch ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)"}`,
          }}
        >
          <Rocket className="w-5 h-5" style={{ color: canLaunch ? "#059669" : "#DC2626" }} />
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: canLaunch ? "#059669" : "#DC2626" }}>
            {canLaunch ? "First Launch Scope: GO" : "First Launch Scope: NO-GO"}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {canLaunch
              ? "All first launch scope items are ready. This does not mean all capabilities are trusted — only that the minimum launch scope is met."
              : `${blockedCount} blocked, ${partialCount} partial. Resolve all blocked items before launching.`}
          </p>
        </div>
      </div>

      {/* Checklist items */}
      {evaluated.map(item => {
        const style = STATUS_STYLES[item.status] || STATUS_STYLES.blocked;
        const Icon = style.icon;
        const canLaunchItem = item.status === "ready";
        return (
          <div key={item.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
                >
                  {style.label}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color: canLaunchItem ? "#059669" : "#DC2626",
                    background: canLaunchItem ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.05)",
                    border: `1px solid ${canLaunchItem ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.18)"}`,
                  }}
                >
                  {canLaunchItem ? "Can Launch" : "Cannot Launch"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Required Evidence</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.evidence}</p>
              </div>

              {item.blocker && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Blocker</p>
                  <p className="text-xs text-red-600 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{item.blocker}</span>
                  </p>
                </div>
              )}

              {item.nextAction && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Action</p>
                  <p className="text-xs text-gray-600">{item.nextAction}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}