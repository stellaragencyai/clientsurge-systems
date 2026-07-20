import React from "react";

const cx = (...values) => values.filter(Boolean).join(" ");

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
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cx("cs-field", error && "cs-field--error", className)}>
      <label className="cs-field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
          })
        : children}
      {hint ? <p className="cs-field__hint" id={hintId}>{hint}</p> : null}
      {error ? <p className="cs-field__error" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}

export function CSCard({ title, description, actions, children, className, tone = "default" }) {
  return (
    <section className={cx("cs-card", `cs-card--${tone}`, className)}>
      {(title || description || actions) ? (
        <div className="cs-card__header">
          <div>
            {title ? <h2 className="cs-card__title">{title}</h2> : null}
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

export function CSEmptyState({ title, description, action, secondaryAction, icon, className }) {
  return (
    <div className={cx("cs-empty-state", className)}>
      {icon ? <div className="cs-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <h2 className="cs-empty-state__title">{title}</h2>
      {description ? <p className="cs-empty-state__description">{description}</p> : null}
      {(action || secondaryAction) ? <div className="cs-empty-state__actions">{action}{secondaryAction}</div> : null}
    </div>
  );
}

export function CSSkeleton({ width = "100%", height = "1rem", radius = "var(--cs-radius-md)", className }) {
  return <span className={cx("cs-skeleton", className)} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}
