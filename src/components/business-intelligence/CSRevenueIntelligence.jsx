import React from "react";
import { CircleDollarSign, Scale } from "lucide-react";
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
import { revenueFixtures } from "./phaseBFixtures";
import { CSEmptyState, CSStatusBadge } from "@/components/design-system";

const REVENUE_CLASS_LABELS = [
  "Collected",
  "Invoiced",
  "Projected",
  "Attributed",
  "Estimated",
  "Refunded",
  "Outstanding",
  "Unknown",
];

function RevenueClassCard({ item }) {
  return (
    <article className="cs-bi-revenue-class">
      <div className="cs-bi-revenue-row__header">
        <div>
          <h3>{item.label}</h3>
          <strong>{item.value}</strong>
          <p>{item.description}</p>
        </div>
        <TruthLabel value={item.verification} />
      </div>
      <div className="cs-bi-revenue-row__meta">
        <FreshnessIndicator state={item.freshness} />
        <ConfidenceBadge value={item.confidence} />
      </div>
      <SourceDisclosure
        source={item.source}
        verification={item.verification}
        freshness={item.freshness}
        explanation="This class remains separate. It is not blended into an overall revenue total."
      />
    </article>
  );
}

function RevenueEmptyState({ scenario }) {
  return (
    <CSEmptyState
      title={scenario.headline}
      description={scenario.description}
      icon={<CircleDollarSign />}
      action={<DeepLinkAction label="Open revenue source setup" href="#revenue-source-setup" />}
    />
  );
}

export default function CSRevenueIntelligence({ scenario = revenueFixtures.current }) {
  const state = scenario.state || "current";
  const classes = scenario.classes || [];

  return (
    <BIReviewSurface
      eyebrow="Revenue Intelligence"
      title="Revenue classes stay separate"
      description="Collected, invoiced, projected, attributed, estimated, refunded, outstanding, and unknown revenue are never silently combined."
      actions={<CSStatusBadge tone="warning">No unsupported attribution</CSStatusBadge>}
      className={`cs-bi-revenue-intelligence cs-bi-state-${state}`}
    >
      <BIStateFrame
        state={state}
        loading={<LoadingState title="Checking revenue sources" description={scenario.headline} />}
        permissionRestricted={<PermissionRestrictedState title="Revenue permission restricted" description={scenario.headline} />}
        unavailable={<UnavailableState title="Revenue source unavailable" description={scenario.headline} />}
        unknown={<UnknownState title={scenario.headline} description="Unknown revenue is not rendered as zero." />}
      >
        {state === "empty" ? (
          <RevenueEmptyState scenario={scenario} />
        ) : (
          <div className="cs-bi-layout">
            {state === "partial" ? <PartialCoverageBanner coverage={scenario.coverage} /> : null}
            {state === "stale" ? <PartialCoverageBanner coverage="Revenue data is stale. Comparisons and action recommendations must disclose that freshness gap." /> : null}
            {state === "delayed" ? <PartialCoverageBanner coverage="Reconciliation is delayed. Delayed revenue is not treated as collected." /> : null}

            <BISection id="revenue-boundaries" title={scenario.headline} description="Opening view prioritizes revenue-path issues, verified collected revenue, and source coverage before trends.">
              <div className="cs-bi-methodology-note">
                <Scale aria-hidden="true" />
                <p>Comparisons require matching period length, timezone, source coverage, revenue class, and currency treatment. Attribution is deferred until a separate approved method exists.</p>
              </div>
              <div className="cs-bi-chip-row" aria-label="Supported revenue classes">
                {REVENUE_CLASS_LABELS.map((label) => <CSStatusBadge key={label} tone="neutral">{label}</CSStatusBadge>)}
              </div>
            </BISection>

            <BISection id="revenue-class-list" title="Class-by-class view" description="Each class carries truth, freshness, confidence, and source disclosure.">
              {classes.length ? (
                <div className="cs-bi-layout cs-bi-layout--three">
                  {classes.map((item) => <RevenueClassCard key={item.id} item={item} />)}
                </div>
              ) : (
                <RevenueEmptyState scenario={scenario} />
              )}
            </BISection>
          </div>
        )}
      </BIStateFrame>
    </BIReviewSurface>
  );
}
