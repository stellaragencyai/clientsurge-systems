import { Link } from "react-router-dom";
import { ClipboardCheck, Database, GitPullRequest, Route, ShieldCheck } from "lucide-react";
import {
  PHASE_C_ROUTES,
  PHASE_C_SOURCE_ISSUES,
  phaseCReviewPacket,
} from "@/data/phaseCReviewFixtures";
import {
  ContractPill,
  DefinitionList,
  DeepLink,
  PhaseCAdapterBoundaryGrid,
  PhaseCReviewShell,
  PhaseCRoleScenarioGrid,
  PhaseCStateGallery,
  PhaseCWorker3Checklist,
  ReviewCard,
  SectionHeader,
} from "@/components/review/phase-c/PhaseCReviewComponents";

const reviewRoutes = PHASE_C_ROUTES.filter((route) => route.key !== "hub");

export default function PhaseCReviewHub() {
  const fixtureRows = [
    { label: "Workforce workers", value: phaseCReviewPacket.fixtures.workforce.workers },
    { label: "Worker states", value: phaseCReviewPacket.fixtures.workforce.states },
    { label: "Timeline events", value: phaseCReviewPacket.fixtures.timeline.events },
    { label: "Event types", value: phaseCReviewPacket.fixtures.timeline.eventTypes },
    { label: "Conversations", value: phaseCReviewPacket.fixtures.communications.conversations },
    { label: "Communication states", value: phaseCReviewPacket.fixtures.communications.states },
    { label: "Customer accounts", value: phaseCReviewPacket.fixtures.customerSuccess.accounts },
    { label: "Evidence-backed risks", value: phaseCReviewPacket.fixtures.customerSuccess.risks },
    { label: "Health scores", value: phaseCReviewPacket.fixtures.customerSuccess.healthScores },
  ];

  return (
    <PhaseCReviewShell
      activeKey="hub"
      eyebrow="Phase C Customer + AI Operations"
      title="Phase C Review Hub"
      summary="A review-only landing page for Phase C foundations. It gathers route inventory, fixture coverage, required state coverage, role scenarios, adapter boundaries, validation targets, and Worker #3 review criteria without mounting live adapters."
    >
      <section aria-labelledby="phase-c-route-map">
        <SectionHeader
          id="phase-c-route-map"
          eyebrow="Route map"
          title="Review surfaces"
          description="Each route is fixture-backed, internal/noindex, and excluded from production navigation."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {reviewRoutes.map((route) => (
            <ReviewCard key={route.path} title={route.label} subtitle={route.path} icon={Route}>
              <DeepLink to={route.path}>Open route</DeepLink>
            </ReviewCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="phase-c-fixture-matrix">
        <SectionHeader
          id="phase-c-fixture-matrix"
          eyebrow="Fixture matrix"
          title="Coverage inventory"
          description="Fixtures are intentionally review-only and include no live Base44 or provider calls."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ReviewCard title="Fixture counts" subtitle="Phase C packet" icon={Database}>
            <DefinitionList
              columns="sm:grid-cols-3"
              items={fixtureRows.map((row) => ({
                label: row.label,
                value: String(row.value),
              }))}
            />
          </ReviewCard>
          <ReviewCard title="Source issues" subtitle="Normative inputs" icon={GitPullRequest}>
            <div className="grid gap-2">
              {PHASE_C_SOURCE_ISSUES.map((issue) => (
                <a
                  key={issue.number}
                  href={issue.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                >
                  <span>#{issue.number} {issue.role}</span>
                  <span className="text-xs text-slate-500">Open</span>
                </a>
              ))}
            </div>
          </ReviewCard>
        </div>
      </section>

      <section aria-labelledby="phase-c-state-gallery">
        <SectionHeader
          id="phase-c-state-gallery"
          eyebrow="State gallery"
          title="Required UI states"
          description="Every Phase C module gets fixture scenarios for loading, refreshing, current, empty, partial, stale, delayed, unavailable, not connected, permission restricted, unknown, and error states."
        />
        <div className="mt-4">
          <PhaseCStateGallery />
        </div>
      </section>

      <section aria-labelledby="phase-c-role-scenarios">
        <SectionHeader
          id="phase-c-role-scenarios"
          eyebrow="Role and permissions"
          title="Permission scenarios"
          description="Roles show allowed actions, protected content boundaries, and recovery paths without leaking restricted data."
        />
        <div className="mt-4">
          <PhaseCRoleScenarioGrid />
        </div>
      </section>

      <section aria-labelledby="phase-c-adapter-boundaries">
        <SectionHeader
          id="phase-c-adapter-boundaries"
          eyebrow="Adapter boundaries"
          title="Future live adapter contracts"
          description="These are interface boundaries only. They define expected reads and prohibited writes before any production integration exists."
        />
        <div className="mt-4">
          <PhaseCAdapterBoundaryGrid />
        </div>
      </section>

      <section aria-labelledby="phase-c-worker3-checklist">
        <SectionHeader
          id="phase-c-worker3-checklist"
          eyebrow="Worker #3"
          title="UX review checklist"
          description="Rendered-quality criteria for hierarchy, state clarity, mobile order, keyboard access, touch targets, truth copy, provenance, and reduced motion."
          action={<ContractPill label="Review status" value="Ready for UX review" tone="verified" icon={ShieldCheck} />}
        />
        <div className="mt-4">
          <PhaseCWorker3Checklist />
        </div>
      </section>

      <section aria-labelledby="phase-c-next-review">
        <SectionHeader
          id="phase-c-next-review"
          eyebrow="Review packet"
          title="What reviewers should inspect"
          description="The implementation packet documents branch, routes, components, fixtures, validation, and review ownership."
        />
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ClipboardCheck className="mt-1 h-5 w-5 flex-none text-[#0f2d52]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">Phase C Customer + AI Operations Review Packet</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Includes route inventory, fixture coverage, validation commands, and review notes.
                </p>
              </div>
            </div>
            <Link
              to="/review/phase-c/workforce"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#0f2d52] bg-[#0f2d52] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
            >
              Start with Workforce
            </Link>
          </div>
        </div>
      </section>
    </PhaseCReviewShell>
  );
}
