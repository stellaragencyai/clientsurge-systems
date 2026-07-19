import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Database,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  CSAlert,
  CSButton,
  CSCard,
  CSEmptyState,
  CSSkeleton,
  CSStatusBadge,
} from "@/components/design-system";
import "@/styles/clientsurge-os-business-intelligence.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export const VERIFICATION_LABELS = {
  verified: { label: "Verified", tone: "success" },
  derived: { label: "Derived", tone: "info" },
  estimated: { label: "Estimated", tone: "warning" },
  reported: { label: "Reported", tone: "neutral" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export const FRESHNESS_LABELS = {
  live: { label: "Live", tone: "success" },
  current: { label: "Current", tone: "success" },
  stale: { label: "Stale", tone: "warning" },
  delayed: { label: "Delayed", tone: "warning" },
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

export const PRIORITY_LABELS = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "info" },
  low: { label: "Low", tone: "neutral" },
};

export const OWNER_LABELS = {
  customer: "Customer",
  clientsurge_staff: "ClientSurge staff",
  ai_worker: "AI worker",
  external_provider: "External provider",
  system: "System",
  unassigned: "Unassigned",
};

function lookupLabel(map, value, fallback = "Unknown") {
  return map[value] || { label: fallback, tone: "neutral" };
}

export function TruthLabel({ value = "unknown", className }) {
  const item = lookupLabel(VERIFICATION_LABELS, value, "Truth unknown");
  return <CSStatusBadge tone={item.tone} className={className}>{item.label}</CSStatusBadge>;
}

export function FreshnessIndicator({ state = "unknown", timestamp, className }) {
  const item = lookupLabel(FRESHNESS_LABELS, state, "Freshness unknown");
  return (
    <span className={cx("cs-bi-freshness", className)}>
      <Clock3 size={14} aria-hidden="true" />
      <span>{item.label}</span>
      {timestamp ? <time dateTime={timestamp}>{timestamp}</time> : null}
    </span>
  );
}

export function ConfidenceBadge({ value = "insufficient", className }) {
  const item = lookupLabel(CONFIDENCE_LABELS, value, "Insufficient confidence");
  return <CSStatusBadge tone={item.tone} className={className}>{item.label}</CSStatusBadge>;
}

export function ActionPriority({ priority = "medium", className }) {
  const item = lookupLabel(PRIORITY_LABELS, priority, "Medium");
  return <CSStatusBadge tone={item.tone} className={className}>{item.label}</CSStatusBadge>;
}

export function OwnerBadge({ owner = "unassigned", className }) {
  return (
    <span className={cx("cs-bi-owner", className)}>
      <UserRound size={14} aria-hidden="true" />
      <span>{OWNER_LABELS[owner] || OWNER_LABELS.unassigned}</span>
    </span>
  );
}

export function DeepLinkAction({ label = "Open resolution", href = "#", disabled = false, className }) {
  if (disabled) {
    return (
      <span className={cx("cs-bi-deep-link cs-bi-deep-link--disabled", className)} aria-disabled="true">
        {label}
      </span>
    );
  }

  return (
    <a className={cx("cs-bi-deep-link", className)} href={href}>
      <span>{label}</span>
      <ArrowRight size={15} aria-hidden="true" />
    </a>
  );
}

export function SourceDisclosure({ source, verification, freshness, timestamp, scope, explanation, className }) {
  return (
    <dl className={cx("cs-bi-source-disclosure", className)} aria-label="Source disclosure">
      <div>
        <dt>Source</dt>
        <dd>{source || "Source unavailable"}</dd>
      </div>
      <div>
        <dt>Truth</dt>
        <dd><TruthLabel value={verification} /></dd>
      </div>
      <div>
        <dt>Freshness</dt>
        <dd><FreshnessIndicator state={freshness} timestamp={timestamp} /></dd>
      </div>
      {scope ? (
        <div>
          <dt>Scope</dt>
          <dd>{scope}</dd>
        </div>
      ) : null}
      {explanation ? (
        <div className="cs-bi-source-disclosure__wide">
          <dt>Explanation</dt>
          <dd>{explanation}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function EvidenceSummary({ title = "Evidence", items = [], className }) {
  return (
    <section className={cx("cs-bi-evidence", className)} aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-evidence`}>
      <h3 id={`${title.replace(/\s+/g, "-").toLowerCase()}-evidence`}>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id || item.label}>
              <ShieldCheck size={15} aria-hidden="true" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No evidence is available for this state.</p>
      )}
    </section>
  );
}

export function PartialCoverageBanner({ coverage, missing = [], className }) {
  return (
    <CSAlert tone="warning" title="Partial data coverage" className={cx("cs-bi-banner", className)}>
      <p>{coverage || "Some connected sources are missing or delayed, so the view is incomplete."}</p>
      {missing.length ? <p>Missing: {missing.join(", ")}.</p> : null}
    </CSAlert>
  );
}

export function RecommendationCard({
  title,
  reason,
  evidence = [],
  priority = "medium",
  owner = "unassigned",
  confidence = "insufficient",
  verification = "unknown",
  freshness = "unknown",
  source = "No source connected",
  actionLabel = "Open resolution",
  actionHref = "#",
  className,
}) {
  return (
    <article className={cx("cs-bi-recommendation", className)}>
      <div className="cs-bi-recommendation__header">
        <div>
          <h3>{title}</h3>
          {reason ? <p>{reason}</p> : null}
        </div>
        <ActionPriority priority={priority} />
      </div>
      <div className="cs-bi-chip-row">
        <OwnerBadge owner={owner} />
        <ConfidenceBadge value={confidence} />
        <TruthLabel value={verification} />
      </div>
      <EvidenceSummary title={`${title} evidence`} items={evidence} />
      <SourceDisclosure source={source} verification={verification} freshness={freshness} />
      <DeepLinkAction label={actionLabel} href={actionHref} />
    </article>
  );
}

export function LoadingState({ title = "Loading verified intelligence", description = "Connected sources are being checked before any values are shown.", className }) {
  return (
    <div className={cx("cs-bi-state", className)} role="status" aria-live="polite">
      <RefreshCw aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <div className="cs-bi-state__skeletons" aria-hidden="true">
        <CSSkeleton height="12px" />
        <CSSkeleton height="12px" width="72%" />
      </div>
    </div>
  );
}

export function UnknownState({ title = "Status unknown", description = "There is not enough evidence to classify this result.", action, className }) {
  return (
    <CSEmptyState
      className={cx("cs-bi-empty-state", className)}
      icon={<Database />}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function UnavailableState({ title = "Source unavailable", description = "This source cannot be reached right now. Existing verified data is not being promoted to current.", action, className }) {
  return (
    <CSEmptyState
      className={cx("cs-bi-empty-state", className)}
      icon={<AlertCircle />}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function PermissionRestrictedState({ title = "Permission restricted", description = "You do not have access to this intelligence source in the current account scope.", action, className }) {
  return (
    <CSEmptyState
      className={cx("cs-bi-empty-state", className)}
      icon={<LockKeyhole />}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function ErrorRecoveryPanel({ title = "Unable to verify this view", description, recoveryLabel = "Retry verification", onRetry, className }) {
  return (
    <div className={cx("cs-bi-error-recovery", className)} role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      <CSButton variant="secondary" onClick={onRetry}>{recoveryLabel}</CSButton>
    </div>
  );
}

export function BIStateFrame({ state, loading, permissionRestricted, unavailable, unknown, error, children }) {
  if (state === "loading") return loading || <LoadingState />;
  if (state === "permission") return permissionRestricted || <PermissionRestrictedState />;
  if (state === "unavailable") return unavailable || <UnavailableState />;
  if (state === "unknown") return unknown || <UnknownState />;
  if (state === "error") return error || <ErrorRecoveryPanel description="The isolated review fixture triggered its recovery state." />;
  return children;
}

export function BIReviewSurface({ eyebrow, title, description, actions, children, className }) {
  return (
    <main className={cx("cs-bi-surface", className)}>
      <header className="cs-bi-surface__header">
        <div>
          {eyebrow ? <p className="cs-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="cs-bi-surface__actions">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function BISection({ id, title, description, actions, children, className }) {
  return (
    <section id={id} className={cx("cs-bi-section", className)} aria-labelledby={`${id}-title`}>
      <div className="cs-bi-section__header">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="cs-bi-section__actions">{actions}</div> : null}
      </div>
      <div className="cs-bi-section__body">{children}</div>
    </section>
  );
}

export function BIInsightCard({ title, value, description, source, verification, freshness, confidence, deepLink, className }) {
  return (
    <CSCard className={cx("cs-bi-insight", className)} title={title} description={description}>
      {value ? <strong className="cs-bi-insight__value">{value}</strong> : null}
      <div className="cs-bi-chip-row">
        <TruthLabel value={verification} />
        <FreshnessIndicator state={freshness} />
        <ConfidenceBadge value={confidence} />
      </div>
      <SourceDisclosure source={source} verification={verification} freshness={freshness} />
      {deepLink ? <DeepLinkAction {...deepLink} /> : null}
    </CSCard>
  );
}

export function ExternalSourceLink({ href, children }) {
  return (
    <a className="cs-bi-external-source" href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
