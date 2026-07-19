import React from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2 } from "lucide-react";
import { CSAlert, CSButton, CSProgressSteps, CSStatusBadge } from "@/components/design-system";

const cx = (...values) => values.filter(Boolean).join(" ");

const saveStateConfig = {
  idle: { label: "All changes saved", icon: Cloud, tone: "success" },
  dirty: { label: "Unsaved changes", icon: AlertCircle, tone: "warning" },
  saving: { label: "Saving changes", icon: Loader2, tone: "info" },
  saved: { label: "Changes saved", icon: Check, tone: "success" },
  error: { label: "Save failed", icon: CloudOff, tone: "danger" },
  offline: { label: "Connection unavailable", icon: CloudOff, tone: "warning" },
};

export function CSActivationSaveStatus({ state = "idle", message, onRetry }) {
  const config = saveStateConfig[state] || saveStateConfig.idle;
  const Icon = config.icon;

  return (
    <div className={cx("cs-activation-save-status", `cs-activation-save-status--${state}`)} role={state === "error" ? "alert" : "status"} aria-live={state === "error" ? "assertive" : "polite"}>
      <Icon className={state === "saving" ? "cs-activation-save-status__spinner" : undefined} aria-hidden="true" />
      <span>
        <strong>{config.label}</strong>
        {message ? <small>{message}</small> : null}
      </span>
      {state === "error" && onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function CSActivationStepNav({ steps, currentStep, onStepSelect }) {
  return (
    <nav className="cs-activation-step-nav" aria-label="Activation steps">
      <ol>
        {steps.map((step, index) => {
          const position = index + 1;
          const state = step.status || (position < currentStep ? "complete" : position === currentStep ? "current" : "upcoming");
          const isSelectable = state === "complete" || state === "current" || step.available;

          return (
            <li key={step.id || step.label} className={cx("cs-activation-step-nav__item", `cs-activation-step-nav__item--${state}`)}>
              <button
                type="button"
                disabled={!isSelectable}
                onClick={() => isSelectable && onStepSelect?.(position, step)}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className="cs-activation-step-nav__marker" aria-hidden="true">{state === "complete" ? <Check /> : position}</span>
                <span className="cs-activation-step-nav__copy">
                  <strong>{step.label}</strong>
                  {step.description ? <small>{step.description}</small> : null}
                </span>
                {state === "blocked" ? <CSStatusBadge tone="warning">Blocked</CSStatusBadge> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function CSActivationShell({
  steps,
  currentStep,
  title,
  description,
  children,
  saveState = "idle",
  saveMessage,
  onRetrySave,
  onPrevious,
  onContinue,
  previousLabel = "Previous",
  continueLabel = "Save and continue",
  continueLoading = false,
  continueDisabled = false,
  onStepSelect,
  validationMessage,
  blockedMessage,
  headerActions,
}) {
  const progress = steps.length ? Math.round((Math.min(currentStep, steps.length) / steps.length) * 100) : 0;

  return (
    <main className="cs-activation-shell">
      <header className="cs-activation-shell__topbar">
        <div>
          <span className="cs-activation-shell__brand">ClientSurge OS</span>
          <span className="cs-activation-shell__context">Guided activation</span>
        </div>
        <div className="cs-activation-shell__topbar-actions">
          <CSActivationSaveStatus state={saveState} message={saveMessage} onRetry={onRetrySave} />
          {headerActions}
        </div>
      </header>

      <div className="cs-activation-shell__mobile-progress">
        <div>
          <span>Step {currentStep} of {steps.length}</span>
          <strong>{progress}% complete</strong>
        </div>
        <progress value={progress} max="100" aria-label={`Activation ${progress}% complete`} />
        <CSProgressSteps steps={steps} currentStep={currentStep} />
      </div>

      <div className="cs-activation-shell__layout">
        <aside className="cs-activation-shell__sidebar">
          <div className="cs-activation-shell__sidebar-heading">
            <p>System activation</p>
            <strong>{progress}% complete</strong>
          </div>
          <div className="cs-activation-shell__progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          <CSActivationStepNav steps={steps} currentStep={currentStep} onStepSelect={onStepSelect} />
        </aside>

        <section className="cs-activation-shell__workspace" aria-labelledby="cs-activation-step-title">
          <div className="cs-activation-shell__workspace-inner">
            <header className="cs-activation-shell__step-header">
              <p className="cs-eyebrow">Step {currentStep} of {steps.length}</p>
              <h1 id="cs-activation-step-title">{title}</h1>
              {description ? <p>{description}</p> : null}
            </header>

            {blockedMessage ? <CSAlert tone="warning" title="This step is blocked">{blockedMessage}</CSAlert> : null}
            {validationMessage ? <CSAlert tone="danger" title="Review required information">{validationMessage}</CSAlert> : null}

            <div className="cs-activation-shell__content">{children}</div>
          </div>

          <footer className="cs-activation-shell__footer">
            <CSButton variant="secondary" size="lg" onClick={onPrevious} disabled={currentStep <= 1 || continueLoading}>
              <ChevronLeft aria-hidden="true" /> {previousLabel}
            </CSButton>
            <CSButton size="lg" onClick={onContinue} loading={continueLoading} disabled={continueDisabled}>
              {continueLabel} <ChevronRight aria-hidden="true" />
            </CSButton>
          </footer>
        </section>
      </div>
    </main>
  );
}
