import React from "react";
import {
  ActionCard,
  HandoffCard,
  LoadingState,
  PhaseCSection,
  PhaseCSourceDisclosure,
  PhaseCSurface,
  RecommendationCard,
  StaticFoundationNotice,
  UnavailableState,
  WorkerCard,
} from "./CSCustomerOperationsPrimitives";
import { aiWorkforceFixtures } from "./phaseCFixtures";

export default function CSAIWorkforceOS({ scenario = aiWorkforceFixtures.healthy }) {
  const worker = scenario.worker;

  return (
    <PhaseCSurface scenario={scenario}>
      <div className="cs-co-layout">
        <StaticFoundationNotice />
        <PhaseCSection
          id="ai-worker-source-contract"
          title="Worker source contract"
          description="Truth, freshness, permission scope, and static-review origin remain visible for every worker state."
        >
          <PhaseCSourceDisclosure disclosure={scenario.disclosure} />
        </PhaseCSection>
        {scenario.state === "loading" ? (
          <LoadingState title="Loading AI worker evidence" description={scenario.happening} />
        ) : scenario.state === "unavailable" ? (
          <>
            <UnavailableState title="AI worker evidence unavailable" description={scenario.attention} />
            <PhaseCSection
              id="ai-worker-unavailable-context"
              title="Unavailable worker context"
              description="Known worker identity remains visible, but unavailable evidence is not promoted to current."
            >
              <WorkerCard worker={worker} />
            </PhaseCSection>
          </>
        ) : (
          <>
            <PhaseCSection
              id="ai-worker-overview"
              title="Worker overview"
              description="Identity, responsibility, output, blocked work, and owner appear before configuration detail."
            >
              <WorkerCard worker={worker} />
            </PhaseCSection>

            <div className="cs-co-two-column">
              <PhaseCSection
                id="ai-worker-profile"
                title="Worker profile and detail"
                description="The profile explains what the worker does for the business, not just whether it is active."
              >
                <dl className="cs-co-meta-grid">
                  <div><dt>Identity</dt><dd>{worker.identity}</dd></div>
                  <div><dt>Role</dt><dd>{worker.role}</dd></div>
                  <div><dt>Responsibility</dt><dd>{worker.responsibility}</dd></div>
                  <div><dt>Configuration state</dt><dd>{worker.configurationState}</dd></div>
                  <div><dt>Observable business result</dt><dd>{worker.businessResult}</dd></div>
                  <div><dt>Ownership</dt><dd>{worker.owner}</dd></div>
                </dl>
              </PhaseCSection>

              <PhaseCSection
                id="ai-worker-configuration"
                title="Worker configuration"
                description="Configuration is separated from runtime status so not configured, paused, and offline remain distinct."
              >
                <dl className="cs-co-meta-grid">
                  <div><dt>Configuration state</dt><dd>{worker.configurationState}</dd></div>
                  <div><dt>Runtime status</dt><dd>{worker.currentStatus}</dd></div>
                  <div><dt>Blocked dependency</dt><dd>{worker.blockedWork}</dd></div>
                  <div><dt>Resolution owner</dt><dd>{worker.owner}</dd></div>
                </dl>
              </PhaseCSection>
            </div>

            <PhaseCSection
              id="ai-worker-activity"
              title="Worker activity and completed work"
              description="Recent and completed work stay auditable with evidence and freshness."
            >
              <div className="cs-co-two-column">
                <ActionCard
                  title="Recent work"
                  reason={worker.recentWork}
                  evidence={worker.evidence}
                  owner={worker.owner}
                  expectedResult={worker.businessResult}
                  destination="AI Workforce > Activity"
                  lifecycle="reviewable"
                  confidence={worker.confidence}
                  truth={worker.truth}
                  freshness={worker.freshness}
                />
                <ActionCard
                  title="Completed work"
                  reason={worker.completedWork}
                  evidence={worker.evidence}
                  owner={worker.owner}
                  expectedResult="Completed work remains visible for audit."
                  destination="AI Workforce > Completed work"
                  lifecycle="audited"
                  confidence={worker.confidence}
                  truth={worker.truth}
                  freshness={worker.freshness}
                />
              </div>
            </PhaseCSection>

            <PhaseCSection
              id="ai-worker-recommendations"
              title="Worker recommendations"
              description="Recommendations include evidence, owner, expected result, lifecycle, confidence, and destination."
            >
              <div className="cs-co-card-grid">
                {scenario.recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>
            </PhaseCSection>

            <PhaseCSection
              id="ai-worker-human-handoff"
              title="Human handoff"
              description="AI-to-human transfer is explicit, owned, and recoverable."
            >
              <HandoffCard handoff={worker.handoff} />
            </PhaseCSection>
          </>
        )}
      </div>
    </PhaseCSurface>
  );
}
