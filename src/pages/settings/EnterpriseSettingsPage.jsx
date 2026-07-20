import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileClock,
  Gauge,
  HelpCircle,
  KeyRound,
  Layers,
  Link2,
  LockKeyhole,
  MapPin,
  Paintbrush,
  Receipt,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
} from "lucide-react";
import {
  ENTERPRISE_ACCESSIBILITY_REQUIREMENTS,
  ENTERPRISE_ADMIN_PERMISSIONS,
  ENTERPRISE_ADMIN_ROLES,
  ENTERPRISE_ADMIN_SCOPES,
  ENTERPRISE_DESTRUCTIVE_ACTION_SAFEGUARDS,
  ENTERPRISE_RESPONSIVE_VALIDATION,
  ENTERPRISE_REVIEW_ACCEPTANCE,
  ENTERPRISE_SETTINGS_ROUTES,
  PHASE_D_SOURCE,
  ROLE_PERMISSION_MATRIX,
  getEnterpriseRoute,
  getEnterpriseSection,
  getStateLabelsForSection,
} from "@/lib/enterpriseAdminFoundation";
import { fetchEnterpriseOrganizationSection } from "@/lib/enterpriseOrganizationSettingsSource";
import { fetchEnterpriseTeamSection } from "@/lib/enterpriseTeamManagementSource";

const SECTION_SOURCE_LOADERS = {
  organization: {
    label: "Organization",
    load: fetchEnterpriseOrganizationSection,
  },
  team: {
    label: "Team",
    load: fetchEnterpriseTeamSection,
  },
};

const ROUTE_ICON = {
  organization: Building2,
  team: Users,
  roles: UserCog,
  integrations: Link2,
  billing: CreditCard,
  usage: Gauge,
  notifications: Bell,
  security: LockKeyhole,
  audit: FileClock,
  support: HelpCircle,
};

const PANEL_ICON = {
  company: Building2,
  locations: MapPin,
  domains: Link2,
  brand: Paintbrush,
  preferences: SlidersHorizontal,
  users: Users,
  invites: Bell,
  teams: Layers,
  assignments: ClipboardList,
  activity: Activity,
  rbac: UserCog,
  approval: ShieldCheck,
  stripe: CreditCard,
  twilio: Activity,
  resend: Bell,
  "google-business": MapPin,
  analytics: Gauge,
  subscription: Receipt,
  "payment-method": CreditCard,
  invoices: Receipt,
  "scheduled-change": FileClock,
  metering: Gauge,
  entitlements: KeyRound,
  channels: Bell,
  escalations: AlertTriangle,
  "login-history": LockKeyhole,
  sessions: ShieldCheck,
  "permissions-changes": UserCog,
  "audit-events": FileClock,
  "security-alerts": AlertTriangle,
  "audit-history": FileClock,
  exports: ClipboardList,
  "support-center": HelpCircle,
  escalation: AlertTriangle,
};

const STATUS_STYLE = {
  Current: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Connected: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Trial: "border-sky-200 bg-sky-50 text-sky-800",
  Verifying: "border-sky-200 bg-sky-50 text-sky-800",
  Prepared: "border-sky-200 bg-sky-50 text-sky-800",
  Partial: "border-amber-200 bg-amber-50 text-amber-900",
  Delayed: "border-amber-200 bg-amber-50 text-amber-900",
  Estimated: "border-amber-200 bg-amber-50 text-amber-900",
  "Scheduled Change": "border-amber-200 bg-amber-50 text-amber-900",
  Stale: "border-orange-200 bg-orange-50 text-orange-900",
  Degraded: "border-orange-200 bg-orange-50 text-orange-900",
  Disconnected: "border-slate-200 bg-slate-100 text-slate-700",
  Unknown: "border-slate-200 bg-slate-100 text-slate-700",
  Unavailable: "border-slate-200 bg-slate-100 text-slate-700",
  Restricted: "border-violet-200 bg-violet-50 text-violet-800",
  "Permission Required": "border-violet-200 bg-violet-50 text-violet-800",
  "Permission Restricted": "border-violet-200 bg-violet-50 text-violet-800",
  "Payment Failed": "border-rose-200 bg-rose-50 text-rose-800",
  "Past Due": "border-rose-200 bg-rose-50 text-rose-800",
  Alert: "border-rose-200 bg-rose-50 text-rose-800",
  "SLA At Risk": "border-rose-200 bg-rose-50 text-rose-800",
  Open: "border-sky-200 bg-sky-50 text-sky-800",
  Loading: "border-sky-200 bg-sky-50 text-sky-800",
  Empty: "border-slate-200 bg-slate-100 text-slate-700",
};

function statusClass(status) {
  return STATUS_STYLE[status] || "border-slate-200 bg-white text-slate-700";
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}
    >
      {status}
    </span>
  );
}

function SectionNav({ activeId }) {
  const grouped = ENTERPRISE_SETTINGS_ROUTES.reduce((acc, route) => {
    acc[route.navGroup] ||= [];
    acc[route.navGroup].push(route);
    return acc;
  }, {});

  return (
    <nav aria-label="Enterprise settings sections" className="space-y-4">
      {Object.entries(grouped).map(([group, routes]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">{group}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {routes.map((route) => {
              const Icon = ROUTE_ICON[route.id] || Settings;
              const active = route.id === activeId;
              return (
                <Link
                  key={route.id}
                  to={route.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none ${
                    active
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="min-w-0 truncate">{route.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SourceSemantics({ semantics }) {
  return (
    <section aria-labelledby="source-semantics-title" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <h2 id="source-semantics-title" className="text-base font-semibold text-slate-950">
          Source Semantics
        </h2>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {Object.entries(semantics).map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <dt className="font-semibold capitalize text-slate-600">{label}</dt>
            <dd className="mt-1 text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SourceBindingNotice({ binding }) {
  if (!binding) return null;

  const bindingRows = Object.entries(binding).filter(([key]) => !["errors"].includes(key));

  return (
    <section aria-labelledby="source-binding-title" className="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileClock className="h-5 w-5 text-violet-800" aria-hidden="true" />
            <h2 id="source-binding-title" className="text-base font-semibold text-violet-950">
              Read-only Source Binding
            </h2>
          </div>
          <p className="text-sm leading-6 text-violet-950">
            Values may include read-only source snapshots. They remain unverified until canonical records, RBAC enforcement, and audit proof are bound.
          </p>
        </div>
        <StatusPill status={binding.status} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {bindingRows.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-violet-200 bg-white/70 p-3">
            <dt className="font-semibold text-violet-800">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}
            </dt>
            <dd className="mt-1 break-words text-violet-950">{value}</dd>
          </div>
        ))}
      </dl>
      {binding.errors?.length ? (
        <ul className="mt-3 space-y-1 text-sm text-violet-950" aria-label="Source binding read issues">
          {binding.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PanelCard({ panel }) {
  const Icon = PANEL_ICON[panel.id] || Settings;
  const describedBy = `${panel.id}-consequence`;

  return (
    <article
      id={panel.id}
      aria-labelledby={`${panel.id}-title`}
      aria-describedby={describedBy}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Icon className="h-5 w-5 text-sky-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 id={`${panel.id}-title`} className="text-base font-semibold text-slate-950">
              {panel.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{panel.scope}</p>
          </div>
        </div>
        <StatusPill status={panel.status} />
      </div>

      <dl className="mt-5 grid gap-2 text-sm">
        {panel.fields.map(([label, value]) => (
          <div key={label} className="grid gap-1 rounded-lg bg-slate-50 p-3 sm:grid-cols-[9rem_1fr]">
            <dt className="font-semibold text-slate-600">{label}</dt>
            <dd className="text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Source</p>
          <p className="mt-1 text-slate-950">{panel.source}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Freshness</p>
          <p className="mt-1 text-slate-950">{panel.freshness}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Verification</p>
          <p className="mt-1 text-slate-950">{panel.verification}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Next Action</p>
          <p className="mt-1 text-slate-950">{panel.nextAction}</p>
        </div>
      </div>

      <p id={describedBy} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        {panel.consequence}
      </p>
    </article>
  );
}

function StateContract({ section }) {
  const states = getStateLabelsForSection(section);

  return (
    <section aria-labelledby="state-contract-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <h2 id="state-contract-title" className="text-base font-semibold text-slate-950">
          State Contract
        </h2>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Supported review and product states">
        {states.map((state) => (
          <li key={state}>
            <StatusPill status={state} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PermissionMatrix() {
  return (
    <section aria-labelledby="permission-matrix-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="permission-matrix-title" className="text-base font-semibold text-slate-950">
            Permission Matrix
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Roles, permissions, and scopes are explicit for Worker #3 enforcement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status="Current" />
          <StatusPill status="Restricted" />
        </div>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Roles</p>
          <p className="mt-1 text-slate-950">{ENTERPRISE_ADMIN_ROLES.join(", ")}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Permissions</p>
          <p className="mt-1 text-slate-950">{ENTERPRISE_ADMIN_PERMISSIONS.join(", ")}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-600">Scopes</p>
          <p className="mt-1 text-slate-950">{ENTERPRISE_ADMIN_SCOPES.join(", ")}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[760px] w-full border-collapse text-sm">
          <caption className="sr-only">Enterprise RBAC matrix by role and scope</caption>
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Scope</th>
              <th scope="col" className="px-4 py-3 font-semibold">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ROLE_PERMISSION_MATRIX.map((row) => (
              <tr key={`${row.role}-${row.scope}`} className="bg-white">
                <th scope="row" className="px-4 py-3 text-left font-semibold text-slate-950">
                  {row.role}
                </th>
                <td className="px-4 py-3 text-slate-700">{row.scope}</td>
                <td className="px-4 py-3 text-slate-700">{row.permissions.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChecklistSection({ title, icon: Icon, items, id }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <h2 id={id} className="text-base font-semibold text-slate-950">
          {title}
        </h2>
      </div>
      <ul className="space-y-3 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ValidationMatrix() {
  return (
    <section aria-labelledby="validation-matrix-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <h2 id="validation-matrix-title" className="text-base font-semibold text-slate-950">
          Validation Matrix
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {ENTERPRISE_RESPONSIVE_VALIDATION.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-semibold text-slate-950">{item.label}</p>
            <p className="mt-1 text-slate-600">{item.viewport}</p>
            <p className="mt-2 text-slate-700">{item.expectation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function EnterpriseSettingsPage({ sectionId = "organization" }) {
  const route = getEnterpriseRoute(sectionId);
  const baseSection = getEnterpriseSection(sectionId);
  const sourceLoader = SECTION_SOURCE_LOADERS[sectionId];
  const [boundSection, setBoundSection] = useState(null);
  const [bindingStatus, setBindingStatus] = useState("Loading");
  const section = sourceLoader && boundSection ? boundSection : baseSection;
  const Icon = ROUTE_ICON[route.id] || Settings;

  useEffect(() => {
    let active = true;

    if (!sourceLoader) {
      setBoundSection(null);
      setBindingStatus("Empty");
      return () => {
        active = false;
      };
    }

    setBindingStatus("Loading");
    sourceLoader.load()
      .then((nextSection) => {
        if (!active) return;
        setBoundSection(nextSection);
        setBindingStatus(nextSection.sourceBinding?.status || "Current");
      })
      .catch((error) => {
        if (!active) return;
        setBindingStatus("Partial");
        setBoundSection({
          ...baseSection,
          sourceBinding: {
            mode: "read-only",
            status: "Partial",
            sources: "fixture fallback only",
            errors: [error?.message || `${sourceLoader.label} source binding failed`],
          },
        });
      });

    return () => {
      active = false;
    };
  }, [baseSection, sourceLoader]);

  if (!ENTERPRISE_SETTINGS_ROUTES.some((item) => item.id === sectionId)) {
    return <Navigate to="/settings/organization" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8" aria-labelledby="enterprise-settings-title">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 motion-reduce:transition-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Admin
          </Link>
          <SectionNav activeId={route.id} />
        </aside>

        <div className="min-w-0 space-y-6">
          <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {section.eyebrow}
                  </span>
                  <span
                    role="status"
                    aria-live="polite"
                    className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800"
                  >
                    Review fixture from #{PHASE_D_SOURCE.issue}
                  </span>
                  {sourceLoader ? (
                    <span
                      role="status"
                      aria-live="polite"
                      className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                    >
                      {sourceLoader.label} binding {bindingStatus}
                    </span>
                  ) : null}
                </div>
                <h1 id="enterprise-settings-title" className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {section.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
                  {section.summary}
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:w-72 lg:grid-cols-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-600">Route</p>
                  <p className="mt-1 break-all text-slate-950">{route.path}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-600">Priority</p>
                  <p className="mt-1 text-slate-950">Phase D priority {route.priority}</p>
                </div>
              </div>
            </div>
          </header>

          <SourceSemantics semantics={section.sourceSemantics} />
          <SourceBindingNotice binding={section.sourceBinding} />

          <section aria-labelledby="panels-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="panels-title" className="text-xl font-semibold text-slate-950">
                  Panels
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Each panel separates fixture state from verified source truth.
                </p>
              </div>
              <StatusPill status="Current" />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {section.panels.map((panel) => (
                <PanelCard key={panel.id} panel={panel} />
              ))}
            </div>
          </section>

          {section.showPermissionMatrix ? <PermissionMatrix /> : null}

          <StateContract section={section} />

          <div className="grid gap-4 xl:grid-cols-2">
            <ChecklistSection
              id="safeguards-title"
              title="Safeguards"
              icon={ShieldCheck}
              items={[...section.safeguards, ...ENTERPRISE_DESTRUCTIVE_ACTION_SAFEGUARDS]}
            />
            <ChecklistSection
              id="activity-audit-title"
              title="Activity And Audit Events"
              icon={FileClock}
              items={section.auditEvents}
            />
            <ChecklistSection
              id="acceptance-title"
              title="Acceptance"
              icon={CheckCircle2}
              items={[...section.acceptance, ...ENTERPRISE_REVIEW_ACCEPTANCE]}
            />
            <ChecklistSection
              id="accessibility-title"
              title="Accessibility"
              icon={ClipboardList}
              items={ENTERPRISE_ACCESSIBILITY_REQUIREMENTS}
            />
          </div>

          <ValidationMatrix />
        </div>
      </div>
    </main>
  );
}
