import React from "react";
import {
  PhaseCDeepLink,
  PhaseCSection,
  PhaseCSourceDisclosure,
  PhaseCSurface,
  RiskCard,
  StaticFoundationNotice,
  SuccessPlanList,
} from "./CSCustomerOperationsPrimitives";
import { customerSuccessFixtures } from "./phaseCFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";
import { ClipboardCheck } from "lucide-react";

export default function CSCustomerSuccessWorkspace({ scenario = customerSuccessFixtures.healthy }) {
  const overview = scenario.overview || {};
  const risks = scenario.risks || [];

  return (
    <PhaseCSurface scenario={scenario}>
      <div className="cs-co-layout">
        <StaticFoundationNotice />
        <PhaseCSection
          id="customer-success-source-contract"
          title="Customer success source contract"
          description="The workspace uses evidence-backed qualitative status. It does not create unsupported health scores."
        >
          <PhaseCSourceDisclosure disclosure={scenario.disclosure} />
        </PhaseCSection>

        <PhaseCSection
          id="customer-success-overview"
          title="Customer overview"
          description="Installation, adoption, automation coverage, AI usage, account owner, interventions, and renewal readiness stay separated."
          actions={<CSStatusBadge tone={scenario.tone}>{scenario.status}</CSStatusBadge>}
        >
          <dl className="cs-co-overview-grid">
            <div><dt>Installation progress</dt><dd>{overview.installation}</dd></div>
            <div><dt>Adoption</dt><dd>{overview.adoption}</dd></div>
            <div><dt>Automation coverage</dt><dd>{overview.automationCoverage}</dd></div>
            <div><dt>AI usage</dt><dd>{overview.aiUsage}</dd></div>
            <div><dt>Risk signals</dt><dd>{risks.length ? `${risks.length} evidence-backed risk signals` : "No evidence-backed risk signals"}</dd></div>
            <div><dt>Account owner</dt><dd>{overview.accountOwner}</dd></div>
            <div><dt>Interventions</dt><dd>{scenario.nextAction}</dd></div>
            <div><dt>Renewal readiness</dt><dd>{overview.renewalReadiness}</dd></div>
          </dl>
        </PhaseCSection>

        <PhaseCSection
          id="customer-success-risks"
          title="Risk signals and interventions"
          description="Every risk requires evidence, reason, impact, owner, and next action."
          actions={<PhaseCDeepLink label="Open intervention queue" href="#interventions" />}
        >
          {risks.length ? (
            <div className="cs-co-card-grid">
              {risks.map((risk) => <RiskCard key={risk.id} risk={risk} />)}
            </div>
          ) : (
            <CSEmptyState
              className="cs-co-empty-state"
              icon={<ClipboardCheck />}
              title="No evidence-backed risks"
              description="No health score is shown. The fixture only shows risk when evidence, reason, impact, owner, and next action exist."
              action={<PhaseCDeepLink label="Open success plan" href="#success-plan" />}
            />
          )}
        </PhaseCSection>

        <PhaseCSection
          id="customer-success-plan"
          title="Success plan"
          description="Success work remains owned, sequenced, and reviewable without unsupported scoring."
        >
          <SuccessPlanList items={scenario.successPlan} />
        </PhaseCSection>
      </div>
    </PhaseCSurface>
  );
}
