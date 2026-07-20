import { Activity, Bot, Settings, ShieldAlert } from "lucide-react";
import {
  AI_WORKER_STATES,
  phaseCWorkforce,
} from "@/data/phaseCReviewFixtures";
import {
  ContractPill,
  DefinitionList,
  EvidenceList,
  HandoffBlock,
  PhaseCReviewShell,
  PillList,
  RecommendationBlock,
  ReviewCard,
  SectionHeader,
  StateBadge,
  StateReferenceGrid,
  formatDateTime,
} from "@/components/review/phase-c/PhaseCReviewComponents";

function TextList({ items, emptyText = "None recorded" }) {
  if (!items?.length) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#0f2d52]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function WorkerProfileCard({ worker }) {
  return (
    <ReviewCard
      id={`worker-${worker.id}`}
      title={`${worker.identity.name} - ${worker.role}`}
      subtitle={`${worker.identity.workerId} in ${worker.identity.system}`}
      icon={Bot}
      badge={<StateBadge state={worker.currentState} />}
    >
      <div className="grid gap-4">
        <DefinitionList
          columns="sm:grid-cols-3"
          items={[
            { label: "Identity", value: `${worker.identity.name} (${worker.identity.workerId})` },
            { label: "Role", value: worker.role },
            { label: "Current state", value: worker.currentState },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-bold text-slate-950">Responsibilities</h4>
            <div className="mt-2">
              <PillList items={worker.responsibilities} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950">Today&apos;s Work</h4>
            <div className="mt-2">
              <TextList items={worker.todaysWork} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950">Completed Work</h4>
            <div className="mt-2">
              <TextList items={worker.completedWork} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-950">Blocked Work</h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">{worker.blockedWork.summary}</p>
            <div className="mt-2">
              <TextList items={worker.blockedWork.blockers} emptyText="No active blockers recorded." />
            </div>
          </div>
        </div>

        <DefinitionList
          columns="lg:grid-cols-3"
          items={[
            { label: "Business result", value: worker.businessResult.summary },
            { label: "Business result source", value: worker.businessResult.source },
            { label: "Result verification", value: worker.businessResult.verification },
            { label: "Confidence", value: worker.confidence.level },
            { label: "Confidence reason", value: worker.confidence.reason },
            { label: "Freshness", value: worker.confidence.freshness },
          ]}
        />

        <div>
          <h4 className="text-sm font-bold text-slate-950">Evidence</h4>
          <div className="mt-2">
            <EvidenceList items={worker.evidence} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-950">Recommendation</h4>
          <div className="mt-2">
            <RecommendationBlock recommendation={worker.recommendation} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-950">Human Escalation</h4>
          <div className="mt-2">
            <HandoffBlock handoff={worker.humanEscalation} />
          </div>
        </div>
      </div>
    </ReviewCard>
  );
}

export default function PhaseCWorkforceReview() {
  const { workers, activity, stateReference } = phaseCWorkforce;
  const recommendations = workers.map((worker) => ({
    worker,
    recommendation: worker.recommendation,
  }));

  return (
    <PhaseCReviewShell
      activeKey="workforce"
      eyebrow="Phase C Customer + AI Operations"
      title="AI Workforce OS"
      summary="Fixture-backed worker directory, profile, activity, recommendations, and configuration views. Every worker exposes identity, ownership, evidence, confidence, current state, business result, blocked work, recommendation, and human escalation."
    >
      <section aria-labelledby="workforce-overview">
        <SectionHeader
          id="workforce-overview"
          eyebrow="Worker Directory"
          title="Operational coverage"
          description="The review fixture supports every requested worker state without treating unknown, unavailable, paused, or offline as healthy."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReviewCard title="Workers" subtitle="Fixture profiles" icon={Bot}>
            <p className="text-3xl font-semibold text-slate-950">{workers.length}</p>
            <p className="mt-1 text-sm text-slate-600">Every profile carries required Phase C fields.</p>
          </ReviewCard>
          <ReviewCard title="States" subtitle="Supported vocabulary" icon={ShieldAlert}>
            <p className="text-3xl font-semibold text-slate-950">{AI_WORKER_STATES.length}</p>
            <p className="mt-1 text-sm text-slate-600">Unknown and unavailable remain distinct.</p>
          </ReviewCard>
          <ReviewCard title="Activity" subtitle="Worker events" icon={Activity}>
            <p className="text-3xl font-semibold text-slate-950">{activity.length}</p>
            <p className="mt-1 text-sm text-slate-600">Activity retains source and evidence IDs.</p>
          </ReviewCard>
          <ReviewCard title="Configuration" subtitle="Fixture-only adapters" icon={Settings}>
            <p className="text-3xl font-semibold text-slate-950">0</p>
            <p className="mt-1 text-sm text-slate-600">No live adapters or production sends are mounted.</p>
          </ReviewCard>
        </div>
      </section>

      <section aria-labelledby="workforce-state-reference">
        <SectionHeader
          id="workforce-state-reference"
          eyebrow="State model"
          title="AI worker states"
          description="The state model is text-first and meaning-backed so color is never the only signal."
        />
        <div className="mt-4">
          <StateReferenceGrid states={stateReference} />
        </div>
      </section>

      <section aria-labelledby="worker-profiles">
        <SectionHeader
          id="worker-profiles"
          eyebrow="Worker Profile"
          title="Directory and profile cards"
          description="Each AI worker card includes the complete required field set from the Phase C prompt."
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {workers.map((worker) => (
            <WorkerProfileCard key={worker.id} worker={worker} />
          ))}
        </div>
      </section>

      <section aria-labelledby="worker-activity">
        <SectionHeader
          id="worker-activity"
          eyebrow="Worker Activity"
          title="Recent activity"
          description="Activity rows preserve the worker, timestamp, source, state, and evidence reference."
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {activity.map((item) => {
            const worker = workers.find((candidate) => candidate.id === item.workerId);
            return (
              <ReviewCard
                key={item.id}
                title={worker?.identity.name || item.workerId}
                subtitle={formatDateTime(item.timestamp)}
                icon={Activity}
                badge={<StateBadge state={item.state} />}
              >
                <p className="text-sm leading-6 text-slate-700">{item.summary}</p>
                <DefinitionList
                  columns="sm:grid-cols-2"
                  items={[
                    { label: "Worker", value: item.workerId },
                    { label: "Source", value: item.source },
                    { label: "Evidence", value: item.evidenceId },
                  ]}
                />
              </ReviewCard>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="worker-recommendations">
        <SectionHeader
          id="worker-recommendations"
          eyebrow="Worker Recommendations"
          title="Evidence-backed next actions"
          description="Recommendations retain owner, reason, source confidence, lifecycle, destination, and expected result."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {recommendations.map(({ worker, recommendation }) => (
            <ReviewCard
              key={`${worker.id}-${recommendation.title}`}
              title={recommendation.title}
              subtitle={`${worker.identity.name} - ${worker.role}`}
              icon={ShieldAlert}
              badge={<ContractPill label="Priority" value={recommendation.priority} tone={recommendation.priority === "critical" ? "unknown" : "reported"} />}
            >
              <RecommendationBlock recommendation={recommendation} />
            </ReviewCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="worker-configuration">
        <SectionHeader
          id="worker-configuration"
          eyebrow="Worker Configuration"
          title="Configuration and safeguards"
          description="Configuration fixtures state scope, permissions, integrations, freshness windows, and safeguards without enabling live work."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {workers.map((worker) => (
            <ReviewCard
              key={`${worker.id}-configuration`}
              title={`${worker.identity.name} configuration`}
              subtitle={worker.configuration.scope}
              icon={Settings}
            >
              <DefinitionList
                columns="sm:grid-cols-2"
                items={[
                  { label: "Freshness window", value: worker.configuration.freshnessWindow },
                  { label: "Scope", value: worker.configuration.scope },
                ]}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Permissions</h4>
                  <div className="mt-2">
                    <PillList items={worker.configuration.permissions} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Integrations</h4>
                  <div className="mt-2">
                    <PillList items={worker.configuration.integrations} tone="current" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Safeguards</h4>
                  <div className="mt-2">
                    <PillList items={worker.configuration.safeguards} tone="unknown" />
                  </div>
                </div>
              </div>
            </ReviewCard>
          ))}
        </div>
      </section>
    </PhaseCReviewShell>
  );
}
