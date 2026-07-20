import React from "react";

const cx = (...values) => values.filter(Boolean).join(" ");

const EMPTY_STATE_COPY = {
  verified_zero: {
    title: "Nothing found in verified results",
    description: "The query completed successfully and no records matched the current source and period.",
    consequence: "This can be treated as a confirmed zero for this view.",
  },
  filtered_zero: {
    title: "No results match these filters",
    description: "Records may exist outside the active filters, search terms, or date range.",
    consequence: "Clear filters or widen the period before treating this as no activity.",
  },
  not_connected: {
    title: "Source not connected",
    description: "This state cannot be verified until the required integration is connected.",
    consequence: "Insights that depend on this source remain unavailable.",
  },
  unavailable: {
    title: "Source unavailable",
    description: "The source could not be reached or queried right now.",
    consequence: "Existing work is preserved, but current results may be incomplete.",
  },
  permission_restricted: {
    title: "Permission required",
    description: "This content may exist, but your current role cannot view it.",
    consequence: "Counts and details are withheld to avoid leaking restricted information.",
  },
  incomplete_setup: {
    title: "Setup incomplete",
    description: "A required setup step has not been completed yet.",
    consequence: "Results will remain limited until the setup requirement is resolved.",
  },
  unknown: {
    title: "State not verified",
    description: "There is not enough evidence to determine whether results exist.",
    consequence: "Do not treat this state as healthy, empty, or complete.",
  },
  query_error: {
    title: "Query failed",
    description: "The request did not complete successfully.",
    consequence: "Retry before using this view for decisions.",
  },
  unsupported: {
    title: "Not supported here",
    description: "This view does not support the requested source, package, or configuration.",
    consequence: "Use an eligible source or module for this workflow.",
  },
};

function normalizeHeadingLevel(level = 2) {
  const numericLevel = Number(level);
  if (!Number.isInteger(numericLevel)) return 2;
  return Math.min(Math.max(numericLevel, 1), 6);
}

function Heading({ level = 2, className, id, children }) {
  const Tag = `h${normalizeHeadingLevel(level)}`;
  return <Tag id={id} className={className}>{children}</Tag>;
}

function getControlRequiredProps(child, required) {
  if (!required) return {};
  const childType = child?.type;
  if (typeof childType === "string" && ["input", "select", "textarea"].includes(childType)) {
    return { required: child.props.required ?? true };
  }
  return { "aria-required": child.props["aria-required"] ?? true };
}

export function CSPageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <header className={cx("cs-page-header", className)}>
      <div className="cs-page-header__copy">
        {eyebrow ? <p className="cs-eyebrow">{eyebrow}</p> : null}
        <h1 className="cs-page-title">{title}</h1>
        {description ? <p className="cs-page-description">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="cs-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function CSButton({ variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...props }) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={cx("cs-button", `cs-button--${variant}`, `cs-button--${size}`, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="cs-button__spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function CSField({ label, hint, error, required, className, children, id }) {
  const fallbackId = React.useId();
  const childId = React.isValidElement(children) ? children.props.id : undefined;
  const fieldId = id || childId || `cs-field-${fallbackId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [React.isValidElement(children) ? children.props["aria-describedby"] : null, hintId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div className={cx("cs-field", error && "cs-field--error", className)}>
      <label className="cs-field__label" htmlFor={fieldId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id: fieldId,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
            ...getControlRequiredProps(children, required),
          })
        : children}
      {hint ? <p className="cs-field__hint" id={hintId}>{hint}</p> : null}
      {error ? <p className="cs-field__error" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}

export function CSCard({ title, description, actions, children, className, tone = "default", headingLevel = 2, titleId }) {
  return (
    <section className={cx("cs-card", `cs-card--${tone}`, className)}>
      {(title || description || actions) ? (
        <div className="cs-card__header">
          <div>
            {title ? <Heading level={headingLevel} id={titleId} className="cs-card__title">{title}</Heading> : null}
            {description ? <p className="cs-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="cs-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="cs-card__body">{children}</div>
    </section>
  );
}

export function CSMetricCard({ label, value, change, helper, icon, status = "neutral", className }) {
  return (
    <article className={cx("cs-metric-card", className)}>
      <div className="cs-metric-card__topline">
        <span className="cs-metric-card__label">{label}</span>
        {icon ? <span className="cs-metric-card__icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <strong className="cs-metric-card__value">{value}</strong>
      {(change || helper) ? (
        <div className="cs-metric-card__meta">
          {change ? <span className={cx("cs-metric-card__change", `cs-metric-card__change--${status}`)}>{change}</span> : null}
          {helper ? <span>{helper}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

export function CSStatusBadge({ tone = "neutral", children, className }) {
  return <span className={cx("cs-status-badge", `cs-status-badge--${tone}`, className)}>{children}</span>;
}

export function CSAlert({ tone = "info", title, children, actions, className, announce = false }) {
  const liveProps = tone === "danger"
    ? { role: "alert" }
    : announce
      ? { role: "status", "aria-live": "polite" }
      : {};
  return (
    <div className={cx("cs-alert", `cs-alert--${tone}`, className)} {...liveProps}>
      <div className="cs-alert__content">
        {title ? <strong className="cs-alert__title">{title}</strong> : null}
        {children ? <div className="cs-alert__message">{children}</div> : null}
      </div>
      {actions ? <div className="cs-alert__actions">{actions}</div> : null}
    </div>
  );
}

export function CSProgressSteps({ steps, currentStep, className }) {
  return (
    <ol className={cx("cs-progress-steps", className)} aria-label="Progress">
      {steps.map((step, index) => {
        const position = index + 1;
        const state = position < currentStep ? "complete" : position === currentStep ? "current" : "upcoming";
        return (
          <li className={cx("cs-progress-step", `cs-progress-step--${state}`)} key={step.id || step.label} aria-current={state === "current" ? "step" : undefined}>
            <span className="cs-progress-step__marker">{state === "complete" ? "✓" : position}</span>
            <span className="cs-progress-step__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function CSEmptyState({
  title,
  description,
  consequence,
  action,
  secondaryAction,
  icon,
  className,
  reason = "unknown",
  headingLevel = 2,
  titleId,
}) {
  const copy = EMPTY_STATE_COPY[reason] || EMPTY_STATE_COPY.unknown;
  const finalTitle = title || copy.title;
  const finalDescription = description || copy.description;
  const finalConsequence = consequence || copy.consequence;
  return (
    <div className={cx("cs-empty-state", `cs-empty-state--${reason}`, className)} data-empty-reason={reason}>
      {icon ? <div className="cs-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <Heading level={headingLevel} id={titleId} className="cs-empty-state__title">{finalTitle}</Heading>
      {finalDescription ? <p className="cs-empty-state__description">{finalDescription}</p> : null}
      {finalConsequence ? <p className="cs-empty-state__consequence">{finalConsequence}</p> : null}
      {(action || secondaryAction) ? <div className="cs-empty-state__actions">{action}{secondaryAction}</div> : null}
    </div>
  );
}

export function CSSkeleton({ width = "100%", height = "1rem", radius = "var(--cs-radius-md)", className }) {
  return <span className={cx("cs-skeleton", className)} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

export function CSLoadingState({
  label = "Loading content",
  description,
  children,
  className,
}) {
  return (
    <div className={cx("cs-loading-state", className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {description ? <p className="cs-loading-state__description">{description}</p> : null}
      <div className="cs-loading-state__skeletons" aria-hidden="true">
        {children || (
          <>
            <CSSkeleton width="42%" height="1.5rem" />
            <CSSkeleton width="100%" height="0.9rem" />
            <CSSkeleton width="76%" height="0.9rem" />
          </>
        )}
      </div>
    </div>
  );
}

export { EMPTY_STATE_COPY };
