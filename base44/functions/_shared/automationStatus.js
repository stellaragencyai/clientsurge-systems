import { buildInstallSnapshot } from "./installPipeline.js";
import { getServiceExecutionProfile } from "./canonicalAutomationRuntime.js";

export const AUTOMATION_STATUS_DEFINITIONS = [
  {
    id: "instant_response",
    step: 1,
    title: "Instant Lead Response",
    description: "Sends the canonical first-response SMS when a signed customer lead-capture webhook hits a Live order.",
    service_key: "instant_lead_response",
  },
  {
    id: "booking_link",
    step: 2,
    title: "AI Booking Agent / Booking Handoff",
    description: "Honest booking-link handoff or simulation only until a real booking provider is wired.",
    service_key: "ai_booking_agent",
  },
  {
    id: "followup_sms",
    step: 3,
    title: "Follow-Up SMS (15 Min)",
    description: "Sends a follow-up SMS 15 minutes after a lead is contacted if no reply.",
  },
  {
    id: "lead_discovery",
    step: 4,
    title: "Daily Lead Discovery",
    description: "Discovers and enriches new leads daily at 8AM from Google Maps.",
  },
  {
    id: "missed_call",
    step: 5,
    title: "Missed Call Text-Back",
    description: "Sends the configured missed-call SMS when a signed Twilio call-status webhook resolves a Live order.",
    service_key: "missed_call_text_back",
  },
  {
    id: "email_sequence",
    step: 6,
    title: "14-Day Nurture Sequence",
    description: "Canonical due-step nurture runner with real sends only after Live enrollment and recurring invocation.",
    service_key: "nurture_sequence_14d",
  },
  {
    id: "reactivation",
    step: 7,
    title: "Old Lead Reactivation",
    description: "Runs only as an admin-approved reactivation batch with cooldown and canonical lead targeting.",
    service_key: "lead_reactivation",
  },
  {
    id: "review_request",
    step: 8,
    title: "Review Request Automation",
    description: "Manual review-request runtime only until a real post-appointment trigger source exists.",
    service_key: "review_request",
  },
  {
    id: "crm_pipeline",
    step: 9,
    title: "CRM Pipeline Automation",
    description: "Auto-tags and updates lead status through the pipeline based on activity.",
  },
  {
    id: "support",
    step: 10,
    title: "Ongoing Support & Optimization",
    description: "Monthly performance reviews and continuous system optimization.",
  },
];

const RUNTIME_SUCCESS_EVENTS = new Set(["provider_send_succeeded"]);
const RUNTIME_FAILURE_EVENTS = new Set([
  "provider_send_failed",
  "runtime_attempt_blocked",
  "service_transition_blocked",
]);
const RUNTIME_ATTEMPT_EVENTS = new Set(["runtime_attempt_started"]);

function toTimestamp(value) {
  return new Date(value || 0).getTime();
}

function sortByCreatedDateDesc(a, b) {
  return toTimestamp(b.created_date) - toTimestamp(a.created_date);
}

function buildCounts(values = []) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function deriveAggregateServiceStatus(serviceStates) {
  const statuses = serviceStates.map((state) => state.install_status);

  if (statuses.length === 0) {
    return "not_purchased";
  }

  if (statuses.some((status) => status === "Error")) {
    return "error";
  }

  if (statuses.every((status) => status === "Live")) {
    return "live";
  }

  if (statuses.some((status) => status === "Testing")) {
    return "testing";
  }

  if (statuses.some((status) => status === "Configuring")) {
    return "configuring";
  }

  if (statuses.some((status) => status === "Live")) {
    return "configuring";
  }

  if (statuses.some((status) => status === "Ready for Install")) {
    return "ready_for_install";
  }

  return "paid";
}

function formatStateLabel(state) {
  const labels = {
    not_canonicalized: "Not Canonical Yet",
    not_purchased: "Not Purchased",
    paid: "Paid",
    ready_for_install: "Ready for Install",
    configuring: "Configuring",
    testing: "Testing",
    live: "Live",
    error: "Error",
  };

  return labels[state] || "Unknown";
}

function buildLastSignal(events) {
  const lastEvent = [...events].sort(sortByCreatedDateDesc)[0];

  if (!lastEvent) {
    return null;
  }

  return {
    event_type: lastEvent.event_type,
    status: lastEvent.status,
    created_date: lastEvent.created_date,
    subject: lastEvent.subject,
  };
}

function summarizeRuntimeSignals(events) {
  return {
    total_runs: events.filter((event) => RUNTIME_ATTEMPT_EVENTS.has(event.event_type)).length,
    successful_runs: events.filter((event) => RUNTIME_SUCCESS_EVENTS.has(event.event_type)).length,
    failed_runs: events.filter((event) => RUNTIME_FAILURE_EVENTS.has(event.event_type)).length,
    event_counts: buildCounts(events.map((event) => event.event_type)),
    last_signal: buildLastSignal(events),
  };
}

function buildUnsupportedAutomationStatus(definition) {
  const executionProfile = getServiceExecutionProfile(definition.service_key || "");
  return {
    ...definition,
    supported: false,
    state: "not_canonicalized",
    state_label: formatStateLabel("not_canonicalized"),
    state_reason:
      "This automation does not yet have a canonical order-backed install/runtime model, so no backend status is inferred.",
    tracked_order_count: 0,
    tracked_pipeline_counts: {},
    tracked_install_counts: {},
    runtime: {
      total_runs: 0,
      successful_runs: 0,
      failed_runs: 0,
      event_counts: {},
      last_signal: null,
    },
    execution_profile: executionProfile,
  };
}

function buildSupportedAutomationStatus(definition, orders, events) {
  const serviceOrders = [];
  const serviceStates = [];

  for (const order of orders) {
    if (order.payment_status !== "paid") {
      continue;
    }

    const snapshot = buildInstallSnapshot(order);
    const matchedServiceState = snapshot.serviceStates.find(
      (serviceState) => serviceState.service_key === definition.service_key
    );

    if (!matchedServiceState) {
      continue;
    }

    serviceOrders.push({
      id: order.id,
      pipeline_status: snapshot.pipelineStatus,
    });
    serviceStates.push(matchedServiceState);
  }

  const state = deriveAggregateServiceStatus(serviceStates);
  const runtimeEvents = events.filter(
    (event) => event.service_key === definition.service_key
  );
  const executionProfile = getServiceExecutionProfile(definition.service_key);

  return {
    ...definition,
    supported: true,
    state,
    state_label: formatStateLabel(state),
    state_reason:
      state === "not_purchased"
        ? "No paid orders currently include this canonical service."
        : "Derived from paid order install states and CommunicationEvent runtime signals.",
    tracked_order_count: serviceOrders.length,
    tracked_pipeline_counts: buildCounts(serviceOrders.map((order) => order.pipeline_status)),
    tracked_install_counts: buildCounts(serviceStates.map((serviceState) => serviceState.install_status)),
    runtime: summarizeRuntimeSignals(runtimeEvents),
    execution_profile: executionProfile,
  };
}

export function deriveAutomationStatuses({ orders = [], events = [] }) {
  return AUTOMATION_STATUS_DEFINITIONS.map((definition) =>
    definition.service_key
      ? buildSupportedAutomationStatus(definition, orders, events)
      : buildUnsupportedAutomationStatus(definition)
  );
}
