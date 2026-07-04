import {
  CheckCircle2, AlertTriangle, XCircle, Rocket, FileText,
} from "lucide-react";
import { computePhase } from "@/lib/twilioGrowthEnginePhases";

const STATUS_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Ready" },
  yellow: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Blocked" },
};

function evaluateItem(itemId, data) {
  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const quarantine = data.quarantine || {};
  const proofLogsEmpty = data.proof_logs_empty;

  switch (itemId) {
    case "speed_to_lead": {
      const cap = caps.find(c => c.key === "instant_lead_response");
      const hasDelivered = (delivery.delivered || 0) > 0;
      const hasProviderId = (delivery.with_provider_message_id || 0) > 0;
      const proofPassed = cap?.proof?.passed > 0;
      const blockers = [];
      if (!hasDelivered) blockers.push("No delivered SMS proof in CommunicationLog");
      if (!hasProviderId) blockers.push("No provider_message_id on outbound SMS records");
      if (!proofPassed) blockers.push("No AutomationProofLog pass for instant_lead_response");
      const ready = hasDelivered && hasProviderId && proofPassed;
      const status = ready ? "green" : hasDelivered || hasProviderId ? "yellow" : "red";
      return {
        status,
        requiredEvidence: "Delivered SMS (delivery_status=delivered) tied to a real production lead, with valid provider_message_id and AutomationProofLog pass.",
        blockers,
        nextAction: ready
          ? "Maintain monitoring. Speed-to-lead is launch-ready."
          : "Trigger a real production lead and confirm delivered SMS with provider_message_id, then pass AutomationProofLog.",
        canLaunch: ready,
      };
    }
    case "missed_call": {
      const cap = caps.find(c => c.key === "missed_call_text_back");
      const has404 = missed.has_404;
      const has405 = missed.has_405;
      const smsAttempts = (missed.sms_attempts || 0) > 0;
      const successfulSends = (missed.successful_sends || 0) > 0;
      const proofPassed = cap?.proof?.passed > 0;
      const blockers = [];
      if (has404) blockers.push("Webhook returning 404");
      if (has405) blockers.push("Webhook returning 405");
      if (!smsAttempts) blockers.push("No missed-call SMS attempts logged");
      if (!successfulSends) blockers.push("No successful missed-call SMS sends");
      if (!proofPassed) blockers.push("No AutomationProofLog pass for missed_call_text_back");
      const ready = !has404 && !has405 && smsAttempts && successfulSends && proofPassed;
      const status = ready ? "green" : smsAttempts || successfulSends ? "yellow" : "red";
      return {
        status,
        requiredEvidence: "Missed-call webhook returning 200, SMS attempt with successful delivery, and AutomationProofLog pass.",
        blockers,
        nextAction: ready
          ? "Maintain webhook monitoring. Missed-call recovery is launch-ready."
          : "Repair webhook 404/405 if present, trigger a test missed call, confirm SMS delivery, then pass AutomationProofLog.",
        canLaunch: ready,
      };
    }
    case "proof_logging": {
      const cap = caps.find(c => c.key === "automation_proof_logs");
      const totalProofs = cap?.proof?.total || 0;
      const passedProofs = cap?.proof?.passed || 0;
      const blockers = [];
      if (totalProofs === 0) blockers.push("AutomationProofLog is empty — no proof records exist");
      if (totalProofs > 0 && passedProofs === 0) blockers.push("Proof records exist but none passed");
      const ready = passedProofs > 0;
      const status = ready ? "green" : totalProofs > 0 ? "yellow" : "red";
      return {
        status,
        requiredEvidence: "At least one passed AutomationProofLog record for a first-launch service (instant_lead_response or missed_call_text_back).",
        blockers,
        nextAction: ready
          ? "Continue maintaining proof records for all first-launch services."
          : proofLogsEmpty
            ? "Create and pass AutomationProofLog records for instant_lead_response and missed_call_text_back."
            : "Review pending/failed proof records and resolve blockers.",
        canLaunch: ready,
      };
    }
    case "test_exclusion": {
      const excludedCount = quarantine.excluded_leads_count;
      const productionCount = quarantine.production_leads_count;
      const hasRules = (quarantine.rules || []).length > 0;
      const weakProofCount = delivery.weak_proof_count || 0;
      const blockers = [];
      if (!hasRules) blockers.push("No test-data exclusion rules defined");
      if (weakProofCount > 0) blockers.push(`${weakProofCount} weak-proof records detected (provider_message_id=null + status=sent)`);
      if (excludedCount === undefined) blockers.push("Quarantine counts not computed — exclusion status unknown");
      const ready = hasRules && weakProofCount === 0 && excludedCount !== undefined;
      const status = ready ? "green" : hasRules ? "yellow" : "red";
      return {
        status,
        requiredEvidence: "Test/internal/smoke exclusion rules active, zero weak-proof records polluting production metrics, quarantine counts computed.",
        blockers,
        nextAction: ready
          ? "Exclusion system is launch-ready. Continue excluding test data from production KPIs."
          : weakProofCount > 0
            ? "Investigate and exclude weak-proof records (null provider_message_id + sent status) from production metrics."
            : "Define and verify test-data exclusion rules in the audit function.",
        canLaunch: ready,
      };
    }
    case "repair_queue": {
      const repairCap = caps.filter(c => c.status !== "green");
      const criticalRepairs = repairCap.filter(c => c.key === "instant_lead_response" || c.key === "missed_call_text_back");
      const blockers = [];
      if (criticalRepairs.length > 0) blockers.push(`${criticalRepairs.length} critical first-launch repair(s) open`);
      if (missed.has_404) blockers.push("Missed-call webhook 404 — appears in repair queue");
      if (delivery.without_provider_message_id > 0) blockers.push(`${delivery.without_provider_message_id} SMS log(s) without provider_message_id`);
      const ready = criticalRepairs.length === 0 && !missed.has_404 && (delivery.without_provider_message_id || 0) === 0;
      const status = ready ? "green" : repairCap.length > 0 ? "yellow" : "red";
      return {
        status,
        requiredEvidence: "Repair Queue visible and empty of critical first-launch items (speed-to-lead, missed-call recovery, webhook 404, provider errors).",
        blockers,
        nextAction: ready
          ? "Repair Queue is clear for first launch. Monitor for new items."
          : "Resolve all critical first-launch repairs before launching. Check the Repair Queue tab.",
        canLaunch: ready,
      };
    }
    default:
      return { status: "red", requiredEvidence: "Unknown checklist item.", blockers: ["Unknown item"], nextAction: "N/A", canLaunch: false };
  }
}

const ITEMS = [
  { id: "speed_to_lead", label: "Website Speed-to-Lead Readiness", icon: FileText },
  { id: "missed_call", label: "Missed Call Recovery Readiness", icon: AlertTriangle },
  { id: "proof_logging", label: "Evidence/Proof Logging Readiness", icon: CheckCircle2 },
  { id: "test_exclusion", label: "Internal/Test Record Exclusion Readiness", icon: CheckCircle2 },
  { id: "repair_queue", label: "Repair Queue Visibility", icon: AlertTriangle },
];

export default function FirstLaunchChecklist({ data }) {
  if (!data) return null;

  const results = ITEMS.map(item => ({ ...item, ...evaluateItem(item.id, data) }));
  const allReady = results.every(r => r.canLaunch);
  const readyCount = results.filter(r => r.canLaunch).length;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div
        className="rounded-xl p-5 flex items-start gap-3"
        style={{
          background: allReady
            ? "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))"
            : "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))",
          border: `1px solid ${allReady ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: allReady ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
            border: `1px solid ${allReady ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)"}`,
          }}
        >
          <Rocket className="w-4 h-4" style={{ color: allReady ? "#059669" : "#DC2626" }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: allReady ? "#059669" : "#DC2626" }}>
            {allReady
              ? "First Launch: READY — all checklist items pass"
              : `First Launch: NOT READY — ${results.length - readyCount} of ${results.length} items blocked`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Only first-launch-scope items are checked: Speed-to-Lead, Missed Call Recovery, Proof Logging, Test Exclusion, and Repair Queue.
            Voice, referral, and review capabilities are intentionally excluded from first launch scope.
          </p>
        </div>
      </div>

      {/* Checklist items */}
      {results.map(item => {
        const style = STATUS_STYLES[item.status] || STATUS_STYLES.red;
        const Icon = item.icon;
        return (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.label}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                  {style.label}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{
                    color: item.canLaunch ? "#059669" : "#DC2626",
                    background: item.canLaunch ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.05)",
                    border: `1px solid ${item.canLaunch ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.18)"}`,
                  }}
                >
                  {item.canLaunch ? "CAN LAUNCH" : "CANNOT LAUNCH"}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Required Evidence</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.requiredEvidence}</p>
              </div>
              {item.blockers.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Blocker{item.blockers.length > 1 ? "s" : ""}</p>
                  <ul className="space-y-1">
                    {item.blockers.map((b, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Action</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.nextAction}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}