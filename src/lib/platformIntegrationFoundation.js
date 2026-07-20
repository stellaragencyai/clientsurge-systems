import {
  ENTERPRISE_SETTINGS_ROUTES,
  ROLE_SCOPE_PERMISSIONS,
} from "./enterpriseAdminFoundation.js";

export const PLATFORM_PHASE_F_SOURCE = {
  phase: "Phase F",
  title: "Platform Integration Foundation",
  owner: "Worker #1",
  scope: "Connect existing ClientSurge OS foundations into one operating system",
  constraints: [
    "Connect existing systems instead of creating standalone modules",
    "Preserve provenance and truth labels across every integration",
    "Keep live, verified, derived, estimated, reported, and unknown states separate",
  ],
};

export const PLATFORM_NAVIGATION_SECTION_IDS = [
  "command-center",
  "intelligence",
  "operations",
  "customers",
  "communications",
  "ai-workforce",
  "administration",
  "account",
];

export const PLATFORM_NAVIGATION_SECTIONS = [
  {
    id: "command-center",
    label: "Command Center",
    description: "Executive operating view, launch truth, audit command, and platform integration status.",
    desktop: "Persistent shell navigation with active route and breadcrumbs.",
    tablet: "Grouped navigation remains visible with wrapped content.",
    mobile: "Drawer navigation plus top-level quick actions.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    description: "Lead intelligence, analytics, revenue intelligence, attribution, and business health.",
    desktop: "Primary navigation group with metric and insight destinations.",
    tablet: "Grouped nav stays reachable without hiding route context.",
    mobile: "Shown in drawer and universal search.",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Launch, onboarding, deployment, install, verification, incidents, and readiness work.",
    desktop: "Operations routes sit together for repeated execution.",
    tablet: "Two-column surfaces collapse to single-column flow.",
    mobile: "Task-first route list with stable touch targets.",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Leads, client projects, portal, onboarding, opportunities, and customer success context.",
    desktop: "Customer routes retain entity context and deep links.",
    tablet: "Customer context remains above detail surfaces.",
    mobile: "Customer actions reduce to a stacked context sheet.",
  },
  {
    id: "communications",
    label: "Communications",
    description: "Inbox, conversations, templates, logs, email campaigns, and review requests.",
    desktop: "Message, log, and template destinations share one route family.",
    tablet: "Conversation lists and detail panes stack predictably.",
    mobile: "Inbox-first actions stay keyboard and touch reachable.",
  },
  {
    id: "ai-workforce",
    label: "AI Workforce",
    description: "AI agents, automation status, worker activity, provider proof, and review surfaces.",
    desktop: "AI workforce routes stay separate from provider settings.",
    tablet: "Agent cards collapse without losing verification state.",
    mobile: "Worker status appears as compact deep-linkable rows.",
  },
  {
    id: "administration",
    label: "Administration",
    description: "Organization, teams, permissions, integrations, billing, security, audit, and support.",
    desktop: "Enterprise settings routes are protected and noindexed.",
    tablet: "Settings sections wrap by group while preserving current section.",
    mobile: "Section navigation becomes a stacked list with current-page semantics.",
  },
  {
    id: "account",
    label: "Account",
    description: "Billing ownership, usage, support, session state, and client-facing account routes.",
    desktop: "Account routes remain permission-gated and auditable.",
    tablet: "Owner and support actions stay close to account state.",
    mobile: "Account actions use full-width controls with explicit status.",
  },
];

export const PLATFORM_PERMISSION_SCOPES = ["Organization", "Client", "Location"];
export const PLATFORM_UNAUTHORIZED_STATES = ["Hidden", "Restricted", "Request Access"];

const ADMIN_ROLES = ["admin", "super_admin"];
const ADMIN_PERMISSION = {
  roles: ADMIN_ROLES,
  permission: "View",
  scope: "Organization",
  unauthorized: "Hidden",
};

const MANAGE_ORG_PERMISSION = {
  roles: ADMIN_ROLES,
  permission: "Manage",
  scope: "Organization",
  unauthorized: "Restricted",
};

const CLIENT_VIEW_PERMISSION = {
  roles: ["client", "admin", "super_admin"],
  permission: "View",
  scope: "Client",
  unauthorized: "Request Access",
};

const route = ({
  id,
  path,
  tab,
  navigationId,
  title,
  description,
  navSection,
  navLabel,
  order,
  permissionRequirement = ADMIN_PERMISSION,
  deepLinkParams = [],
  system,
}) => ({
  id,
  path,
  tab,
  destination: tab ? `${path}?tab=${tab}` : path,
  title,
  description,
  permissionRequirement,
  navigationLocation: {
    id: navigationId || tab || id,
    section: navSection,
    label: navLabel || title,
    order,
  },
  deepLinkParams,
  system,
});

const SETTINGS_ROUTES = ENTERPRISE_SETTINGS_ROUTES.map((settingsRoute, index) =>
  route({
    id: `settings-${settingsRoute.id}`,
    path: settingsRoute.path,
    title: settingsRoute.system,
    description: `${settingsRoute.label} controls with source, freshness, scope, verification, safeguards, and audit events.`,
    navSection: settingsRoute.id === "billing" || settingsRoute.id === "usage" || settingsRoute.id === "support"
      ? "account"
      : "administration",
    navLabel: settingsRoute.label,
    order: 80 + index,
    permissionRequirement: settingsRoute.id === "roles" || settingsRoute.id === "security" || settingsRoute.id === "audit"
      ? MANAGE_ORG_PERMISSION
      : ADMIN_PERMISSION,
    deepLinkParams: ["section"],
    system: settingsRoute.system,
  }),
);

export const PLATFORM_ROUTES = [
  route({
    id: "admin-overview",
    path: "/admin",
    navigationId: "overview",
    title: "Command Center Overview",
    description: "Unified admin overview for leads, client launch, automation, revenue, and system proof.",
    navSection: "command-center",
    navLabel: "Overview",
    order: 1,
    system: "Command Center",
  }),
  route({
    id: "platform-integration",
    path: "/admin/platform",
    title: "Platform Integration Foundation",
    description: "Phase F integration layer connecting navigation, search, notifications, activity, permissions, customer context, truth state, and readiness validation.",
    navSection: "command-center",
    navLabel: "Platform Integration",
    order: 2,
    system: "Platform Integration",
  }),
  route({
    id: "audit-command-center",
    path: "/admin",
    tab: "audit-command-center",
    title: "Audit Command Center",
    description: "Operator command surface for launch gates, audits, blockers, and next actions.",
    navSection: "command-center",
    navLabel: "Audit Command Center",
    order: 3,
    system: "Audit",
  }),
  route({
    id: "launch-proof",
    path: "/admin",
    tab: "launch-proof",
    title: "Launch Proof",
    description: "Separates Git, Base44 publish, live DOM, and production security proof.",
    navSection: "command-center",
    navLabel: "Launch Proof",
    order: 4,
    system: "Production Readiness",
  }),
  route({
    id: "lead-intelligence",
    path: "/admin",
    tab: "lead-intelligence",
    title: "Lead Intelligence",
    description: "Lead scoring, conversion opportunities, and data-quality context.",
    navSection: "intelligence",
    order: 10,
    system: "Lead Intelligence",
  }),
  route({
    id: "analytics",
    path: "/admin",
    tab: "analytics",
    title: "Analytics",
    description: "Performance, traffic, funnel, and verified measurement surfaces.",
    navSection: "intelligence",
    order: 11,
    system: "Business Health",
  }),
  route({
    id: "revenue",
    path: "/admin",
    tab: "revenue",
    title: "Revenue Intelligence",
    description: "Revenue, MRR, subscriptions, and source-labelled financial state.",
    navSection: "intelligence",
    navLabel: "Revenue & MRR",
    order: 12,
    system: "Revenue Intelligence",
  }),
  route({
    id: "revenue-tracking",
    path: "/admin",
    tab: "revenue-tracking",
    title: "Revenue Tracking",
    description: "Detailed revenue tracking with order, subscription, and payment-state context.",
    navSection: "intelligence",
    order: 12.5,
    system: "Revenue Intelligence",
  }),
  route({
    id: "attribution",
    path: "/admin",
    tab: "attribution",
    title: "Source Attribution",
    description: "Campaign, channel, and landing-source attribution with data freshness labels.",
    navSection: "intelligence",
    order: 13,
    system: "Website Intelligence",
  }),
  route({
    id: "landing-traffic",
    path: "/admin",
    tab: "landing-traffic",
    title: "Landing Traffic",
    description: "Landing-page traffic and conversion review with source and freshness context.",
    navSection: "intelligence",
    order: 13.5,
    system: "Website Intelligence",
  }),
  route({
    id: "health",
    path: "/admin",
    tab: "health",
    title: "Integration Health",
    description: "Provider and workflow health with proof-limited operating status.",
    navSection: "intelligence",
    order: 14,
    system: "Business Health",
  }),
  route({
    id: "guided-onboarding",
    path: "/admin",
    tab: "guided-onboarding",
    title: "Launch Guide",
    description: "Operator checklist for onboarding and launch execution.",
    navSection: "operations",
    order: 20,
    system: "Onboarding",
  }),
  route({
    id: "client-projects",
    path: "/admin",
    tab: "client-projects",
    title: "Client Projects",
    description: "Project state, handoff ownership, open work, and customer context.",
    navSection: "operations",
    order: 21,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["client", "order"],
    system: "Customer Success",
  }),
  route({
    id: "deployment-manager",
    path: "/admin",
    tab: "deployment-manager",
    title: "Deployment Manager",
    description: "Deployment plan, release chain, and readiness status.",
    navSection: "operations",
    order: 22,
    system: "Production Readiness",
  }),
  route({
    id: "install-queue",
    path: "/admin",
    tab: "install-queue",
    title: "Install Queue",
    description: "Order-to-install queue with ownership, blockers, and proof state.",
    navSection: "operations",
    order: 23,
    deepLinkParams: ["order"],
    system: "Activation",
  }),
  route({
    id: "launch-gates",
    path: "/admin",
    tab: "launch-gates",
    title: "Launch Gates",
    description: "Launch readiness gates, evidence, blockers, and validation state.",
    navSection: "operations",
    order: 24,
    system: "Production Readiness",
  }),
  route({
    id: "onboarding-orchestration",
    path: "/admin",
    tab: "onboarding-orchestration",
    title: "Onboarding Progress",
    description: "Unified onboarding progress review with task, client, and launch-state context.",
    navSection: "operations",
    order: 24.2,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Onboarding",
  }),
  route({
    id: "install-checklists",
    path: "/admin",
    tab: "install-checklists",
    title: "Install Checklists",
    description: "Installation checklist validation with service, proof, and blocker state.",
    navSection: "operations",
    order: 24.4,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Activation",
  }),
  route({
    id: "ops-verification",
    path: "/admin/ops-verification",
    title: "Ops Verification Center",
    description: "Operations verification for portal, onboarding, readiness, and proof carry-forward.",
    navSection: "operations",
    order: 25,
    system: "Production Readiness",
  }),
  route({
    id: "inbound-readiness",
    path: "/admin/inbound-readiness",
    title: "Inbound Readiness",
    description: "Inbound automation, provider readiness, and operational blockers.",
    navSection: "operations",
    order: 26,
    system: "Operations",
  }),
  route({
    id: "broken-flows",
    path: "/admin/broken-flows",
    title: "Broken Flows",
    description: "Known broken business-critical flows and repair targets.",
    navSection: "operations",
    order: 27,
    system: "Incidents",
  }),
  route({
    id: "publish-drift",
    path: "/admin/publish-drift",
    title: "Publish Drift",
    description: "Git, Base44, public asset, and live route drift diagnostics.",
    navSection: "operations",
    order: 28,
    system: "Incidents",
  }),
  route({
    id: "leads",
    path: "/admin",
    tab: "leads",
    title: "Leads",
    description: "Lead pipeline, quality, source, owner, and activity state.",
    navSection: "customers",
    order: 30,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["lead"],
    system: "Opportunity Center",
  }),
  route({
    id: "lead-detail",
    path: "/admin/leads/:leadId",
    title: "Lead Detail",
    description: "Lead record with source, owner, activity, and conversion context.",
    navSection: "customers",
    order: 31,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["leadId"],
    system: "Opportunity Center",
  }),
  route({
    id: "priority",
    path: "/admin",
    tab: "priority",
    title: "Priority Queue",
    description: "Prioritized outreach queue with activation, booking, and follow-up signals.",
    navSection: "customers",
    order: 32,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["lead"],
    system: "Opportunity Center",
  }),
  route({
    id: "website-leads",
    path: "/admin",
    tab: "website-leads",
    title: "Website Leads",
    description: "Website lead intake with verified-junk guardrails and source context.",
    navSection: "customers",
    order: 33,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Website Intelligence",
  }),
  route({
    id: "demo-bookings",
    path: "/admin",
    tab: "demo-bookings",
    title: "Demo Bookings",
    description: "Booked demos, source context, follow-up ownership, and status.",
    navSection: "customers",
    order: 34,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Opportunity Center",
  }),
  route({
    id: "sales-funnel",
    path: "/admin",
    tab: "sales-funnel",
    title: "Sales Funnel",
    description: "Lead-to-close funnel review with conversion state and blocker context.",
    navSection: "customers",
    order: 35,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Opportunity Center",
  }),
  route({
    id: "opportunity-review",
    path: "/admin/opportunity-review",
    title: "Opportunity Review",
    description: "Review qualified opportunities, recommended actions, and close-risk context.",
    navSection: "customers",
    order: 36,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["opportunity", "lead"],
    system: "Opportunity Center",
  }),
  route({
    id: "client-onboarding",
    path: "/admin/onboarding",
    navigationId: "onboarding",
    title: "Client Onboarding",
    description: "Onboarding workflow, owner assignment, and customer launch state.",
    navSection: "customers",
    order: 37,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Onboarding",
  }),
  route({
    id: "customer-onboarding",
    path: "/admin",
    tab: "customer-onboarding",
    title: "Customer Onboarding",
    description: "Dashboard onboarding panel for customer setup, requirements, and launch handoff.",
    navSection: "customers",
    order: 38,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Onboarding",
  }),
  route({
    id: "onboarding-pipeline",
    path: "/admin/onboarding-pipeline",
    title: "Onboarding Pipeline",
    description: "Client onboarding pipeline with progress, blockers, and ownership.",
    navSection: "customers",
    order: 39,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Onboarding",
  }),
  route({
    id: "platform-clients",
    path: "/admin",
    tab: "platform-clients",
    title: "Platform Clients",
    description: "Client platform records with account, launch, and ownership context.",
    navSection: "customers",
    order: 40,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Customer Success",
  }),
  route({
    id: "sniper",
    path: "/admin",
    tab: "sniper",
    title: "Lead Sniper",
    description: "Lead Sniper prospecting surface with source, owner, and outreach readiness context.",
    navSection: "customers",
    order: 40.5,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Opportunity Center",
  }),
  route({
    id: "client-portal",
    path: "/client-portal",
    title: "Client Portal",
    description: "Client-facing account, launch, support, and performance context.",
    navSection: "customers",
    order: 41,
    permissionRequirement: CLIENT_VIEW_PERMISSION,
    deepLinkParams: ["section"],
    system: "Customer Success",
  }),
  route({
    id: "inbox",
    path: "/admin",
    tab: "inbox",
    title: "Inbox",
    description: "Client and lead conversations with owner, status, and destination.",
    navSection: "communications",
    order: 40,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    deepLinkParams: ["message"],
    system: "Communication Center",
  }),
  route({
    id: "communication-logs",
    path: "/admin",
    tab: "logs",
    navigationId: "logs",
    title: "Communication Logs",
    description: "Inbound and outbound communication events, provider proof, and failures.",
    navSection: "communications",
    navLabel: "Communication Logs",
    order: 41,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Communication Center",
  }),
  route({
    id: "instant-response",
    path: "/admin",
    tab: "instant-response",
    title: "Instant Response",
    description: "Instant lead response diagnostics with provider, timing, and delivery truth states.",
    navSection: "communications",
    order: 41.5,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Communication Center",
  }),
  route({
    id: "templates",
    path: "/admin",
    tab: "templates",
    title: "Templates",
    description: "Email, SMS, and review request templates with source and consent controls.",
    navSection: "communications",
    order: 42,
    system: "Communication Center",
  }),
  route({
    id: "email-campaigns",
    path: "/admin",
    tab: "email-campaigns",
    title: "Email Campaigns",
    description: "Email campaign setup, delivery readiness, and branded sender checks.",
    navSection: "communications",
    order: 43,
    system: "Communication Center",
  }),
  route({
    id: "routing",
    path: "/admin",
    tab: "routing",
    title: "Lead Routing",
    description: "Lead routing rules, owner assignment, and delivery/failure safeguards.",
    navSection: "communications",
    order: 43.5,
    permissionRequirement: { ...ADMIN_PERMISSION, scope: "Client" },
    system: "Communication Center",
  }),
  route({
    id: "review-request",
    path: "/admin",
    tab: "review-request",
    title: "Review Requests",
    description: "Review request workflows, opt-out safeguards, and customer context.",
    navSection: "communications",
    order: 44,
    system: "Communication Center",
  }),
  route({
    id: "failed-jobs",
    path: "/admin",
    tab: "failed-jobs",
    title: "Failed Jobs",
    description: "Failed communication and automation jobs with retry readiness and provider context.",
    navSection: "communications",
    order: 44.3,
    system: "Communication Center",
  }),
  route({
    id: "resend-diagnostics",
    path: "/admin",
    tab: "resend-diagnostics",
    title: "Resend Sender Diagnostics",
    description: "Sender identity and email provider diagnostics with setup and verification state.",
    navSection: "communications",
    order: 44.5,
    system: "Communication Center",
  }),
  route({
    id: "messaging-regression",
    path: "/admin",
    tab: "messaging-regression",
    title: "Messaging Provider Test",
    description: "Messaging provider regression checks with proof-limited pass/fail context.",
    navSection: "communications",
    order: 44.7,
    system: "Communication Center",
  }),
  route({
    id: "social-engine",
    path: "/admin",
    tab: "social-engine",
    title: "Social Media Engine",
    description: "Social content and channel automation surface with provenance and owner context.",
    navSection: "communications",
    order: 44.8,
    system: "Communication Center",
  }),
  route({
    id: "website-copy",
    path: "/admin",
    tab: "website-copy",
    title: "Website Copy AI",
    description: "Website copy generation and review surface with source and approval state.",
    navSection: "communications",
    order: 44.9,
    system: "Communication Center",
  }),
  route({
    id: "ai-marketing",
    path: "/admin/marketing",
    navigationId: "marketing",
    title: "AI Marketing",
    description: "Marketing agent activity and campaign operating context.",
    navSection: "communications",
    order: 45,
    system: "AI Workforce",
  }),
  route({
    id: "automations",
    path: "/admin/automations",
    title: "Automation Status",
    description: "Automation jobs, worker status, and proof-limited execution state.",
    navSection: "ai-workforce",
    order: 50,
    system: "AI Workforce",
  }),
  route({
    id: "automation-activity",
    path: "/admin/automation-activity",
    title: "Automation Activity",
    description: "Automation activity stream with deployment, run, and proof state.",
    navSection: "ai-workforce",
    order: 50.5,
    system: "AI Workforce",
  }),
  route({
    id: "ai-sales",
    path: "/admin/ai-sales",
    title: "AI Sales Command",
    description: "AI sales worker control surface and sales workflow state.",
    navSection: "ai-workforce",
    order: 51,
    system: "AI Workforce",
  }),
  route({
    id: "task-board",
    path: "/admin",
    tab: "task-board",
    title: "Task Board",
    description: "Operator task board for AI and launch work with owner and status context.",
    navSection: "ai-workforce",
    order: 51.3,
    system: "AI Workforce",
  }),
  route({
    id: "campaign-builder",
    path: "/admin",
    tab: "campaign-builder",
    title: "Campaign Builder",
    description: "Campaign builder for AI-assisted outreach with source and approval context.",
    navSection: "ai-workforce",
    order: 51.4,
    system: "AI Workforce",
  }),
  route({
    id: "drip",
    path: "/admin",
    tab: "drip",
    title: "Drip Campaigns",
    description: "Drip campaign automation with sequence, consent, and delivery state.",
    navSection: "ai-workforce",
    order: 51.5,
    system: "AI Workforce",
  }),
  route({
    id: "nurture",
    path: "/admin",
    tab: "nurture",
    title: "Nurture Campaigns",
    description: "Nurture automation with customer stage, cadence, and proof context.",
    navSection: "ai-workforce",
    order: 51.6,
    system: "AI Workforce",
  }),
  route({
    id: "cadence",
    path: "/admin",
    tab: "cadence",
    title: "Dynamic Cadence",
    description: "Dynamic follow-up cadence controls with source and permission state.",
    navSection: "ai-workforce",
    order: 51.7,
    system: "AI Workforce",
  }),
  route({
    id: "reactivation",
    path: "/admin",
    tab: "reactivation",
    title: "Lead Reactivation",
    description: "Reactivation automation for dormant leads with suppression and consent controls.",
    navSection: "ai-workforce",
    order: 51.8,
    system: "AI Workforce",
  }),
  route({
    id: "ai-sales-reps",
    path: "/admin",
    tab: "ai-sales-reps",
    title: "AI Sales Reps",
    description: "AI sales representative readiness, workload, and activity.",
    navSection: "ai-workforce",
    order: 52,
    system: "AI Workforce",
  }),
  route({
    id: "twilio-health",
    path: "/admin",
    tab: "twilio-health",
    title: "Twilio Health",
    description: "Twilio runtime health with provider, message, and delivery proof state.",
    navSection: "ai-workforce",
    order: 52.5,
    system: "AI Workforce",
  }),
  route({
    id: "twilio-growth-engine",
    path: "/admin",
    tab: "twilio-growth-engine",
    title: "Twilio Growth Engine",
    description: "Messaging automation proof, weak provider IDs, and provider-risk review.",
    navSection: "ai-workforce",
    order: 53,
    system: "AI Workforce",
  }),
  route({
    id: "performance-wars",
    path: "/admin/performance-wars",
    title: "Performance Wars",
    description: "Performance comparison and campaign competition surface with bounded proof.",
    navSection: "ai-workforce",
    order: 54,
    system: "AI Workforce",
  }),
  route({
    id: "settings",
    path: "/admin",
    tab: "settings",
    title: "Settings",
    description: "Legacy admin settings panel with organization controls and runtime configuration.",
    navSection: "administration",
    order: 70,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Administration",
  }),
  route({
    id: "lead-quality",
    path: "/admin",
    tab: "lead-quality",
    title: "Lead Quality Control",
    description: "Lead quality control and quarantine review with explicit data-truth guardrails.",
    navSection: "administration",
    order: 71,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Data Quality",
  }),
  route({
    id: "crm-health",
    path: "/admin",
    tab: "crm-health",
    title: "CRM Health",
    description: "CRM health diagnostics for ingestion, data quality, and operational readiness.",
    navSection: "administration",
    order: 72,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Data Quality",
  }),
  route({
    id: "data-quality",
    path: "/admin",
    tab: "data-quality",
    title: "Data Quality",
    description: "Data quality dashboard combining cleanup, validation, and source-freshness context.",
    navSection: "administration",
    order: 73,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Data Quality",
  }),
  route({
    id: "sprint2-blockers",
    path: "/admin/sprint2-blockers",
    title: "Sprint 2 Blockers",
    description: "Sprint 2 blocker verification with proof state and approval boundaries.",
    navSection: "administration",
    order: 74,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Production Readiness",
  }),
  route({
    id: "audit-log",
    path: "/admin",
    tab: "audit-log",
    title: "Audit Log",
    description: "Audit log events with actor, source, timestamp, and verification state.",
    navSection: "administration",
    order: 75,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Audit",
  }),
  route({
    id: "launch-truth-sprint",
    path: "/admin",
    tab: "launch-truth-sprint",
    title: "Launch Truth Sprint",
    description: "Launch truth sprint review with verified, estimated, and unknown states kept separate.",
    navSection: "administration",
    order: 76,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Production Readiness",
  }),
  route({
    id: "canonical-map",
    path: "/admin",
    tab: "canonical-map",
    title: "System Map",
    description: "Canonical system map with ownership, dependency, and integration context.",
    navSection: "administration",
    order: 77,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Administration",
  }),
  route({
    id: "resource-library",
    path: "/admin",
    tab: "resource-library",
    title: "Resource Library",
    description: "Resource and document library with source, owner, and publication state.",
    navSection: "administration",
    order: 78,
    system: "Administration",
  }),
  route({
    id: "qa",
    path: "/admin",
    tab: "qa",
    title: "QA Tools",
    description: "Internal QA tools with admin-only access and explicit testing context.",
    navSection: "administration",
    order: 79,
    permissionRequirement: MANAGE_ORG_PERMISSION,
    system: "Administration",
  }),
  route({
    id: "install-guide",
    path: "/admin/install-guide",
    title: "Install Guide",
    description: "Installation guide and operator reference for client launch work.",
    navSection: "administration",
    order: 79.5,
    system: "Administration",
  }),
  ...SETTINGS_ROUTES,
  route({
    id: "logout",
    path: "/logout",
    title: "Logout",
    description: "End the active account session.",
    navSection: "account",
    order: 99,
    permissionRequirement: {
      roles: ["client", "admin", "super_admin"],
      permission: "View",
      scope: "Organization",
      unauthorized: "Hidden",
    },
    system: "Account",
  }),
];

export const ADMIN_SHELL_NAVIGATION_GROUPS = [
  {
    group: "Command Center",
    items: ["admin-overview", "platform-integration", "audit-command-center", "launch-proof"],
  },
  {
    group: "Intelligence",
    items: ["lead-intelligence", "analytics", "revenue", "attribution", "health"],
  },
  {
    group: "Operations",
    items: [
      "guided-onboarding",
      "client-projects",
      "deployment-manager",
      "install-queue",
      "launch-gates",
      "ops-verification",
      "inbound-readiness",
      "broken-flows",
      "publish-drift",
    ],
  },
  {
    group: "Customers",
    items: ["leads", "priority", "website-leads", "demo-bookings", "client-onboarding", "onboarding-pipeline", "opportunity-review"],
  },
  {
    group: "Communications",
    items: [
      { routeId: "inbox", badge: "inbox" },
      { routeId: "communication-logs", badge: "webhook-errors" },
      "templates",
      "review-request",
      "email-campaigns",
      "routing",
      "ai-marketing",
    ],
  },
  {
    group: "AI Workforce",
    items: ["automations", "ai-sales", "automation-activity", "task-board", "campaign-builder", "drip", "nurture", "cadence", "reactivation"],
  },
  {
    group: "Administration",
    items: [
      { routeId: "settings-organization", id: "enterprise-settings", label: "Enterprise Settings" },
      "settings",
      "crm-health",
      "sprint2-blockers",
      "audit-log",
      "qa",
      "install-guide",
    ],
  },
  {
    group: "Account",
    items: [
      { routeId: "settings-billing", id: "billing" },
      { routeId: "settings-usage", id: "usage" },
      { routeId: "settings-support", id: "support" },
    ],
  },
];

export const ADMIN_DASHBOARD_NAVIGATION_GROUPS = [
  {
    group: "Command Center",
    items: [
      "admin-overview",
      { routeId: "platform-integration", external: true },
      "lead-intelligence",
      { routeId: "inbox", badge: "inbox" },
    ],
  },
  {
    group: "Customers",
    items: ["leads", "priority", "website-leads", "demo-bookings", "sales-funnel"],
  },
  {
    group: "Operations",
    items: ["guided-onboarding", "customer-onboarding", "client-projects", "deployment-manager", "install-queue", "launch-gates"],
  },
  {
    group: "Communications",
    items: [
      { routeId: "automations", external: true },
      "instant-response",
      "email-campaigns",
      "routing",
      { routeId: "communication-logs", badge: "webhook-errors" },
      "failed-jobs",
      { routeId: "ai-marketing", external: true },
    ],
  },
  {
    group: "Intelligence",
    items: ["revenue", "analytics", "attribution", "landing-traffic"],
  },
  {
    group: "Administration",
    items: ["audit-command-center", "launch-proof", "health", "settings"],
  },
];

export const ADMIN_DASHBOARD_SECONDARY_NAVIGATION_ITEMS = [
  "lead-quality",
  "crm-health",
  { routeId: "client-onboarding", external: true },
  "onboarding-orchestration",
  "install-checklists",
  "cadence",
  "reactivation",
  "drip",
  "nurture",
  "revenue-tracking",
  "campaign-builder",
  "launch-truth-sprint",
  "data-quality",
  "platform-clients",
  "twilio-growth-engine",
  "twilio-health",
  "resend-diagnostics",
  "audit-log",
  "canonical-map",
  "resource-library",
  "messaging-regression",
  "ai-sales-reps",
  "sniper",
  { routeId: "ai-sales", id: "ai-sales-cmd", external: true },
  { routeId: "performance-wars", external: true },
  "social-engine",
  "website-copy",
  "task-board",
  "templates",
  "review-request",
  "qa",
  { routeId: "install-guide", external: true },
];

export const ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS = [
  "admin-overview",
  { routeId: "platform-integration", label: "Platform" },
  "leads",
  "inbox",
  "settings",
];

export const PLATFORM_SEARCH_STATES = [
  "Loading",
  "Results",
  "No Results",
  "Partial Results",
  "Permission Restricted",
  "Error",
];

export const PLATFORM_SEARCH_RESULT_FIELDS = [
  "id",
  "title",
  "description",
  "source",
  "type",
  "route",
  "status",
  "owner",
  "timestamp",
  "permission",
  "destination",
  "metadata",
];

export const PLATFORM_SEARCH_SOURCES = [
  {
    id: "customers",
    type: "customer",
    tab: "client-projects",
    recordKeys: ["customers", "customer", "client"],
    entities: ["ClientProject", "Client"],
    fields: ["business_name", "client_name", "company", "full_name", "email", "client_email", "contact_email", "phone"],
    titleFields: ["business_name", "client_name", "company", "full_name", "email", "client_email"],
    ownerFields: ["owner", "owner_name", "account_owner", "client_email", "contact_email", "email"],
    timestampFields: ["updated_date", "created_date", "last_activity_at"],
    destination: "/admin?tab=client-projects&client=:id",
    permission: { ...ADMIN_PERMISSION, scope: "Client" },
  },
  {
    id: "leads",
    type: "lead",
    tab: "leads",
    recordKeys: ["leads", "lead"],
    entities: ["Leads", "Lead", "WebsiteLead"],
    fields: ["business_name", "full_name", "name", "email", "phone", "phone_number", "industry", "source"],
    titleFields: ["business_name", "full_name", "name", "email"],
    ownerFields: ["owner", "assigned_to", "email", "phone", "phone_number"],
    timestampFields: ["updated_date", "created_date", "last_contacted_at"],
    destination: "/admin/leads/:id",
    permission: { ...ADMIN_PERMISSION, scope: "Client" },
  },
  {
    id: "opportunities",
    type: "opportunity",
    tab: "priority",
    recordKeys: ["opportunities", "opportunity", "priority", "priority_queue"],
    entities: ["Opportunity", "LeadOpportunity", "LeadPriorityQueue", "Leads", "Lead"],
    fields: ["business_name", "full_name", "name", "email", "opportunity_stage", "activation_priority", "next_action", "recommended_offer"],
    titleFields: ["business_name", "full_name", "name", "email", "id"],
    ownerFields: ["owner", "assigned_to", "email", "activation_priority"],
    timestampFields: ["updated_date", "created_date", "last_activity_at", "last_contacted_at"],
    destination: "/admin/opportunity-review?opportunity=:id",
    permission: { ...ADMIN_PERMISSION, scope: "Client" },
  },
  {
    id: "appointments",
    type: "appointment",
    tab: "demo-bookings",
    recordKeys: ["appointments", "appointment", "bookings", "demo_bookings", "demoBookings"],
    entities: ["Appointment", "DemoBooking", "Booking", "CalendarEvent"],
    fields: ["business_name", "customer_name", "full_name", "name", "email", "scheduled_date", "scheduled_time", "status", "intent", "source"],
    titleFields: ["business_name", "customer_name", "full_name", "name", "email", "id"],
    ownerFields: ["owner", "assigned_to", "email", "calendar_owner"],
    timestampFields: ["scheduled_at", "scheduled_date", "updated_date", "created_date"],
    destination: "/admin?tab=demo-bookings&appointment=:id",
    permission: { ...ADMIN_PERMISSION, scope: "Client" },
  },
  {
    id: "conversations",
    type: "conversation",
    tab: "inbox",
    recordKeys: ["conversations", "conversation", "support"],
    entities: ["SupportMessage", "CommunicationEvent", "CommunicationLog"],
    fields: ["sender_name", "sender_email", "message", "description", "project_id", "business_name", "subject"],
    titleFields: ["subject", "sender_name", "sender_email", "project_id", "business_name"],
    ownerFields: ["owner", "sender_email", "assigned_to", "role"],
    timestampFields: ["updated_date", "created_date", "timestamp", "sent_at"],
    destination: "/admin?tab=inbox&message=:id",
    permission: { ...ADMIN_PERMISSION, scope: "Client" },
  },
  {
    id: "ai-workers",
    type: "ai_worker",
    tab: "automations",
    recordKeys: ["ai-workers", "ai_workers", "aiWorker", "worker"],
    entities: ["AIWorker", "AutomationAgent", "AutomationJob", "Agent"],
    fields: ["name", "worker_name", "agent_name", "status", "capability", "description"],
    titleFields: ["name", "worker_name", "agent_name", "capability"],
    ownerFields: ["owner", "assigned_to", "source", "capability"],
    timestampFields: ["updated_date", "created_date", "last_run_at", "timestamp"],
    destination: "/admin/automations?worker=:id",
    permission: ADMIN_PERMISSION,
  },
  {
    id: "timeline-events",
    type: "timeline_event",
    tab: "audit-log",
    recordKeys: ["timeline-events", "timeline_events", "timeline", "activity"],
    entities: ["ClientTimelineEvent", "AuditLog", "CommunicationEvent", "AutomationProofLog"],
    fields: ["actor", "type", "source", "verification", "related_object", "message", "event_type"],
    titleFields: ["type", "event_type", "message", "related_object"],
    ownerFields: ["actor", "owner", "source"],
    timestampFields: ["timestamp", "created_date", "updated_date"],
    destination: "/admin?tab=audit-log&event=:id",
    permission: ADMIN_PERMISSION,
  },
  {
    id: "settings",
    type: "setting",
    tab: "settings",
    recordKeys: ["settings", "setting"],
    entities: ["AdminSettings"],
    fields: ["title", "label", "system", "description", "scope"],
    titleFields: ["title", "label", "system"],
    ownerFields: ["scope", "owner"],
    timestampFields: ["updated_date", "created_date"],
    destination: "/settings/:id",
    permission: MANAGE_ORG_PERMISSION,
  },
  {
    id: "billing",
    type: "billing",
    tab: "revenue",
    recordKeys: ["billing", "order"],
    entities: ["Order", "Subscription", "Invoice"],
    fields: ["business_name", "customer_name", "customer_email", "stripe_session_id", "subscription_id", "invoice_number", "payment_status", "order_status"],
    titleFields: ["business_name", "customer_name", "customer_email", "invoice_number", "id"],
    ownerFields: ["customer_email", "owner", "billing_owner"],
    timestampFields: ["updated_date", "created_date", "paid_at", "invoice_date"],
    destination: "/admin?tab=client-projects&order=:id",
    permission: { ...MANAGE_ORG_PERMISSION, scope: "Organization" },
  },
  {
    id: "documents",
    type: "document",
    tab: "resource-library",
    recordKeys: ["documents", "document"],
    entities: ["Document", "Resource", "KnowledgeBaseArticle"],
    fields: ["title", "name", "description", "category", "owner"],
    titleFields: ["title", "name", "description"],
    ownerFields: ["owner", "category", "created_by"],
    timestampFields: ["updated_date", "created_date", "published_at"],
    destination: "/admin?tab=resource-library&document=:id",
    permission: ADMIN_PERMISSION,
  },
];

export const PLATFORM_SEARCH_STATIC_RECORDS = {
  settings: ENTERPRISE_SETTINGS_ROUTES.map((item) => ({
    id: item.id,
    title: item.label,
    system: item.system,
    description: `${item.system} settings`,
    scope: item.navGroup,
    updated_date: "static-contract",
  })),
};

export const PLATFORM_NOTIFICATION_SOURCES = [
  "AI",
  "Business Intelligence",
  "Communications",
  "Billing",
  "Security",
  "Integration",
];

export const PLATFORM_NOTIFICATION_CATEGORIES = [
  "automation",
  "intelligence",
  "communication",
  "billing",
  "security",
  "integration",
];

export const PLATFORM_NOTIFICATION_SEVERITIES = ["Critical", "High", "Normal", "Low"];
export const PLATFORM_NOTIFICATION_PRIORITIES = PLATFORM_NOTIFICATION_SEVERITIES;

export const PLATFORM_NOTIFICATION_STATES = [
  "Unread",
  "Read",
  "Resolved",
  "Expired",
  "Dismissed",
];

export const PLATFORM_NOTIFICATION_CONTRACT = {
  requiredFields: [
    "id",
    "title",
    "category",
    "severity",
    "source",
    "whatHappened",
    "whyItMatters",
    "businessImpact",
    "recommendedAction",
    "owner",
    "destination",
    "status",
    "createdAt",
  ],
  sources: PLATFORM_NOTIFICATION_SOURCES,
  categories: PLATFORM_NOTIFICATION_CATEGORIES,
  severities: PLATFORM_NOTIFICATION_SEVERITIES,
  priorities: PLATFORM_NOTIFICATION_PRIORITIES,
  states: PLATFORM_NOTIFICATION_STATES,
};

export const PLATFORM_NOTIFICATION_FIXTURES = [
  {
    id: "ai-worker-attention",
    title: "AI worker needs review",
    category: "automation",
    severity: "High",
    source: "AI",
    whatHappened: "An AI worker returned an incomplete proof payload.",
    whyItMatters: "Connected does not prove the worker completed the business task.",
    businessImpact: "Follow-up automation may need manual review before launch proof is trusted.",
    recommendedAction: "Open Automation Activity and verify the latest run evidence.",
    owner: "AI Ops",
    destination: "/admin/automation-activity",
    status: "Unread",
    createdAt: "fixture-contract",
  },
  {
    id: "business-intelligence-partial",
    title: "Business intelligence source is partial",
    category: "intelligence",
    severity: "Normal",
    source: "Business Intelligence",
    whatHappened: "One analytics source is unavailable while other sources are current.",
    whyItMatters: "Partial data must not be summarized as verified performance.",
    businessImpact: "Revenue and attribution decisions may need source-level qualification.",
    recommendedAction: "Review Analytics and Source Attribution freshness labels.",
    owner: "Revenue Ops",
    destination: "/admin?tab=analytics",
    status: "Unread",
    createdAt: "fixture-contract",
  },
  {
    id: "billing-payment-attention",
    title: "Billing record requires attention",
    category: "billing",
    severity: "Critical",
    source: "Billing",
    whatHappened: "A billing record has an unresolved payment or subscription state.",
    whyItMatters: "Sent or created checkout events do not prove payment completion.",
    businessImpact: "Client activation should wait for verified order status.",
    recommendedAction: "Open Revenue Intelligence and reconcile the order proof.",
    owner: "Finance Ops",
    destination: "/admin?tab=revenue",
    status: "Unread",
    createdAt: "fixture-contract",
  },
  {
    id: "security-rbac-change",
    title: "Security review is required",
    category: "security",
    severity: "High",
    source: "Security",
    whatHappened: "A role or permission change needs admin review.",
    whyItMatters: "Access must stay scoped by organization, client, and location.",
    businessImpact: "Incorrect access could expose restricted customer or billing data.",
    recommendedAction: "Review Roles & Permissions before approving the change.",
    owner: "Platform Admin",
    destination: "/settings/roles",
    status: "Unread",
    createdAt: "fixture-contract",
  },
  {
    id: "integration-proof-missing",
    title: "Integration proof is missing",
    category: "integration",
    severity: "High",
    source: "Integration",
    whatHappened: "A provider is configured but lacks current workflow proof.",
    whyItMatters: "Configured and connected states do not prove operational health.",
    businessImpact: "Launch readiness should stay blocked until proof is refreshed.",
    recommendedAction: "Open Integration Health and validate provider evidence.",
    owner: "Platform Ops",
    destination: "/admin?tab=health",
    status: "Unread",
    createdAt: "fixture-contract",
  },
];

export const PLATFORM_ACTIVITY_EVENT_SOURCES = [
  "AI",
  "Users",
  "Customers",
  "Communications",
  "Billing",
  "Security",
  "Website",
];

export const PLATFORM_ACTIVITY_EVENT_CONTRACT = {
  requiredFields: [
    "actor",
    "timestamp",
    "source",
    "type",
    "verification",
    "relatedObject",
    "deepLink",
  ],
  provenancePolicy: "Never flatten provenance",
  sources: PLATFORM_ACTIVITY_EVENT_SOURCES,
  verificationStates: ["Verified", "Derived", "Estimated", "Reported", "Unknown"],
};

export const CUSTOMER_CONTEXT_FIELDS = [
  "customer",
  "company",
  "location",
  "plan",
  "aiWorkers",
  "recentActivity",
  "openOpportunities",
  "communications",
  "risks",
];

export const CUSTOMER_CONTEXT_SURFACES = [
  "Timeline",
  "Communications",
  "AI Workforce",
  "Opportunity Center",
  "Support",
];

export const CUSTOMER_CONTEXT_CONTRACT = {
  requiredFields: CUSTOMER_CONTEXT_FIELDS,
  surfaces: CUSTOMER_CONTEXT_SURFACES,
  fallbackState: "Unavailable",
  permissionScope: "Client",
};

export const DATA_TRUTH_STATES = ["Verified", "Derived", "Estimated", "Reported", "Unknown"];
export const DATA_FRESHNESS_STATES = ["Live", "Current", "Delayed", "Stale", "Unavailable"];

export const TRUTH_LAYER_DENIED_PROMOTIONS = [
  { from: "Unknown", to: "Healthy", reason: "Unknown source cannot become an operational health claim." },
  { from: "Estimated", to: "Verified", reason: "Estimated data needs source proof before verification." },
  { from: "No Data", to: "Zero", reason: "Absence of records is not a measured zero." },
  { from: "Connected", to: "Operational", reason: "A connection is not end-to-end workflow proof." },
];

export const DATA_TRUTH_LAYER = {
  truthStates: DATA_TRUTH_STATES,
  freshnessStates: DATA_FRESHNESS_STATES,
  deniedPromotions: TRUTH_LAYER_DENIED_PROMOTIONS,
  displayPolicy: "Show truth state and freshness together for every integrated object.",
};

export const PLATFORM_VALIDATION_VIEWPORTS = [1440, 1280, 1024, 768, 390, 375];

export const PLATFORM_ACCESSIBILITY_REQUIREMENTS = [
  "Keyboard",
  "Focus",
  "ARIA",
  "Screen reader",
  "Reduced Motion",
];

export const PLATFORM_READINESS_CHECKS = [
  { id: "navigation", label: "Navigation", expectations: ["desktop", "tablet", "mobile", "breadcrumbs", "active states", "permission filtering", "deep links"] },
  { id: "search", label: "Search", expectations: PLATFORM_SEARCH_STATES },
  { id: "notifications", label: "Notifications", expectations: PLATFORM_NOTIFICATION_STATES },
  { id: "permissions", label: "Permissions", expectations: PLATFORM_UNAUTHORIZED_STATES },
  { id: "deep-links", label: "Deep links", expectations: ["route destination", "query params", "breadcrumbs"] },
  { id: "customer-context", label: "Customer context", expectations: CUSTOMER_CONTEXT_SURFACES },
  { id: "truth-layer", label: "Truth layer", expectations: [...DATA_TRUTH_STATES, ...DATA_FRESHNESS_STATES] },
];

export const WORKER_3_PACKET = {
  reviewFocus: [
    "Confirm final navigation grouping feels consistent across desktop, tablet, and mobile.",
    "Review universal search states, keyboard behavior, and permission-restricted copy.",
    "Verify activity, notification, customer context, and truth labels do not imply live proof.",
    "Check restricted/request-access states for enterprise polish and accessibility.",
  ],
  accessibility: PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  viewportMatrix: PLATFORM_VALIDATION_VIEWPORTS,
};

function pickFirst(record, fields) {
  return fields.map((field) => record?.[field]).find((value) => value !== undefined && value !== null && String(value).trim());
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function getRecordsForSource(entityRecords, source) {
  const dynamicRecords = source.recordKeys.flatMap((key) => entityRecords?.[key] || []);
  const staticRecords = PLATFORM_SEARCH_STATIC_RECORDS[source.id] || [];
  return [...dynamicRecords, ...staticRecords];
}

function matchesQuery(record, fields, query) {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) return false;

  return fields.some((field) => String(record?.[field] || "").toLowerCase().includes(normalizedQuery));
}

function buildDestination(template, record) {
  return String(template).replace(/:([a-zA-Z0-9_]+)/g, (_, key) => encodeURIComponent(record?.[key] || record?.id || ""));
}

function buildSearchDescription(record, source, title, owner) {
  const description = pickFirst(record, ["description", "message", "subject", "status", "payment_status", "order_status", "scope"]);
  return String(description || `${source.id} result for ${title} owned by ${owner}`);
}

function buildSearchMetadata(record, source, routeId, timestamp, sourceStatus, permissionState) {
  return {
    recordId: record.id,
    sourceId: source.id,
    sourceEntities: source.entities,
    routeId,
    tab: source.tab,
    permissionScope: source.permission.scope,
    truthState: timestamp === "static-contract" ? "Derived" : "Reported",
    freshness: timestamp === "Unknown" ? "Unavailable" : "Current",
    adapterStatus: sourceStatus?.status || "Unverified",
    adapterUnavailableEntities: sourceStatus?.unavailableEntities || [],
    permissionState: permissionState?.state || "Allowed",
    permissionRole: permissionState?.role || "admin",
  };
}

function normalizeDestination(destination) {
  const value = String(destination || "/admin");
  return value.endsWith("/") && value !== "/" ? value.slice(0, -1) : value;
}

function routeMatchesPath(routeItem, destination) {
  const [pathPart, queryPart = ""] = normalizeDestination(destination).split("?");
  const routePath = normalizeDestination(routeItem.path);

  if (routeItem.tab) {
    const params = new URLSearchParams(queryPart);
    return pathPart === routePath && params.get("tab") === routeItem.tab;
  }

  if (queryPart && new URLSearchParams(queryPart).has("tab")) {
    return false;
  }

  if (!routePath.includes(":")) {
    return pathPart === routePath;
  }

  const pattern = `^${routePath.replace(/:[^/]+/g, "[^/]+")}$`;
  return new RegExp(pattern).test(pathPart);
}

function toEnterpriseRole(role) {
  if (role === "super_admin") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "client") return "Viewer";
  if (!role) return "Viewer";
  return String(role).charAt(0).toUpperCase() + String(role).slice(1);
}

function normalizeNavigationEntry(entry) {
  return typeof entry === "string" ? { routeId: entry } : entry;
}

function buildPlatformNavigationItem(entry, user, options = {}) {
  const normalizedEntry = normalizeNavigationEntry(entry);
  const routeItem = getPlatformRouteById(normalizedEntry.routeId);
  if (!routeItem) return null;

  const permissionUser = user || options.defaultUser || { role: "admin" };
  if (options.filterPermissions !== false && !evaluatePlatformPermission(permissionUser, routeItem.permissionRequirement).allowed) {
    return null;
  }

  const destination = normalizedEntry.destination || routeItem.destination;
  const isExternal = Boolean(normalizedEntry.external);

  return {
    id: normalizedEntry.id || routeItem.navigationLocation.id,
    routeId: routeItem.id,
    label: normalizedEntry.label || routeItem.navigationLocation.label || routeItem.title,
    title: routeItem.title,
    description: routeItem.description,
    path: routeItem.path,
    tab: routeItem.tab,
    destination,
    external: isExternal,
    externalPath: normalizedEntry.externalPath || (isExternal ? destination : undefined),
    badge: normalizedEntry.badge,
    section: routeItem.navigationLocation.section,
    order: routeItem.navigationLocation.order,
    permissionRequirement: routeItem.permissionRequirement,
    system: routeItem.system,
  };
}

export function getPlatformRouteById(routeId) {
  return PLATFORM_ROUTES.find((routeItem) => routeItem.id === routeId);
}

export function getPlatformNavigationItems(user, entries, options = {}) {
  return entries
    .map((entry) => buildPlatformNavigationItem(entry, user, options))
    .filter(Boolean);
}

export function getPlatformNavigationGroups(user, groups = ADMIN_SHELL_NAVIGATION_GROUPS, options = {}) {
  return groups
    .map((group) => ({
      group: group.group,
      items: getPlatformNavigationItems(user, group.items, options),
    }))
    .filter((group) => group.items.length > 0);
}

function collectPlatformSearchResults(entityRecords, query, options = {}) {
  const permissionUser = options.user || options.currentUser || { role: "admin" };

  return PLATFORM_SEARCH_SOURCES.flatMap((source) => {
    const permissionState = evaluatePlatformPermission(permissionUser, source.permission);
    const sourceStatus = options.sourceStatuses?.[source.id];

    return (
    getRecordsForSource(entityRecords, source)
      .filter((record) => matchesQuery(record, source.fields, query))
      .slice(0, 5)
      .map((record) => {
        const title = String(pickFirst(record, source.titleFields) || source.type);
        const owner = String(pickFirst(record, source.ownerFields) || "Unassigned");
        const timestamp = String(pickFirst(record, source.timestampFields) || "Unknown");
        const destination = buildDestination(source.destination, record);
        const route = getPlatformRouteByDestination(destination)?.id || source.tab || source.id;
        const description = buildSearchDescription(record, source, title, owner);
        const metadata = buildSearchMetadata(record, source, route, timestamp, sourceStatus, permissionState);

        return {
          id: record.id,
          title,
          description,
          source: source.id,
          type: source.type,
          route,
          status: "Results",
          owner,
          timestamp,
          permission: source.permission,
          destination,
          metadata,
          tab: source.tab,
          label: title,
          sub: `${source.id} - ${owner}`,
          data: record,
          state: "Results",
        };
      })
    );
  });
}

export function buildPlatformSearchResponse(entityRecords, query, maxResults = 12, options = {}) {
  const allMatches = collectPlatformSearchResults(entityRecords, query, options);
  const permittedMatches = allMatches.filter((result) => result.metadata.permissionState === "Allowed");
  const adapterStates = Object.values(options.sourceStatuses || {}).map((status) => status?.status);
  const hasPartialSource = adapterStates.some((status) => status === "Partial" || status === "Unavailable");
  const restrictedCount = allMatches.length - permittedMatches.length;
  const results = permittedMatches.slice(0, maxResults);
  const totalPermitted = permittedMatches.length;
  const truncated = totalPermitted > maxResults;

  let status = "No Results";
  if (results.length > 0) {
    status = hasPartialSource || truncated ? "Partial Results" : "Results";
  } else if (allMatches.length > 0 && restrictedCount > 0) {
    status = "Permission Restricted";
  }

  return {
    results,
    status,
    totalMatches: allMatches.length,
    permittedCount: totalPermitted,
    restrictedCount,
    truncated,
    sourceStatuses: options.sourceStatuses || {},
  };
}

export function buildPlatformSearchResults(entityRecords, query, maxResults = 12, options = {}) {
  return buildPlatformSearchResponse(entityRecords, query, maxResults, options).results;
}

export function getPlatformSearchPlaceholder() {
  return "Search customers, leads, appointments, opportunities, AI workers, settings...";
}

export function getPlatformRouteByDestination(destination) {
  return PLATFORM_ROUTES.find((routeItem) => routeMatchesPath(routeItem, destination));
}

export function getPlatformBreadcrumbs(destination) {
  const routeItem = getPlatformRouteByDestination(destination) || PLATFORM_ROUTES[0];
  const section = PLATFORM_NAVIGATION_SECTIONS.find((item) => item.id === routeItem.navigationLocation.section);

  return [
    { label: "ClientSurge OS", destination: "/admin" },
    { label: section?.label || "Platform", destination: "/admin/platform" },
    { label: routeItem.title, destination: routeItem.destination },
  ];
}

export function evaluatePlatformPermission(user, requirement = ADMIN_PERMISSION) {
  const userRole = user?.role || "anonymous";
  const allowedByRole = (requirement.roles || ADMIN_ROLES).includes(userRole);
  const enterpriseRole = toEnterpriseRole(userRole);
  const permissionsForScope = ROLE_SCOPE_PERMISSIONS[enterpriseRole]?.[requirement.scope] || [];
  const allowedByPermission = !requirement.permission || permissionsForScope.includes(requirement.permission);
  const allowed = allowedByRole && allowedByPermission;
  const unauthorizedState = requirement.unauthorized || "Hidden";

  return {
    allowed,
    state: allowed ? "Allowed" : unauthorizedState,
    role: userRole,
    scope: requirement.scope,
    permission: requirement.permission,
  };
}

export function getVisiblePlatformRoutes(user) {
  return PLATFORM_ROUTES.filter((routeItem) =>
    evaluatePlatformPermission(user, routeItem.permissionRequirement).allowed,
  );
}

export function canPromoteTruthState(from, to) {
  return !TRUTH_LAYER_DENIED_PROMOTIONS.some((rule) => rule.from === from && rule.to === to);
}

export function normalizeDataTruth({ truthState = "Unknown", freshness = "Unavailable" } = {}) {
  return {
    truthState: DATA_TRUTH_STATES.includes(truthState) ? truthState : "Unknown",
    freshness: DATA_FRESHNESS_STATES.includes(freshness) ? freshness : "Unavailable",
  };
}

export function buildCustomerContext(input = {}) {
  const truth = normalizeDataTruth(input.truth);

  return CUSTOMER_CONTEXT_FIELDS.reduce((context, field) => {
    context[field] = input[field] ?? (Array.isArray(input[field]) ? [] : null);
    return context;
  }, { truth });
}

function assertCheck(condition, id, failures) {
  if (!condition) failures.push(id);
}

export function validatePlatformIntegrationFoundation() {
  const failures = [];

  const navIds = PLATFORM_NAVIGATION_SECTIONS.map((item) => item.id);
  assertCheck(
    PLATFORM_NAVIGATION_SECTION_IDS.every((id) => navIds.includes(id)),
    "missing-navigation-section",
    failures,
  );

  for (const routeItem of PLATFORM_ROUTES) {
    assertCheck(Boolean(routeItem.title), `route-title:${routeItem.id}`, failures);
    assertCheck(Boolean(routeItem.description), `route-description:${routeItem.id}`, failures);
    assertCheck(Boolean(routeItem.permissionRequirement?.permission), `route-permission:${routeItem.id}`, failures);
    assertCheck(Boolean(routeItem.navigationLocation?.section), `route-navigation:${routeItem.id}`, failures);
    assertCheck(navIds.includes(routeItem.navigationLocation.section), `route-section:${routeItem.id}`, failures);
    assertCheck(Boolean(routeItem.destination), `route-destination:${routeItem.id}`, failures);
  }

  const routeIds = new Set(PLATFORM_ROUTES.map((routeItem) => routeItem.id));
  const navigationRouteIds = [
    ...ADMIN_SHELL_NAVIGATION_GROUPS.flatMap((group) => group.items),
    ...ADMIN_DASHBOARD_NAVIGATION_GROUPS.flatMap((group) => group.items),
    ...ADMIN_DASHBOARD_SECONDARY_NAVIGATION_ITEMS,
    ...ADMIN_MOBILE_QUICK_NAVIGATION_ITEMS,
  ].map((entry) => normalizeNavigationEntry(entry).routeId);
  assertCheck(
    navigationRouteIds.every((routeId) => routeIds.has(routeId)),
    "navigation-route-registry",
    failures,
  );

  for (const source of PLATFORM_SEARCH_SOURCES) {
    assertCheck(
      PLATFORM_SEARCH_RESULT_FIELDS.every((field) => field === "permission" ? Boolean(source.permission) : true),
      `search-result-fields:${source.id}`,
      failures,
    );
    assertCheck(source.fields.length > 0, `search-fields:${source.id}`, failures);
    assertCheck(Boolean(source.destination), `search-destination:${source.id}`, failures);
  }

  assertCheck(
    ["Loading", "Results", "No Results", "Partial Results", "Permission Restricted", "Error"].every((state) => PLATFORM_SEARCH_STATES.includes(state)) &&
      PLATFORM_SEARCH_SOURCES.length >= 10,
    "search-states",
    failures,
  );
  assertCheck(
    ["appointments", "opportunities"].every((sourceId) => PLATFORM_SEARCH_SOURCES.some((source) => source.id === sourceId)),
    "search-source-completeness",
    failures,
  );
  assertCheck(
    PLATFORM_NOTIFICATION_CONTRACT.requiredFields.length === 13 &&
      PLATFORM_NOTIFICATION_SOURCES.length >= 5 &&
      PLATFORM_NOTIFICATION_STATES.length === 5 &&
      PLATFORM_NOTIFICATION_FIXTURES.every((fixture) =>
        PLATFORM_NOTIFICATION_CONTRACT.requiredFields.every((field) => Boolean(fixture[field])),
      ) &&
      ["AI", "Business Intelligence", "Billing", "Security", "Integration"].every((source) =>
        PLATFORM_NOTIFICATION_FIXTURES.some((fixture) => fixture.source === source),
      ),
    "notification-contract",
    failures,
  );
  assertCheck(
    PLATFORM_ACTIVITY_EVENT_CONTRACT.provenancePolicy === "Never flatten provenance" &&
      PLATFORM_ACTIVITY_EVENT_CONTRACT.requiredFields.includes("deepLink"),
    "activity-contract",
    failures,
  );
  assertCheck(
    CUSTOMER_CONTEXT_FIELDS.every((field) => CUSTOMER_CONTEXT_CONTRACT.requiredFields.includes(field)) &&
      CUSTOMER_CONTEXT_SURFACES.length === 5,
    "customer-context-contract",
    failures,
  );
  assertCheck(
    PLATFORM_PERMISSION_SCOPES.every((scope) => ["Organization", "Client", "Location"].includes(scope)) &&
      PLATFORM_UNAUTHORIZED_STATES.every((state) => ["Hidden", "Restricted", "Request Access"].includes(state)),
    "permission-contract",
    failures,
  );
  assertCheck(
    !canPromoteTruthState("Unknown", "Healthy") &&
      !canPromoteTruthState("Estimated", "Verified") &&
      !canPromoteTruthState("No Data", "Zero") &&
      !canPromoteTruthState("Connected", "Operational"),
    "truth-layer-denials",
    failures,
  );
  assertCheck(
    [1440, 1280, 1024, 768, 390, 375].every((viewport) => PLATFORM_VALIDATION_VIEWPORTS.includes(viewport)),
    "viewport-matrix",
    failures,
  );
  assertCheck(
    ["Keyboard", "Focus", "ARIA", "Screen reader", "Reduced Motion"].every((item) => PLATFORM_ACCESSIBILITY_REQUIREMENTS.includes(item)),
    "accessibility-matrix",
    failures,
  );

  return {
    ok: failures.length === 0,
    failures,
    checked: {
      routes: PLATFORM_ROUTES.length,
      navigationSections: PLATFORM_NAVIGATION_SECTIONS.length,
      searchSources: PLATFORM_SEARCH_SOURCES.length,
      notificationSources: PLATFORM_NOTIFICATION_SOURCES.length,
      activitySources: PLATFORM_ACTIVITY_EVENT_SOURCES.length,
      viewports: PLATFORM_VALIDATION_VIEWPORTS,
      accessibility: PLATFORM_ACCESSIBILITY_REQUIREMENTS,
    },
  };
}
