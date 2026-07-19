import React from "react";
import { HeartPulse, ShieldAlert } from "lucide-react";
import {
  BIReviewSurface,
  BISection,
  BIStateFrame,
  ConfidenceBadge,
  DeepLinkAction,
  FreshnessIndicator,
  LoadingState,
  PartialCoverageBanner,
  PermissionRestrictedState,
  SourceDisclosure,
  TruthLabel,
  UnavailableState,
  UnknownState,
} from "./CSBusinessIntelligencePrimitives";
import { businessHealthFixtures } from "./phaseBFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";

const STATUS_TONES = {
  healthy: "success",
  degraded: "warning",
  attention_needed: "warning",
  action_required: "danger",
  blocked: "danger",
  offline: "danger",
  not_configured: "neutral",
  paused: "neutral",
  unknown: "neutral",
  unavailable: "neutral",
};

function HealthDomainCard({ domain }) {
  return (
    <article className="cs-bi-health-domain">
      <div className="cs-bi-health-domain__header">
        <div>
          <h3>{domain.name}</h3>
          <p>{domain.reason}</p>
        </div>
        <CSStatusBadge tone={STATUS_TONES[domain.status] || "neutral"}>{domain.statusLabel}</CSStatusBadge>
      </div>
      <div className="cs-bi-health-domain__meta">
        <ConfidenceBadge value={domain.confidence} />
        <TruthLabel value={domain.verification} />
        <FreshnessIndicator state={domain.freshness} />
      </div>
      <SourceDisclosure
        source={domain.source}
        verification={domain.verification}
        freshness={domain.freshness}
        explanation="Domain classification is qualitative until an approved score contract exists."
      />
      <DeepLinkAction label={domain.nextAction} href={`#${domain.id}`} />
    </article>
  );
}

function HealthEmptyState({ scenario }) {
  return (
    <CSEmptyState
      title={scenario.headline}
      description={scenario.description}
      icon={<HeartPulse />}
      action={<DeepLinkAction label="Open connection checklist" href="#health-connections" />}
    />
  );
}

export default function CSBusinessHealthEngine({ scenario = businessHealthFixtures.current }) {
  const state = scenario.state || "current";
  const domains = scenario.domains || [];

  return (
    <BIReviewSurface
      eyebrow="Business Health Engine"
      title="Qualitative health, never a fake score"
      description="The foundation explains status, confidence, source, freshness, evidence, reason, and next action without inventing a numeric model."
      actions={<CSStatusBadge tone="neutral">No numeric score</CSStatusBadge>}
      className={`cs-bi-business-health cs-bi-state-${state}`}
    >
      <BIStateFrame
        state={state}
        loading={<LoadingState title="Checking health contributors" description={scenario.headline} />}
        permissionRestricted={<PermissionRestrictedState title="Health permission restricted" description={scenario.headline} />}
        unavailable={<UnavailableState title="Business health unavailable" description={scenario.headline} />}
        unknown={<UnknownState title={scenario.headline} description={scenario.description || "Unknown is not treated as healthy."} />}
      >
        {state === "empty" ? (
          <HealthEmptyState scenario={scenario} />
        ) : (
          <div className="cs-bi-layout">
            {state === "partial" ? <PartialCoverageBanner coverage={scenario.coverage} /> : null}
            {state === "stale" ? <PartialCoverageBanner coverage="Health evidence is stale. The assessment stays visible but confidence must be reduced." /> : null}
            {state === "delayed" ? <PartialCoverageBanner coverage="A source delay is disclosed before any health conclusion is trusted." /> : null}

            <BISection id="business-health-overview" title={scenario.headline} description={scenario.description}>
              <div className="cs-bi-methodology-note">
                <ShieldAlert aria-hidden="true" />
                <p>No weighting values or numeric score are approved. Critical failures cannot be averaged away by unrelated healthy domains.</p>
              </div>
            </BISection>

            <BISection id="business-health-domains" title="Domain breakdown" description="Each domain shows why it is classified and what action is available.">
              {domains.length ? (
                <div className="cs-bi-health-list">
                  {domains.map((domain) => <HealthDomainCard key={domain.id} domain={domain} />)}
                </div>
              ) : (
                <HealthEmptyState scenario={scenario} />
              )}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
