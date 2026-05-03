import { loadAdminSettings } from "./adminSettings.js";
import { deriveIntegrationHealth } from "./integrationHealth.js";
import { buildInstallSnapshot, deriveServiceActivationGateFromEvents, LEAD_REACTIVATION_SEGMENTS } from "./installPipeline.js";
import { buildNurtureSequenceSchedulePreview, listLeadReactivationTargets } from "./installRuntime.js";
import { PROVIDER_DEPLOYMENT_STATUS } from "./providerProof.js";

function providerIsReady(status) {
  return [
    PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
    PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED,
    PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
  ].includes(status);
}

export const REMOTE_SETUP_SEQUENCE = [
  { step: 1, title: "Open paid order", detail: "Start in the paid install queue and open the selected order in the canonical install workspace." },
  { step: 2, title: "Verify linked records", detail: "Confirm the order is linked to Client, ClientProject, and OnboardingClient before making setup changes." },
  { step: 3, title: "Review purchased services", detail: "Confirm which tracked services were purchased so ops only configures what the order actually includes." },
  { step: 4, title: "Check provider readiness", detail: "Review Stripe payment state plus Twilio, email, and webhook readiness before entering service configuration." },
  { step: 5, title: "Enter shared config", detail: "Save shared SMS/runtime settings on Order.install_configuration.shared." },
  { step: 6, title: "Enter service-specific config", detail: "Save the purchased service templates on Order.install_configuration.services." },
  { step: 7, title: "Save and confirm completeness", detail: "Confirm the workspace clears configuration blockers and the required actions list updates deterministically." },
  { step: 8, title: "Move service to Configuring", detail: "Advance the purchased service from Ready for Install to Configuring using the canonical backend transition action." },
  { step: 9, title: "Move service to Testing", detail: "Advance the service to Testing only after required configuration is complete." },
  { step: 10, title: "Run remote test action", detail: "Use Send Test Lead or Simulate Missed Call to exercise the real runtime path and create audit events." },
  { step: 11, title: "Inspect timeline and events", detail: "Confirm the CommunicationEvent timeline shows the expected runtime attempts, provider sends, and outcomes." },
  { step: 12, title: "Move service to Live", detail: "Only move the service to Live after a successful remote test and no remaining blockers." },
];

export const SERVICE_INSTALL_PLAYBOOKS = {
  instant_lead_response: {
    service_key: "instant_lead_response",
    display_name: "Instant Lead Response",
    providers: ["twilio"],
    what_operator_is_doing:
      "Configuring the client's immediate SMS reply flow so new inbound leads receive a timely first response.",
    required_shared_fields: [
      "twilio_business_phone",
      "business_hours",
      "after_hours_behavior",
      "consent_behavior",
      "opt_out_message",
    ],
    required_service_fields: ["sms_template"],
    auto_fill_sources: [
      "Customer name, business name, and contact data from Order",
      "Linked record context from Client and ClientProject",
    ],
    manual_inputs: [
      "Twilio business phone",
      "Business hours",
      "After-hours handling rule",
      "Consent behavior",
      "Opt-out copy",
      "Instant Lead Response SMS template",
    ],
    testing_checks: [
      "Shared configuration is complete",
      "Twilio provider readiness is configured, test-wired, or live-provider-proofed",
      "Service status is Testing",
      "Remote Send Test Lead action produces a successful provider_send_succeeded event",
    ],
    live_checks: [
      "A successful test lead runtime exists in CommunicationEvent",
      "No remaining shared or service configuration blockers exist",
      "The latest runtime attempt is not blocked or failed",
    ],
  },
  missed_call_text_back: {
    service_key: "missed_call_text_back",
    display_name: "Missed Call Text-Back",
    providers: ["twilio"],
    what_operator_is_doing:
      "Configuring the missed-call SMS recovery flow so callers receive an immediate text when a call is missed.",
    required_shared_fields: [
      "twilio_business_phone",
      "business_hours",
      "after_hours_behavior",
      "consent_behavior",
      "opt_out_message",
    ],
    required_service_fields: ["sms_template"],
    auto_fill_sources: [
      "Customer name, business name, and contact data from Order",
      "Linked record context from Client and ClientProject",
    ],
    manual_inputs: [
      "Twilio business phone",
      "Business hours",
      "After-hours handling rule",
      "Consent behavior",
      "Opt-out copy",
      "Missed Call Text-Back SMS template",
    ],
    testing_checks: [
      "Shared configuration is complete",
      "Twilio provider readiness is configured, test-wired, or live-provider-proofed",
      "Service status is Testing",
      "Simulate Missed Call produces a successful provider_send_succeeded event",
    ],
    live_checks: [
      "A successful missed-call runtime exists in CommunicationEvent",
      "No remaining shared or service configuration blockers exist",
      "The latest runtime attempt is not blocked or failed",
    ],
  },
  nurture_sequence_14d: {
    service_key: "nurture_sequence_14d",
    display_name: "14-Day Nurture Sequence",
    providers: ["twilio", "resend"],
    what_operator_is_doing:
      "Configuring a multi-step 14-day nurture sequence that can deliver SMS and email follow-up from the canonical order-backed configuration.",
    required_shared_fields: [
      "twilio_business_phone",
      "business_hours",
      "after_hours_behavior",
      "consent_behavior",
      "opt_out_message",
    ],
    required_service_fields: ["sms_enabled", "email_enabled", "steps"],
    auto_fill_sources: [
      "Customer and business details from Order",
      "Primary customer email from Order.customer_email",
      "Primary customer phone from Order.customer_phone",
    ],
    manual_inputs: [
      "Enable SMS and/or Email for the sequence",
      "Define at least 3 nurture steps",
      "Choose day and channel for each step",
      "Save a message template for every step",
    ],
    testing_checks: [
      "At least one channel is enabled",
      "At least 3 valid steps are saved",
      "The first configured step can be executed by Run Nurture Sequence Test",
      "If the first step is SMS, Twilio readiness is configured, test-wired, or live-provider-proofed",
      "If the first step is Email, email provider readiness is configured, test-wired, or live-provider-proofed",
    ],
    live_checks: [
      "Sequence definition is complete",
      "A successful nurture sequence test exists in CommunicationEvent",
      "Enabled channels have supporting provider readiness",
      "No remaining sequence blockers are present",
    ],
  },
  ai_booking_agent: {
    service_key: "ai_booking_agent",
    display_name: "AI Booking Agent",
    providers: ["internal"],
    what_operator_is_doing:
      "Configuring the booking handoff so leads can be routed into booking, capture the required intake fields, and receive the canonical confirmation flow.",
    required_shared_fields: [],
    required_service_fields: ["booking_link", "booking_mode", "confirmation_template", "reminder_template", "intake_fields"],
    auto_fill_sources: [
      "Customer and business details from Order",
      "Existing booking/demo flow conventions already used in the app",
    ],
    manual_inputs: [
      "Booking link",
      "Booking mode",
      "Confirmation template",
      "Reminder enabled toggle",
      "Reminder template when reminders are enabled",
      "Required intake fields",
      "Optional booking business hours guidance",
    ],
    testing_checks: [
      "Booking link is saved",
      "Booking mode is selected",
      "Confirmation template is saved",
      "Reminder template is saved if reminders are enabled",
      "Intake fields are configured",
      "Service is in Testing",
      "Run Booking Agent Test creates a booking_simulation_created event and confirmation events",
    ],
    live_checks: [
      "A successful booking-agent test exists in CommunicationEvent",
      "Booking link remains valid",
      "A live calendar proof event is recorded after a real external calendar booking is verified",
      "No remaining booking blockers are present",
    ],
  },
  lead_reactivation: {
    service_key: "lead_reactivation",
    display_name: "Old Lead Reactivation",
    providers: ["internal"],
    what_operator_is_doing:
      "Selecting dormant leads from the canonical Leads table and running a controlled reactivation batch from the order-backed service config.",
    required_shared_fields: [],
    required_service_fields: ["target_segment", "message_template", "max_batch_size"],
    auto_fill_sources: [
      "Business name from Order to scope eligible Leads",
      "Canonical Leads records rather than deprecated Lead entries",
    ],
    manual_inputs: [
      "Choose the target dormant-lead segment",
      "Write the reactivation message template",
      "Set the maximum batch size",
    ],
    testing_checks: [
      "A valid target segment is selected",
      "A reactivation message template is saved",
      "Service is in Testing",
      "Run Reactivation Test processes 1 to 3 canonical Leads and logs a batch summary event",
    ],
    live_checks: [
      "A successful reactivation test exists in CommunicationEvent",
      "The selected segment has eligible Leads to contact",
      "No remaining reactivation blockers are present",
    ],
  },
  review_request: {
    service_key: "review_request",
    display_name: "Review Request Automation",
    providers: ["twilio", "resend", "internal"],
    what_operator_is_doing:
      "Configuring a post-trigger review request flow that can send a review link over SMS or email from canonical order-backed configuration.",
    required_shared_fields: [],
    required_service_fields: [
      "review_link",
      "trigger_event",
      "message_template",
      "channel",
      "send_delay_minutes",
      "fallback_internal_feedback_enabled",
    ],
    auto_fill_sources: [
      "Business and customer details from Order",
      "Provider readiness from canonical admin settings and CommunicationEvent activity",
    ],
    manual_inputs: [
      "Review link",
      "Trigger event",
      "Review request message template",
      "Delivery channel",
      "Optional send delay",
      "Fallback internal feedback toggle",
    ],
    testing_checks: [
      "Review link is saved",
      "Trigger event is selected",
      "Message template is saved",
      "Delivery channel is selected",
      "Service is in Testing",
      "Run Review Request Test creates a review_request_trigger_simulated event and a successful provider send event",
    ],
    live_checks: [
      "A successful review-request test exists in CommunicationEvent",
      "Selected channel has supporting provider readiness when applicable",
      "No remaining review-request blockers are present",
      "A live completion-trigger proof event is recorded after a real appointment or order completion",
    ],
  },
};

const SHARED_CONFIGURATION_FIELD_META = {
  twilio_business_phone: {
    label: "Twilio business phone",
    helper: "Required for the SMS-based services on this order.",
  },
  business_hours: {
    label: "Business hours",
    helper: "Used by the runtime after-hours guardrail.",
  },
  after_hours_behavior: {
    label: "After-hours behavior",
    helper: "Determines how SMS flows behave outside business hours.",
  },
  consent_behavior: {
    label: "Consent behavior",
    helper: "Determines which compliance rule applies to outbound SMS.",
  },
  opt_out_message: {
    label: "Opt-out message",
    helper: "Required compliance footer for SMS automation copy.",
  },
};

const ACTION_LEVEL_PRIORITY = {
  blocker: 0,
  next: 1,
  info: 2,
};

function formatBusinessName(order) {
  return order.business_name || "the business";
}

function formatOwnerName(order) {
  return order.customer_name || "the team";
}

function buildSuggestion({
  field,
  label,
  value,
  source_labels = [],
  rationale,
  advisory = true,
  confidence = "suggested",
  available = true,
  unavailable_reason = null,
}) {
  return {
    field,
    label,
    value,
    source_labels,
    rationale,
    advisory,
    confidence,
    available,
    unavailable_reason,
  };
}

function buildSharedConfigurationSuggestions({ order, installConfiguration }) {
  const sharedConfig = installConfiguration?.shared || {};
  const suggestions = {
    twilio_business_phone: buildSuggestion({
      field: "twilio_business_phone",
      label: "Twilio business phone",
      value: "",
      source_labels: [],
      rationale: "A dedicated Twilio business phone cannot be safely inferred from current order context.",
      available: false,
      unavailable_reason: "Manual input required",
    }),
    business_hours: buildSuggestion({
      field: "business_hours",
      label: "Business hours",
      value: sharedConfig.business_hours || "",
      source_labels: sharedConfig.business_hours ? ["Existing shared config"] : [],
      rationale: sharedConfig.business_hours
        ? "Using the already-saved shared business hours as the current best value."
        : "Business hours are not safely derivable from order context alone.",
      available: Boolean(sharedConfig.business_hours),
      unavailable_reason: sharedConfig.business_hours ? null : "Manual input required",
    }),
    after_hours_behavior: buildSuggestion({
      field: "after_hours_behavior",
      label: "After-hours behavior",
      value: "hold_until_open",
      source_labels: ["Canonical SMS safety default"],
      rationale: "Holding outbound SMS until open is the safest suggested default when no confirmed after-hours policy is stored yet.",
    }),
    consent_behavior: buildSuggestion({
      field: "consent_behavior",
      label: "Consent behavior",
      value: "include_opt_out_language",
      source_labels: ["Canonical SMS compliance default"],
      rationale: "Including opt-out language is the current safest suggested default for SMS copy in this repo.",
    }),
    opt_out_message: buildSuggestion({
      field: "opt_out_message",
      label: "Opt-out message",
      value: "Reply STOP to opt out.",
      source_labels: ["Canonical SMS compliance default"],
      rationale: "This is the current default opt-out footer used by the canonical SMS services.",
    }),
  };

  return {
    fields: suggestions,
  };
}

function buildConfigSuggestions(order, serviceState, { providerReadiness, reactivationSegmentInsights = [] } = {}) {
  const businessName = formatBusinessName(order);
  const ownerName = formatOwnerName(order);
  const bookingLink = serviceState.configuration?.booking_link || "{{booking_link}}";
  const reviewLink = serviceState.configuration?.review_link || "{{review_link}}";

  if (serviceState.service_key === "instant_lead_response") {
    return {
      fields: {
        sms_template: buildSuggestion({
          field: "sms_template",
          label: "SMS template",
          value: `Hi {{lead_name}}, thanks for reaching out to ${businessName}. This is ${ownerName}'s team. Reply here and we will help you shortly.`,
          source_labels: ["Order.business_name", "Order.customer_name"],
          rationale: "Built from the current business name and account owner so ops starts from branded reply copy instead of a blank field.",
        }),
      },
    };
  }

  if (serviceState.service_key === "missed_call_text_back") {
    return {
      fields: {
        sms_template: buildSuggestion({
          field: "sms_template",
          label: "SMS template",
          value: `Sorry we missed your call to ${businessName}. Reply here and ${ownerName}'s team will text you back as soon as possible.`,
          source_labels: ["Order.business_name", "Order.customer_name"],
          rationale: "Built from the current business and owner context so ops can start from a safe missed-call reply draft.",
        }),
      },
    };
  }

  if (serviceState.service_key === "nurture_sequence_14d") {
    const smsReady =
      providerReadiness.twilio.order_business_phone_present &&
      providerIsReady(providerReadiness.twilio.derived_status);
    const emailReady = providerIsReady(providerReadiness.resend.derived_status);
    const starterSteps = smsReady && emailReady
      ? [
          { day: 1, channel: "sms", message_template: `Hi {{lead_name}}, this is ${businessName}. Checking in after your recent inquiry.` },
          { day: 4, channel: "email", message_template: `Hi {{lead_name}}, ${businessName} wanted to follow up in case you still have questions.` },
          { day: 10, channel: "sms", message_template: `Final follow-up from ${businessName}. Reply here if you want help getting started.` },
        ]
      : smsReady
      ? [
          { day: 1, channel: "sms", message_template: `Hi {{lead_name}}, this is ${businessName}. Checking in after your recent inquiry.` },
          { day: 4, channel: "sms", message_template: `Quick follow-up from ${businessName}. Let us know if you want to take the next step.` },
          { day: 10, channel: "sms", message_template: `Final follow-up from ${businessName}. Reply here if you want help getting started.` },
        ]
      : emailReady
      ? [
          { day: 1, channel: "email", message_template: `Hi {{lead_name}}, thanks again for connecting with ${businessName}.` },
          { day: 4, channel: "email", message_template: `${businessName} wanted to follow up in case you still have questions.` },
          { day: 10, channel: "email", message_template: `Final email from ${businessName}. Reply if you would like help moving forward.` },
        ]
      : [];

    return {
      fields: {
        sms_step_template: buildSuggestion({
          field: "sms_step_template",
          label: "Starter SMS step copy",
          value: `Hi {{lead_name}}, this is ${businessName}. Checking back in to see if you still want help getting started.`,
          source_labels: ["Order.business_name", "Order.customer_name"],
          rationale: "Starter SMS step copy built from current order context.",
        }),
        email_step_template: buildSuggestion({
          field: "email_step_template",
          label: "Starter email step copy",
          value: `Hi {{lead_name}}, thanks again for connecting with ${businessName}. If you want to take the next step, reply here and ${ownerName}'s team will help.`,
          source_labels: ["Order.business_name", "Order.customer_name"],
          rationale: "Starter email step copy built from current order context.",
        }),
      },
      presets: {
        starter_sequence: starterSteps.length > 0
          ? {
              label: "Use suggested 3-step starter sequence",
              value: {
                sms_enabled: starterSteps.some((step) => step.channel === "sms"),
                email_enabled: starterSteps.some((step) => step.channel === "email"),
                steps: starterSteps,
              },
              source_labels: [
                "Order.business_name",
                "Order.customer_name",
                smsReady ? "Twilio readiness" : null,
                emailReady ? "Email readiness" : null,
              ].filter(Boolean),
              rationale: "Built from current order context and currently usable channels. Ops should review each step before saving.",
            }
          : {
              label: "Starter sequence unavailable",
              value: null,
              source_labels: [],
              rationale: "No channel is currently ready enough to suggest a sequence starter with confidence.",
              available: false,
            },
      },
    };
  }

  if (serviceState.service_key === "ai_booking_agent") {
    return {
      fields: {
        booking_mode: buildSuggestion({
          field: "booking_mode",
          label: "Booking mode",
          value: serviceState.configuration?.booking_link ? "external_link" : "internal_placeholder",
          source_labels: serviceState.configuration?.booking_link ? ["Existing booking link"] : ["Missing booking link"],
          rationale: serviceState.configuration?.booking_link
            ? "A real booking link is already present, so external_link is the strongest suggested mode."
            : "Without a confirmed external booking link, internal_placeholder is the safest suggested mode.",
        }),
        intake_fields: buildSuggestion({
          field: "intake_fields",
          label: "Required intake fields",
          value: ["lead_name", "lead_email", "lead_phone"],
          source_labels: ["Canonical booking starter fields"],
          rationale: "These are the safest starter fields for testing lead-to-booking flow without assuming extra intake requirements.",
        }),
        confirmation_template: buildSuggestion({
          field: "confirmation_template",
          label: "Confirmation template",
          value: `Thanks {{lead_name}}. You can book with ${businessName} here: ${bookingLink}`,
          source_labels: ["Order.business_name", "Current booking link"],
          rationale: "Built from the current business name and booking link so ops starts from an order-aware confirmation draft.",
        }),
        reminder_template: buildSuggestion({
          field: "reminder_template",
          label: "Reminder template",
          value: `Reminder from ${businessName}: your booking details are here ${bookingLink}. Reply if you need to reschedule.`,
          source_labels: ["Order.business_name", "Current booking link"],
          rationale: "Built from the current business name and booking link so ops starts from an order-aware reminder draft.",
        }),
      },
    };
  }

  if (serviceState.service_key === "lead_reactivation") {
    const bestSegment = [...reactivationSegmentInsights]
      .sort((left, right) => right.target_size - left.target_size)[0] || null;

    return {
      fields: {
        target_segment: bestSegment
          ? buildSuggestion({
              field: "target_segment",
              label: "Target segment",
              value: bestSegment.segment,
              source_labels: ["Canonical Leads target counts"],
              rationale: `${bestSegment.label} currently has ${bestSegment.target_size} eligible lead(s), making it the strongest suggested starting segment.`,
            })
          : buildSuggestion({
              field: "target_segment",
              label: "Target segment",
              value: "",
              source_labels: [],
              rationale: "No eligible canonical Leads were found to suggest a starting reactivation segment confidently.",
              available: false,
              unavailable_reason: "Manual selection required",
            }),
        message_template: buildSuggestion({
          field: "message_template",
          label: "Message template",
          value: `Hi {{first_name}}, this is ${businessName}. Wanted to check whether you still want help moving forward. Reply here if you would like to reconnect.`,
          source_labels: ["Order.business_name"],
          rationale: "Built from the current business name so ops starts from a neutral reactivation draft.",
        }),
      },
      insights: {
        segment_options: reactivationSegmentInsights,
      },
    };
  }

  if (serviceState.service_key === "review_request") {
    const channelSuggestion =
      providerReadiness.twilio.order_business_phone_present &&
      providerIsReady(providerReadiness.twilio.derived_status)
        ? "sms"
        : providerIsReady(providerReadiness.resend.derived_status)
        ? "email"
        : "";

    return {
      fields: {
        channel: channelSuggestion
          ? buildSuggestion({
              field: "channel",
              label: "Channel",
              value: channelSuggestion,
              source_labels: [
                channelSuggestion === "sms" ? "Twilio readiness" : "Email readiness",
              ],
              rationale: `Suggested because ${channelSuggestion === "sms" ? "SMS" : "email"} appears to be the strongest currently usable test channel.`,
            })
          : buildSuggestion({
              field: "channel",
              label: "Channel",
              value: "",
              source_labels: [],
              rationale: "No review-request channel could be suggested confidently from current provider readiness.",
              available: false,
              unavailable_reason: "Manual selection required",
            }),
        message_template: buildSuggestion({
          field: "message_template",
          label: "Message template",
          value: `Thanks for choosing ${businessName}. If you have a minute, we would really appreciate a quick review here: ${reviewLink}`,
          source_labels: ["Order.business_name", "Current review link"],
          rationale: "Built from the current business name and review link so ops starts from a branded review-request draft.",
        }),
      },
    };
  }

  return { fields: {} };
}

function parseMetadataJson(value) {
  if (!value || typeof value !== "string") {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function cleanConfigString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueActions(actions) {
  const seen = new Set();

  return actions.filter((action) => {
    const key = `${action.code}:${action.field || ""}:${action.provider || ""}:${action.step || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getLatestMatchingEvent(events, predicate) {
  return [...events]
    .filter(predicate)
    .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())[0] || null;
}

function formatActionTitleFromField(field, label) {
  if (label) {
    if (/^(Add|Enable|Save|Set|Choose|Configure)\b/.test(label)) {
      return label;
    }
    return `Complete ${label}`;
  }

  return `Complete ${field}`;
}

function deriveStripeReadiness(order) {
  const paid = order.payment_status === "paid";

  return {
    id: "stripe",
    name: "Stripe Payment",
    derived_status: paid
      ? PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED
      : PROVIDER_DEPLOYMENT_STATUS.FAILED,
    status_label: paid ? "Live Provider Proofed" : "Failed",
    status_reason: paid
      ? "A paid order already exists, so Stripe has live deployment proof for this install."
      : "Order is not marked paid, so remote setup should not proceed.",
    configured: Boolean(order.stripe_session_id || order.stripe_customer_id || paid),
    latest_activity_at: order.created_date || null,
    latest_test_at: null,
    latest_test_status: null,
    latest_test_reason: null,
    ready_for_setup: paid,
    order_specific_details: {
      payment_status: order.payment_status || "unknown",
      stripe_session_id_present: Boolean(order.stripe_session_id),
      stripe_customer_id_present: Boolean(order.stripe_customer_id),
    },
  };
}

function buildProviderSnapshot({ integration, latestProviderTest, extra = {} }) {
  return {
    id: integration.id,
    name: integration.name,
    derived_status: integration.derived_status,
    status_label: integration.status_label,
    status_reason: integration.status_reason,
    configured: integration.configured,
    missing_configuration: integration.missing_configuration || [],
    latest_activity_at: integration.latest_activity_at,
    latest_success_at: integration.latest_success_at,
    latest_failure_at: integration.latest_failure_at,
    latest_live_proof_at: integration.latest_live_proof_at || null,
    latest_callback_at: integration.latest_callback_at || null,
    recent_activity_count: integration.recent_activity_count,
    recent_failure_count: integration.recent_failure_count,
    latest_test_at: latestProviderTest?.created_date || null,
    latest_test_status: latestProviderTest?.status || null,
    latest_test_reason:
      latestProviderTest?.message_body || latestProviderTest?.error_message || null,
    ...extra,
  };
}

function buildLatestProviderTests(events) {
  const providerTests = events.filter((event) => parseMetadataJson(event.metadata_json)?.context_type === "provider_test");

  return {
    twilio: getLatestMatchingEvent(providerTests, (event) => parseMetadataJson(event.metadata_json)?.integration_id === "twilio"),
    resend: getLatestMatchingEvent(providerTests, (event) => parseMetadataJson(event.metadata_json)?.integration_id === "email"),
    webhook: getLatestMatchingEvent(providerTests, (event) => parseMetadataJson(event.metadata_json)?.integration_id === "webhook"),
  };
}

function buildProviderReadiness({ order, snapshot, integrationHealth, latestProviderTests }) {
  const integrations = Object.fromEntries(
    (integrationHealth.integrations || []).map((integration) => [integration.id, integration])
  );
  const trackedServices = snapshot.serviceStates.map((service) => service.display_name);
  const orderBusinessPhone = snapshot.installConfiguration.shared?.twilio_business_phone || "";

  return {
    stripe: deriveStripeReadiness(order),
    twilio: buildProviderSnapshot({
      integration: integrations.twilio || {
        id: "twilio",
        name: "Twilio SMS",
        derived_status: "unavailable",
        status_label: "Unavailable",
        status_reason: "Twilio readiness is not currently derivable.",
        configured: false,
        missing_configuration: [],
      },
      latestProviderTest: latestProviderTests.twilio,
      extra: {
        required_for_services: trackedServices,
        order_business_phone: orderBusinessPhone,
        order_business_phone_present: Boolean(orderBusinessPhone),
        ready_for_testing:
          Boolean(orderBusinessPhone) &&
          providerIsReady(integrations.twilio?.derived_status || PROVIDER_DEPLOYMENT_STATUS.UNAVAILABLE),
        ready_for_live:
          Boolean(orderBusinessPhone) &&
          providerIsReady(integrations.twilio?.derived_status || PROVIDER_DEPLOYMENT_STATUS.UNAVAILABLE),
      },
    }),
    resend: buildProviderSnapshot({
      integration: integrations.resend || {
        id: "resend",
        name: "Resend Email",
        derived_status: "unavailable",
        status_label: "Unavailable",
        status_reason: "Email readiness is not currently derivable.",
        configured: false,
        missing_configuration: [],
      },
      latestProviderTest: latestProviderTests.resend,
      extra: {
        required_for_services: [],
      },
    }),
    webhook: buildProviderSnapshot({
      integration: integrations.webhook || {
        id: "webhook",
        name: "Webhook Delivery",
        derived_status: "unavailable",
        status_label: "Unavailable",
        status_reason: "Webhook readiness is not currently derivable.",
        configured: false,
        missing_configuration: [],
      },
      latestProviderTest: latestProviderTests.webhook,
      extra: {
        required_for_services: [],
      },
    }),
  };
}

function deriveServiceRuntimeSummary(events, orderId, serviceKey) {
  const serviceEvents = events.filter(
    (event) => event.order_id === orderId && event.service_key === serviceKey
  );

  const latestRuntimeEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) =>
      [
        "runtime_attempt_started",
        "runtime_attempt_blocked",
        "provider_send_attempted",
        "provider_send_succeeded",
        "provider_send_failed",
      ].includes(event.event_type)
  );
  const latestSuccessEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) => event.event_type === "provider_send_succeeded"
  );
  const latestBlockedEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  const latestFailedEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) => event.event_type === "provider_send_failed"
  );
  const latestBatchSummaryEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) => event.event_type === "lead_reactivation_batch_completed"
  );
  const latestBatchSummaryMetadata = latestBatchSummaryEvent
    ? parseMetadataJson(latestBatchSummaryEvent.metadata_json)
    : null;
  const latestReviewTriggerEvent = getLatestMatchingEvent(
    serviceEvents,
    (event) => event.event_type === "review_request_trigger_simulated"
  );
  const latestReviewTriggerMetadata = latestReviewTriggerEvent
    ? parseMetadataJson(latestReviewTriggerEvent.metadata_json)
    : null;

  return {
    latest_runtime_event_type: latestRuntimeEvent?.event_type || null,
    latest_runtime_at: latestRuntimeEvent?.created_date || null,
    latest_runtime_status: latestRuntimeEvent?.status || null,
    latest_booking_simulation_at: getLatestMatchingEvent(
      serviceEvents,
      (event) => event.event_type === "booking_simulation_created"
    )?.created_date || null,
    latest_batch_summary_at: latestBatchSummaryEvent?.created_date || null,
    latest_batch_summary: latestBatchSummaryMetadata,
    latest_review_trigger_at: latestReviewTriggerEvent?.created_date || null,
    latest_review_trigger: latestReviewTriggerMetadata,
    latest_success_at: latestSuccessEvent?.created_date || null,
    latest_blocked_at: latestBlockedEvent?.created_date || null,
    latest_failed_at: latestFailedEvent?.created_date || null,
    successful_test_exists: Boolean(latestSuccessEvent),
  };
}

function buildMissingConfigActions(serviceState) {
  return (serviceState.missing_configuration_fields || []).map((field, index) => ({
    code: `missing_configuration:${field}`,
    title: formatActionTitleFromField(field, serviceState.missing_configuration_labels?.[index]),
    detail: `${serviceState.display_name} is missing ${serviceState.missing_configuration_labels?.[index] || field}.`,
    field,
    level: "blocker",
    blocks_testing: true,
    blocks_live: true,
    step: field.startsWith("shared.") ? "shared_configuration" : "service_configuration",
  }));
}

function buildProviderActions(serviceState, providerReadiness) {
  const actions = [];
  const configuration = serviceState.configuration || {};

  if (serviceState.service_key === "nurture_sequence_14d") {
    if (!configuration.sms_enabled && !configuration.email_enabled) {
      actions.push({
        code: "provider:nurture_channel_missing",
        title: "Enable SMS or Email",
        detail: "The nurture sequence needs at least one active channel before testing can begin.",
        provider: "sequence",
        level: "blocker",
        blocks_testing: true,
        blocks_live: true,
        step: "service_configuration",
      });
    }

    if (
      configuration.sms_enabled &&
      (!providerReadiness.twilio.order_business_phone_present ||
        !providerIsReady(providerReadiness.twilio.derived_status))
    ) {
      actions.push({
        code: "provider:nurture_twilio_not_ready",
        title: "Resolve SMS provider readiness",
        detail: providerReadiness.twilio.status_reason,
        provider: "twilio",
        level: "blocker",
        blocks_testing: true,
        blocks_live: true,
        step: "provider_readiness",
      });
    }

    if (
      configuration.email_enabled &&
      !providerIsReady(providerReadiness.resend.derived_status)
    ) {
      actions.push({
        code: "provider:nurture_email_not_ready",
        title: "Resolve email provider readiness",
        detail: providerReadiness.resend.status_reason,
        provider: "resend",
        level: "blocker",
        blocks_testing: true,
        blocks_live: true,
        step: "provider_readiness",
      });
    }

    return actions;
  }

  if (["ai_booking_agent", "lead_reactivation"].includes(serviceState.service_key)) {
    return actions;
  }

  if (serviceState.service_key === "review_request") {
    if (serviceState.configuration?.channel === "sms") {
      if (!providerReadiness.twilio.order_business_phone_present) {
        actions.push({
          code: "provider:review_request_twilio_business_phone_missing",
          title: "Add Twilio business phone",
          detail: "SMS review-request testing needs a canonical Twilio business phone on shared configuration.",
          provider: "twilio",
          level: "info",
          blocks_testing: false,
          blocks_live: false,
          step: "shared_configuration",
        });
      }

      if (!providerIsReady(providerReadiness.twilio.derived_status)) {
        actions.push({
          code: "provider:review_request_twilio_not_ready",
          title: "Review SMS provider readiness",
          detail: providerReadiness.twilio.status_reason,
          provider: "twilio",
          level: "info",
          blocks_testing: false,
          blocks_live: false,
          step: "provider_readiness",
        });
      }
    }

    if (serviceState.configuration?.channel === "email" &&
      !providerIsReady(providerReadiness.resend.derived_status)) {
      actions.push({
        code: "provider:review_request_email_not_ready",
        title: "Review email provider readiness",
        detail: providerReadiness.resend.status_reason,
        provider: "resend",
        level: "info",
        blocks_testing: false,
        blocks_live: false,
        step: "provider_readiness",
      });
    }

    return actions;
  }

  if (!providerReadiness.twilio.order_business_phone_present) {
    actions.push({
      code: "provider:twilio_business_phone_missing",
      title: "Add Twilio business phone",
      detail: `${serviceState.display_name} cannot run until a Twilio business phone is saved on shared configuration.`,
      provider: "twilio",
      level: "blocker",
      blocks_testing: true,
      blocks_live: true,
      step: "shared_configuration",
    });
  }

  if (!providerIsReady(providerReadiness.twilio.derived_status)) {
    actions.push({
      code: "provider:twilio_not_ready",
      title: "Resolve Twilio readiness",
      detail: providerReadiness.twilio.status_reason,
      provider: "twilio",
      level: "blocker",
      blocks_testing: true,
      blocks_live: true,
      step: "provider_readiness",
    });
  }

  return actions;
}

function buildServiceOperatorSummary(serviceState, actions) {
  const blockerCount = actions.filter((action) => action.level === "blocker").length;
  const nextAction = actions.find((action) => action.level === "next") || null;
  const firstBlocker = actions.find((action) => action.level === "blocker") || null;

  return {
    blocker_count: blockerCount,
    next_action_title: firstBlocker?.title || nextAction?.title || "No action required",
    next_action_detail: firstBlocker?.detail || nextAction?.detail || `${serviceState.display_name} is aligned with canonical backend state.`,
    phase_summary:
      serviceState.install_status === "Ready for Install"
        ? "Needs active operator setup"
        : serviceState.install_status === "Configuring"
        ? "Configuration in progress"
        : serviceState.install_status === "Testing"
        ? "Ready for guarded runtime validation"
        : serviceState.install_status === "Live"
        ? "Active in the canonical install pipeline"
        : "Needs manual review",
  };
}

function buildSharedConfigurationSummary({ services, installConfiguration }) {
  const requiredFields = [...new Set(
    services.flatMap((service) => service.playbook?.required_shared_fields || [])
  )];
  const sharedConfig = installConfiguration?.shared || {};

  const fields = requiredFields.map((field) => {
    const value = sharedConfig[field];
    const present = Boolean(cleanConfigString(value));

    return {
      field,
      label: SHARED_CONFIGURATION_FIELD_META[field]?.label || field,
      helper: SHARED_CONFIGURATION_FIELD_META[field]?.helper || null,
      present,
      current_value: present ? value : "",
      missing_title: `Complete ${SHARED_CONFIGURATION_FIELD_META[field]?.label || field}`,
      applies_to_services: services
        .filter((service) => (service.playbook?.required_shared_fields || []).includes(field))
        .map((service) => ({
          service_key: service.service_key,
          display_name: service.display_name,
        })),
    };
  });

  return {
    required: fields.length > 0,
    complete: fields.every((field) => field.present),
    required_count: fields.length,
    present_count: fields.filter((field) => field.present).length,
    missing_fields: fields.filter((field) => !field.present),
    fields,
  };
}

function getServiceSortRank(service) {
  if (service.go_live_readiness?.can_move_to_live) {
    return 0;
  }

  if (service.install_status === "Testing" && !service.go_live_readiness?.tested) {
    return 1;
  }

  if (service.go_live_readiness?.can_move_to_testing) {
    return 2;
  }

  if ((service.operator_summary?.blocker_count || 0) > 0) {
    return 3;
  }

  if (service.install_status === "Configuring") {
    return 4;
  }

  if (service.install_status === "Ready for Install") {
    return 5;
  }

  if (service.install_status === "Live") {
    return 7;
  }

  return 6;
}

function sortServicesForOps(services) {
  return [...services].sort((left, right) => {
    const rankDifference = getServiceSortRank(left) - getServiceSortRank(right);
    if (rankDifference !== 0) {
      return rankDifference;
    }

    const blockerDifference = (right.operator_summary?.blocker_count || 0) - (left.operator_summary?.blocker_count || 0);
    if (blockerDifference !== 0) {
      return blockerDifference;
    }

    return left.display_name.localeCompare(right.display_name);
  });
}

function rankNextBestAction(action) {
  const levelRank = ACTION_LEVEL_PRIORITY[action.level] ?? 9;
  const testingRank = action.blocks_testing ? 0 : action.blocks_live ? 1 : 2;
  const scopeRank = action.scope === "order" ? 0 : action.step === "shared_configuration" ? 1 : 2;

  return [levelRank, testingRank, scopeRank].join(":");
}

function buildCommandView({ services, nextBestActions }) {
  const configureFirst = services.find((service) =>
    service.install_status !== "Live" &&
    (!service.configuration_complete || (service.operator_summary?.blocker_count || 0) > 0)
  ) || null;
  const testNow = services.find((service) =>
    service.install_status === "Testing" &&
    !service.go_live_readiness?.tested &&
    !service.go_live_readiness?.blocked
  ) || null;
  const goLiveNow = services.find((service) => service.go_live_readiness?.can_move_to_live) || null;
  const moveToTestingNow = services.find((service) => service.go_live_readiness?.can_move_to_testing) || null;
  const primaryBlocker = nextBestActions.find((action) => action.level === "blocker") || null;

  return {
    configure_first: configureFirst
      ? {
          service_key: configureFirst.service_key,
          display_name: configureFirst.display_name,
          next_action_title: configureFirst.operator_summary?.next_action_title,
          next_action_detail: configureFirst.operator_summary?.next_action_detail,
        }
      : null,
    move_to_testing_now: moveToTestingNow
      ? {
          service_key: moveToTestingNow.service_key,
          display_name: moveToTestingNow.display_name,
          detail: moveToTestingNow.operator_summary?.next_action_detail,
        }
      : null,
    test_now: testNow
      ? {
          service_key: testNow.service_key,
          display_name: testNow.display_name,
          detail: testNow.operator_summary?.next_action_detail,
        }
      : null,
    go_live_now: goLiveNow
      ? {
          service_key: goLiveNow.service_key,
          display_name: goLiveNow.display_name,
          detail: goLiveNow.operator_summary?.next_action_detail,
        }
      : null,
    primary_blocker: primaryBlocker
      ? {
          title: primaryBlocker.title,
          detail: primaryBlocker.detail,
          service_key: primaryBlocker.service_key || null,
          service_display_name: primaryBlocker.service_display_name || null,
        }
      : null,
  };
}

function buildServiceFilterCounts(services) {
  return {
    all: services.length,
    blocked: services.filter((service) => (service.operator_summary?.blocker_count || 0) > 0).length,
    testing_ready: services.filter((service) => service.go_live_readiness?.can_move_to_testing).length,
    live_ready: services.filter((service) => service.go_live_readiness?.can_move_to_live).length,
    in_testing: services.filter((service) => service.install_status === "Testing").length,
    live: services.filter((service) => service.install_status === "Live").length,
  };
}

function buildDeploymentSummary({ services, workspaceSummary }) {
  return {
    can_prepare_setup: (workspaceSummary?.setup_assist?.safe_autofill_count || 0) > 0,
    can_run_setup_sequence: services.some(
      (service) =>
        service.configuration_complete &&
        !service.test_summary?.successful_test_exists &&
        (
          service.install_status === "Ready for Install" ||
          service.install_status === "Configuring" ||
          service.install_status === "Testing"
        )
    ),
    services_ready_for_sequence: services
      .filter(
        (service) =>
          service.configuration_complete &&
          !service.test_summary?.successful_test_exists &&
          (
            service.install_status === "Ready for Install" ||
            service.install_status === "Configuring" ||
            service.install_status === "Testing"
          )
      )
      .map((service) => ({
        service_key: service.service_key,
        display_name: service.display_name,
        install_status: service.install_status,
      })),
    services_requiring_manual_input: services
      .filter((service) => (service.operator_summary?.blocker_count || 0) > 0)
      .map((service) => ({
        service_key: service.service_key,
        display_name: service.display_name,
        install_status: service.install_status,
      })),
    services_ready_for_live: services
      .filter((service) => service.go_live_readiness?.can_move_to_live)
      .map((service) => ({
        service_key: service.service_key,
        display_name: service.display_name,
        install_status: service.install_status,
      })),
    expected_blockers: (workspaceSummary?.next_best_actions || [])
      .filter((action) => action.level === "blocker")
      .map((action) => ({
        title: action.title,
        detail: action.detail,
        service_display_name: action.service_display_name || null,
      })),
    counts: {
      safe_autofill: workspaceSummary?.setup_assist?.safe_autofill_count || 0,
      manual_required: workspaceSummary?.setup_assist?.manual_required_count || 0,
      sequence_ready: services.filter(
        (service) =>
          service.configuration_complete &&
          !service.test_summary?.successful_test_exists &&
          (
            service.install_status === "Ready for Install" ||
            service.install_status === "Configuring" ||
            service.install_status === "Testing"
          )
      ).length,
      live_ready: services.filter((service) => service.go_live_readiness?.can_move_to_live).length,
    },
  };
}

function buildWorkspaceSummary({ order, services, orderRequiredActions, installConfiguration }) {
  const sharedConfiguration = buildSharedConfigurationSummary({
    services,
    installConfiguration,
  });
  const sharedSuggestions = buildSharedConfigurationSuggestions({
    order,
    installConfiguration,
  });

  const nextBestActions = uniqueActions([
    ...orderRequiredActions.map((action) => ({
      ...action,
      scope: "order",
      service_key: null,
      service_display_name: null,
    })),
    ...sharedConfiguration.missing_fields.map((field) => ({
      code: `shared_missing:${field.field}`,
      title: field.missing_title,
      detail: `${field.label} is still missing for ${field.applies_to_services.map((service) => service.display_name).join(", ")}.`,
      level: "blocker",
      blocks_testing: true,
      blocks_live: true,
      step: "shared_configuration",
      scope: "shared",
      field: `shared.${field.field}`,
      service_key: null,
      service_display_name: null,
    })),
    ...services.flatMap((service) =>
      service.required_actions.map((action) => ({
        ...action,
        code: `${action.code}:${service.service_key}`,
        scope: "service",
        service_key: service.service_key,
        service_display_name: service.display_name,
      }))
    ),
  ])
    .sort((left, right) => rankNextBestAction(left).localeCompare(rankNextBestAction(right)))
    .slice(0, 8);

  const readyForTestingCount = services.filter((service) => service.go_live_readiness?.can_move_to_testing).length;
  const readyForLiveCount = services.filter((service) => service.go_live_readiness?.can_move_to_live).length;
  const liveCount = services.filter((service) => service.install_status === "Live").length;
  const blockedCount =
    orderRequiredActions.filter((action) => action.level === "blocker").length +
    services.reduce((count, service) => count + service.operator_summary.blocker_count, 0);

  let headline = "Review the canonical setup summary";
  let detail = "The workspace is aligned with canonical backend truth.";

  if (blockedCount > 0) {
    headline = "Resolve blockers before testing";
    detail = "The backend still sees blockers that prevent at least one purchased service from moving forward.";
  } else if (readyForLiveCount > 0) {
    headline = "Promote tested services to Live";
    detail = "At least one purchased service has a successful test and can be activated from the canonical transition action.";
  } else if (readyForTestingCount > 0) {
    headline = "Move configured services into Testing";
    detail = "Configuration blockers are cleared for at least one purchased service, so ops can begin guarded runtime validation.";
  } else if (!sharedConfiguration.complete && sharedConfiguration.required) {
    headline = "Finish shared runtime setup first";
    detail = "The shared runtime configuration still blocks at least one SMS-based service.";
  } else if (services.some((service) => !service.configuration_complete)) {
    headline = "Finish service-specific configuration";
    detail = "The order is linked and paid, but at least one purchased service still needs canonical config saved.";
  } else if (liveCount === services.length && services.length > 0) {
    headline = "All purchased services are already live";
    detail = "No additional setup action is required in the canonical workspace right now.";
  }

  const safeAutofill = [
    ...Object.values(sharedSuggestions.fields)
      .filter((suggestion) => suggestion.available)
      .map((suggestion) => ({
        scope: "shared",
        field: `shared.${suggestion.field}`,
        label: suggestion.label,
        source_labels: suggestion.source_labels,
        rationale: suggestion.rationale,
      })),
    ...services.flatMap((service) =>
      Object.values(service.config_suggestions?.fields || {})
        .filter((suggestion) => suggestion.available)
        .map((suggestion) => ({
          scope: "service",
          service_key: service.service_key,
          service_display_name: service.display_name,
          field: `services.${service.service_key}.${suggestion.field}`,
          label: suggestion.label,
          source_labels: suggestion.source_labels,
          rationale: suggestion.rationale,
        }))
    ),
  ];

  const manualRequired = [
    ...Object.values(sharedSuggestions.fields)
      .filter((suggestion) => !suggestion.available)
      .map((suggestion) => ({
        scope: "shared",
        field: `shared.${suggestion.field}`,
        label: suggestion.label,
        reason: suggestion.unavailable_reason || suggestion.rationale,
      })),
    ...services.flatMap((service) =>
      Object.values(service.config_suggestions?.fields || {})
        .filter((suggestion) => !suggestion.available)
        .map((suggestion) => ({
          scope: "service",
          service_key: service.service_key,
          service_display_name: service.display_name,
          field: `services.${service.service_key}.${suggestion.field}`,
          label: suggestion.label,
          reason: suggestion.unavailable_reason || suggestion.rationale,
        }))
    ),
  ];

  const commandView = buildCommandView({
    services,
    nextBestActions,
  });

  return {
    headline,
    detail,
    counts: {
      tracked_services: services.length,
      configuration_ready: services.filter((service) => service.configuration_complete).length,
      ready_for_testing: readyForTestingCount,
      ready_for_live: readyForLiveCount,
      live: liveCount,
      blockers: blockedCount,
    },
    shared_configuration: sharedConfiguration,
    shared_suggestions: sharedSuggestions,
    next_best_actions: nextBestActions,
    runtime_targets: {
      suggested_phone: order.customer_phone || "",
      suggested_email: order.customer_email || "",
    },
    setup_assist: {
      safe_autofill_count: safeAutofill.length,
      manual_required_count: manualRequired.length,
      safe_autofill: safeAutofill,
      manual_required: manualRequired,
      blocker_summary: nextBestActions.filter((action) => action.level === "blocker").map((action) => ({
        title: action.title,
        detail: action.detail,
        service_display_name: action.service_display_name || null,
      })),
    },
    command_view: commandView,
    service_filter_counts: buildServiceFilterCounts(services),
    deployment_summary: buildDeploymentSummary({
      services,
      workspaceSummary: {
        next_best_actions: nextBestActions,
        setup_assist: {
          safe_autofill_count: safeAutofill.length,
          manual_required_count: manualRequired.length,
        },
      },
    }),
  };
}

function deriveServiceRequiredActions({
  serviceState,
  providerReadiness,
  runtimeSummary,
  activationGate,
}) {
  const actions = [
    ...buildProviderActions(serviceState, providerReadiness),
    ...buildMissingConfigActions(serviceState),
  ];

  if (
    serviceState.install_status === "Ready for Install" &&
    actions.filter((action) => action.level === "blocker").length === 0
  ) {
    actions.push({
      code: "next:move_to_configuring",
      title: "Move service to Configuring",
      detail: `${serviceState.display_name} is ready for the operator to begin active setup.`,
      level: "next",
      blocks_testing: false,
      blocks_live: false,
      step: "transition_to_configuring",
    });
  }

  if (
    serviceState.install_status === "Configuring" &&
    serviceState.configuration_complete
  ) {
    actions.push({
      code: "next:move_to_testing",
      title: "Move service to Testing",
      detail: `${serviceState.display_name} has the minimum required configuration to enter guarded testing.`,
      level: "next",
      blocks_testing: false,
      blocks_live: false,
      step: "transition_to_testing",
    });
  }

  if (!runtimeSummary.successful_test_exists) {
    actions.push({
      code: "test:successful_runtime_required",
      title: "Run a successful remote test",
      detail:
        serviceState.service_key === "instant_lead_response"
          ? "Use Send Test Lead and confirm a successful provider send before moving Live."
          : serviceState.service_key === "missed_call_text_back"
          ? "Use Simulate Missed Call and confirm a successful provider send before moving Live."
          : serviceState.service_key === "ai_booking_agent"
          ? "Use Run Booking Agent Test and confirm the booking simulation plus confirmation events succeed before moving Live."
          : serviceState.service_key === "lead_reactivation"
          ? "Use Run Reactivation Test and confirm the per-lead sends plus summary event succeed before moving Live."
          : serviceState.service_key === "review_request"
          ? "Use Run Review Request Test and confirm the simulated trigger plus successful selected-channel send event before moving Live."
          : "Use Run Nurture Sequence Test and confirm the first sequence step succeeds before moving Live.",
      level: "blocker",
      blocks_testing: false,
      blocks_live: true,
      step: "remote_test",
    });
  }

  if (!activationGate.provider_verified) {
    actions.push({
      code: "proof:provider_verification_required",
      title:
        serviceState.service_key === "instant_lead_response"
          ? "Run live SMS proof"
        : serviceState.service_key === "missed_call_text_back"
          ? "Capture canonical missed-call webhook proof"
        : serviceState.service_key === "ai_booking_agent"
          ? "Record live calendar proof"
        : serviceState.service_key === "lead_reactivation"
          ? "Run canonical reactivation batch proof"
        : serviceState.service_key === "review_request"
          ? "Record live completion-trigger proof"
        : "Record provider proof",
      detail:
        serviceState.service_key === "instant_lead_response"
          ? "A successful test exists, but the canonical live SMS proof event has not been recorded yet."
        : serviceState.service_key === "missed_call_text_back"
          ? "A successful test exists, but the canonical Twilio missed-call webhook proof has not been recorded yet."
        : serviceState.service_key === "ai_booking_agent"
          ? "A successful booking simulation exists, but no operator-confirmed live external calendar proof has been recorded yet."
        : serviceState.service_key === "lead_reactivation"
          ? "A successful reactivation batch proof has not been recorded yet."
        : serviceState.service_key === "review_request"
          ? "A successful review-request test exists, but no operator-confirmed live completion-trigger proof has been recorded yet."
        : "A canonical provider proof event has not been recorded yet.",
      level: "blocker",
      blocks_testing: false,
      blocks_live: true,
      step: "provider_proof",
    });
  }

  if (activationGate.blocking_errors.present) {
    actions.push({
      code: "proof:blocking_error_present",
      title: "Resolve blocking install or runtime error",
      detail:
        activationGate.blocking_errors.latest_failure_message ||
        activationGate.blocking_errors.pipeline_error ||
        activationGate.blocking_errors.install_error ||
        "A blocking install or runtime error exists after the last successful validation.",
      level: "blocker",
      blocks_testing: false,
      blocks_live: true,
      step: "manual_repair",
    });
  }

  if (
    serviceState.install_status === "Testing" &&
    runtimeSummary.successful_test_exists &&
    serviceState.configuration_complete &&
    activationGate.provider_verified &&
    !activationGate.blocking_errors.present
  ) {
    actions.push({
      code: "next:move_to_live",
      title: "Move service to Live",
      detail: `${serviceState.display_name} has a successful remote test and can be activated from the canonical backend action.`,
      level: "next",
      blocks_testing: false,
      blocks_live: false,
      step: "transition_to_live",
    });
  }

  if (serviceState.install_status === "Live") {
    actions.push({
      code: "state:live",
      title: "Service is live",
      detail: `${serviceState.display_name} is already live in the canonical order workflow.`,
      level: "info",
      blocks_testing: false,
      blocks_live: false,
      step: "live",
    });
  }

  const dedupedActions = uniqueActions(actions);
  const blockingTesting = dedupedActions.filter((action) => action.blocks_testing);
  const blockingLive = dedupedActions.filter((action) => action.blocks_live);

  const canMoveToTesting =
    serviceState.allowed_next_statuses.includes("Testing") && blockingTesting.length === 0;
  const canMoveToLive =
    serviceState.allowed_next_statuses.includes("Live") &&
    blockingLive.length === 0 &&
    activationGate.provider_verified &&
    !activationGate.blocking_errors.present;

  return {
    actions: dedupedActions,
    go_live_readiness: {
      config_complete: serviceState.configuration_complete,
      provider_ready:
        serviceState.service_key === "nurture_sequence_14d"
          ? (
              (serviceState.configuration?.sms_enabled
                ? providerReadiness.twilio.order_business_phone_present &&
                  providerIsReady(providerReadiness.twilio.derived_status)
                : true) &&
              (serviceState.configuration?.email_enabled
                ? providerIsReady(providerReadiness.resend.derived_status)
                : true)
            )
          : serviceState.service_key === "ai_booking_agent"
          || serviceState.service_key === "lead_reactivation"
          || serviceState.service_key === "review_request"
          ? true
          : (
              providerReadiness.twilio.order_business_phone_present &&
              providerIsReady(providerReadiness.twilio.derived_status)
            ),
      tested: runtimeSummary.successful_test_exists,
      provider_verified: activationGate.provider_verified,
      blocked: blockingLive.length > 0,
      blocking_items: blockingLive.map((action) => action.title),
      can_move_to_testing: canMoveToTesting,
      can_move_to_live: canMoveToLive,
      activation_gate: activationGate,
      recommended_next_action:
        dedupedActions.find((action) => action.level === "blocker")?.title ||
        dedupedActions.find((action) => action.level === "next")?.title ||
        "No action required",
    },
  };
}

export async function buildRemoteSetupWorkspace({ base44, order, orderEvents = [] }) {
  const snapshot = buildInstallSnapshot(order);
  const [{ settings }, healthEvents] = await Promise.all([
    loadAdminSettings(base44),
    base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 100),
  ]);
  const integrationHealth = deriveIntegrationHealth({
    settings,
    events: healthEvents,
  });
  const latestProviderTests = buildLatestProviderTests(healthEvents);
  const providerReadiness = buildProviderReadiness({
    order,
    snapshot,
    integrationHealth,
    latestProviderTests,
  });

  const services = await Promise.all(snapshot.serviceStates.map(async (serviceState) => {
    const runtimeSummary = deriveServiceRuntimeSummary(orderEvents, order.id, serviceState.service_key);
    const activationGate = deriveServiceActivationGateFromEvents({
      order,
      serviceKey: serviceState.service_key,
      serviceState,
      serviceEvents: orderEvents.filter(
        (event) => event.order_id === order.id && event.service_key === serviceState.service_key
      ),
    }).activation_gate;
    const requiredActionSummary = deriveServiceRequiredActions({
      serviceState,
      providerReadiness,
      runtimeSummary,
      activationGate,
    });
    const targetLeads = serviceState.service_key === "lead_reactivation"
      ? await listLeadReactivationTargets({
          base44,
          order,
          targetSegment: serviceState.configuration?.target_segment,
          maxBatchSize: serviceState.configuration?.max_batch_size || 25,
        })
      : [];
    const reactivationSegmentInsights = serviceState.service_key === "lead_reactivation"
      ? await Promise.all(
          LEAD_REACTIVATION_SEGMENTS.map(async (segment) => {
            const matches = await listLeadReactivationTargets({
              base44,
              order,
              targetSegment: segment,
              maxBatchSize: 500,
            });

            return {
              segment,
              label: segment.replaceAll("_", " "),
              target_size: matches.length,
            };
          })
        )
      : [];
    const operationalAllowedNextStatuses = serviceState.allowed_next_statuses.filter((status) => {
      if (status === "Testing") {
        return requiredActionSummary.go_live_readiness.can_move_to_testing;
      }
      if (status === "Live") {
        return requiredActionSummary.go_live_readiness.can_move_to_live;
      }
      return true;
    });

    return {
      ...serviceState,
      allowed_next_statuses: operationalAllowedNextStatuses,
      test_summary: runtimeSummary,
      required_actions: requiredActionSummary.actions,
      target_size: targetLeads.length,
      target_lead_preview: targetLeads.slice(0, 3).map((lead) => ({
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
      })),
      scheduler: serviceState.service_key === "nurture_sequence_14d"
        ? buildNurtureSequenceSchedulePreview(serviceState.configuration)
        : null,
      go_live_readiness: {
        ...requiredActionSummary.go_live_readiness,
        allowed_next_statuses: operationalAllowedNextStatuses,
      },
      playbook: SERVICE_INSTALL_PLAYBOOKS[serviceState.service_key] || {
        service_key: serviceState.service_key,
        display_name: serviceState.display_name,
        providers: [],
      },
      config_suggestions: buildConfigSuggestions(order, serviceState, {
        providerReadiness,
        reactivationSegmentInsights,
      }),
      operator_summary: buildServiceOperatorSummary(serviceState, requiredActionSummary.actions),
      timeline_relevance: {
        latest_event_type:
          runtimeSummary.latest_runtime_event_type ||
          (runtimeSummary.latest_batch_summary_at ? "lead_reactivation_batch_completed" : null) ||
          (runtimeSummary.latest_booking_simulation_at ? "booking_simulation_created" : null) ||
          (runtimeSummary.latest_review_trigger_at ? "review_request_trigger_simulated" : null),
        latest_event_at:
          runtimeSummary.latest_runtime_at ||
          runtimeSummary.latest_batch_summary_at ||
          runtimeSummary.latest_booking_simulation_at ||
          runtimeSummary.latest_review_trigger_at ||
          null,
        successful_test_exists: runtimeSummary.successful_test_exists,
      },
    };
  }));
  const orderedServices = sortServicesForOps(services);

  const orderRequiredActions = uniqueActions([
    ...(order.payment_status !== "paid"
      ? [
          {
            code: "order:payment_required",
            title: "Order must be paid",
            detail: "Remote setup is blocked until Stripe payment is confirmed.",
            level: "blocker",
            blocks_testing: true,
            blocks_live: true,
            step: "payment",
          },
        ]
      : []),
    ...(order.subscription_status === "canceled"
      ? [
          {
            code: "order:subscription_canceled",
            title: "Subscription canceled",
            detail: "Billing is canceled. Services remain visible for auditability, but access is disabled until billing is reactivated.",
            level: "blocker",
            blocks_testing: true,
            blocks_live: true,
            step: "billing",
          },
        ]
      : order.subscription_status === "past_due"
      ? [
          {
            code: "order:subscription_past_due",
            title: "Subscription past due",
            detail: "Billing follow-up is required. Review subscription status before continuing activation work.",
            level: "info",
            blocks_testing: false,
            blocks_live: false,
            step: "billing",
          },
        ]
      : []),
    ...(!order.client_id || !order.client_project_id || !order.onboarding_client_id
      ? [
          {
            code: "order:linked_records_required",
            title: "Verify linked records",
            detail: "Client, ClientProject, and OnboardingClient should all be linked before active setup continues.",
            level: "blocker",
            blocks_testing: true,
            blocks_live: true,
            step: "linked_records",
          },
        ]
      : []),
    ...(order.pipeline_error
      ? [
          {
            code: "order:pipeline_error",
            title: "Resolve pipeline linking error",
            detail: order.pipeline_error,
            level: "blocker",
            blocks_testing: true,
            blocks_live: true,
            step: "manual_repair",
          },
        ]
      : []),
  ]);

  const workspaceSummary = buildWorkspaceSummary({
    order,
    services: orderedServices,
    orderRequiredActions,
    installConfiguration: snapshot.installConfiguration,
  });

  return {
    generated_at: new Date().toISOString(),
    provider_readiness: providerReadiness,
    integration_health_summary: integrationHealth.system,
    latest_provider_tests: {
      twilio: providerReadiness.twilio.latest_test_at
        ? {
            at: providerReadiness.twilio.latest_test_at,
            status: providerReadiness.twilio.latest_test_status,
            reason: providerReadiness.twilio.latest_test_reason,
          }
        : null,
      resend: providerReadiness.resend.latest_test_at
        ? {
            at: providerReadiness.resend.latest_test_at,
            status: providerReadiness.resend.latest_test_status,
            reason: providerReadiness.resend.latest_test_reason,
          }
        : null,
      webhook: providerReadiness.webhook.latest_test_at
        ? {
            at: providerReadiness.webhook.latest_test_at,
            status: providerReadiness.webhook.latest_test_status,
            reason: providerReadiness.webhook.latest_test_reason,
          }
        : null,
    },
    required_actions: {
      order: orderRequiredActions,
      services: Object.fromEntries(orderedServices.map((service) => [service.service_key, service.required_actions])),
      total_blockers:
        orderRequiredActions.filter((action) => action.level === "blocker").length +
        orderedServices.reduce(
          (count, service) => count + service.required_actions.filter((action) => action.level === "blocker").length,
          0
        ),
    },
    services: orderedServices,
    workspace_summary: workspaceSummary,
    operator_sequence: REMOTE_SETUP_SEQUENCE,
  };
}
