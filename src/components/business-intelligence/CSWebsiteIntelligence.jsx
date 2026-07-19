import React from "react";
import { Globe2, Route } from "lucide-react";
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
import { websiteFixtures } from "./phaseBFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";

function JourneyStep({ signal }) {
  const tone = signal.status === "Action required" ? "danger" : signal.status === "Current" ? "success" : "neutral";

  return (
    <article className="cs-bi-journey-step">
      <div className="cs-bi-health-domain__header">
        <div>
          <h3>{signal.label}</h3>
          <p>{signal.evidence}</p>
        </div>
        <CSStatusBadge tone={tone}>{signal.status}</CSStatusBadge>
      </div>
      <div className="cs-bi-journey-step__meta">
        <TruthLabel value={signal.verification} />
        <FreshnessIndicator state={signal.freshness} />
        <ConfidenceBadge value={signal.confidence} />
      </div>
      <SourceDisclosure
        source={signal.source}
        verification={signal.verification}
        freshness={signal.freshness}
        explanation={signal.recommendation}
      />
      <DeepLinkAction label="Open journey step" href={`#${signal.id}`} />
    </article>
  );
}

function WebsiteEmptyState({ scenario }) {
  return (
    <CSEmptyState
      title={scenario.headline}
      description={scenario.description || "No activity is not treated as failure unless evidence supports that conclusion."}
      icon={<Globe2 />}
      action={<DeepLinkAction label="Open website sources" href="#website-sources" />}
    />
  );
}

export default function CSWebsiteIntelligence({ scenario = websiteFixtures.current }) {
  const state = scenario.state || "current";
  const signals = scenario.signals || [];

  return (
    <BIReviewSurface
      eyebrow="Website Intelligence"
      title="Critical journeys before page noise"
      description="Technical evidence and business outcomes stay separate. Recommendations identify evidence, freshness, and exact resolution destination."
      actions={<CSStatusBadge tone="info">No unsupported causation</CSStatusBadge>}
      className={`cs-bi-website-intelligence cs-bi-state-${state}`}
    >
      <BIStateFrame
        state={state}
        loading={<LoadingState title="Checking website intelligence" description={scenario.headline} />}
        permissionRestricted={<PermissionRestrictedState title="Website intelligence permission restricted" description={scenario.headline} />}
        unavailable={<UnavailableState title="Website source unavailable" description={scenario.headline} />}
        unknown={<UnknownState title={scenario.headline} description="Unknown website status is not treated as healthy." />}
      >
        {state === "empty" ? (
          <WebsiteEmptyState scenario={scenario} />
        ) : (
          <div className="cs-bi-layout">
            {state === "partial" ? <PartialCoverageBanner coverage={scenario.coverage} /> : null}
            {state === "stale" ? <PartialCoverageBanner coverage="Website evidence is stale. The view stays honest about freshness before recommending changes." /> : null}
            {state === "delayed" ? <PartialCoverageBanner coverage="Analytics processing is delayed. Business outcomes remain separated from technical checks." /> : null}

            <BISection id="website-critical-journey" title={scenario.headline} description="Landing to lead form to booking to confirmation is represented as a critical journey with evidence per step.">
              <div className="cs-bi-methodology-note">
                <Route aria-hidden="true" />
                <p>Technical metrics include availability, form health, and route behavior. Business outcomes include verified leads, bookings, and conversion events only when connected sources support them.</p>
              </div>
              {signals.length ? (
                <div className="cs-bi-website-path">
                  {signals.map((signal) => <JourneyStep key={signal.id} signal={signal} />)}
                </div>
              ) : (
                <WebsiteEmptyState scenario={scenario} />
              )}
            </BISection>

            <BISection id="website-recommendations" title="Recommendations" description="Recommendations cannot claim revenue or causation unless approved evidence exists.">
              {signals.length ? (
                <div className="cs-bi-journey-list">
                  {signals.map((signal) => (
                    <JourneyStep
                      key={`${signal.id}-recommendation`}
                      signal={{ ...signal, label: signal.recommendation, status: signal.status }}
                    />
                  ))}
                </div>
              ) : (
                <UnknownState title="No website recommendations" description="The foundation does not fabricate technical or business recommendations." />
              )}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
