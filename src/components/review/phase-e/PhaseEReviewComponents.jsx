import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Command,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRoundCheck,
} from "lucide-react";
import {
  PHASE_E_ACCESSIBILITY_REQUIREMENTS,
  PHASE_E_COMPONENTS,
  PHASE_E_ROUTES,
  PHASE_E_SOURCE,
  PHASE_E_SOURCE_ISSUES,
  PHASE_E_TRUTH_RULES,
  PHASE_E_VIEWPORTS,
  getPhaseEComponents,
} from "@/lib/phaseELifecycleFoundation";

const ROUTE_ICON = {
  onboarding: Sparkles,
  "home-entry": Home,
  trial: TimerReset,
  subscription: CreditCard,
  search: Search,
  "command-menu": Command,
  notifications: Bell,
  help: HelpCircle,
  incidents: AlertTriangle,
  "launch-readiness": ClipboardCheck,
};

const STATUS_STYLE = {
  Loading: "border-slate-200 bg-slate-50 text-slate-700",
  Current: "border-sky-200 bg-sky-50 text-sky-900",
  Complete: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Incomplete: "border-amber-200 bg-amber-50 text-amber-900",
  Waiting: "border-amber-200 bg-amber-50 text-amber-900",
  Partial: "border-amber-200 bg-amber-50 text-amber-900",
  Blocked: "border-rose-200 bg-rose-50 text-rose-800",
  Critical: "border-rose-200 bg-rose-50 text-rose-800",
  Error: "border-rose-200 bg-rose-50 text-rose-800",
  Unavailable: "border-slate-300 bg-slate-100 text-slate-800",
  Unknown: "border-slate-300 bg-slate-100 text-slate-800",
  "Permission Restricted": "border-violet-200 bg-violet-50 text-violet-800",
  "No Permission Results": "border-violet-200 bg-violet-50 text-violet-800",
  Expired: "border-orange-200 bg-orange-50 text-orange-900",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Needs Attention": "border-amber-200 bg-amber-50 text-amber-900",
  "New User": "border-sky-200 bg-sky-50 text-sky-900",
  "Active User": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Inactive User": "border-slate-300 bg-slate-100 text-slate-800",
  "Trial Started": "border-sky-200 bg-sky-50 text-sky-900",
  "Activation In Progress": "border-amber-200 bg-amber-50 text-amber-900",
  "Trial Active": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Trial Ending Soon": "border-amber-200 bg-amber-50 text-amber-900",
  "Trial Expired": "border-orange-200 bg-orange-50 text-orange-900",
  Converted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Cancelled: "border-slate-300 bg-slate-100 text-slate-800",
  Operational: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Degraded: "border-orange-200 bg-orange-50 text-orange-900",
  "Partial Impact": "border-amber-200 bg-amber-50 text-amber-900",
  "Major Incident": "border-rose-200 bg-rose-50 text-rose-800",
  Maintenance: "border-sky-200 bg-sky-50 text-sky-900",
};

const TRUTH_STYLE = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  derived: "border-sky-200 bg-sky-50 text-sky-900",
  reported: "border-slate-300 bg-slate-100 text-slate-800",
  estimated: "border-amber-200 bg-amber-50 text-amber-900",
  delayed: "border-amber-200 bg-amber-50 text-amber-900",
  permission_restricted: "border-violet-200 bg-violet-50 text-violet-800",
  unknown: "border-rose-200 bg-rose-50 text-rose-800",
};

const IMPACT_STYLE = {
  low: "border-slate-200 bg-white text-slate-700",
  medium: "border-sky-200 bg-sky-50 text-sky-900",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};

const formatTruth = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

function statusClass(status) {
  return STATUS_STYLE[status] || "border-slate-200 bg-white text-slate-700";
}

export function StatusPill({ status }) {
  const Icon = status === "Complete" || status === "Healthy" || status === "Resolved" ? CheckCircle2 : Circle;

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

export function TruthPill({ label, value = "reported" }) {
  const normalized = String(value).toLowerCase();

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
        TRUTH_STYLE[normalized] || TRUTH_STYLE.reported
      }`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {label}: {formatTruth(value)}
    </span>
  );
}

export function PhaseERouteNav({ activeId }) {
  return (
    <nav aria-label="Phase E review routes" className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {PHASE_E_ROUTES.map((route) => {
          const Icon = ROUTE_ICON[route.id] || LayoutDashboard;
          const active = route.id === activeId;

          return (
            <Link
              key={route.id}
              to={route.path}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none ${
                active
                  ? "border-[#0f2d52] bg-[#0f2d52] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className="min-w-0 truncate">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SourceIssueLinks() {
  return (
    <section aria-labelledby="phase-e-source-title" className="border border-slate-200 bg-white p-4">
      <h2 id="phase-e-source-title" className="text-sm font-semibold text-slate-950">
        Source Contracts
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {PHASE_E_SOURCE_ISSUES.map((issue) => (
          <a
            key={issue.number}
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 motion-reduce:transition-none"
            aria-label={`Open GitHub issue ${issue.number}: ${issue.title}`}
          >
            #{issue.number}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

export function SourceSemantics({ semantics }) {
  return (
    <section aria-labelledby="phase-e-semantics-title" className="border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-semantics-title" className="text-base font-semibold text-slate-950">
          Source Semantics
        </h2>
      </div>
      <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        {Object.entries(semantics).map(([label, value]) => (
          <div key={label} className="border-t border-slate-200 pt-3">
            <dt className="font-semibold capitalize text-slate-600">{label}</dt>
            <dd className="mt-1 leading-6 text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function LifecycleTimeline({ section }) {
  return (
    <section aria-labelledby="phase-e-lifecycle-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f2d52]">Journey</p>
          <h2 id="phase-e-lifecycle-title" className="mt-1 text-xl font-semibold text-slate-950">
            Lifecycle States
          </h2>
        </div>
        <StatusPill status="Current" />
      </div>
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {section.lifecycle.map((step, index) => (
          <li key={`${step.label}-${index}`} className="border-l-2 border-slate-200 pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Step {index + 1}</span>
              <StatusPill status={step.status} />
            </div>
            <h3 className="mt-2 text-base font-semibold text-slate-950">{step.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ComponentInventory({ sectionId }) {
  const components = getPhaseEComponents(sectionId);

  return (
    <section aria-labelledby="phase-e-components-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-components-title" className="text-xl font-semibold text-slate-950">
          Components Created
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {components.map((componentName) => (
          <article
            key={componentName}
            id={componentName}
            data-phase-e-component-card="true"
            aria-labelledby={`${componentName}-title`}
            className="border border-slate-200 bg-white p-4"
          >
            <h3 id={`${componentName}-title`} className="text-sm font-semibold text-slate-950">
              {componentName}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Fixture-backed Phase E component with explicit state, source, owner, business impact, and recovery behavior.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function InterruptionGrid({ interruptions }) {
  return (
    <section aria-labelledby="phase-e-interruptions-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-interruptions-title" className="text-xl font-semibold text-slate-950">
          Lifecycle Interruptions
        </h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {interruptions.map((item) => (
          <article key={item.id} id={item.id} className="border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.capability}</p>
              </div>
              <StatusPill status={item.status} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-600">Progress Preserved</dt>
                <dd className="mt-1 leading-6 text-slate-950">{item.preserved}</dd>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-600">Owner</dt>
                <dd className="mt-1 leading-6 text-slate-950">{item.owner}</dd>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-600">Recovery Path</dt>
                <dd className="mt-1 break-words leading-6 text-slate-950">{item.recovery}</dd>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-600">Impact</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex min-h-8 items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      IMPACT_STYLE[item.impact] || IMPACT_STYLE.medium
                    }`}
                  >
                    {formatTruth(item.impact)}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <TruthPill label="Truth" value={item.truth} />
              <Link
                to={item.recovery?.startsWith("/") ? item.recovery : "#"}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0f2d52] transition-colors hover:bg-slate-50 motion-reduce:transition-none"
              >
                Open recovery
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ActionList({ actions }) {
  return (
    <section aria-labelledby="phase-e-actions-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserRoundCheck className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-actions-title" className="text-xl font-semibold text-slate-950">
          Recommended Actions
        </h2>
      </div>
      <ul className="divide-y divide-slate-200">
        {actions.map((item) => (
          <li key={`${item.title}-${item.destination}`} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-center">
            <div>
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">Owner: {item.owner}</p>
            </div>
            <StatusPill status={item.state} />
            <Link
              to={item.destination?.startsWith("/") ? item.destination : "#"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0f2d52] transition-colors hover:bg-slate-50 motion-reduce:transition-none"
            >
              Open
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KeyboardModel({ keyboard }) {
  if (!keyboard) return null;

  return (
    <section aria-labelledby="phase-e-keyboard-title" className="border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Command className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-keyboard-title" className="text-xl font-semibold text-slate-950">
          Keyboard Model
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{keyboard}</p>
    </section>
  );
}

export function StateCoverage({ states }) {
  return (
    <section aria-labelledby="phase-e-state-coverage-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-state-coverage-title" className="text-xl font-semibold text-slate-950">
          State Coverage
        </h2>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Supported Phase E states">
        {states.map((state) => (
          <li key={state}>
            <StatusPill status={state} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ValidationSummary({ route }) {
  return (
    <section aria-labelledby="phase-e-validation-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
          <h2 id="phase-e-validation-title" className="text-xl font-semibold text-slate-950">
            Validation Targets
          </h2>
        </div>
        <span
          role="status"
          aria-live="polite"
          className="inline-flex min-h-8 items-center rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800"
        >
          Review fixture from #{PHASE_E_SOURCE.issue}
        </span>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Browser Matrix</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PHASE_E_VIEWPORTS.map((viewport) => (
              <li key={`${viewport.width}-${viewport.height}`}>
                <StatusPill status={`${viewport.width}`} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Accessibility</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {PHASE_E_ACCESSIBILITY_REQUIREMENTS.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#0f2d52]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div id="truth-rules">
          <h3 className="text-sm font-semibold text-slate-950">Truth Validation</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {PHASE_E_TRUTH_RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#0f2d52]" aria-hidden="true" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {route.system} is included in `scripts/validate-phase-e-browser.mjs` and the Worker #3 review packet.
      </p>
    </section>
  );
}

export function AcceptanceChecklist({ section }) {
  return (
    <section aria-labelledby="phase-e-acceptance-title" className="border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
        <h2 id="phase-e-acceptance-title" className="text-xl font-semibold text-slate-950">
          Acceptance
        </h2>
      </div>
      <ul className="space-y-3 text-sm leading-6 text-slate-700">
        {section.acceptance.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-700" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PhaseEReviewShell({ route, section, children }) {
  const Icon = ROUTE_ICON[route.id] || LayoutDashboard;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8" aria-labelledby="phase-e-title">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Link
            to="/review/phase-e/onboarding"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 motion-reduce:transition-none"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Phase E
          </Link>
          <PhaseERouteNav activeId={route.id} />
          <SourceIssueLinks />
        </aside>

        <div className="min-w-0 space-y-6">
          <header className="border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    Workstream {route.workstream}
                  </span>
                  <span
                    role="status"
                    aria-live="polite"
                    className="inline-flex min-h-8 items-center rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800"
                  >
                    Fixture only: no production adapters connected
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f2d52]">{section.eyebrow}</p>
                <h1 id="phase-e-title" className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                  {section.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">{section.summary}</p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{section.intent}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2 xl:w-80 xl:grid-cols-1">
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-600">Route</p>
                  <p className="mt-1 break-all text-slate-950">{route.path}</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-600">System</p>
                  <p className="mt-1 text-slate-950">{route.system}</p>
                </div>
              </div>
            </div>
          </header>

          {children}

          <section aria-labelledby="phase-e-component-map-title" className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#0f2d52]" aria-hidden="true" />
              <h2 id="phase-e-component-map-title" className="text-xl font-semibold text-slate-950">
                Phase E Component Map
              </h2>
            </div>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.entries(PHASE_E_COMPONENTS).map(([id, components]) => (
                <div key={id} className="border-t border-slate-200 pt-3">
                  <dt className="font-semibold text-slate-950">{PHASE_E_ROUTES.find((item) => item.id === id)?.system}</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-700">{components.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
