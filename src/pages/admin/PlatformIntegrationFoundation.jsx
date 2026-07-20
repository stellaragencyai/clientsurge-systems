import AdminShell from "@/components/admin/AdminShell";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Database,
  KeyRound,
  Layers,
  Link2,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  CUSTOMER_CONTEXT_CONTRACT,
  DATA_TRUTH_LAYER,
  PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  PLATFORM_ACTIVITY_EVENT_CONTRACT,
  PLATFORM_NAVIGATION_SECTIONS,
  PLATFORM_NOTIFICATION_CONTRACT,
  PLATFORM_PERMISSION_SCOPES,
  PLATFORM_PHASE_F_SOURCE,
  PLATFORM_READINESS_CHECKS,
  PLATFORM_ROUTES,
  PLATFORM_SEARCH_RESULT_FIELDS,
  PLATFORM_SEARCH_SOURCES,
  PLATFORM_SEARCH_STATES,
  PLATFORM_UNAUTHORIZED_STATES,
  PLATFORM_VALIDATION_VIEWPORTS,
  WORKER_3_PACKET,
  getPlatformBreadcrumbs,
  validatePlatformIntegrationFoundation,
} from "@/lib/platformIntegrationFoundation";

const iconBySection = {
  "command-center": ClipboardList,
  intelligence: Activity,
  operations: ShieldCheck,
  customers: Users,
  communications: Bell,
  "ai-workforce": Layers,
  administration: KeyRound,
  account: Database,
};

const routeGroups = PLATFORM_NAVIGATION_SECTIONS.map((section) => ({
  ...section,
  routes: PLATFORM_ROUTES.filter((route) => route.navigationLocation.section === section.id)
    .sort((a, b) => a.navigationLocation.order - b.navigationLocation.order),
}));

function StatusBadge({ tone = "slate", children }) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function SummaryTile({ label, value, description, tone }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col items-start gap-2">
        <p className="whitespace-nowrap text-xs font-semibold text-slate-500">{label}</p>
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{description}</p>
    </article>
  );
}

function SectionTitle({ id, icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Icon className="h-5 w-5 text-sky-700" aria-hidden="true" />
      </div>
      <div>
        <h2 id={id} className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function NavigationArchitecture() {
  return (
    <section aria-labelledby="navigation-architecture-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        id="navigation-architecture-title"
        icon={Link2}
        title="Global Navigation"
        description="Every route has a title, description, permission requirement, navigation location, and deep-link destination."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {routeGroups.map((group) => {
          const Icon = iconBySection[group.id] || Layers;
          return (
            <article key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-700" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-950">{group.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{group.description}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm" aria-label={`${group.label} route inventory`}>
                {group.routes.slice(0, 7).map((route) => (
                  <li key={route.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-950">{route.navigationLocation.label}</span>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{route.destination}</code>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{route.description}</p>
                  </li>
                ))}
              </ul>
              {group.routes.length > 7 ? (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {group.routes.length - 7} additional protected routes registered in the contract.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SearchArchitecture() {
  return (
    <section aria-labelledby="search-architecture-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        id="search-architecture-title"
        icon={Search}
        title="Universal Search"
        description="Search sources share one result contract and explicit states for loading, empty, partial, restricted, and error outcomes."
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <caption className="sr-only">Universal search source contract</caption>
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Destination</th>
                <th scope="col" className="px-4 py-3 font-semibold">Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {PLATFORM_SEARCH_SOURCES.map((source) => (
                <tr key={source.id}>
                  <th scope="row" className="px-4 py-3 text-left font-semibold text-slate-950">{source.id}</th>
                  <td className="px-4 py-3 text-slate-700">{source.type}</td>
                  <td className="px-4 py-3 text-slate-700">{source.destination}</td>
                  <td className="px-4 py-3 text-slate-700">{source.permission.permission} / {source.permission.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Required Result Fields</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORM_SEARCH_RESULT_FIELDS.map((field) => (
                <StatusBadge key={field} tone="sky">{field}</StatusBadge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">States</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORM_SEARCH_STATES.map((state) => (
                <StatusBadge key={state} tone={state === "Error" ? "rose" : state === "Permission Restricted" ? "violet" : "slate"}>{state}</StatusBadge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContractPanel({ id, icon, title, description, fields, chips }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle id={id} icon={icon} title={title} description={description} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">Required Fields</p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {fields.map((field) => (
              <li key={field} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{field}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">States And Sources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <StatusBadge key={chip} tone={chip === "Critical" || chip === "Security" ? "rose" : chip === "Restricted" ? "violet" : "slate"}>
                {chip}
              </StatusBadge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PermissionTruthLayer() {
  return (
    <section aria-labelledby="permission-truth-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        id="permission-truth-title"
        icon={ShieldCheck}
        title="Permissions And Truth Layer"
        description="Permission decisions support organization, client, and location scope. Truth rules block unsafe state promotion."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Permission Enforcement</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLATFORM_PERMISSION_SCOPES.map((scope) => <StatusBadge key={scope} tone="sky">{scope}</StatusBadge>)}
            {PLATFORM_UNAUTHORIZED_STATES.map((state) => <StatusBadge key={state} tone="violet">{state}</StatusBadge>)}
          </div>
        </article>
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Data Truth States</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DATA_TRUTH_LAYER.truthStates.map((state) => <StatusBadge key={state} tone={state === "Verified" ? "emerald" : "amber"}>{state}</StatusBadge>)}
            {DATA_TRUTH_LAYER.freshnessStates.map((state) => <StatusBadge key={state} tone={state === "Live" ? "emerald" : "slate"}>{state}</StatusBadge>)}
          </div>
        </article>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {DATA_TRUTH_LAYER.deniedPromotions.map((rule) => (
          <div key={`${rule.from}-${rule.to}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">{rule.from} cannot become {rule.to}</p>
            <p className="mt-1 leading-5">{rule.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadinessHarness({ validation }) {
  return (
    <section aria-labelledby="readiness-harness-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        id="readiness-harness-title"
        icon={ClipboardList}
        title="Production Readiness Harness"
        description="Static validation covers navigation, search, notifications, permissions, deep links, customer context, accessibility, and responsive viewports."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Harness Status</p>
            <span role="status" aria-live="polite">
              <StatusBadge tone={validation.ok ? "emerald" : "rose"}>{validation.ok ? "Ready" : "Blocked"}</StatusBadge>
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="font-semibold text-slate-600">Routes</dt>
              <dd className="mt-1 text-slate-950">{validation.checked.routes}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Search sources</dt>
              <dd className="mt-1 text-slate-950">{validation.checked.searchSources}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Notifications</dt>
              <dd className="mt-1 text-slate-950">{validation.checked.notificationSources}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Activity sources</dt>
              <dd className="mt-1 text-slate-950">{validation.checked.activitySources}</dd>
            </div>
          </dl>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLATFORM_READINESS_CHECKS.map((check) => (
            <article key={check.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{check.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{check.expectations.join(", ")}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PLATFORM_VALIDATION_VIEWPORTS.map((viewport) => <StatusBadge key={viewport} tone="sky">{viewport}px</StatusBadge>)}
        {PLATFORM_ACCESSIBILITY_REQUIREMENTS.map((item) => <StatusBadge key={item} tone="slate">{item}</StatusBadge>)}
      </div>
    </section>
  );
}

function WorkerPacket() {
  return (
    <section aria-labelledby="worker-packet-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle
        id="worker-packet-title"
        icon={AlertTriangle}
        title="Worker #3 Packet"
        description="Review targets for UX consistency, workflow quality, accessibility, and enterprise polish."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {WORKER_3_PACKET.reviewFocus.map((item) => (
          <article key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {item}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function PlatformIntegrationFoundation() {
  const validation = validatePlatformIntegrationFoundation();
  const breadcrumbs = getPlatformBreadcrumbs("/admin/platform");

  return (
    <AdminShell title="Platform Integration" activeId="platform-integration">
      <main className="space-y-6 text-slate-950" aria-labelledby="platform-integration-title">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {breadcrumbs.map((item, index) => (
            <span key={item.destination} className="flex items-center gap-2">
              <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{item.label}</span>
              {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
            </span>
          ))}
        </nav>

        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone="sky">{PLATFORM_PHASE_F_SOURCE.phase}</StatusBadge>
                <StatusBadge tone={validation.ok ? "emerald" : "rose"}>{validation.ok ? "Validation Ready" : "Validation Blocked"}</StatusBadge>
                <StatusBadge tone="slate">{PLATFORM_PHASE_F_SOURCE.owner}</StatusBadge>
              </div>
              <h1 id="platform-integration-title" className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                {PLATFORM_PHASE_F_SOURCE.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
                {PLATFORM_PHASE_F_SOURCE.scope}. This page is the reviewable integration layer for the existing ClientSurge OS systems.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[26rem]">
              <SummaryTile label="Routes" value={validation.checked.routes} tone="sky" description="Registered with title, description, permission, nav location, and destination." />
              <SummaryTile label="Search" value={validation.checked.searchSources} tone="violet" description="Sources mapped to one universal result contract." />
              <SummaryTile label="Viewports" value={PLATFORM_VALIDATION_VIEWPORTS.length} tone="emerald" description="Desktop, tablet, and mobile widths in the harness." />
            </div>
          </div>
        </header>

        <NavigationArchitecture />
        <SearchArchitecture />
        <div className="grid gap-6 xl:grid-cols-2">
          <ContractPanel
            id="notification-architecture-title"
            icon={Bell}
            title="Notification Architecture"
            description="Notifications carry priority, source, owner, destination, and lifecycle state."
            fields={PLATFORM_NOTIFICATION_CONTRACT.requiredFields}
            chips={[...PLATFORM_NOTIFICATION_CONTRACT.sources, ...PLATFORM_NOTIFICATION_CONTRACT.states]}
          />
          <ContractPanel
            id="activity-system-title"
            icon={Activity}
            title="Global Activity System"
            description="Activity events preserve actor, timestamp, source, verification, related object, and deep link."
            fields={PLATFORM_ACTIVITY_EVENT_CONTRACT.requiredFields}
            chips={[...PLATFORM_ACTIVITY_EVENT_CONTRACT.sources, PLATFORM_ACTIVITY_EVENT_CONTRACT.provenancePolicy]}
          />
        </div>
        <ContractPanel
          id="customer-context-title"
          icon={Users}
          title="Customer Context Engine"
          description="Customer-facing routes can receive one context shape across timeline, communications, AI workforce, opportunities, and support."
          fields={CUSTOMER_CONTEXT_CONTRACT.requiredFields}
          chips={CUSTOMER_CONTEXT_CONTRACT.surfaces}
        />
        <PermissionTruthLayer />
        <ReadinessHarness validation={validation} />
        <WorkerPacket />
      </main>
    </AdminShell>
  );
}
