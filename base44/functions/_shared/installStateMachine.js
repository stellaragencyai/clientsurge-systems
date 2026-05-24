export const CANONICAL_INSTALL_STATES = [
  "PENDING_PAYMENT",
  "PAYMENT_VERIFIED",
  "ORDER_CREATED",
  "ONBOARDING_STARTED",
  "CONFIG_REQUIRED",
  "CONFIG_SUBMITTED",
  "CONFIG_VALIDATED",
  "TWILIO_PENDING",
  "TWILIO_READY",
  "RESEND_PENDING",
  "RESEND_READY",
  "WORKFLOW_DEPLOY_PENDING",
  "WORKFLOW_DEPLOYED",
  "AUTOMATION_TESTING",
  "AUTOMATION_TEST_FAILED",
  "LIVE_READY",
  "LIVE",
  "PAUSED",
  "RECOVERY_REQUIRED",
  "FAILED",
  "CANCELLED",
];

export const CANONICAL_INSTALL_TRANSITIONS = {
  PENDING_PAYMENT: ["PAYMENT_VERIFIED", "CANCELLED"],
  PAYMENT_VERIFIED: ["ORDER_CREATED", "ONBOARDING_STARTED", "CONFIG_REQUIRED", "RECOVERY_REQUIRED", "CANCELLED"],
  ORDER_CREATED: ["ONBOARDING_STARTED", "CONFIG_REQUIRED", "RECOVERY_REQUIRED", "CANCELLED"],
  ONBOARDING_STARTED: ["CONFIG_REQUIRED", "CONFIG_SUBMITTED", "RECOVERY_REQUIRED", "CANCELLED"],
  CONFIG_REQUIRED: ["CONFIG_SUBMITTED", "CONFIG_VALIDATED", "RECOVERY_REQUIRED", "CANCELLED"],
  CONFIG_SUBMITTED: ["CONFIG_VALIDATED", "CONFIG_REQUIRED", "RECOVERY_REQUIRED", "CANCELLED"],
  CONFIG_VALIDATED: [
    "TWILIO_PENDING",
    "TWILIO_READY",
    "RESEND_PENDING",
    "RESEND_READY",
    "WORKFLOW_DEPLOY_PENDING",
    "WORKFLOW_DEPLOYED",
    "AUTOMATION_TESTING",
    "RECOVERY_REQUIRED",
    "CANCELLED",
  ],
  TWILIO_PENDING: ["TWILIO_READY", "RECOVERY_REQUIRED", "CANCELLED"],
  TWILIO_READY: ["RESEND_PENDING", "RESEND_READY", "WORKFLOW_DEPLOY_PENDING", "WORKFLOW_DEPLOYED", "AUTOMATION_TESTING", "RECOVERY_REQUIRED", "CANCELLED"],
  RESEND_PENDING: ["RESEND_READY", "RECOVERY_REQUIRED", "CANCELLED"],
  RESEND_READY: ["WORKFLOW_DEPLOY_PENDING", "WORKFLOW_DEPLOYED", "AUTOMATION_TESTING", "RECOVERY_REQUIRED", "CANCELLED"],
  WORKFLOW_DEPLOY_PENDING: ["WORKFLOW_DEPLOYED", "RECOVERY_REQUIRED", "CANCELLED"],
  WORKFLOW_DEPLOYED: ["AUTOMATION_TESTING", "AUTOMATION_TEST_FAILED", "LIVE_READY", "RECOVERY_REQUIRED", "CANCELLED"],
  AUTOMATION_TESTING: ["AUTOMATION_TEST_FAILED", "LIVE_READY", "LIVE", "RECOVERY_REQUIRED", "CANCELLED"],
  AUTOMATION_TEST_FAILED: ["AUTOMATION_TESTING", "RECOVERY_REQUIRED", "FAILED", "CANCELLED"],
  LIVE_READY: ["LIVE", "RECOVERY_REQUIRED", "PAUSED", "CANCELLED"],
  LIVE: ["PAUSED", "RECOVERY_REQUIRED", "CANCELLED"],
  PAUSED: ["LIVE", "RECOVERY_REQUIRED", "CANCELLED"],
  RECOVERY_REQUIRED: [
    "PAYMENT_VERIFIED",
    "ORDER_CREATED",
    "ONBOARDING_STARTED",
    "CONFIG_REQUIRED",
    "CONFIG_SUBMITTED",
    "CONFIG_VALIDATED",
    "AUTOMATION_TESTING",
    "LIVE_READY",
    "FAILED",
    "CANCELLED",
  ],
  FAILED: ["RECOVERY_REQUIRED", "CANCELLED"],
  CANCELLED: [],
};

export class InstallStateTransitionError extends Error {
  constructor(message, { code = "install_state_transition_blocked", details = {} } = {}) {
    super(message);
    this.name = "InstallStateTransitionError";
    this.code = code;
    this.details = details;
    this.status = 409;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getServiceStates(snapshot = {}) {
  return snapshot.serviceStates || [];
}

export function summarizeInstallStateInputs({ order = {}, snapshot = {} } = {}) {
  const serviceStates = getServiceStates(snapshot);
  const trackedItems = snapshot.trackedItems || serviceStates;
  const statuses = serviceStates.map((item) => item.install_status);
  const configurationComplete =
    serviceStates.length > 0 && serviceStates.every((item) => item.configuration_complete === true);
  const allLive = trackedItems.length > 0 && statuses.every((status) => status === "Live");
  const anyTesting = statuses.some((status) => status === "Testing" || status === "Live");
  const anyError = statuses.some((status) => status === "Error");

  return {
    payment_verified: order.payment_status === "paid",
    fulfillment_failed:
      order.fulfillment_status === "failed" ||
      order.fulfillment_recovery_required === true,
    install_initialized: Boolean(order.install_initialized_at),
    onboarding_started: Boolean(order.onboarding_client_id || order.client_project_id),
    configuration_complete: configurationComplete,
    all_live: allLive,
    any_testing: anyTesting,
    any_error: anyError,
    pipeline_status: order.pipeline_status || snapshot.pipelineStatus || "",
    blocking_issue: order.pipeline_error || order.fulfillment_last_error || "",
    failed_subsystem:
      order.fulfillment_recovery_required || order.fulfillment_status === "failed"
        ? "fulfillment"
        : anyError || order.pipeline_status === "Error"
        ? "install_pipeline"
        : order.pipeline_error
        ? "install_pipeline"
        : "",
    service_statuses: unique(statuses),
  };
}

export function deriveCanonicalInstallState({ order = {}, snapshot = {} } = {}) {
  if (order.order_status === "cancelled" || order.subscription_status === "canceled") {
    return "CANCELLED";
  }

  if (order.install_paused_at || order.billing_status === "paused") {
    return "PAUSED";
  }

  const summary = summarizeInstallStateInputs({ order, snapshot });

  if (!summary.payment_verified) {
    return "PENDING_PAYMENT";
  }

  if (summary.fulfillment_failed || summary.any_error || summary.pipeline_status === "Error") {
    return "RECOVERY_REQUIRED";
  }

  if (summary.all_live) {
    return "LIVE";
  }

  if (summary.any_testing && summary.configuration_complete) {
    return "AUTOMATION_TESTING";
  }

  if (summary.configuration_complete) {
    return "CONFIG_VALIDATED";
  }

  if (summary.onboarding_started || summary.install_initialized) {
    return "CONFIG_REQUIRED";
  }

  return "PAYMENT_VERIFIED";
}

export function getAllowedCanonicalInstallStates(currentState) {
  return CANONICAL_INSTALL_TRANSITIONS[currentState] || [];
}

export function validateCanonicalInstallTransition({
  currentState,
  nextState,
  summary = {},
}) {
  if (!CANONICAL_INSTALL_STATES.includes(nextState)) {
    throw new InstallStateTransitionError(`Unknown canonical install state: ${nextState}`, {
      code: "install_state_unknown",
      details: { current_state: currentState, requested_state: nextState },
    });
  }

  if (!currentState || currentState === nextState) {
    return true;
  }

  const allowed = getAllowedCanonicalInstallStates(currentState);
  if (!allowed.includes(nextState)) {
    throw new InstallStateTransitionError(
      `Install state cannot move from ${currentState} to ${nextState}.`,
      {
        code: "install_state_transition_not_allowed",
        details: { current_state: currentState, requested_state: nextState, allowed_next_states: allowed },
      }
    );
  }

  if (
    [
      "CONFIG_VALIDATED",
      "TWILIO_PENDING",
      "TWILIO_READY",
      "RESEND_PENDING",
      "RESEND_READY",
      "WORKFLOW_DEPLOY_PENDING",
      "WORKFLOW_DEPLOYED",
      "LIVE_READY",
      "LIVE",
    ].includes(nextState) &&
    !summary.configuration_complete
  ) {
    throw new InstallStateTransitionError(
      `${nextState} requires validated install configuration.`,
      {
        code: "install_state_config_required",
        details: { current_state: currentState, requested_state: nextState },
      }
    );
  }

  if (nextState === "LIVE" && !summary.all_live) {
    throw new InstallStateTransitionError("LIVE requires every tracked service to be Live.", {
      code: "install_state_live_prerequisites_missing",
      details: { current_state: currentState, requested_state: nextState },
    });
  }

  return true;
}

export function buildCanonicalInstallStatePatch({
  order = {},
  snapshot = {},
  requestedState,
  eventType = "state_derived",
  note = "",
  now = new Date().toISOString(),
} = {}) {
  const summary = summarizeInstallStateInputs({ order, snapshot });
  const currentState = order.canonical_install_state || "";
  const nextState = requestedState || deriveCanonicalInstallState({ order, snapshot });

  validateCanonicalInstallTransition({
    currentState,
    nextState,
    summary,
  });

  const changed = currentState !== nextState;
  const historyEntry = {
    state: nextState,
    previous_state: currentState || null,
    entered_at: now,
    event_type: eventType,
    note,
    blocking_issue: summary.blocking_issue || "",
    failed_subsystem: summary.failed_subsystem || "",
  };
  const history = Array.isArray(order.install_state_history)
    ? order.install_state_history.slice(-49)
    : [];

  return {
    canonical_install_state: nextState,
    previous_install_state: changed ? currentState || null : order.previous_install_state || null,
    install_state_entered_at: changed ? now : order.install_state_entered_at || now,
    install_state_updated_at: now,
    install_blocking_issue: summary.blocking_issue || "",
    install_failed_subsystem: summary.failed_subsystem || "",
    install_retry_count: Number(order.install_retry_count || 0),
    install_last_successful_milestone:
      nextState === "RECOVERY_REQUIRED" || nextState === "FAILED"
        ? order.install_last_successful_milestone || currentState || ""
        : nextState,
    install_state_history: changed ? [...history, historyEntry] : order.install_state_history || history,
  };
}
