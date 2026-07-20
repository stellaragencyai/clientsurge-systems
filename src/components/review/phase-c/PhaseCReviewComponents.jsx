import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  PauseCircle,
  Settings,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import {
  AI_WORKER_STATE_LABELS,
  AI_WORKER_STATE_MEANINGS,
  COMMUNICATION_STATE_LABELS,
  COMMUNICATION_STATE_MEANINGS,
  PHASE_C_ADAPTER_BOUNDARIES,
  PHASE_C_ACCESSIBILITY_CONTRACTS,
  PHASE_C_RECOMMENDATION_LIFECYCLE_ACTIONS,
  PHASE_C_ROUTES,
  PHASE_C_ROLE_SCENARIOS,
  PHASE_C_SOURCE_ISSUES,
  PHASE_C_STATE_GALLERY,
  PHASE_C_WORKER3_UX_CHECKLIST,
  PHASE_C_VALIDATION_TARGETS,
} from "@/data/phaseCReviewFixtures";
import { cn } from "@/lib/utils";

const STATE_TONES = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  degraded: "border-amber-200 bg-amber-50 text-amber-900",
  attention: "border-sky-200 bg-sky-50 text-sky-900",
  blocked: "border-red-200 bg-red-50 text-red-800",
  paused: "border-slate-300 bg-slate-100 text-slate-800",
  offline: "border-zinc-300 bg-zinc-100 text-zinc-800",
  unknown: "border-gray-300 bg-gray-100 text-gray-800",
  unavailable: "border-orange-200 bg-orange-50 text-orange-900",
  loading: "border-slate-300 bg-slate-100 text-slate-800",
  refreshing: "border-sky-200 bg-sky-50 text-sky-900",
  empty: "border-slate-300 bg-white text-slate-800",
  stale: "border-amber-200 bg-amber-50 text-amber-900",
  not_connected: "border-gray-300 bg-gray-100 text-gray-800",
  permission_restricted: "border-red-200 bg-red-50 text-red-800",
  error: "border-red-200 bg-red-50 text-red-800",
  queued: "border-slate-300 bg-slate-100 text-slate-800",
  sending: "border-sky-200 bg-sky-50 text-sky-900",
  sent: "border-blue-200 bg-blue-50 text-blue-900",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  read: "border-teal-200 bg-teal-50 text-teal-900",
  failed: "border-red-200 bg-red-50 text-red-800",
  current: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-amber-200 bg-amber-50 text-amber-900",
  limited: "border-sky-200 bg-sky-50 text-sky-900",
  reported: "border-slate-300 bg-slate-100 text-slate-800",
  delayed: "border-amber-200 bg-amber-50 text-amber-900",
};

const TRUTH_TONES = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  derived: "border-sky-200 bg-sky-50 text-sky-900",
  estimated: "border-amber-200 bg-amber-50 text-amber-900",
  reported: "border-slate-300 bg-slate-100 text-slate-800",
  unknown: "border-gray-300 bg-gray-100 text-gray-800",
  current: "border-emerald-200 bg-emerald-50 text-emerald-800",
  stale: "border-amber-200 bg-amber-50 text-amber-900",
  delayed: "border-amber-200 bg-amber-50 text-amber-900",
  unavailable: "border-orange-200 bg-orange-50 text-orange-900",
  not_connected: "border-gray-300 bg-gray-100 text-gray-800",
  permission_restricted: "border-red-200 bg-red-50 text-red-800",
  loading: "border-slate-300 bg-slate-100 text-slate-800",
  refreshing: "border-sky-200 bg-sky-50 text-sky-900",
  empty: "border-slate-300 bg-white text-slate-800",
  error: "border-red-200 bg-red-50 text-red-800",
  live: "border-emerald-200 bg-emerald-50 text-emerald-800",
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-900",
  low: "border-amber-200 bg-amber-50 text-amber-900",
  insufficient: "border-gray-300 bg-gray-100 text-gray-800",
};

const STATE_ICONS = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  attention: AlertTriangle,
  blocked: ShieldAlert,
  paused: PauseCircle,
  offline: XCircle,
  unknown: Circle,
  unavailable: Clock,
  loading: Clock,
  refreshing: Activity,
  empty: Circle,
  stale: AlertTriangle,
  delayed: Clock,
  not_connected: XCircle,
  permission_restricted: ShieldAlert,
  error: XCircle,
  queued: Clock,
  sending: Activity,
  sent: ArrowRight,
  delivered: CheckCircle2,
  read: CheckCircle2,
  failed: XCircle,
};

const formatLabel = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function formatDateTime(value) {
  if (!value) return "Not recorded";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ContractPill({ label, value, tone = "reported", icon: Icon }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
        TRUTH_TONES[String(tone).toLowerCase()] || TRUTH_TONES.reported
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      <span>{label}</span>
      {value ? <span className="font-bold">{value}</span> : null}
    </span>
  );
}

export function RecommendationLifecycleControls({ recommendation }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const selected = PHASE_C_RECOMMENDATION_LIFECYCLE_ACTIONS.find((action) => action.id === selectedAction);
  const currentState = selected?.resultingState || recommendation.lifecycle;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3" data-phase-c-lifecycle-controls="true">
      <div className="flex flex-wrap items-center gap-2">
        <ContractPill label="Fixture state" value={formatLabel(currentState)} tone="reported" />
        <ContractPill label="Side effect" value="None" tone="verified" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Fixture lifecycle actions for ${recommendation.title}`}>
        {PHASE_C_RECOMMENDATION_LIFECYCLE_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setSelectedAction(action.id)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2",
              selectedAction === action.id
                ? "border-[#0f2d52] bg-[#0f2d52] text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            )}
            aria-pressed={selectedAction === action.id}
          >
            {action.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        {selected?.auditMeaning || "Choose a fixture lifecycle action to preview the retained audit meaning."}
      </p>
    </div>
  );
}

export function StateBadge({ state, kind = "worker", className }) {
  const normalized = String(state || "unknown").toLowerCase();
  const labels = kind === "communication" ? COMMUNICATION_STATE_LABELS : AI_WORKER_STATE_LABELS;
  const meanings = kind === "communication" ? COMMUNICATION_STATE_MEANINGS : AI_WORKER_STATE_MEANINGS;
  const Icon = STATE_ICONS[normalized] || Circle;
  const label = labels[normalized] || formatLabel(normalized);
  const meaning = meanings[normalized] || "State meaning is not defined.";

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
        STATE_TONES[normalized] || STATE_TONES.unknown,
        className
      )}
      aria-label={`${label}: ${meaning}`}
      title={meaning}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function PhaseCReviewShell({ activeKey, title, eyebrow, summary, children }) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <nav aria-label="Phase C review routes" className="flex flex-wrap gap-2">
            {PHASE_C_ROUTES.map((route) => {
              const active = route.key === activeKey;
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2",
                    active
                      ? "border-[#0f2d52] bg-[#0f2d52] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {route.label}
                </Link>
              );
            })}
          </nav>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f2d52]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{summary}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Source contracts</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PHASE_C_SOURCE_ISSUES.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                    aria-label={`Open GitHub issue ${issue.number}: ${issue.title}`}
                  >
                    #{issue.number}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
        <PhaseCValidationSummary />
      </div>
    </main>
  );
}

export function PhaseCValidationSummary() {
  return (
    <section aria-labelledby="phase-c-validation" className="border-t border-slate-200 pt-6">
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f2d52]">Validation</p>
          <h2 id="phase-c-validation" className="mt-2 text-xl font-semibold text-slate-950">
            Review targets
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These routes are fixture-backed and require responsive and accessibility review before promotion.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">Viewport set</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {PHASE_C_VALIDATION_TARGETS.map((target) => (
                <ContractPill
                  key={`${target.width}-${target.height}`}
                  label={`${target.group}`}
                  value={`${target.width}px`}
                  tone="reported"
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">Accessibility checks</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {PHASE_C_ACCESSIBILITY_CONTRACTS.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#0f2d52]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({ id, eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f2d52]">{eyebrow}</p> : null}
        <h2 id={id} className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}

export function ReviewCard({ id, title, subtitle, badge, children, icon: Icon = FileText, className }) {
  return (
    <article
      id={id}
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,45,82,0.04)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-[#0f2d52] text-white">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-950">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
        {badge ? <div className="flex-none">{badge}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

export function DefinitionList({ items, columns = "md:grid-cols-2" }) {
  return (
    <dl className={cn("grid gap-3", columns)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-900">{item.value || "Not recorded"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PillList({ items, tone = "reported", emptyText = "None recorded" }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <ContractPill key={item} label={item} tone={tone} />
      ))}
    </div>
  );
}

export function EvidenceList({ items }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">No evidence recorded.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">{item.label}</p>
            <ContractPill label="Verification" value={formatLabel(item.verification)} tone={item.verification} />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-700">{item.detail}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {item.source} - observed {formatDateTime(item.observedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SourceDisclosure({ source }) {
  if (!source) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-950">{source.name}</p>
        <ContractPill label="Verification" value={formatLabel(source.verification)} tone={source.verification} />
        <ContractPill label="Freshness" value={formatLabel(source.freshness)} tone={source.freshness} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Source ID</dt>
          <dd className="break-words text-slate-900">{source.id}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Scope</dt>
          <dd className="break-words text-slate-900">{source.scope}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Observed</dt>
          <dd className="text-slate-900">{formatDateTime(source.observedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Processed</dt>
          <dd className="text-slate-900">{formatDateTime(source.processedAt)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-6 text-slate-700">{source.coverage}</p>
    </div>
  );
}

export function DeepLink({ to, children = "Open context" }) {
  const className =
    "inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0f2d52] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2";

  if (to?.startsWith("http")) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {children}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link to={to || "#"} className={className}>
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

export function StateReferenceGrid({ states, kind = "worker" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {states.map((item) => (
        <div key={item.state} className="rounded-lg border border-slate-200 bg-white p-3">
          <StateBadge state={item.state} kind={kind} />
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.meaning}</p>
        </div>
      ))}
    </div>
  );
}

export function RecommendationBlock({ recommendation, interactive = false }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ContractPill label="Priority" value={formatLabel(recommendation.priority)} tone={recommendation.priority === "critical" ? "unknown" : "reported"} />
        <ContractPill label="Lifecycle" value={formatLabel(recommendation.lifecycle)} tone="reported" />
        <ContractPill label="Impact truth" value={formatLabel(recommendation.impactTruth)} tone={recommendation.impactTruth} />
      </div>
      <h4 className="mt-3 text-sm font-bold text-slate-950">{recommendation.title}</h4>
      <p className="mt-1 text-sm leading-6 text-slate-700">{recommendation.reason}</p>
      <DefinitionList
        columns="sm:grid-cols-2"
        items={[
          { label: "Owner", value: recommendation.owner },
          { label: "Expected result", value: recommendation.expectedResult },
          { label: "Impact", value: formatLabel(recommendation.impactClassification) },
          { label: "Destination", value: recommendation.destination },
        ]}
      />
      <div className="mt-3">
        <DeepLink to={recommendation.destination}>Open recommendation context</DeepLink>
      </div>
      {interactive ? (
        <div className="mt-3">
          <RecommendationLifecycleControls recommendation={recommendation} />
        </div>
      ) : null}
    </div>
  );
}

export function PhaseCStateGallery({ gallery = PHASE_C_STATE_GALLERY }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {gallery.map((module) => (
        <ReviewCard key={module.route} title={module.module} subtitle={module.route} icon={Activity}>
          <div className="grid gap-2 sm:grid-cols-2">
            {module.states.map((state) => (
              <div key={`${module.route}-${state.state}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <StateBadge state={state.state} />
                <p className="mt-2 text-sm leading-6 text-slate-700">{state.summary}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{state.recovery}</p>
              </div>
            ))}
          </div>
        </ReviewCard>
      ))}
    </div>
  );
}

export function PhaseCRoleScenarioGrid({ scenarios = PHASE_C_ROLE_SCENARIOS }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {scenarios.map((scenario) => (
        <ReviewCard key={scenario.id} title={scenario.label} subtitle={scenario.ownerClass} icon={User}>
          <DefinitionList
            columns="sm:grid-cols-2"
            items={[
              { label: "Routes", value: scenario.routes.join(", ") },
              { label: "Recovery", value: scenario.recovery },
            ]}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-bold text-slate-950">Allowed actions</h4>
              <div className="mt-2">
                <PillList items={scenario.allowedActions} tone="verified" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-950">Restrictions</h4>
              <div className="mt-2">
                <PillList items={scenario.restrictions} tone="unknown" />
              </div>
            </div>
          </div>
        </ReviewCard>
      ))}
    </div>
  );
}

export function PhaseCAdapterBoundaryGrid({ boundaries = PHASE_C_ADAPTER_BOUNDARIES }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {boundaries.map((boundary) => (
        <ReviewCard
          key={boundary.id}
          title={boundary.contract}
          subtitle={`${boundary.module} - ${formatLabel(boundary.status)}`}
          icon={Settings}
        >
          <DefinitionList
            columns="sm:grid-cols-2"
            items={[
              { label: "Allowed methods", value: boundary.allowedMethods.join(", ") },
              { label: "Required return fields", value: boundary.requiredReturnFields.join(", ") },
            ]}
          />
          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-950">Prohibited</h4>
            <div className="mt-2">
              <PillList items={boundary.prohibited} tone="unknown" />
            </div>
          </div>
        </ReviewCard>
      ))}
    </div>
  );
}

export function PhaseCWorker3Checklist({ items = PHASE_C_WORKER3_UX_CHECKLIST }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#0f2d52]" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-bold text-slate-950">{item.label}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.acceptance}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HandoffBlock({ handoff }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ContractPill label="Escalation" value={handoff.required ? "Required" : "Not required"} tone={handoff.required ? "unknown" : "reported"} icon={User} />
        <ContractPill label="Urgency" value={formatLabel(handoff.urgency)} tone={handoff.urgency === "critical" ? "unknown" : "reported"} />
      </div>
      <DefinitionList
        columns="sm:grid-cols-2"
        items={[
          { label: "Reason", value: handoff.reason },
          { label: "Target owner", value: handoff.targetOwner || handoff.owner },
          { label: "Status", value: formatLabel(handoff.status) },
        ]}
      />
    </div>
  );
}

export function WorkerIcon() {
  return <Bot className="h-5 w-5" aria-hidden="true" />;
}

export function SettingsIcon() {
  return <Settings className="h-5 w-5" aria-hidden="true" />;
}

export function TimelineIcon() {
  return <CalendarClock className="h-5 w-5" aria-hidden="true" />;
}
