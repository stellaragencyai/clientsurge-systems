import React from "react";
import { CalendarDays, ListChecks } from "lucide-react";
import {
  BIInsightCard,
  BIReviewSurface,
  BISection,
  BIStateFrame,
  DeepLinkAction,
  LoadingState,
  PartialCoverageBanner,
  PermissionRestrictedState,
  RecommendationCard,
  SourceDisclosure,
  UnavailableState,
  UnknownState,
} from "./CSBusinessIntelligencePrimitives";
import { morningBriefFixtures, sharedFixtureDisclosure } from "./phaseBFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";

function BriefEmptyState({ scenario }) {
  return (
    <CSEmptyState
      title={scenario.headline || "No verified activity for this period"}
      description={scenario.description || scenario.summary}
      icon={<CalendarDays />}
      action={<DeepLinkAction label="Open source setup" href="#brief-source-setup" />}
    />
  );
}

export default function CSMorningBrief({ scenario = morningBriefFixtures.current }) {
  const state = scenario.state || "current";
  const highlights = scenario.highlights || [];
  const actions = scenario.actions || [];

  return (
    <BIReviewSurface
      eyebrow="Morning Brief"
      title="Today needs a short, honest brief"
      description="The brief prioritizes action, verified outcomes, and source coverage before supporting trends."
      actions={<CSStatusBadge tone="info">{scenario.period || "Selected period"}</CSStatusBadge>}
      className={`cs-bi-morning-brief cs-bi-state-${state}`}
    >
      <BIStateFrame
        state={state}
        loading={<LoadingState title="Preparing the Morning Brief" description={scenario.summary} />}
        permissionRestricted={<PermissionRestrictedState title="Brief permission restricted" description={scenario.summary} />}
        unavailable={<UnavailableState title="Morning Brief unavailable" description={scenario.summary} />}
        unknown={<UnknownState title="Morning Brief unknown" description={scenario.summary} />}
      >
        {state === "empty" ? (
          <BriefEmptyState scenario={scenario} />
        ) : (
          <div className="cs-bi-layout">
            {state === "partial" ? <PartialCoverageBanner coverage={scenario.coverage} missing={scenario.missing} /> : null}
            {state === "stale" ? <PartialCoverageBanner coverage="The brief is visible with stale source disclosure. It is not promoted to current." /> : null}
            {state === "delayed" ? <PartialCoverageBanner coverage="A connected source has confirmed processing delay. Delayed items remain labeled." /> : null}

            <section className="cs-bi-brief-summary" aria-labelledby="morning-brief-summary-title">
              <div className="cs-bi-brief-callout">
                <ListChecks aria-hidden="true" />
                <div>
                  <h2 id="morning-brief-summary-title">{scenario.summary}</h2>
                  <p>Priority actions stay above supporting reporting. Missing domains are disclosed instead of filled with zero.</p>
                </div>
                <SourceDisclosure {...(scenario.disclosure || sharedFixtureDisclosure)} />
              </div>

              <BISection id="morning-brief-actions" title="Highest-priority actions" description="Only precise, evidence-backed actions appear here.">
                {actions.length ? actions.map((action) => <RecommendationCard key={action.id} {...action} />) : <BriefEmptyState scenario={scenario} />}
              </BISection>
            </section>

            <BISection id="morning-brief-highlights" title="Verified business highlights" description="Each highlight carries source, freshness, confidence, and explanation.">
              {highlights.length ? (
                <div className="cs-bi-layout cs-bi-layout--two">
                  {highlights.map((highlight) => <BIInsightCard key={highlight.id} {...highlight} />)}
                </div>
              ) : (
                <UnknownState title="No verified highlights to show" description="The brief does not invent calls, bookings, reviews, revenue, or website activity." />
              )}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
