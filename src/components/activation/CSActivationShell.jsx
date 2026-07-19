import {
  CSActivationFooter,
  CSActivationShell as CSActivationShellPrimitive,
  CSActivationStepNav as CSActivationStepNavPrimitive,
  CSAutosaveStatus,
} from "@/components/design-system";

const saveStateLabels = {
  idle: "All changes saved",
  dirty: "Unsaved changes",
  saving: "Saving changes",
  saved: "Changes saved",
  error: "Save failed",
  offline: "Connection unavailable",
};

const saveStateMap = {
  idle: "saved",
  dirty: "dirty",
  saving: "saving",
  saved: "saved",
  error: "error",
  offline: "offline",
};

function normalizeActivationSteps(steps = [], currentStep = 1) {
  return steps.map((step, index) => {
    const position = index + 1;
    const computedStatus = position < currentStep ? "complete" : position === currentStep ? "current" : "available";
    const status = step.status || computedStatus;
    const isSelectable = status === "complete" || status === "current" || step.available;
    const fallbackUnavailableReason =
      status === "blocked"
        ? "Complete the required activation item before opening this step."
        : "Complete the earlier activation steps before opening this step.";

    return {
      ...step,
      id: step.id || `activation-step-${position}`,
      position,
      sourceStep: step,
      status: status === "upcoming" ? "available" : status,
      disabled: status === "blocked" || !isSelectable,
      disabledReason:
        step.blockedReason ||
        step.blockedMessage ||
        step.unavailableReason ||
        step.disabledReason ||
        (!isSelectable ? fallbackUnavailableReason : ""),
    };
  });
}

export function CSActivationSaveStatus({ state = "idle", message }) {
  return (
    <CSAutosaveStatus
      status={saveStateMap[state] || state}
      label={message || saveStateLabels[state] || "Save status unavailable"}
    />
  );
}

export function CSActivationStepNav({ steps = [], currentStep, onStepSelect }) {
  const normalizedSteps = normalizeActivationSteps(steps, currentStep);
  const currentStepId = normalizedSteps.find((step) => step.position === currentStep)?.id;

  return (
    <CSActivationStepNavPrimitive
      steps={normalizedSteps}
      currentStepId={currentStepId}
      onStepSelect={(step) => onStepSelect?.(step.position, step.sourceStep)}
    />
  );
}

export default function CSActivationShell({
  steps = [],
  currentStep = 1,
  title,
  description,
  children,
  saveState = "idle",
  saveMessage,
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
  const normalizedSteps = normalizeActivationSteps(steps, currentStep);
  const currentStepId = normalizedSteps.find((step) => step.position === currentStep)?.id;
  const progress = normalizedSteps.length ? Math.round((Math.min(currentStep, normalizedSteps.length) / normalizedSteps.length) * 100) : 0;

  return (
    <CSActivationShellPrimitive
      steps={normalizedSteps}
      currentStepId={currentStepId}
      onStepSelect={(step) => onStepSelect?.(step.position, step.sourceStep)}
      title={title}
      description={description}
      progress={progress}
      autosaveStatus={saveStateMap[saveState] || saveState}
      blocker={blockedMessage ? { title: "This step is blocked", description: blockedMessage } : undefined}
      validationErrors={validationMessage ? [{ id: "validation", message: validationMessage }] : []}
      footer={
        <CSActivationFooter
          onBack={currentStep <= 1 || continueLoading ? undefined : onPrevious}
          onContinue={onContinue}
          backLabel={previousLabel}
          continueLabel={continueLabel}
          saving={continueLoading}
          disableContinue={continueDisabled}
        />
      }
      supportAction={headerActions}
    >
      {saveMessage ? <CSActivationSaveStatus state={saveState} message={saveMessage} /> : null}
      {children}
    </CSActivationShellPrimitive>
  );
}
