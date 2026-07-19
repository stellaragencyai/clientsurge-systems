import React from "react";
import { Filter, Target } from "lucide-react";
import {
  ActionPriority,
  BIReviewSurface,
  BISection,
  BIStateFrame,
  ConfidenceBadge,
  DeepLinkAction,
  EvidenceSummary,
  FreshnessIndicator,
  LoadingState,
  OwnerBadge,
  PartialCoverageBanner,
  PermissionRestrictedState,
  SourceDisclosure,
  TruthLabel,
  UnavailableState,
  UnknownState,
} from "./CSBusinessIntelligencePrimitives";
import { opportunityFixtures } from "./phaseBFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";

function OpportunityCard({ opportunity }) {
  return (
    <article className="cs-bi-opportunity-card">
      <div className="cs-bi-opportunity-card__header">
        <div>
          <h3>{opportunity.title}</h3>
          <p>{opportunity.explanation}</p>
        </div>
        <ActionPriority priority={opportunity.priority} />
      </div>
      <div className="cs-bi-opportunity-card__meta">
        <OwnerBadge owner={opportunity.owner} />
        <ConfidenceBadge value={opportunity.confidence} />
        <TruthLabel value={opportunity.verification} />
        <FreshnessIndicator state={opportunity.freshness} />
        <CSStatusBadge tone="neutral">{opportunity.lifecycle}</CSStatusBadge>
      </div>
      <EvidenceSummary title={`${opportunity.title} evidence`} items={opportunity.evidence} />
      <SourceDisclosure
        source={opportunity.source}
        verification={opportunity.verification}
        freshness={opportunity.freshness}
        scope={opportunity.category}
        explanation={`Impact class: ${opportunity.impact}. No dollar impact is shown without an approved attribution contract.`}
      />
      <DeepLinkAction label={opportunity.actionLabel} href={`#${opportunity.id}`} />
    </article>
  );
}

function OpportunityEmptyState({ scenario }) {
  return (
    <CSEmptyState
      title={scenario.headline}
      description={scenario.description || "No current opportunities meet the selected criteria. This does not mean the business is fully optimized."}
      icon={<Target />}
      action={<DeepLinkAction label="Open source coverage" href="#opportunity-sources" />}
    />
  );
}

export default function CSOpportunityCenter({ scenario = opportunityFixtures.current }) {
  const state = scenario.state || "current";
  const opportunities = scenario.opportunities || [];
  const selected = opportunities[0];

  return (
    <BIReviewSurface
      eyebrow="Opportunity Center"
      title="Prioritized opportunities with evidence first"
      description="Opportunity cards show source, confidence, owner, lifecycle, and exact next action without unsupported revenue claims."
      actions={<CSStatusBadge tone="info">Estimated impact separated</CSStatusBadge>}
      className={`cs-bi-opportunity-center cs-bi-state-${state}`}
    >
      <BIStateFrame
        state={state}
        loading={<LoadingState title="Checking opportunity detectors" description={scenario.headline} />}
        permissionRestricted={<PermissionRestrictedState title="Opportunity permission restricted" description={scenario.headline} />}
        unavailable={<UnavailableState title="Opportunity Center unavailable" description={scenario.headline} />}
        unknown={<UnknownState title={scenario.headline} description="No detector result is promoted without evidence." />}
      >
        {state === "empty" ? (
          <OpportunityEmptyState scenario={scenario} />
        ) : (
          <div className="cs-bi-layout cs-bi-layout--two">
            <BISection
              id="opportunity-priority-list"
              title={scenario.headline}
              description="Critical and high-priority items appear before estimated growth or coverage opportunities."
              actions={<DeepLinkAction label="Filter opportunities" href="#opportunity-filters" />}
            >
              {state === "partial" ? <PartialCoverageBanner coverage={scenario.coverage} /> : null}
              {state === "stale" ? <PartialCoverageBanner coverage="Opportunity evidence is stale and must be reviewed before action priority is trusted." /> : null}
              {state === "delayed" ? <PartialCoverageBanner coverage="Detector processing is delayed; delayed opportunities remain labeled." /> : null}
              {opportunities.length ? (
                <div className="cs-bi-opportunity-list">
                  {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
                </div>
              ) : (
                <OpportunityEmptyState scenario={scenario} />
              )}
            </BISection>

            <BISection id="opportunity-detail" title="Opportunity detail" description="The detail view explains why the item exists and what resolves it.">
              {selected ? (
                <div className="cs-bi-opportunity-detail">
                  <Filter aria-hidden="true" />
                  <h3>{selected.title}</h3>
                  <p>{selected.explanation}</p>
                  <p>Dismissal and snooze must record actor, reason, timestamp, and recurrence policy before production integration.</p>
                  <SourceDisclosure source={selected.source} verification={selected.verification} freshness={selected.freshness} />
                </div>
              ) : (
                <UnknownState title="No opportunity selected" description="Select an opportunity to review evidence, assumptions, owner, lifecycle, and recurrence history." />
              )}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
