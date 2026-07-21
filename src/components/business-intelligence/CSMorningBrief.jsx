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

            <BISection id="morning-brief-condition" title="Business Condition" description="The opening condition is qualitative and source-backed; unsupported success is never shown.">
              <div className="cs-bi-brief-callout">
                <ListChecks aria-hidden="true" />
                <div>
                  <h3>{scenario.summary}</h3>
                  <p>Supported condition states: Healthy, Attention, Degraded, Blocked, Unknown, and Unavailable. Missing domains are disclosed instead of filled with zero.</p>
                </div>
                <SourceDisclosure {...(scenario.disclosure || sharedFixtureDisclosure)} />
              </div>
            </BISection>

            <BISection id="morning-brief-attention" title="Attention Required" description="Human attention appears only when evidence supports a specific review path.">
              {actions.length ? (
                <div className="cs-bi-methodology-note">
                  <ListChecks aria-hidden="true" />
                  <p>{actions.length} evidence-backed item requires review. No fake revenue, fake growth, or fake ROI is inferred.</p>
                </div>
              ) : (
                <UnknownState title="No attention item verified" description="The brief does not invent urgent work when evidence is absent." />
              )}
            </BISection>

            <BISection id="morning-brief-next-actions" title="Next Actions" description="Actions include owner, confidence, truth, evidence, and a narrow destination.">
              {actions.length ? (
                <div className="cs-bi-layout cs-bi-layout--two">
                  {actions.map((action) => (
                    <div key={`${action.id}-next`} className="cs-bi-methodology-note">
                      <ListChecks aria-hidden="true" />
                      <p><strong>{action.title}:</strong> {action.reason}</p>
                      <DeepLinkAction label={action.actionLabel} href={action.actionHref} />
                    </div>
                  ))}
                </div>
              ) : (
                <BriefEmptyState scenario={scenario} />
              )}
            </BISection>

            <BISection id="morning-brief-outcomes" title="Verified Outcomes" description="Each outcome carries source, freshness, confidence, and explanation.">
              {highlights.length ? (
                <div className="cs-bi-layout cs-bi-layout--two">
                  {highlights.map((highlight) => <BIInsightCard key={highlight.id} {...highlight} />)}
                </div>
              ) : (
                <UnknownState title="No verified highlights to show" description="The brief does not invent calls, bookings, reviews, revenue, or website activity." />
              )}
            </BISection>

            <BISection id="morning-brief-ai-summary" title="AI Summary" description="The summary restates visible evidence and uncertainty; it does not create metrics.">
              <div className="cs-bi-methodology-note">
                <CalendarDays aria-hidden="true" />
                <p>{scenario.summary} This fixture is isolated from production data, so the summary remains limited to rendered evidence and disclosed gaps.</p>
              </div>
              <SourceDisclosure {...(scenario.disclosure || sharedFixtureDisclosure)} />
            </BISection>

            <BISection id="morning-brief-recommendations" title="Recommendations" description="Recommendations remain evidence-backed and do not claim fake growth, ROI, or revenue impact.">
              {actions.length ? actions.map((action) => <RecommendationCard key={`${action.id}-recommendation`} {...action} />) : <UnknownState title="No recommendation verified" description="No recommendation is shown without evidence, owner, impact class, and destination." />}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
