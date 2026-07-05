import { StatusPill, isQaEvidence, safeJsonParse } from "./helpers";

export default function SummaryCards({ gates, proofLogs, dashTruth, readinessState, checklists }) {
  const instantGate = gates?.find((g) => g.gate_key === "instant_lead_response");
  const missedGate = gates?.find((g) => g.gate_key === "missed_call_text_back");
  const routeGate = gates?.find((g) => g.gate_key === "twilio_webhook_route_health");
  const deliveryGate = gates?.find((g) => g.gate_key === "automation_delivery_gate");

  // ── Sprint 1 approval state ──
  const instantInternalApproved = instantGate?.status === "approved" && isQaEvidence(instantGate?.evidence_quality);
  const missedInternalApproved = missedGate?.status === "approved" && isQaEvidence(missedGate?.evidence_quality);
  const bothInternalApproved = instantInternalApproved && missedInternalApproved;

  // Sprint 1 Core Twilio
  const sprint1Passed = instantGate?.status === "proof_passed" && missedGate?.status === "proof_passed";
  const sprint1AllQa = sprint1Passed && isQaEvidence(instantGate?.evidence_quality) && isQaEvidence(missedGate?.evidence_quality);
  const sprint1Approved = bothInternalApproved;

  let sprint1Label, sprint1Color;
  if (sprint1Approved) {
    sprint1Label = "Internal Launch Approved";
    sprint1Color = "blue";
  } else if (sprint1Passed) {
    sprint1Label = sprint1AllQa ? "QA Proof Passed — Approval Pending" : "Conditional Go";
    sprint1Color = sprint1AllQa ? "yellow" : "green";
  } else {
    sprint1Label = "Not Ready";
    sprint1Color = "red";
  }

  // Full Platform — guardrail: internal approval never changes this
  const platformGo = readinessState?.go_no_go_decision === "go";
  const platformLabel = platformGo ? "Launch Ready" : "Not Fully Launch Ready";
  const platformColor = platformGo ? "green" : "red";

  // ── Sprint 2 — Inbound SMS + Nurture ──
  const inboundGate = gates?.find((g) => g.gate_key === "inbound_sms_assistant");
  const nurtureGate = gates?.find((g) => g.gate_key === "nurture_sequence_14d");
  const sprint2CombinedGate = gates?.find((g) => g.gate_key === "sprint2_inbound_and_nurture_gate");

  let sprint2Label, sprint2Color;
  if (sprint2CombinedGate?.status === "approved") {
    sprint2Label = "Internal Launch Approved";
    sprint2Color = "blue";
  } else if (sprint2CombinedGate?.status === "proof_passed") {
    sprint2Label = isQaEvidence(sprint2CombinedGate?.evidence_quality) ? "QA Proof Passed" : "Production Proof Passed";
    sprint2Color = isQaEvidence(sprint2CombinedGate?.evidence_quality) ? "yellow" : "green";
  } else if (inboundGate?.status === "ready_for_proof" || nurtureGate?.status === "ready_for_proof") {
    sprint2Label = "Ready for QA Proof";
    sprint2Color = "yellow";
  } else if (inboundGate?.status === "partial" || nurtureGate?.status === "partial") {
    sprint2Label = "Configured — Partial";
    sprint2Color = "yellow";
  } else {
    sprint2Label = "Not Started";
    sprint2Color = "gray";
  }

  // Route Health
  const routeHealthy = routeGate?.status === "proof_passed";
  const routeLabel = routeHealthy ? "Healthy" : "Unhealthy";
  const routeColor = routeHealthy ? "green" : "red";

  // Proof Logs
  const passedCount = (proofLogs || []).filter((p) => p.status === "pass").length;
  const proofLabel = `${passedCount} Passed`;
  const proofColor = passedCount > 0 ? "green" : "red";

  // Checklist Alignment
  const misaligned = (checklists || []).filter((cl) => {
    const g = gates?.find((gt) => gt.gate_key === cl.service_key);
    return g?.status === "proof_passed" && cl.status !== "active";
  });
  const checklistLabel = misaligned.length > 0 ? "Needs Reconciliation" : "Aligned";
  const checklistColor = misaligned.length > 0 ? "yellow" : "green";

  // Next Action
  let nextAction = "No action needed";
  if (!routeHealthy) nextAction = "Repair webhook routes";
  else if (!sprint1Passed) nextAction = "Complete Sprint 1 proof logs";
  else if (sprint1AllQa && !sprint1Approved) nextAction = "Admin decision: approve for internal launch or require production proof";
  else if (sprint1Approved && sprint2CombinedGate?.status !== "proof_passed") nextAction = "Sprint 1 approved — build Sprint 2 proof (inbound SMS + nurture)";
  else if (sprint1Approved) nextAction = "Sprint 1 internally approved — pursue production proof for public/client launch";
  else if (misaligned.length > 0) nextAction = "Reconcile checklists with gates";
  else if (!platformGo) nextAction = "Address full-platform blockers";

  const cards = [
    { title: "Sprint 1 Core Twilio", label: sprint1Label, color: sprint1Color },
    { title: "Sprint 2 Inbound + Nurture", label: sprint2Label, color: sprint2Color },
    { title: "Full Platform Readiness", label: platformLabel, color: platformColor },
    { title: "Route Health", label: routeLabel, color: routeColor },
    { title: "Proof Logs", label: proofLabel, color: proofColor },
    { title: "Checklist Alignment", label: checklistLabel, color: checklistColor },
    { title: "Next Required Action", label: nextAction, color: "blue", full: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`rounded-xl border p-4 ${c.full ? "sm:col-span-2 lg:col-span-3" : ""}`}
          style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">{c.title}</p>
          <StatusPill color={c.color} label={c.label} />
        </div>
      ))}
    </div>
  );
}