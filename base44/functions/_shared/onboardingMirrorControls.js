const EDITABLE_ONBOARDING_CHECKLIST_STEPS = new Set([
  "step_lead_sources",
  "step_followup_sequence",
  "step_dashboard",
]);

const DERIVED_ONBOARDING_CHECKLIST_STEPS = new Set([
  "step_twilio",
  "step_instant_response",
  "step_missed_call",
  "step_messages_customized",
  "step_tested",
  "step_live",
]);

function buildChecklistEvent({ onboardingClient, stepKey, value }) {
  return {
    channel: "internal",
    direction: "system",
    event_type: "workflow_triggered",
    provider: "internal",
    status: "processed",
    subject: "Admin onboarding checklist updated",
    message_body: `Admin updated ${stepKey} to ${value ? "complete" : "pending"} on onboarding mirror ${onboardingClient.id}.`,
    order_id: onboardingClient.order_id,
    client_id: onboardingClient.client_id,
    client_project_id: onboardingClient.client_project_id,
    onboarding_client_id: onboardingClient.id,
    context_type: "admin_onboarding_checklist",
    context_id: `${onboardingClient.id}:${stepKey}`,
    metadata_json: JSON.stringify({
      onboarding_client_id: onboardingClient.id,
      step_key: stepKey,
      value,
    }),
  };
}

export class OnboardingMirrorMutationError extends Error {
  constructor(message, { status = 400, code = "onboarding_mirror_mutation_invalid" } = {}) {
    super(message);
    this.name = "OnboardingMirrorMutationError";
    this.status = status;
    this.code = code;
  }
}

export function isEditableOnboardingChecklistStep(stepKey) {
  return EDITABLE_ONBOARDING_CHECKLIST_STEPS.has(stepKey);
}

export function isDerivedOnboardingChecklistStep(stepKey) {
  return DERIVED_ONBOARDING_CHECKLIST_STEPS.has(stepKey);
}

export function getEditableOnboardingChecklistSteps() {
  return [...EDITABLE_ONBOARDING_CHECKLIST_STEPS];
}

export async function updateAdminOnboardingChecklistStep({
  base44,
  onboardingClientId,
  stepKey,
  value,
}) {
  if (!onboardingClientId) {
    throw new OnboardingMirrorMutationError("onboarding_client_id is required", {
      status: 400,
      code: "onboarding_mirror_missing_id",
    });
  }

  if (!stepKey) {
    throw new OnboardingMirrorMutationError("step_key is required", {
      status: 400,
      code: "onboarding_mirror_missing_step_key",
    });
  }

  if (typeof value !== "boolean") {
    throw new OnboardingMirrorMutationError("value must be a boolean", {
      status: 400,
      code: "onboarding_mirror_invalid_value",
    });
  }

  if (isDerivedOnboardingChecklistStep(stepKey)) {
    throw new OnboardingMirrorMutationError(
      "This onboarding checklist step is derived from canonical order/install state and cannot be edited directly.",
      {
        status: 409,
        code: "onboarding_mirror_step_derived",
      }
    );
  }

  if (!isEditableOnboardingChecklistStep(stepKey)) {
    throw new OnboardingMirrorMutationError("Unsupported onboarding checklist step", {
      status: 400,
      code: "onboarding_mirror_step_unsupported",
    });
  }

  const onboardingClient = await base44.asServiceRole.entities.OnboardingClient.get(onboardingClientId);
  if (!onboardingClient) {
    throw new OnboardingMirrorMutationError("Onboarding client not found", {
      status: 404,
      code: "onboarding_mirror_not_found",
    });
  }

  const updated = await base44.asServiceRole.entities.OnboardingClient.update(onboardingClientId, {
    [stepKey]: value,
  });

  if (updated.order_id) {
    await base44.asServiceRole.entities.CommunicationEvent.create(
      buildChecklistEvent({
        onboardingClient: updated,
        stepKey,
        value,
      })
    );
  }

  return updated;
}
