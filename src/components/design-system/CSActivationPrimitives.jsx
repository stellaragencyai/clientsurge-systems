import { useId } from "react";
import { AlertTriangle, Check, Circle, Cloud, CloudOff, LockKeyhole } from "lucide-react";
import { CSAlert, CSButton, CSPageHeader, CSStatusBadge } from "./CSProductPrimitives";
import "@/styles/clientsurge-os-activation.css";

const cx = (...values) => values.filter(Boolean).join(" ");

const STEP_ICONS = {
  complete: Check,
  current: Circle,
  available: Circle,
  blocked: LockKeyhole,
  optional: Circle,
};

export function CSAutosaveStatus({ status = "saved", label, className }) {
  const config = {
    saving: { icon: Cloud, text: label || "Saving changes…", tone: "info" },
    saved: { icon: Cloud, text: label || "All changes saved", tone: "success" },
    offline: { icon: CloudOff, text: label || "Offline — changes are not saved", tone: "warning" },
    error: { icon: AlertTriangle, text: label || "Changes could not be saved", tone: "danger" },
  }[status] || { icon: Cloud, text: label || "Save status unavailable", tone: "neutral" };
  const Icon = config.icon;

  return (
    <CSStatusBadge tone={config.tone} className={cx("cs-autosave-status", className)}>
      <Icon size={14} aria-hidden="true" />
      <span aria-live="polite">{config.text}</span>
    </CSStatusBadge>
  );
}

export function CSActivationStepNav({ steps = [], currentStepId, onStepSelect, className }) {
  const navigationId = useId();

  return (
    <nav className={cx("cs-activation-nav", className)} aria-label="Activation steps">
      <ol>
        {steps.map((step, index) => {
          const status = step.id === currentStepId ? "current" : (step.status || "available");
          const Icon = STEP_ICONS[status] || Circle;
          const disabled = status === "blocked" || step.disabled;
          const disabledReason =
            step.blockedReason ||
            step.blockedMessage ||
            step.unavailableReason ||
            step.disabledReason ||
            (disabled ? "Complete the required activation item before opening this step." : "");
          const disabledReasonId = disabledReason ? `${navigationId}-${step.id || index}-reason` : undefined;
          return (
            <li key={step.id}>
              <button
                type="button"
                className={cx("cs-activation-nav__item", `cs-activation-nav__item--${status}`)}
                aria-current={status === "current" ? "step" : undefined}
                aria-disabled={disabled ? "true" : undefined}
                aria-describedby={disabledReasonId}
                onClick={(event) => {
                  if (disabled) {
                    event.preventDefault();
                    return;
                  }

                  onStepSelect?.(step);
                }}
              >
                <span className="cs-activation-nav__marker" aria-hidden="true"><Icon size={16} /></span>
                <span className="cs-activation-nav__copy">
                  <span className="cs-activation-nav__index">Step {index + 1}</span>
                  <span className="cs-activation-nav__label">{step.label}</span>
                  {step.optional ? <span className="cs-activation-nav__optional">Optional</span> : null}
                  {disabledReason ? <span id={disabledReasonId} className="cs-activation-nav__reason">{disabledReason}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CSValidationSummary({ errors = [], title = "Review the required information", className }) {
  if (!errors.length) return null;
  return (
    <CSAlert tone="danger" title={title} className={cx("cs-validation-summary", className)}>
      <ul>
        {errors.map((error) => <li key={error.id || error.message}>{error.message || error}</li>)}
      </ul>
    </CSAlert>
  );
}

export function CSActivationFooter({ onBack, onSaveExit, onContinue, continueLabel = "Save and continue", backLabel = "Back", saving = false, disableContinue = false, className }) {
  return (
    <footer className={cx("cs-activation-footer", className)}>
      <div>{onBack ? <CSButton variant="ghost" onClick={onBack}>{backLabel}</CSButton> : null}</div>
      <div className="cs-activation-footer__actions">
        {onSaveExit ? <CSButton variant="secondary" onClick={onSaveExit} disabled={saving}>Save and exit</CSButton> : null}
        <CSButton onClick={onContinue} loading={saving} disabled={disableContinue}>{continueLabel}</CSButton>
      </div>
    </footer>
  );
}

export function CSActivationShell({
  steps = [],
  currentStepId,
  onStepSelect,
  eyebrow = "Guided activation",
  title,
  description,
  progress = 0,
  autosaveStatus = "saved",
  validationErrors = [],
  blocker,
  children,
  footer,
  supportAction,
  className,
}) {
  const boundedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <div className={cx("cs-activation-shell", className)}>
      <aside className="cs-activation-shell__sidebar">
        <div className="cs-activation-shell__brand">ClientSurge OS</div>
        <div className="cs-activation-shell__progress" aria-label={`${boundedProgress}% complete`}>
          <div className="cs-activation-shell__progress-copy"><span>Activation progress</span><strong>{boundedProgress}%</strong></div>
          <div className="cs-activation-shell__track"><span style={{ width: `${boundedProgress}%` }} /></div>
        </div>
        <CSActivationStepNav steps={steps} currentStepId={currentStepId} onStepSelect={onStepSelect} />
        {supportAction ? <div className="cs-activation-shell__support">{supportAction}</div> : null}
      </aside>

      <section className="cs-activation-shell__workspace">
        <header className="cs-activation-shell__topbar">
          <CSAutosaveStatus status={autosaveStatus} />
        </header>
        <main className="cs-activation-shell__main">
          <CSPageHeader eyebrow={eyebrow} title={title} description={description} />
          {blocker ? <CSAlert tone="warning" title={blocker.title || "This step is blocked"}>{blocker.description}</CSAlert> : null}
          <CSValidationSummary errors={validationErrors} />
          <div className="cs-activation-shell__content">{children}</div>
        </main>
        {footer}
      </section>
    </div>
  );
}
