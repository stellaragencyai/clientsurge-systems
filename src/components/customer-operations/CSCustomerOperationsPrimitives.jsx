import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  CSAlert,
  CSButton,
  CSEmptyState,
  CSSkeleton,
  CSStatusBadge,
} from "@/components/design-system";

const cx = (...values) => values.filter(Boolean).join(" ");

export const STATUS_LABELS = {
  healthy: { label: "Healthy", tone: "success" },
  current: { label: "Current", tone: "success" },
  loading: { label: "Loading", tone: "info" },
  degraded: { label: "Degraded", tone: "warning" },
  attention_required: { label: "Attention required", tone: "warning" },
  action_required: { label: "Action required", tone: "warning" },
  blocked: { label: "Blocked", tone: "danger" },
  paused: { label: "Paused", tone: "neutral" },
  offline: { label: "Offline", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
  unavailable: { label: "Unavailable", tone: "danger" },
  not_configured: { label: "Not configured", tone: "neutral" },
  empty: { label: "Empty valid", tone: "neutral" },
  delayed: { label: "Delayed", tone: "warning" },
  permission_restricted: { label: "Permission restricted", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  escalated: { label: "Escalated", tone: "warning" },
  risk: { label: "Risk", tone: "warning" },
  missing_data: { label: "Missing data", tone: "warning" },
  incomplete_setup: { label: "Incomplete setup", tone: "neutral" },
  normal: { label: "Normal", tone: "success" },
  unread: { label: "Unread", tone: "warning" },
};

export const TRUTH_LABELS = {
  verified: { label: "Verified", tone: "success" },
  derived: { label: "Derived", tone: "info" },
  estimated: { label: "Estimated", tone: "warning" },
  reported: { label: "Reported", tone: "neutral" },
  unknown: { label: "Unknown truth", tone: "neutral" },
};

export const FRESHNESS_LABELS = {
  live: { label: "Live", tone: "success" },
  current: { label: "Current", tone: "success" },
  stale: { label: "Stale", tone: "warning" },
  delayed: { label: "Delayed", tone: "warning" },
  partial: { label: "Partial", tone: "warning" },
  unavailable: { label: "Unavailable", tone: "danger" },
  not_connected: { label: "Not connected", tone: "neutral" },
  permission_restricted: { label: "Permission restricted", tone: "warning" },
  unknown: { label: "Freshness unknown", tone: "neutral" },
};

export const CONFIDENCE_LABELS = {
  high: { label: "High confidence", tone: "success" },
  medium: { label: "Medium confidence", tone: "info" },
  low: { label: "Low confidence", tone: "warning" },
  insufficient: { label: "Insufficient confidence", tone: "neutral" },
};

export const OWNER_LABELS = {
  customer: "Customer",
  clientsurge_staff: "ClientSurge staff",
  ai_worker: "AI worker",
  external_provider: "External provider",
  system: "System",
  unassigned: "Unassigned",
};

export const PRIORITY_LABELS = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "info" },
  low: { label: "Low", tone: "neutral" },
};

function lookup(map, key, fallbackLabel = "Unknown") {
  return map[key] || { label: fallbackLabel, tone: "neutral" };
}

export function PhaseCStatusBadge({ state = "unknown", label, tone, className }) {
  const item = lookup(STATUS_LABELS, state);
  return <CSStatusBadge tone={tone || item.tone} className={className}>{label || item.label}</CSStatusBadge>;
}

export function TruthIndicator({ value = "unknown", className }) {
  const item = lookup(TRUTH_LABELS, value, "Unknown truth");
  return <CSStatusBadge tone={item.tone} className={className}>{item.label}</CSStatusBadge>;
}

export function FreshnessIndicator({ state = "unknown", timestamp, className }) {
  const item = lookup(FRESHNESS_LABELS, state, "Freshness unknown");
  return (
    <span className={cx("cs-co-freshness", className)}>
      <Clock3 size={14} aria-hidden="true" />
      <span>{item.label}</span>
      {timestamp ? <time dateTime={timestamp}>{timestamp}</time> : null}
    </span>
  );
}

export function ConfidenceIndicator({ value = "insufficient", className }) {
  const item = lookup(CONFIDENCE_LABELS, value, "Insufficient confidence");
  return <CSStatusBadge tone={item.tone} className={className}>{item.label}</CSStatusBadge>;
}

export function OwnerBadge({ owner = "unassigned", className }) {
  return (
    <span className={cx("cs-co-owner", className)}>
      <UserRound size={14} aria-hidden="true" />
      <span>{OWNER_LABELS[owner] || OWNER_LABELS.unassigned}</span>
    </span>
  );
}

export function PhaseCDeepLink({ label = "Open details", href = "#", className }) {
  return (
    <a className={cx("cs-co-deep-link", className)} href={href}>
      <span>{label}</span>
      <ArrowRight size={15} aria-hidden="true" />
    </a>
  );
}

export function PhaseCSourceDisclosure({ disclosure, className }) {
  const source = disclosure || {};
  return (
    <dl className={cx("cs-co-source", className)} aria-label="Source, truth, freshness, and permission disclosure">
      <div>
        <dt>Source</dt>
        <dd>{source.source || "Source unavailable"}</dd>
      </div>
      <div>
        <dt>Source ID</dt>
        <dd>{source.sourceId || "not-supplied"}</dd>
      </div>
      <div>
        <dt>Truth</dt>
        <dd><TruthIndicator value={source.truth} /></dd>
      </div>
      <div>
        <dt>Freshness</dt>
        <dd><FreshnessIndicator state={source.freshness} timestamp={source.timestamp} /></dd>
      </div>
      <div>
        <dt>Permission scope</dt>
        <dd>{source.permission || source.scope || "Permission scope unavailable"}</dd>
      </div>
      <div className="cs-co-source__wide">
        <dt>Explanation</dt>
        <dd>{source.explanation || "No production connection is used by this static review fixture."}</dd>
      </div>
    </dl>
  );
}

export function EvidenceCard({ title = "Evidence", evidence = [], className }) {
  return (
    <section className={cx("cs-co-evidence", className)} aria-label={title}>
      <h3>{title}</h3>
      {evidence.length ? (
        <ul>
          {evidence.map((item) => (
            <li key={item.id || item.label}>
              <ShieldCheck size={15} aria-hidden="true" />
              <span>{item.label || item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No evidence is available for this fixture state.</p>
      )}
    </section>
  );
}

export function PhaseCSituationStrip({ happening, attention, nextAction }) {
  const items = [
    ["What is happening", happening],
    ["Needs attention", attention],
    ["Next action", nextAction],
  ];

  return (
    <section className="cs-co-situation" aria-label="Current situation, attention, and next action">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}

export function PhaseCSurface({ scenario, children, actions }) {
  return (
    <main className={cx("cs-co-surface", `cs-co-state-${scenario.state}`)}>
      <header className="cs-co-surface__header">
        <div>
          <p className="cs-eyebrow">ClientSurge Phase C</p>
          <h1>{scenario.title}</h1>
          <p>{scenario.subtitle}</p>
          <div className="cs-co-chip-row" aria-label="Primary state">
            <PhaseCStatusBadge state={scenario.state} label={scenario.status} tone={scenario.tone} />
            <FreshnessIndicator state={scenario.disclosure?.freshness} timestamp={scenario.disclosure?.timestamp} />
          </div>
        </div>
        {actions ? <div className="cs-co-surface__actions">{actions}</div> : null}
      </header>
      <PhaseCSituationStrip
        happening={scenario.happening}
        attention={scenario.attention}
        nextAction={scenario.nextAction}
      />
      {children}
    </main>
  );
}

export function PhaseCSection({ id, title, description, children, actions, className }) {
  return (
    <section id={id} className={cx("cs-co-section", className)} aria-labelledby={`${id}-title`}>
      <div className="cs-co-section__header">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="cs-co-section__actions">{actions}</div> : null}
      </div>
      <div className="cs-co-section__body">{children}</div>
    </section>
  );
}

export function LoadingState({ title = "Loading Phase C foundation", description = "Static fixture evidence is being prepared before anything is promoted to current." }) {
  return (
    <div className="cs-co-state-panel" role="status" aria-live="polite">
      <RefreshCw aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <div className="cs-co-state-panel__skeletons" aria-hidden="true">
        <CSSkeleton height="12px" />
        <CSSkeleton height="12px" width="72%" />
      </div>
    </div>
  );
}

export function UnavailableState({ title = "Unavailable", description = "The source cannot currently be reached. Existing information is not promoted to current." }) {
  return (
    <CSEmptyState
      className="cs-co-empty-state"
      title={title}
      description={description}
      icon={<AlertTriangle />}
      action={<PhaseCDeepLink label="Open recovery context" href="#source-recovery" />}
    />
  );
}

export function RestrictedState({ title = "Permission restricted", description = "Content may exist but is restricted for the current role. Protected details are not leaked." }) {
  return (
    <CSEmptyState
      className="cs-co-empty-state"
      title={title}
      description={description}
      icon={<LockKeyhole />}
      action={<PhaseCDeepLink label="Request access" href="#request-access" />}
    />
  );
}

export function StaticFoundationNotice() {
  return (
    <CSAlert tone="info" title="Static foundation only" className="cs-co-static-notice">
      This review route uses committed fixtures only. It does not mount production routes, live adapters, or production data.
    </CSAlert>
  );
}

export function ActionCard({
  title,
  reason,
  evidence = [],
  priority = "medium",
  owner = "unassigned",
  expectedResult,
  destination,
  lifecycle,
  confidence = "insufficient",
  truth = "unknown",
  freshness = "unknown",
}) {
  const priorityItem = lookup(PRIORITY_LABELS, priority, "Medium");

  return (
    <article className="cs-co-action-card">
      <div className="cs-co-action-card__header">
        <div>
          <h3>{title}</h3>
          <p>{reason}</p>
        </div>
        <CSStatusBadge tone={priorityItem.tone}>{priorityItem.label}</CSStatusBadge>
      </div>
      <dl className="cs-co-meta-grid">
        <div><dt>Owner</dt><dd><OwnerBadge owner={owner} /></dd></div>
        <div><dt>Expected result</dt><dd>{expectedResult}</dd></div>
        <div><dt>Destination</dt><dd>{destination}</dd></div>
        <div><dt>Lifecycle</dt><dd>{lifecycle}</dd></div>
        <div><dt>Truth</dt><dd><TruthIndicator value={truth} /></dd></div>
        <div><dt>Freshness</dt><dd><FreshnessIndicator state={freshness} /></dd></div>
        <div><dt>Confidence</dt><dd><ConfidenceIndicator value={confidence} /></dd></div>
      </dl>
      <EvidenceCard title={`${title} evidence`} evidence={evidence} />
      <PhaseCDeepLink label={destination || "Open resolution"} href="#phase-c-resolution" />
    </article>
  );
}

export function RecommendationCard({ recommendation }) {
  return <ActionCard {...recommendation} />;
}

export function WorkerCard({ worker }) {
  const rows = [
    ["Identity", worker.identity],
    ["Role", worker.role],
    ["Responsibility", worker.responsibility],
    ["Current status", worker.currentStatus],
    ["Configuration", worker.configurationState],
    ["Recent work", worker.recentWork],
    ["Completed work", worker.completedWork],
    ["Business result", worker.businessResult],
    ["Blocked work", worker.blockedWork],
    ["Recommendation", worker.recommendation],
  ];

  return (
    <article className="cs-co-worker-card">
      <div className="cs-co-worker-card__top">
        <span aria-hidden="true"><Bot /></span>
        <div>
          <h3>{worker.identity}</h3>
          <p>{worker.role}</p>
        </div>
      </div>
      <dl className="cs-co-meta-grid cs-co-meta-grid--worker">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        <div><dt>Evidence</dt><dd>{worker.evidence?.length || 0} evidence items</dd></div>
        <div><dt>Confidence</dt><dd><ConfidenceIndicator value={worker.confidence} /></dd></div>
        <div><dt>Freshness</dt><dd><FreshnessIndicator state={worker.freshness} /></dd></div>
        <div><dt>Owner</dt><dd><OwnerBadge owner={worker.owner} /></dd></div>
      </dl>
      <EvidenceCard title={`${worker.identity} evidence`} evidence={worker.evidence} />
    </article>
  );
}

export function HandoffCard({ handoff }) {
  return (
    <article className="cs-co-handoff-card">
      <h3>Human handoff</h3>
      <dl className="cs-co-meta-grid">
        <div><dt>Handoff reason</dt><dd>{handoff.reason}</dd></div>
        <div><dt>Target owner or queue</dt><dd>{handoff.target}</dd></div>
        <div><dt>Urgency</dt><dd>{handoff.urgency}</dd></div>
        <div><dt>Context summary</dt><dd>{handoff.context}</dd></div>
      </dl>
      <PhaseCDeepLink label="Open handoff context" href="#human-handoff" />
    </article>
  );
}

export function TimelineEvent({ event }) {
  return (
    <article className="cs-co-timeline-event">
      <span className="cs-co-timeline-event__marker" aria-hidden="true"><FileText /></span>
      <div>
        <div className="cs-co-timeline-event__header">
          <h3>{event.businessSummary}</h3>
          <CSStatusBadge tone="info">{event.category}</CSStatusBadge>
        </div>
        <dl className="cs-co-meta-grid">
          <div><dt>Event ID</dt><dd>{event.id}</dd></div>
          <div><dt>Timestamp</dt><dd><time dateTime={event.timestamp}>{event.timestamp}</time></dd></div>
          <div><dt>Source</dt><dd>{event.source}</dd></div>
          <div><dt>Actor</dt><dd>{event.actor}</dd></div>
          <div><dt>Verification state</dt><dd><TruthIndicator value={event.verification} /></dd></div>
          <div><dt>Business summary</dt><dd>{event.businessSummary}</dd></div>
          <div><dt>Related object</dt><dd>{event.relatedObject}</dd></div>
          <div><dt>Permission scope</dt><dd>{event.permissionScope}</dd></div>
        </dl>
        <PhaseCDeepLink label="Open event detail" href={event.deepLink} />
      </div>
    </article>
  );
}

export function ConversationCard({ conversation }) {
  return (
    <article className="cs-co-conversation-card">
      <div className="cs-co-conversation-card__header">
        <span aria-hidden="true"><MessageSquareText /></span>
        <div>
          <h3>{conversation.subject}</h3>
          <p>{conversation.customer} - {conversation.channel}</p>
        </div>
        <CSStatusBadge tone={conversation.state === "Failed" ? "danger" : conversation.unread ? "warning" : "info"}>{conversation.state}</CSStatusBadge>
      </div>
      <dl className="cs-co-meta-grid">
        <div><dt>Ownership</dt><dd><OwnerBadge owner={conversation.owner} /></dd></div>
        <div><dt>Assignment</dt><dd>{conversation.assignment}</dd></div>
        <div><dt>Unread state</dt><dd>{conversation.unread ? "Unread" : "Read by authorized user"}</dd></div>
        <div><dt>Unresolved state</dt><dd>{conversation.unresolved ? "Unresolved" : "Resolved for this fixture"}</dd></div>
        <div><dt>Delivery meaning</dt><dd>{conversation.lastStatus}</dd></div>
        <div><dt>AI assistance</dt><dd>{conversation.aiAssistance}</dd></div>
        <div><dt>Human escalation</dt><dd>{conversation.escalation}</dd></div>
        <div><dt>Permissions</dt><dd>{conversation.permission}</dd></div>
      </dl>
      <EvidenceCard title={`${conversation.channel} evidence`} evidence={conversation.evidence} />
      <PhaseCDeepLink label={conversation.nextAction} href={`#${conversation.id}`} />
    </article>
  );
}

export function RiskCard({ risk }) {
  const priorityItem = lookup(PRIORITY_LABELS, risk.priority, "Medium");
  return (
    <article className="cs-co-risk-card">
      <div className="cs-co-risk-card__header">
        <h3>{risk.title}</h3>
        <CSStatusBadge tone={priorityItem.tone}>{priorityItem.label}</CSStatusBadge>
      </div>
      <dl className="cs-co-meta-grid">
        <div><dt>Evidence</dt><dd>{risk.evidence}</dd></div>
        <div><dt>Reason</dt><dd>{risk.reason}</dd></div>
        <div><dt>Impact</dt><dd>{risk.impact}</dd></div>
        <div><dt>Owner</dt><dd><OwnerBadge owner={risk.owner} /></dd></div>
        <div><dt>Next action</dt><dd>{risk.nextAction}</dd></div>
      </dl>
      <PhaseCDeepLink label={risk.nextAction} href={`#${risk.id}`} />
    </article>
  );
}

export function SuccessPlanList({ items = [] }) {
  return (
    <ol className="cs-co-success-plan">
      {items.map((item) => (
        <li key={item.id}>
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            <span>{OWNER_LABELS[item.owner] || OWNER_LABELS.unassigned} - {item.state}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ReviewOnlyAction({ children = "Open static review context" }) {
  return <CSButton variant="secondary">{children}</CSButton>;
}
