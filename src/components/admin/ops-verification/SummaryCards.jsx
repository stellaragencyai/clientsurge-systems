import { StatusPill, isQaEvidence } from "./helpers";

export default function SummaryCards({ gates, proofLogs, dashTruth, readinessState, checklists }) {
  const instantGate = gates?.find((g) => g.gate_key === "instant_lead_response");
  const missedGate = gates?.find((g) => g.gate_key === "missed_call_text_back");
  const routeGate = gates?.find((g) => g.gate_key === "twilio_webhook_route_health");
  const deliveryGate = gates?.find((g) => g.gate_key === "automation_delivery_gate");

  // Sprint 1 Core Twilio
  const sprint1Passed = instantGate?.status === "proof_passed" && missedGate?.status === "proof_passed";
  const sprint1AllQa = sprint1Passed && isQaEvidence(instantGate?.evidence_quality) && isQaEvidence(missedGate?.evidence_quality);
  const sprint1Label = sprint1Passed
    ? sprint1AllQa ? "Conditional Go / QA Proof / Prod Approval Pending" : "Conditional Go"
    : "Not Ready";
  const sprint1Color = sprint1Passed ? (sprint1AllQa ? "yellow" : "green") : "red";

  // Full Platform
  const platformGo = readinessState?.go_no_go_decision === "go";
  const platformLabel = platformGo ? "Launch Ready" : "Not Fully Launch Ready";
  const platformColor = platformGo ? "green" : "red";

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
  else if (sprint1AllQa) nextAction = "Clear production proof or admin-approve for internal launch";
  else if (!sprint1Passed) nextAction = "Complete Sprint 1 proof logs";
  else if (misaligned.length > 0) nextAction = "Reconcile checklists with gates";
  else if (!platformGo) nextAction = "Address full-platform blockers";

  const cards = [
    { title: "Sprint 1 Core Twilio", label: sprint1Label, color: sprint1Color },
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