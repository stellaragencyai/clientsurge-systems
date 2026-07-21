export const PHASE_E_SOURCE = {
  issue: 1383,
  title: "Phase E architecture - Lifecycle, search, notifications, help, incidents, and launch completion",
  constraints: [
    "Static review foundations only",
    "No live billing, production notification send, or customer-data adapter",
    "No unsupported success, revenue, health, or attribution claims",
    "Worker #2 owns sequencing decisions before rollout",
  ],
};

export const PHASE_E_SOURCE_ISSUES = [
  {
    number: 1383,
    title: "Phase E architecture",
    url: "https://github.com/stellaragencyai/clientsurge-systems/issues/1383",
  },
  {
    number: 1371,
    title: "Enterprise design governance",
    url: "https://github.com/stellaragencyai/clientsurge-systems/issues/1371",
  },
  {
    number: 1372,
    title: "Component acceptance library",
    url: "https://github.com/stellaragencyai/clientsurge-systems/issues/1372",
  },
  {
    number: 1373,
    title: "Global navigation and cross-module contract",
    url: "https://github.com/stellaragencyai/clientsurge-systems/issues/1373",
  },
  {
    number: 1359,
    title: "Cross-phase product contracts",
    url: "https://github.com/stellaragencyai/clientsurge-systems/issues/1359",
  },
];

export const PHASE_E_ROUTES = [
  {
    id: "onboarding",
    path: "/review/phase-e/onboarding",
    label: "Onboarding",
    system: "First-Time Customer Experience",
    workstream: 1,
  },
  {
    id: "home-entry",
    path: "/review/phase-e/home-entry",
    label: "Home Entry",
    system: "Returning User Experience",
    workstream: 2,
  },
  {
    id: "trial",
    path: "/review/phase-e/trial",
    label: "Trial",
    system: "Trial Lifecycle",
    workstream: 3,
  },
  {
    id: "subscription",
    path: "/review/phase-e/subscription",
    label: "Subscription",
    system: "Upgrade and Downgrade Foundation",
    workstream: 4,
  },
  {
    id: "search",
    path: "/review/phase-e/search",
    label: "Search",
    system: "Global Search",
    workstream: 5,
  },
  {
    id: "command-menu",
    path: "/review/phase-e/command-menu",
    label: "Command Menu",
    system: "Command Menu",
    workstream: 6,
  },
  {
    id: "notifications",
    path: "/review/phase-e/notifications",
    label: "Notifications",
    system: "Notification Center",
    workstream: 7,
  },
  {
    id: "help",
    path: "/review/phase-e/help",
    label: "Help",
    system: "Help and Education Center",
    workstream: 8,
  },
  {
    id: "incidents",
    path: "/review/phase-e/incidents",
    label: "Incidents",
    system: "Incident Communication",
    workstream: 9,
  },
  {
    id: "launch-readiness",
    path: "/review/phase-e/launch-readiness",
    label: "Launch Readiness",
    system: "Launch Readiness Validation System",
    workstream: 10,
  },
];

export const PHASE_E_VIEWPORTS = [
  { label: "Desktop", width: 1440, height: 900 },
  { label: "Desktop", width: 1280, height: 820 },
  { label: "Tablet", width: 1024, height: 768 },
  { label: "Tablet", width: 768, height: 900 },
  { label: "Mobile", width: 390, height: 844 },
  { label: "Mobile", width: 375, height: 667 },
];

export const PHASE_E_REVIEW_STATES = [
  "Loading",
  "Current",
  "Incomplete",
  "Blocked",
  "Waiting",
  "Complete",
  "Error",
  "Unavailable",
  "New User",
  "Active User",
  "Inactive User",
  "Needs Attention",
  "Healthy",
  "Permission Restricted",
  "Partial",
  "Empty",
  "Stale",
  "Expired",
  "Resolved",
  "Unknown",
];

export const PHASE_E_TRUTH_RULES = [
  "Unknown is not healthy",
  "Estimated is not verified",
  "Sent is not delivered",
  "No data is not zero",
  "Configured is not working",
  "Connected is not healthy",
];

export const PHASE_E_ACCESSIBILITY_REQUIREMENTS = [
  "Keyboard reachable route navigation, overlays, search results, command actions, and recovery links",
  "Visible focus states on every interactive control",
  "ARIA current page, labelled landmarks, status semantics, and polite fixture notice",
  "Screen-reader labels for state, source, owner, business impact, and recovery path",
  "Reduced-motion validation with no required running animations",
  "Minimum 44px touch targets for navigation and actions",
  "200% zoom and narrow-screen reflow without horizontal overflow",
  "Color-independent status meaning with icon or text support",
];

export const PHASE_E_LAUNCH_VALIDATION_SYSTEMS = [
  "First-Time Customer Experience",
  "Returning User Experience",
  "Trial Lifecycle",
  "Upgrade and Downgrade Foundation",
  "Global Search",
  "Command Menu",
  "Notification Center",
  "Help and Education Center",
  "Incident Communication",
  "Launch Readiness Validation System",
];

export const PHASE_E_COMPONENTS = {
  onboarding: [
    "WelcomeExperience",
    "ActivationProgress",
    "BusinessSetupSummary",
    "ConnectionChecklist",
    "AIActivationStatus",
    "FirstSuccessCard",
  ],
  "home-entry": [
    "ResumeWorkCard",
    "RecentActivity",
    "PendingActions",
    "BusinessSnapshot",
    "RecommendationPanel",
  ],
  trial: [
    "TrialStatus",
    "DaysRemaining",
    "ActivatedFeatures",
    "UnusedFeatures",
    "RecommendedActions",
    "UpgradePath",
  ],
  subscription: [
    "CurrentPlan",
    "AvailablePlans",
    "FeatureComparison",
    "UpgradeFlow",
    "DowngradeProtection",
    "ScheduledChanges",
  ],
  search: [
    "SearchOverlay",
    "SearchInput",
    "SearchResultGroup",
    "RecentSearches",
    "NoResultsState",
    "PermissionAwareResult",
  ],
  "command-menu": [
    "CommandMenuOverlay",
    "CommandSearchInput",
    "CommandActionGroup",
    "PermissionAwareAction",
    "DestructiveActionGroup",
    "MobileCommandLauncher",
  ],
  notifications: [
    "NotificationInbox",
    "NotificationPriorityGroup",
    "ActionRequiredNotification",
    "ResolvedNotification",
    "PermissionRestrictedNotification",
    "NotificationDeepLink",
  ],
  help: [
    "HelpSearch",
    "GuideCard",
    "ContextualHelp",
    "TroubleshootingStep",
    "BestPracticeCard",
    "EscalationPath",
  ],
  incidents: [
    "IncidentStatusBanner",
    "IncidentImpactSummary",
    "AffectedSystemsList",
    "IncidentTimeline",
    "NextUpdateNotice",
    "MaintenanceWindow",
  ],
  "launch-readiness": [
    "LaunchReadinessMatrix",
    "BrowserViewportMatrix",
    "AccessibilityChecklist",
    "TruthValidationChecklist",
    "WorkerReviewPacket",
    "ValidationEvidenceLog",
  ],
};

const lifecycleInterruption = ({
  id,
  title,
  status,
  capability,
  preserved,
  owner,
  recovery,
  truth = "reported",
  impact = "medium",
}) => ({
  id,
  title,
  status,
  capability,
  preserved,
  owner,
  recovery,
  truth,
  impact,
});

const sourceSemantics = (source, scope, verification, freshness = "Static fixture prepared for review") => ({
  source,
  freshness,
  scope,
  verification,
});

const action = (title, owner, destination, state = "Waiting") => ({
  title,
  owner,
  destination,
  state,
});

export const PHASE_E_SECTIONS = {
  onboarding: {
    title: "Activate Your Business",
    eyebrow: "First-Time Customer Experience",
    summary:
      "The first customer journey after signup shows account creation, plan selection, payment completion, business activation, AI systems coming online, and the first meaningful business result.",
    intent: "A new customer always knows what happened, what is complete, what remains, who owns the next action, and how to recover.",
    sourceSemantics: sourceSemantics(
      "Phase E onboarding fixture mapped to signup, order, setup, integration, AI worker, and first-result events",
      "Customer account and location",
      "Requires approved adapters before any account, payment, or AI activation state becomes production truth",
    ),
    lifecycle: [
      { label: "Visitor", status: "Complete", detail: "Public product path is completed before account creation." },
      { label: "Account Created", status: "Complete", detail: "Customer identity exists, but profile enrichment remains review-scoped." },
      { label: "Plan Selected", status: "Complete", detail: "Plan selection is shown without creating a live billing mutation." },
      { label: "Payment Completed", status: "Waiting", detail: "Payment proof remains fixture-only until Stripe source binding is approved." },
      { label: "Business Activation", status: "Current", detail: "Activation work is in progress with setup blockers exposed." },
      { label: "AI Systems Coming Online", status: "Incomplete", detail: "AI worker readiness is distinct from configuration presence." },
      { label: "First Business Result", status: "Unavailable", detail: "No result is claimed until delivery evidence exists." },
    ],
    states: ["Loading", "Current", "Incomplete", "Blocked", "Waiting", "Complete", "Error", "Unavailable"],
    interruptions: [
      lifecycleInterruption({
        id: "payment-proof",
        title: "Payment confirmation is not verified",
        status: "Waiting",
        capability: "Plan activation and entitlement confidence",
        preserved: "Account, selected plan, and setup answers remain preserved",
        owner: "ClientSurge billing owner",
        recovery: "/review/phase-e/subscription#upgrade-flow",
        truth: "unknown",
      }),
      lifecycleInterruption({
        id: "connection-missing",
        title: "Business connection is incomplete",
        status: "Blocked",
        capability: "Lead routing and AI follow-up",
        preserved: "Business profile, checklist progress, and onboarding notes remain preserved",
        owner: "Customer",
        recovery: "/review/phase-e/onboarding#ConnectionChecklist",
      }),
    ],
    actions: [
      action("Review business profile", "Customer", "/review/phase-e/onboarding#BusinessSetupSummary", "Current"),
      action("Reconnect messaging provider", "Customer", "/review/phase-e/onboarding#ConnectionChecklist", "Blocked"),
      action("Review first-result readiness", "ClientSurge success", "/review/phase-e/launch-readiness", "Waiting"),
    ],
    acceptance: [
      "WelcomeExperience, ActivationProgress, BusinessSetupSummary, ConnectionChecklist, AIActivationStatus, and FirstSuccessCard are represented.",
      "Customer-facing language uses Activate Your Business, Your AI Business Is Coming Online, and Your Business Is Ready.",
      "No first business result is implied until delivery evidence is available.",
    ],
  },
  "home-entry": {
    title: "Business Home Entry",
    eyebrow: "Returning User Experience",
    summary:
      "A returning customer sees current status, recent activity, pending actions, a business snapshot, and recommendations before passive reporting.",
    intent: "The first screen after return answers what is happening, what needs attention, and what to do next.",
    sourceSemantics: sourceSemantics(
      "Phase E home-entry fixture mapped to customer status, recent activity, actions, and recommendations",
      "Customer account, location, and authorized modules",
      "Requires activity and recommendation adapters before this becomes a live home surface",
    ),
    lifecycle: [
      { label: "New user", status: "New User", detail: "Resume work focuses on incomplete setup." },
      { label: "Active user", status: "Active User", detail: "Recent activity and next best action are prioritized." },
      { label: "Inactive user", status: "Inactive User", detail: "Reactivation is educational and non-alarming." },
      { label: "Incomplete setup", status: "Incomplete", detail: "Setup gaps stay above analytics." },
      { label: "Needs attention", status: "Needs Attention", detail: "The recommendation includes owner and destination." },
      { label: "Healthy", status: "Healthy", detail: "Healthy requires explicit source evidence and cannot inherit from unknown." },
    ],
    states: ["New User", "Active User", "Inactive User", "Incomplete", "Needs Attention", "Healthy", "Unknown"],
    interruptions: [
      lifecycleInterruption({
        id: "activity-delayed",
        title: "Recent activity may be delayed",
        status: "Waiting",
        capability: "Customer confidence in latest business status",
        preserved: "Existing actions and setup state remain visible",
        owner: "System",
        recovery: "/review/phase-e/notifications#activity-delay",
        truth: "delayed",
      }),
      lifecycleInterruption({
        id: "snapshot-partial",
        title: "Business snapshot has partial coverage",
        status: "Partial",
        capability: "BusinessSnapshot and RecommendationPanel",
        preserved: "Verified items remain visible with source disclosure",
        owner: "ClientSurge success",
        recovery: "/review/phase-e/help#source-coverage",
      }),
    ],
    actions: [
      action("Resume activation", "Customer", "/review/phase-e/onboarding", "Incomplete"),
      action("Review pending actions", "Customer", "/review/phase-e/home-entry#PendingActions", "Current"),
      action("Inspect recommendation source", "ClientSurge success", "/review/phase-e/home-entry#RecommendationPanel", "Current"),
    ],
    acceptance: [
      "ResumeWorkCard, RecentActivity, PendingActions, BusinessSnapshot, and RecommendationPanel are represented.",
      "Mobile order keeps pending actions and blockers above passive snapshot data.",
      "Recommendations keep source, confidence, owner, lifecycle, and impact truth visible.",
    ],
  },
  trial: {
    title: "Trial Lifecycle",
    eyebrow: "Trial Lifecycle",
    summary:
      "Trial state, days remaining, activated features, unused features, recommendations, and upgrade path are shown without false urgency.",
    intent: "Customers understand trial value and limitations without hidden constraints or unsupported pressure.",
    sourceSemantics: sourceSemantics(
      "Phase E trial fixture mapped to trial account, entitlement, activation, and usage events",
      "Customer account and plan eligibility",
      "Requires Stripe and entitlement source binding before days remaining or conversion state is trusted",
    ),
    lifecycle: [
      { label: "Trial Started", status: "Complete", detail: "Trial start is visible but not used as a pressure tactic." },
      { label: "Activation In Progress", status: "Current", detail: "Value depends on activation completion, not calendar time alone." },
      { label: "Trial Active", status: "Current", detail: "Activated and unused features are separated." },
      { label: "Trial Ending Soon", status: "Waiting", detail: "Reminder copy is calm and limitation-forward." },
      { label: "Trial Expired", status: "Expired", detail: "Recovery preserves setup and explains access limits." },
      { label: "Converted", status: "Complete", detail: "Conversion is not shown without billing proof." },
      { label: "Cancelled", status: "Resolved", detail: "Cancellation keeps export and support recovery visible." },
    ],
    states: ["Trial Started", "Activation In Progress", "Trial Active", "Trial Ending Soon", "Trial Expired", "Converted", "Cancelled"],
    interruptions: [
      lifecycleInterruption({
        id: "trial-limitation",
        title: "Feature access is limited until activation finishes",
        status: "Incomplete",
        capability: "Activated features and recommendations",
        preserved: "Trial configuration and setup answers remain preserved",
        owner: "Customer",
        recovery: "/review/phase-e/onboarding#ActivationProgress",
      }),
      lifecycleInterruption({
        id: "trial-expired",
        title: "Trial access expired without conversion proof",
        status: "Expired",
        capability: "Daily use and expansion path",
        preserved: "Business profile, connection history, and trial notes remain preserved",
        owner: "Customer",
        recovery: "/review/phase-e/subscription#CurrentPlan",
        truth: "reported",
      }),
    ],
    actions: [
      action("Finish activation tasks", "Customer", "/review/phase-e/onboarding", "Current"),
      action("Review trial limitations", "Customer", "/review/phase-e/help#billing-help", "Waiting"),
      action("Compare upgrade path", "Billing owner", "/review/phase-e/subscription#AvailablePlans", "Waiting"),
    ],
    acceptance: [
      "Trial Started, Activation In Progress, Trial Active, Trial Ending Soon, Trial Expired, Converted, and Cancelled are represented.",
      "Days remaining never hides important activation limitations.",
      "Upgrade Path uses commerce styling only for commercial commitment actions.",
    ],
  },
  subscription: {
    title: "Subscription Change Foundation",
    eyebrow: "Upgrade And Downgrade",
    summary:
      "Current plan, available plans, feature comparison, upgrade, downgrade, scheduled changes, and consequence review are present without live payment logic.",
    intent: "Plan changes make impact clear before commitment and preserve recovery paths after the result.",
    sourceSemantics: sourceSemantics(
      "Phase E subscription fixture mapped to Stripe, plan, entitlement, usage, and scheduled-change records",
      "Billing owner and organization",
      "Requires Worker #2-approved billing adapter before mutations or live plan state are enabled",
    ),
    lifecycle: [
      { label: "Current Plan", status: "Current", detail: "Plan is fixture-backed and labelled as not live billing proof." },
      { label: "Available Plans", status: "Current", detail: "Plan options show eligibility and limitations." },
      { label: "Review Change", status: "Waiting", detail: "Upgrade and downgrade both begin with impact review." },
      { label: "Confirm", status: "Waiting", detail: "Confirmation requires consequence acknowledgement." },
      { label: "Apply", status: "Unavailable", detail: "Apply is disabled in Phase E foundation." },
      { label: "Show Result", status: "Unavailable", detail: "Result state waits for approved billing mutation path." },
    ],
    states: ["Current Plan", "Available Plans", "Review Change", "Confirm", "Apply", "Show Result", "Scheduled Change", "Unavailable"],
    interruptions: [
      lifecycleInterruption({
        id: "downgrade-impact",
        title: "Downgrade would remove active capabilities",
        status: "Blocked",
        capability: "Feature access, usage limits, and support expectations",
        preserved: "Current plan remains unchanged until confirmation",
        owner: "Billing owner",
        recovery: "/review/phase-e/subscription#DowngradeProtection",
        impact: "high",
      }),
      lifecycleInterruption({
        id: "payment-unavailable",
        title: "Payment application is unavailable in this foundation",
        status: "Unavailable",
        capability: "Upgrade and downgrade execution",
        preserved: "Review decision and scheduled-change draft remain preserved",
        owner: "ClientSurge billing owner",
        recovery: "/review/phase-e/incidents#billing-provider",
        truth: "unknown",
      }),
    ],
    actions: [
      action("Review change", "Billing owner", "/review/phase-e/subscription#UpgradeFlow", "Current"),
      action("Confirm consequence preview", "Billing owner", "/review/phase-e/subscription#DowngradeProtection", "Waiting"),
      action("Open billing help", "Customer", "/review/phase-e/help#billing-help", "Current"),
    ],
    acceptance: [
      "Current Plan, Available Plans, Feature Comparison, Upgrade, Downgrade, Scheduled Changes, and result states are represented.",
      "Downgrade protection shows features lost, current usage, impact, and confirmation before action.",
      "No live Stripe, checkout, payment, or subscription mutation is connected.",
    ],
  },
  search: {
    title: "Global Search",
    eyebrow: "Enterprise Discovery",
    summary:
      "Permission-aware and tenant-scoped search covers customers, leads, conversations, AI workers, timeline events, settings, billing, and documents.",
    intent: "Search is fast, safe, keyboard-first, and honest when results are partial, empty, restricted, or unavailable.",
    keyboard: "Command K / Ctrl K opens search; Arrow keys move between results; Enter opens the focused result; Escape closes and restores focus.",
    sourceSemantics: sourceSemantics(
      "Phase E search fixture mapped to future search index, permission filters, tenant scope, and recent-search records",
      "Tenant, organization, client, location, and role",
      "Requires permission-filtered search adapter before any production result count or snippet is trusted",
    ),
    lifecycle: [
      { label: "Customers", status: "Current", detail: "Authorized customer records include scope and destination." },
      { label: "Leads", status: "Current", detail: "Lead results require permission-safe title and snippet fields." },
      { label: "Conversations", status: "Partial", detail: "Restricted content never leaks through snippets." },
      { label: "AI Workers", status: "Current", detail: "Worker state is shown with truth class." },
      { label: "Timeline Events", status: "Waiting", detail: "Event search waits for audit-backed index." },
      { label: "Settings", status: "Current", detail: "Settings destinations route to the narrowest safe context." },
      { label: "Billing", status: "Permission Restricted", detail: "Billing results are hidden or explained by role." },
      { label: "Documents", status: "Unavailable", detail: "Document search is unavailable until source binding." },
    ],
    states: ["Recent Searches", "Empty", "Partial", "No Permission Results", "Error", "Permission Restricted", "Unavailable"],
    interruptions: [
      lifecycleInterruption({
        id: "restricted-results",
        title: "Some matching content is restricted",
        status: "Permission Restricted",
        capability: "Cross-module discovery",
        preserved: "Authorized result groups and recent searches remain usable",
        owner: "System",
        recovery: "/review/phase-e/help#permissions",
        truth: "permission_restricted",
      }),
      lifecycleInterruption({
        id: "index-partial",
        title: "Search index has partial coverage",
        status: "Partial",
        capability: "Documents and timeline discovery",
        preserved: "Connected categories continue returning authorized matches",
        owner: "ClientSurge operations",
        recovery: "/review/phase-e/launch-readiness#search",
      }),
    ],
    actions: [
      action("Search everything", "Customer", "/review/phase-e/search#SearchInput", "Current"),
      action("Open recent search", "Customer", "/review/phase-e/search#RecentSearches", "Current"),
      action("Review permission rules", "Admin", "/settings/roles", "Waiting"),
    ],
    acceptance: [
      "SearchOverlay, SearchInput, SearchResultGroup, RecentSearches, NoResultsState, and permission-aware result behavior are represented.",
      "Restricted content does not leak title, snippet, count, or autocomplete text.",
      "Keyboard navigation and focus restoration are documented and rendered.",
    ],
  },
  "command-menu": {
    title: "Command Menu",
    eyebrow: "Fast Business Navigation",
    summary:
      "The command menu provides keyboard-first navigation and permitted actions with destructive actions separated from safe commands.",
    intent: "Customers can quickly open the right business context without bypassing permissions, consequences, or recovery paths.",
    keyboard: "Command K / Ctrl K opens the command menu; typing filters safe actions first; destructive actions remain separated and require confirmation.",
    sourceSemantics: sourceSemantics(
      "Phase E command fixture mapped to navigation destinations, permission grants, mobile launcher, and action metadata",
      "Tenant, role, plan eligibility, client, and location",
      "Requires route permission resolver before production commands are enabled",
    ),
    lifecycle: [
      { label: "Open Customer", status: "Current", detail: "Routes to the narrowest authorized customer context." },
      { label: "Open AI Worker", status: "Current", detail: "Shows worker availability before navigation." },
      { label: "Create Message", status: "Waiting", detail: "Draft flow requires communication permission and consent." },
      { label: "View Billing", status: "Permission Restricted", detail: "Billing route is role-gated." },
      { label: "Open Settings", status: "Current", detail: "Settings destination preserves section context." },
      { label: "Reconnect Integration", status: "Blocked", detail: "Reconnect action routes to setup and provider impact." },
      { label: "Search Everything", status: "Current", detail: "Search remains the fallback discovery action." },
    ],
    states: ["Keyboard First", "Permission Aware", "Destructive Separated", "Mobile Alternative", "Unavailable"],
    interruptions: [
      lifecycleInterruption({
        id: "command-permission",
        title: "Command is not available for this role",
        status: "Permission Restricted",
        capability: "Fast navigation and action execution",
        preserved: "Menu state and safe commands remain available",
        owner: "System",
        recovery: "/review/phase-e/help#permissions",
      }),
      lifecycleInterruption({
        id: "destructive-separated",
        title: "Destructive action requires confirmation",
        status: "Blocked",
        capability: "Billing, disconnect, cancel, and delete actions",
        preserved: "Current work remains unchanged until confirmation",
        owner: "Authorized user",
        recovery: "/review/phase-e/subscription#DowngradeProtection",
        impact: "high",
      }),
    ],
    actions: [
      action("Open customer", "Customer", "/review/phase-e/search#customers", "Current"),
      action("Reconnect integration", "Customer", "/review/phase-e/onboarding#ConnectionChecklist", "Blocked"),
      action("View billing", "Billing owner", "/review/phase-e/subscription", "Permission Restricted"),
    ],
    acceptance: [
      "Open Customer, Open AI Worker, Create Message, View Billing, Open Settings, Reconnect Integration, and Search Everything are represented.",
      "Destructive actions are visually and semantically separated from safe navigation.",
      "Mobile has an explicit launcher alternative with reachable touch targets.",
    ],
  },
  notifications: {
    title: "Notification Center",
    eyebrow: "Operational Inbox",
    summary:
      "The notification center groups information, action-required, warning, critical, resolved, stale, expired, permission-restricted, and unavailable states.",
    intent: "Notifications tell customers what happened, why it matters, business impact, owner, recommended action, destination, and status.",
    sourceSemantics: sourceSemantics(
      "Phase E notification fixture mapped to operational events, read state, dedupe, recurrence, owner, and deep-link destinations",
      "Tenant, customer, role, module, and affected object",
      "Requires event adapter and notification preference source before production sends or counts are trusted",
    ),
    lifecycle: [
      { label: "Information", status: "Current", detail: "Awareness only, not an action duplicate." },
      { label: "Action Required", status: "Needs Attention", detail: "Includes owner and exact recovery destination." },
      { label: "Warning", status: "Waiting", detail: "Business impact is stated calmly." },
      { label: "Critical", status: "Blocked", detail: "Critical requires capability, owner, and recovery path." },
      { label: "Resolved", status: "Resolved", detail: "Resolution preserves history." },
      { label: "Permission Restricted", status: "Permission Restricted", detail: "Restricted details are not leaked." },
      { label: "Unavailable", status: "Unavailable", detail: "Inbox failure does not disable the whole shell." },
    ],
    states: ["Unread", "Read", "Resolved", "Stale", "Expired", "Permission Restricted", "Unavailable"],
    interruptions: [
      lifecycleInterruption({
        id: "activity-delay",
        title: "Missed-call follow-up may not send",
        status: "Critical",
        capability: "Communication service follow-up",
        preserved: "Lead record and call event remain preserved for retry",
        owner: "Customer",
        recovery: "/review/phase-e/onboarding#ConnectionChecklist",
        impact: "high",
      }),
      lifecycleInterruption({
        id: "restricted-notification",
        title: "Billing notification is restricted",
        status: "Permission Restricted",
        capability: "Billing awareness for non-billing roles",
        preserved: "Unread count excludes restricted billing detail",
        owner: "Billing owner",
        recovery: "/review/phase-e/help#permissions",
      }),
    ],
    actions: [
      action("Resolve action-required item", "Customer", "/review/phase-e/notifications#ActionRequiredNotification", "Needs Attention"),
      action("Open affected destination", "Customer", "/review/phase-e/onboarding", "Current"),
      action("Review notification preferences", "Admin", "/settings/notifications", "Current"),
    ],
    acceptance: [
      "Every notification includes title, what happened, why it matters, business impact, owner, recommended action, destination, and status.",
      "Unread, read, resolved, stale, expired, permission restricted, and unavailable states are represented.",
      "Badge semantics mean unread actionable notifications only.",
    ],
  },
  help: {
    title: "Help And Education Center",
    eyebrow: "Guidance And Recovery",
    summary:
      "Help covers getting started, AI workforce, website, billing, integrations, troubleshooting, best practices, and contextual guidance where users need it.",
    intent: "Customers get recovery and education in context rather than being pushed to generic documentation.",
    sourceSemantics: sourceSemantics(
      "Phase E help fixture mapped to guide taxonomy, contextual placements, troubleshooting steps, and escalation paths",
      "Customer role, module context, lifecycle stage, and plan eligibility",
      "Requires approved content source before help copy is treated as canonical documentation",
    ),
    lifecycle: [
      { label: "Getting Started", status: "Current", detail: "Supports activation and first-result education." },
      { label: "AI Workforce Guide", status: "Current", detail: "Explains how the AI receptionist works in business language." },
      { label: "Website Guide", status: "Current", detail: "Explains public site and lead capture setup." },
      { label: "Billing Help", status: "Current", detail: "Explains plan, trial, upgrade, and downgrade consequences." },
      { label: "Integrations", status: "Current", detail: "Explains connection health and permissions." },
      { label: "Troubleshooting", status: "Current", detail: "Provides ordered recovery steps with owner and impact." },
      { label: "Best Practices", status: "Current", detail: "Education does not imply unsupported performance outcomes." },
    ],
    states: ["Helpful", "Contextual", "Troubleshooting", "Permission Restricted", "Unavailable", "Error"],
    interruptions: [
      lifecycleInterruption({
        id: "permissions",
        title: "A guide is limited by role",
        status: "Permission Restricted",
        capability: "Billing, security, and integration guidance",
        preserved: "General help remains available without leaking restricted details",
        owner: "System",
        recovery: "/settings/roles",
      }),
      lifecycleInterruption({
        id: "source-coverage",
        title: "Source coverage is partial",
        status: "Partial",
        capability: "Troubleshooting accuracy",
        preserved: "Known safe steps remain available and uncertainty is visible",
        owner: "ClientSurge success",
        recovery: "/review/phase-e/launch-readiness#truth-validation",
      }),
    ],
    actions: [
      action("Find setup help", "Customer", "/review/phase-e/help#getting-started", "Current"),
      action("Open AI workforce guide", "Customer", "/review/phase-e/help#ai-workforce", "Current"),
      action("Start troubleshooting", "Customer", "/review/phase-e/help#troubleshooting", "Current"),
    ],
    acceptance: [
      "HelpSearch, GuideCard, ContextualHelp, TroubleshootingStep, Best Practices, and escalation path components are represented.",
      "Contextual help appears at the point of need, such as How does my AI receptionist work?",
      "Help copy stays direct, specific, calm, business-focused, and honest about uncertainty.",
    ],
  },
  incidents: {
    title: "Incident Communication",
    eyebrow: "Transparent Operations",
    summary:
      "Incident states translate technical faults into business consequence, affected systems, current action, next update, and history.",
    intent: "Customers understand service impact without needing internal implementation keys.",
    sourceSemantics: sourceSemantics(
      "Phase E incident fixture mapped to service status, provider diagnostics, maintenance windows, affected systems, and update history",
      "Organization, customer, module, provider, and permission scope",
      "Requires incident source and notification policy before production status claims are shown",
    ),
    lifecycle: [
      { label: "Operational", status: "Healthy", detail: "Operational requires evidence, not absence of alerts." },
      { label: "Degraded", status: "Waiting", detail: "Reduced capability is explained with business impact." },
      { label: "Partial Impact", status: "Partial", detail: "Affected systems and unaffected work are separated." },
      { label: "Major Incident", status: "Blocked", detail: "Critical path explains owner and next update." },
      { label: "Maintenance", status: "Waiting", detail: "Scheduled maintenance explains expected impact." },
      { label: "Resolved", status: "Resolved", detail: "Resolution history remains visible." },
    ],
    states: ["Operational", "Degraded", "Partial Impact", "Major Incident", "Maintenance", "Resolved"],
    interruptions: [
      lifecycleInterruption({
        id: "billing-provider",
        title: "Payment provider status cannot be verified",
        status: "Unavailable",
        capability: "Plan change execution and billing confidence",
        preserved: "Current plan remains unchanged and scheduled-change draft remains preserved",
        owner: "ClientSurge billing owner",
        recovery: "/review/phase-e/subscription",
        truth: "unknown",
        impact: "high",
      }),
      lifecycleInterruption({
        id: "sms-provider-timeout",
        title: "Text follow-up messages may be delayed",
        status: "Degraded",
        capability: "Lead response and missed-call follow-up",
        preserved: "Lead events remain queued for retry or manual follow-up",
        owner: "ClientSurge operations",
        recovery: "/review/phase-e/notifications#activity-delay",
      }),
    ],
    actions: [
      action("Review affected systems", "Customer", "/review/phase-e/incidents#AffectedSystemsList", "Current"),
      action("Open current action", "ClientSurge operations", "/review/phase-e/incidents#IncidentImpactSummary", "Current"),
      action("Check next update", "Customer", "/review/phase-e/incidents#NextUpdateNotice", "Waiting"),
    ],
    acceptance: [
      "Operational, Degraded, Partial Impact, Major Incident, Maintenance, and Resolved states are represented.",
      "Business consequence appears before technical detail.",
      "Incident history, next update, current action, and affected systems are visible.",
    ],
  },
  "launch-readiness": {
    title: "Launch Readiness Validation",
    eyebrow: "Final Review Matrix",
    summary:
      "The validation system covers all ten Phase E systems, all six viewports, accessibility checks, and truth-state rules before launch claims.",
    intent: "Worker #3 receives a clear review packet with routes, states, fixtures, browser evidence, accessibility coverage, and known limits.",
    sourceSemantics: sourceSemantics(
      "Phase E validation fixture mapped to browser matrix, state coverage, accessibility checks, and launch truth rules",
      "Review environment only",
      "Requires rendered browser validation and Worker #3 review before promotion",
      "Generated from fixture and local browser checks",
    ),
    lifecycle: PHASE_E_LAUNCH_VALIDATION_SYSTEMS.map((system, index) => ({
      label: system,
      status: index === 9 ? "Current" : "Complete",
      detail: "Review route, fixture state coverage, and browser validation target are defined.",
    })),
    states: ["Browser Matrix", "Keyboard", "Focus", "ARIA", "Screen Reader", "Reduced Motion", "Touch Targets", "Contrast", "200% Zoom"],
    interruptions: [
      lifecycleInterruption({
        id: "truth-validation",
        title: "A launch state is not trusted without proof",
        status: "Blocked",
        capability: "Launch readiness claims",
        preserved: "Review fixtures remain usable, but launch claim stays blocked",
        owner: "Worker #1",
        recovery: "/review/phase-e/launch-readiness#truth-rules",
        truth: "unknown",
        impact: "high",
      }),
      lifecycleInterruption({
        id: "worker3-review",
        title: "Worker #3 final product-quality review is pending",
        status: "Waiting",
        capability: "UX polish, accessibility, responsiveness, and enterprise finish",
        preserved: "Implementation and validation evidence remain available",
        owner: "Worker #3",
        recovery: "/review/phase-e/launch-readiness#WorkerReviewPacket",
      }),
    ],
    actions: [
      action("Run browser validator", "Worker #1", "scripts/validate-phase-e-browser.mjs", "Current"),
      action("Review accessibility checklist", "Worker #3", "/review/phase-e/launch-readiness#AccessibilityChecklist", "Waiting"),
      action("Confirm truth-state rules", "Worker #2", "/review/phase-e/launch-readiness#TruthValidationChecklist", "Waiting"),
    ],
    acceptance: [
      "Ten Phase E systems are included in the launch matrix.",
      "Viewports 1440, 1280, 1024, 768, 390, and 375 are represented.",
      "Unknown, estimated, sent, no-data, configured, and connected truth rules remain explicit.",
      "Worker #3 review packet identifies known limits and non-production boundaries.",
    ],
  },
};

export const getPhaseERoute = (sectionId) =>
  PHASE_E_ROUTES.find((route) => route.id === sectionId) || PHASE_E_ROUTES[0];

export const getPhaseESection = (sectionId) =>
  PHASE_E_SECTIONS[sectionId] || PHASE_E_SECTIONS.onboarding;

export const getPhaseEComponents = (sectionId) =>
  PHASE_E_COMPONENTS[sectionId] || PHASE_E_COMPONENTS.onboarding;

export const getPhaseEStatusCoverage = (sectionId) =>
  Array.from(new Set([...(PHASE_E_SECTIONS[sectionId]?.states || []), ...PHASE_E_REVIEW_STATES]));
