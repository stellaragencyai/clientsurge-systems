import React from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarCheck,
  CircleDollarSign,
  Globe2,
  HeartPulse,
  Inbox,
  PhoneCall,
  Sparkles,
  Target,
} from "lucide-react";
import {
  CSCard,
  CSPageHeader,
  CSStatusBadge,
} from "@/components/design-system";

const cx = (...values) => values.filter(Boolean).join(" ");

const actionQueueStates = {
  verified_zero: {
    title: "No human action is currently required",
    description: "The action query completed successfully with required sources and permissions available.",
    detail: "The queue is clear based on verified source data.",
  },
  not_loaded: {
    title: "Action queue not loaded",
    description: "The action query has not completed yet.",
    detail: "Do not treat this as caught up until the query finishes.",
  },
  failed: {
    title: "Action queue failed to load",
    description: "The action query did not complete successfully.",
    detail: "Retry before deciding whether human action is required.",
  },
  not_connected: {
    title: "Action source not connected",
    description: "Required sources are not connected yet.",
    detail: "Connect the source before treating this queue as clear.",
  },
  restricted: {
    title: "Action queue restricted",
    description: "Your role cannot verify whether actions exist.",
    detail: "Counts are withheld to avoid leaking restricted work.",
  },
  unsupported: {
    title: "Action queue unsupported",
    description: "This package or configuration does not support the requested action queue.",
    detail: "Use an eligible module for this workflow.",
  },
  unknown: {
    title: "Action queue not verified",
    description: "There is not enough evidence to know whether actions exist.",
    detail: "No action-clear state has been fabricated.",
  },
};

const freshnessStates = {
  live: "Live",
  current: "Current",
  delayed: "Delayed",
  stale: "Stale",
  partial: "Partial",
  not_connected: "Not connected",
  unavailable: "Unavailable",
  unknown: "Freshness unknown",
};

const conditionStates = {
  verified_operational: {
    label: "Operational",
    tone: "success",
    title: "Business Condition",
    summary: "Verified sources are current and no action-required condition is present.",
    message: "Verified source coverage is current for this review fixture.",
  },
  attention_required: {
    label: "Attention required",
    tone: "warning",
    title: "Business Condition",
    summary: "A verified or material business condition needs attention.",
    message: "Review the attention item and complete the next best action before treating the workspace as operational.",
  },
  setup_incomplete: {
    label: "Setup incomplete",
    tone: "warning",
    title: "Business Condition",
    summary: "Required setup is incomplete.",
    message: "Finish setup before making operational claims.",
  },
  not_connected: {
    label: "Not connected",
    tone: "neutral",
    title: "Business Condition",
    summary: "Required sources are not connected.",
    message: "Connect sources before interpreting business condition.",
  },
  partial: {
    label: "Partial data",
    tone: "warning",
    title: "Business Condition",
    summary: "Some source coverage is missing.",
    message: "Do not treat partial data as complete or operational.",
  },
  stale: {
    label: "Stale data",
    tone: "warning",
    title: "Business Condition",
    summary: "Source data has not updated recently.",
    message: "Refresh source evidence before making operational decisions.",
  },
  delayed: {
    label: "Delayed",
    tone: "warning",
    title: "Business Condition",
    summary: "A connected source is delayed.",
    message: "Review delayed source coverage before acting on totals.",
  },
  permission_restricted: {
    label: "Permission restricted",
    tone: "neutral",
    title: "Business Condition",
    summary: "This role cannot verify the full business condition.",
    message: "Request access before treating hidden work as clear.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "danger",
    title: "Business Condition",
    summary: "A required source is unavailable.",
    message: "Restore the source before interpreting the business condition.",
  },
  unknown: {
    label: "Data not verified",
    tone: "neutral",
    title: "Business Condition",
    summary: "Business pulse not verified",
    message: "Status being verified from static review fixtures. Unknown data is not represented as zero.",
  },
};

export const COMMAND_CENTER_MODULES = [
  { id: "business-pulse", label: "Business Pulse", icon: HeartPulse },
  { id: "growth-snapshot", label: "Growth Snapshot", icon: CircleDollarSign },
  { id: "ai-workforce", label: "AI Workforce", icon: Bot },
  { id: "website-intelligence", label: "Website Intelligence", icon: Globe2 },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "activity", label: "Activity Timeline", icon: Activity },
  { id: "system-health", label: "System Health", icon: HeartPulse },
];

function CommandCenterSection({ id, title, description, icon: Icon, actions, children, className, moduleRole, prominence }) {
  return (
    <section
      id={id}
      className={cx("cs-command-section", className)}
      aria-labelledby={`${id}-title`}
      data-command-role={moduleRole}
      data-prominence={prominence}
    >
      <div className="cs-command-section__header">
        <div className="cs-command-section__heading">
          <span className="cs-command-section__icon" aria-hidden="true"><Icon /></span>
          <div>
            <h2 id={`${id}-title`}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="cs-command-section__actions">{actions}</div> : null}
      </div>
      <div className="cs-command-section__body">{children}</div>
    </section>
  );
}

function ExecutiveSummaryItem({ id, title, icon: Icon, tone = "neutral", badge, children, moduleRole }) {
  return (
    <article
      id={id}
      className="cs-command-summary__item"
      data-command-role={moduleRole}
      data-prominence="primary"
      aria-labelledby={`${id}-title`}
    >
      <div className="cs-command-summary__item-header">
        <span className="cs-command-summary__icon" aria-hidden="true"><Icon /></span>
        <div>
          <h3 id={`${id}-title`}>{title}</h3>
          {badge ? <CSStatusBadge tone={tone}>{badge}</CSStatusBadge> : null}
        </div>
      </div>
      <div className="cs-command-summary__item-body">{children}</div>
    </article>
  );
}

function deriveConditionState({
  dataReadiness,
  sourceConnected,
  coverageState,
  freshnessState,
  alerts,
  actions,
}) {
  if (dataReadiness !== "verified") return "unknown";
  if (!sourceConnected) return "not_connected";
  if (coverageState === "partial" || freshnessState === "partial") return "partial";
  if (freshnessState === "stale") return "stale";
  if (freshnessState === "delayed") return "delayed";
  if (freshnessState === "not_connected") return "not_connected";
  if (freshnessState === "unavailable") return "unavailable";
  if (freshnessState === "unknown") return "unknown";
  if (alerts.length || actions.length) return "attention_required";
  if ((freshnessState === "live" || freshnessState === "current") && coverageState === "current") return "verified_operational";
  return "unknown";
}

function WorkforceRow({ name, role, status, activity, metric }) {
  const tone = status === "Active" ? "success" : status === "Needs attention" ? "warning" : "neutral";
  return (
    <article className="cs-workforce-row">
      <div className="cs-workforce-row__identity">
        <span className="cs-workforce-row__avatar" aria-hidden="true"><Bot /></span>
        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
      <CSStatusBadge tone={tone}>{status}</CSStatusBadge>
      <p>{activity}</p>
      <strong className="cs-workforce-row__metric">{metric}</strong>
    </article>
  );
}

function ActionItem({
  title,
  description,
  priority = "Normal",
  owner = "Unassigned",
  urgency = priority,
  consequence,
  evidence,
  destination,
  lifecycle = "New",
  icon: Icon = Sparkles,
  action,
  compact = false,
}) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : "info";
  return (
    <article className={cx("cs-action-item", compact && "cs-action-item--compact")}>
      <span className="cs-action-item__icon" aria-hidden="true"><Icon /></span>
      <div>
        <div className="cs-action-item__title-row">
          <h3>{title}</h3>
          <CSStatusBadge tone={tone}>{priority}</CSStatusBadge>
        </div>
        <p>{description}</p>
        <dl className={cx("cs-action-item__meta", compact && "cs-action-item__meta--compact")}>
          <div><dt>Owner</dt><dd>{owner}</dd></div>
          <div><dt>Urgency</dt><dd>{urgency}</dd></div>
          <div><dt>Consequence</dt><dd>{consequence || "Business impact not verified"}</dd></div>
          <div><dt>Evidence</dt><dd>{evidence || "Evidence not verified"}</dd></div>
          <div><dt>Destination</dt><dd>{destination || "No exact destination provided"}</dd></div>
          <div><dt>Lifecycle</dt><dd>{lifecycle}</dd></div>
        </dl>
      </div>
      {action ? <div className="cs-action-item__action">{action}</div> : null}
    </article>
  );
}

export default function CSCommandCenterShell({
  businessName = "Your business",
  statusTone,
  dataReadiness = "unverified",
  readinessMessage,
  title,
  description = "Verified activity, revenue opportunities, and human actions appear here as connected sources report in.",
  metrics = [],
  workforce = [],
  actions = [],
  actionQueueVerified = false,
  actionQueueState,
  freshnessState = "unknown",
  sourceConnected = false,
  coverageState = "unknown",
  alerts = [],
  activity,
  opportunities,
  websiteIntelligence,
  systemHealth,
  headerActions,
}) {
  const hasVerifiedOperationalData = dataReadiness === "verified";
  const conditionState = deriveConditionState({
    dataReadiness,
    sourceConnected,
    coverageState,
    freshnessState,
    alerts,
    actions,
  });
  const condition = conditionStates[conditionState] || conditionStates.unknown;
  const canDisplayLive = conditionState === "verified_operational" && sourceConnected && freshnessState === "live" && coverageState === "current";
  const displayedFreshnessState = canDisplayLive ? "live" : freshnessState === "live" ? "current" : freshnessState;
  const displayedFreshnessLabel = freshnessStates[displayedFreshnessState] || freshnessStates.unknown;
  const displayedStatus = condition.label;
  const displayedStatusTone = statusTone || condition.tone;
  const displayedStatusMessage = readinessMessage || condition.message;
  const pageTitle = title || (businessName === "Your business" ? "Your Command Center" : `${businessName} Command Center`);
  const resolvedActionQueueState = actionQueueState || (actionQueueVerified ? "verified_zero" : "unknown");
  const actionQueueCopy = actionQueueStates[resolvedActionQueueState] || actionQueueStates.unknown;
  const hasAttention = alerts.length > 0 || conditionState === "attention_required";
  const attentionFallback = hasAttention
    ? {
        tone: "warning",
        title: "Attention required",
        message: "Review the current condition before treating the workspace as operational.",
        badge: "Review",
      }
    : conditionState === "verified_operational"
      ? {
          tone: "success",
          title: "No priority warning in this verified fixture",
          message: "The verified fixture has no attention-required item before routine work begins.",
          badge: "No blocker",
        }
      : {
          tone: "neutral",
          title: "Attention check pending",
          message: "Attention state depends on verified source coverage. Unknown work is not treated as clear.",
          badge: "Pending",
        };
  const showVerifiedOutcomeSummary = hasVerifiedOperationalData && metrics.length > 0;
  const systemHealthProminence = conditionState === "verified_operational" ? "secondary" : "contextual";
  const conditionPriorityMessage = hasVerifiedOperationalData
    ? condition.message
    : "Unknown data is not represented as zero. Metrics appear after a connected source reports verified values.";
  const primaryAttention = alerts[0] || attentionFallback;
  const primaryAction = actions[0];
  const nextActionTitle = primaryAction
    ? primaryAction.title
    : resolvedActionQueueState === "verified_zero"
      ? actionQueueCopy.title
      : "Verify action queue";
  const nextActionDetail = primaryAction
    ? primaryAction.description
    : `${actionQueueCopy.title}. ${actionQueueCopy.description} ${actionQueueCopy.detail}`;
  const outcomeSummaryItems = metrics.length
    ? metrics.slice(0, 4).map((metric) => ({
        id: metric.id || metric.label,
        label: metric.label,
        value: metric.value,
      }))
    : [
        { id: "leads", label: "Leads", value: "Not verified" },
        { id: "calls", label: "Calls", value: "Not verified" },
        { id: "reviews", label: "Reviews", value: "Not verified" },
      ];

  return (
    <main className="cs-command-center">
      <CSPageHeader
        eyebrow="ClientSurge Command Center"
        title={pageTitle}
        description={description}
      >
        <div className="cs-command-center__status-line">
          <CSStatusBadge tone={displayedStatusTone}>{displayedStatus}</CSStatusBadge>
          <CSStatusBadge tone={displayedFreshnessState === "live" || displayedFreshnessState === "current" ? "info" : displayedFreshnessState === "stale" || displayedFreshnessState === "delayed" || displayedFreshnessState === "partial" ? "warning" : "neutral"}>{displayedFreshnessLabel}</CSStatusBadge>
          <span>{displayedStatusMessage}</span>
        </div>
      </CSPageHeader>

      <section
        id="command-center-summary"
        className="cs-command-summary"
        aria-labelledby="command-center-summary-title"
      >
        <div className="cs-command-summary__header">
          <p className="cs-eyebrow">Command Center Summary</p>
          <h2 id="command-center-summary-title">What matters now</h2>
        </div>

        <div className="cs-command-summary__grid" aria-label="First viewport priority">
          <ExecutiveSummaryItem
          id="business-condition"
          title="Business Condition"
          icon={HeartPulse}
            tone={displayedStatusTone}
            badge={displayedStatus}
          moduleRole="business-condition"
        >
            <div className="cs-command-summary__headline">
              <strong>{condition.summary}</strong>
            </div>
            <p>{conditionPriorityMessage}</p>
            <dl className="cs-command-center__source-row cs-command-center__source-row--compact">
              <div><dt>Source</dt><dd>{sourceConnected ? "Connected review source" : "Static review fixture"}</dd></div>
              <div><dt>Truth</dt><dd><CSStatusBadge tone={displayedStatusTone}>{displayedStatus}</CSStatusBadge></dd></div>
              <div><dt>Freshness</dt><dd><CSStatusBadge tone={displayedFreshnessState === "live" || displayedFreshnessState === "current" ? "info" : "neutral"}>{displayedFreshnessLabel}</CSStatusBadge></dd></div>
              <div><dt>Coverage</dt><dd>{coverageState === "current" ? "Current period" : "Coverage not verified"}</dd></div>
            </dl>
          </ExecutiveSummaryItem>

          <ExecutiveSummaryItem
          id="attention-required"
          title="Attention Required"
          icon={AlertTriangle}
            tone={primaryAttention.tone || "warning"}
            badge={alerts.length || hasAttention ? "Review" : attentionFallback.badge}
          moduleRole="attention-required"
        >
            <div className="cs-command-summary__headline">
              <strong>{primaryAttention.title}</strong>
            </div>
            <p>{primaryAttention.message}</p>
          </ExecutiveSummaryItem>

          <ExecutiveSummaryItem
          id="daily-actions"
            title="Next Best Action"
          icon={Inbox}
            tone={primaryAction ? "warning" : resolvedActionQueueState === "verified_zero" ? "success" : "neutral"}
            badge={primaryAction ? primaryAction.priority || "Action" : resolvedActionQueueState === "verified_zero" ? "Verified zero" : actionQueueCopy.title}
          moduleRole="next-best-actions"
        >
            {primaryAction ? (
              <ActionItem compact {...primaryAction} />
            ) : (
              <>
                <div className="cs-command-summary__headline">
                  <strong>{nextActionTitle}</strong>
                </div>
                <p>{nextActionDetail}</p>
              </>
            )}
          </ExecutiveSummaryItem>

          <ExecutiveSummaryItem
            id="verified-outcome-summary"
            title="Verified Outcome Summary"
            icon={CircleDollarSign}
            tone={showVerifiedOutcomeSummary ? "info" : "neutral"}
            badge={showVerifiedOutcomeSummary ? "Verified" : "Not verified"}
            moduleRole="verified-outcome-summary"
          >
            <div className="cs-command-summary__outcomes" aria-label="Verified outcome summary">
              {outcomeSummaryItems.map((metric) => (
                <div key={metric.id}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </ExecutiveSummaryItem>
        </div>
      </section>

      {headerActions ? <div className="cs-command-center__source-actions">{headerActions}</div> : null}

      <div className="cs-command-center__grid cs-command-center__secondary-grid">
        <CommandCenterSection id="opportunities" title="Opportunities" description="Qualified leads and revenue opportunities that are moving now." icon={Target} moduleRole="opportunities" prominence="secondary">
          {opportunities || <CSCard tone="subtle"><p className="cs-command-center__muted">Opportunity data is unavailable until lead sources are connected.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="website-intelligence" title="Website Intelligence" description="How your website is converting attention into measurable business activity." icon={Globe2} moduleRole="website-intelligence" prominence="secondary">
          {websiteIntelligence || <CSCard tone="subtle"><p className="cs-command-center__muted">Website intelligence will appear after tracking is verified.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="activity" title="Activity Timeline" description="A trustworthy chronological record of meaningful system activity." icon={Activity} className="cs-command-section--wide cs-command-section--secondary" moduleRole="activity-timeline" prominence="secondary">
          {activity || <CSCard tone="subtle"><p className="cs-command-center__muted">No meaningful activity has been recorded yet.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="system-health" title="System Health" description="Connection, delivery, and automation health across the ClientSurge system." icon={HeartPulse} className={cx(systemHealthProminence === "secondary" && "cs-command-section--secondary")} moduleRole="system-health" prominence={systemHealthProminence}>
          {systemHealth || (
            <div className="cs-system-health-summary">
              {systemHealthProminence === "secondary" ? (
                <>
                  <div><PhoneCall aria-hidden="true" /><span>Communications</span><CSStatusBadge tone="success">Verified</CSStatusBadge></div>
                  <div><CalendarCheck aria-hidden="true" /><span>Booking</span><CSStatusBadge tone="success">Verified</CSStatusBadge></div>
                  <div><Globe2 aria-hidden="true" /><span>Website</span><CSStatusBadge tone="success">Verified</CSStatusBadge></div>
                </>
              ) : (
                <>
                  <div><PhoneCall aria-hidden="true" /><span>Communications</span><CSStatusBadge tone="neutral">Not connected</CSStatusBadge></div>
                  <div><CalendarCheck aria-hidden="true" /><span>Booking</span><CSStatusBadge tone="neutral">Not connected</CSStatusBadge></div>
                  <div><Globe2 aria-hidden="true" /><span>Website</span><CSStatusBadge tone="neutral">Not verified</CSStatusBadge></div>
                </>
              )}
            </div>
          )}
        </CommandCenterSection>

        <CommandCenterSection
          id="ai-workforce"
          title="AI Workforce"
          description="Current operating status for the AI systems working across your business."
          icon={Bot}
          className="cs-command-section--wide"
          moduleRole="ai-workforce"
          prominence="secondary"
        >
          <div className="cs-workforce-list">
            {workforce.length ? workforce.map((agent) => <WorkforceRow key={agent.id || agent.name} {...agent} />) : (
              <CSCard tone="subtle" title="No AI workers are reporting yet" description="AI workforce activity will appear after connected services are activated.">
                <p className="cs-command-center__muted">No status has been fabricated. Connect or activate a service to begin reporting.</p>
              </CSCard>
            )}
          </div>
        </CommandCenterSection>
      </div>
    </main>
  );
}
