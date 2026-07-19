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
  CSAlert,
  CSCard,
  CSMetricCard,
  CSPageHeader,
  CSStatusBadge,
} from "@/components/design-system";

const cx = (...values) => values.filter(Boolean).join(" ");

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

function CommandCenterSection({ id, title, description, icon: Icon, actions, children, className }) {
  return (
    <section id={id} className={cx("cs-command-section", className)} aria-labelledby={`${id}-title`}>
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

function ActionItem({ title, description, priority = "Normal", icon: Icon = Sparkles, action }) {
  const tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : "info";
  return (
    <article className="cs-action-item">
      <span className="cs-action-item__icon" aria-hidden="true"><Icon /></span>
      <div>
        <div className="cs-action-item__title-row">
          <h3>{title}</h3>
          <CSStatusBadge tone={tone}>{priority}</CSStatusBadge>
        </div>
        <p>{description}</p>
      </div>
      {action ? <div className="cs-action-item__action">{action}</div> : null}
    </article>
  );
}

export default function CSCommandCenterShell({
  businessName = "Your business",
  status = "Operational",
  metrics = [],
  workforce = [],
  actions = [],
  alerts = [],
  activity,
  opportunities,
  websiteIntelligence,
  systemHealth,
  headerActions,
}) {
  return (
    <main className="cs-command-center">
      <CSPageHeader
        eyebrow="ClientSurge Command Center"
        title={`${businessName} is ${status.toLowerCase()}`}
        description="See what your AI workforce is doing, where revenue opportunities are forming, and what needs your attention next."
        actions={headerActions}
      >
        <div className="cs-command-center__status-line">
          <CSStatusBadge tone={status === "Operational" ? "success" : "warning"}>{status}</CSStatusBadge>
          <span>Live operational view</span>
        </div>
      </CSPageHeader>

      {alerts.length ? (
        <div className="cs-command-center__alerts" aria-label="Priority alerts">
          {alerts.map((alert) => (
            <CSAlert key={alert.id || alert.title} tone={alert.tone || "warning"} title={alert.title} actions={alert.actions}>
              {alert.message}
            </CSAlert>
          ))}
        </div>
      ) : null}

      <section className="cs-command-center__metrics" aria-label="Business pulse">
        {metrics.map((metric) => <CSMetricCard key={metric.id || metric.label} {...metric} />)}
      </section>

      <div className="cs-command-center__grid">
        <CommandCenterSection
          id="ai-workforce"
          title="AI Workforce"
          description="Live operating status for the AI systems working across your business."
          icon={Bot}
          className="cs-command-section--wide"
        >
          <div className="cs-workforce-list">
            {workforce.length ? workforce.map((agent) => <WorkforceRow key={agent.id || agent.name} {...agent} />) : (
              <CSCard tone="subtle" title="No AI workers are reporting yet" description="AI workforce activity will appear after connected services are activated.">
                <p className="cs-command-center__muted">No status has been fabricated. Connect or activate a service to begin reporting.</p>
              </CSCard>
            )}
          </div>
        </CommandCenterSection>

        <CommandCenterSection
          id="daily-actions"
          title="Daily Action Center"
          description="The highest-value actions requiring a person today."
          icon={Inbox}
        >
          <div className="cs-action-list">
            {actions.length ? actions.map((item) => <ActionItem key={item.id || item.title} {...item} />) : (
              <CSCard tone="subtle" title="You are caught up" description="No human action is currently required.">
                <p className="cs-command-center__muted">ClientSurge will surface the next action when one becomes available.</p>
              </CSCard>
            )}
          </div>
        </CommandCenterSection>

        <CommandCenterSection id="opportunities" title="Opportunities" description="Qualified leads and revenue opportunities that are moving now." icon={Target}>
          {opportunities || <CSCard tone="subtle"><p className="cs-command-center__muted">Opportunity data is unavailable until lead sources are connected.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="website-intelligence" title="Website Intelligence" description="How your website is converting attention into measurable business activity." icon={Globe2}>
          {websiteIntelligence || <CSCard tone="subtle"><p className="cs-command-center__muted">Website intelligence will appear after tracking is verified.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="activity" title="Activity Timeline" description="A trustworthy chronological record of meaningful system activity." icon={Activity} className="cs-command-section--wide">
          {activity || <CSCard tone="subtle"><p className="cs-command-center__muted">No meaningful activity has been recorded yet.</p></CSCard>}
        </CommandCenterSection>

        <CommandCenterSection id="system-health" title="System Health" description="Connection, delivery, and automation health across the ClientSurge system." icon={HeartPulse}>
          {systemHealth || (
            <div className="cs-system-health-summary">
              <div><PhoneCall aria-hidden="true" /><span>Communications</span><CSStatusBadge tone="neutral">Not connected</CSStatusBadge></div>
              <div><CalendarCheck aria-hidden="true" /><span>Booking</span><CSStatusBadge tone="neutral">Not connected</CSStatusBadge></div>
              <div><Globe2 aria-hidden="true" /><span>Website</span><CSStatusBadge tone="neutral">Not verified</CSStatusBadge></div>
            </div>
          )}
        </CommandCenterSection>
      </div>
    </main>
  );
}
