import { useMemo, useState } from "react";
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

function WorkerProfileCard({ worker, defaultOpen = false }) {
  return (
    <ReviewCard
      id={`worker-${worker.id}`}
      title={`${worker.identity.name} - ${worker.role}`}
      subtitle={`${worker.identity.workerId} in ${worker.identity.system}`}
      icon={Bot}
      badge={<StateBadge state={worker.currentState} />}
    >
      <details open={defaultOpen} className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-[#0f2d52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2">
          <span>Worker profile detail</span>
          <span className="text-xs text-slate-500 group-open:hidden">Closed</span>
          <span className="hidden text-xs text-slate-500 group-open:inline">Open</span>
        </summary>
        <div className="mt-4 grid gap-4">
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
      </details>
    </ReviewCard>
  );
}

export default function PhaseCWorkforceReview() {
  const { workers, activity, stateReference } = phaseCWorkforce;
  const [stateFilter, setStateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filteredWorkers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return workers.filter((worker) => {
      const matchesState = stateFilter === "all" || worker.currentState === stateFilter;
      const searchableText = [
        worker.identity.name,
        worker.identity.workerId,
        worker.role,
        worker.currentState,
        worker.recommendation.title,
        worker.recommendation.owner,
      ].join(" ").toLowerCase();
      return matchesState && (!term || searchableText.includes(term));
    });
  }, [search, stateFilter, workers]);
  const recommendations = filteredWorkers.map((worker) => ({
    worker,
    recommendation: worker.recommendation,
  }));
  const stateCounts = workers.reduce((acc, worker) => {
    acc[worker.currentState] = (acc[worker.currentState] || 0) + 1;
    return acc;
  }, {});

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
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <label htmlFor="worker-search" className="text-sm font-bold text-slate-950">Search workers</label>
              <input
                id="worker-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                placeholder="Name, role, state, owner"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">State filter</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter AI workers by state">
                <button
                  type="button"
                  onClick={() => setStateFilter("all")}
                  className={`inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 ${stateFilter === "all" ? "border-[#0f2d52] bg-[#0f2d52] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                  aria-pressed={stateFilter === "all"}
                >
                  All ({workers.length})
                </button>
                {AI_WORKER_STATES.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setStateFilter(state)}
                    className={`inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 ${stateFilter === state ? "border-[#0f2d52] bg-[#0f2d52] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                    aria-pressed={stateFilter === state}
                  >
                    {state} ({stateCounts[state] || 0})
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">{filteredWorkers.length} workers shown</p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filteredWorkers.length > 0 ? (
            filteredWorkers.map((worker) => (
              <WorkerProfileCard key={worker.id} worker={worker} defaultOpen={worker.currentState !== "healthy"} />
            ))
          ) : (
            <ReviewCard title="No workers match the current filter" subtitle="Filtered zero" icon={ShieldAlert}>
              <p className="text-sm leading-6 text-slate-700">This is a valid filtered-zero state. Clear search or choose another state to continue review.</p>
            </ReviewCard>
          )}
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
              <RecommendationBlock recommendation={recommendation} interactive />
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
          {filteredWorkers.map((worker) => (
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
