import {
  buildCanonicalInstallStatePatch,
  deriveCanonicalInstallState,
} from "./installStateMachine.js";

export const PIPELINE_STATUSES = [
  "Paid",
  "Ready for Install",
  "Configuring",
  "Testing",
  "Live",
  "Error",
];

export const AFTER_HOURS_BEHAVIORS = [
  "send_after_hours_sms",
  "hold_until_open",
];

export const CONSENT_BEHAVIORS = [
  "include_opt_out_language",
  "explicit_consent_required",
];

export const BOOKING_MODES = [
  "external_link",
  "internal_placeholder",
];

export const REVIEW_REQUEST_TRIGGER_EVENTS = [
  "appointment_completed",
  "order_completed",
  "manual_trigger",
];

export const REVIEW_REQUEST_CHANNELS = [
  "sms",
  "email",
];

export const ALLOWED_BOOKING_INTAKE_FIELDS = [
  "lead_name",
  "lead_email",
  "lead_phone",
  "customer_name",
  "customer_email",
  "customer_phone",
  "preferred_time",
  "notes",
];

export const LEAD_REACTIVATION_SEGMENTS = [
  "all_dormant",
  "contacted_no_reply",
  "qualified_unbooked",
];

export const TRACKED_INSTALL_SERVICES = {
  prod_UNi5RHiKNSTfQl: {
    service_key: "instant_lead_response",
    display_name: "Instant Lead Response",
    onboarding_flag: "step_instant_response",
  },
  prod_UNi5QL0bQl98If: {
    service_key: "missed_call_text_back",
    display_name: "Missed Call Text-Back",
    onboarding_flag: "step_missed_call",
  },
  prod_UNi5N0l5MtaV0R: {
    service_key: "nurture_sequence_14d",
    display_name: "14-Day Nurture Sequence",
  },
  prod_UNi5fLL2SyJJdP: {
    service_key: "ai_booking_agent",
    display_name: "AI Booking Agent",
  },
  prod_UNi5PWv05ECzXI: {
    service_key: "lead_reactivation",
    display_name: "Old Lead Reactivation",
  },
  prod_UNi5dvOUm6Fi9i: {
    service_key: "review_request",
    display_name: "Review Request Automation",
  },
};

const TRACKED_INSTALL_SERVICES_BY_KEY = Object.fromEntries(
  Object.values(TRACKED_INSTALL_SERVICES).map((service) => [service.service_key, service])
);

const PACKAGE_ACTIVATION_DEFINITIONS = {
  basic: {
    package_tier: "basic",
    package_key: "basic_website_plus_two_automations",
    package_name: "Website Redesign + Instant Lead Response + Missed Call Text-Back",
    plan: "Starter System",
    service_keys: ["instant_lead_response", "missed_call_text_back"],
    required_intake_fields: [
      "business_name",
      "business_phone",
      "business_hours",
      "booking_link",
      "brand_voice",
      "services",
    ],
  },
  growth: {
    package_tier: "growth",
    package_key: "growth_website_plus_four_automations",
    package_name: "Website Redesign + Four-Automation Growth Stack",
    plan: "Growth System",
    service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
    required_intake_fields: [
      "business_name",
      "business_phone",
      "business_hours",
      "booking_link",
      "brand_voice",
      "services",
      "lead_sources",
      "booking_process",
      "common_customer_questions",
    ],
  },
  pro: {
    package_tier: "pro",
    package_key: "pro_website_plus_six_automations",
    package_name: "Website Redesign + Full Six-Automation Stack",
    plan: "Pro System",
    service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
    required_intake_fields: [
      "business_name",
      "business_phone",
      "business_hours",
      "booking_link",
      "brand_voice",
      "services",
      "lead_sources",
      "booking_process",
      "common_customer_questions",
      "reactivation_target_segment",
      "review_link",
      "review_trigger_event",
    ],
  },
};

const STATUS_TO_LEGACY_ITEM_STATUS = {
  Paid: "pending",
  "Ready for Install": "pending",
  Configuring: "setting_up",
  Testing: "setting_up",
  Live: "live",
  Error: "setting_up",
};

const REQUIRED_SHARED_CONFIGURATION = [
  {
    field: "twilio_business_phone",
    label: "Twilio business phone",
  },
  {
    field: "business_hours",
    label: "Business hours",
  },
  {
    field: "after_hours_behavior",
    label: "After-hours behavior",
  },
  {
    field: "consent_behavior",
    label: "Consent behavior",
  },
  {
    field: "opt_out_message",
    label: "Opt-out message",
  },
];

const REQUIRED_SERVICE_CONFIGURATION = {
  instant_lead_response: [
    {
      field: "sms_template",
      label: "Instant Lead Response SMS template",
    },
  ],
  missed_call_text_back: [
    {
      field: "sms_template",
      label: "Missed Call Text-Back SMS template",
    },
  ],
};

const ALLOWED_STATUS_TRANSITIONS = {
  Paid: ["Ready for Install", "Error"],
  "Ready for Install": ["Configuring", "Error"],
  Configuring: ["Testing", "Error"],
  Testing: ["Live", "Error"],
  Live: ["Error"],
  Error: ["Ready for Install", "Configuring"],
};

function sortByCreatedDateDesc(a, b) {
  return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComparable(value) {
  return cleanString(value).toLowerCase();
}

function ensureEnumValue(value, allowedValues) {
  return allowedValues.includes(value) ? value : "";
}

function defaultInstallStatusForOrder(orderLike = {}) {
  if (orderLike.install_initialized_at) {
    return "Ready for Install";
  }

  return orderLike.payment_status === "paid" ? "Paid" : "Paid";
}

function buildEmptySharedInstallConfiguration() {
  return {
    twilio_business_phone: "",
    business_hours: "",
    after_hours_behavior: "",
    consent_behavior: "",
    opt_out_message: "",
  };
}

function buildEmptyServiceInstallConfiguration() {
  return {
    sms_template: "",
  };
}

function buildEmptyNurtureSequenceConfiguration() {
  return {
    sms_enabled: false,
    email_enabled: false,
    steps: [],
  };
}

function buildEmptyBookingAgentConfiguration() {
  return {
    booking_link: "",
    booking_mode: "",
    confirmation_template: "",
    reminder_enabled: false,
    reminder_template: "",
    intake_fields: [],
    business_hours: "",
  };
}

function buildEmptyLeadReactivationConfiguration() {
  return {
    target_segment: "",
    message_template: "",
    max_batch_size: 25,
  };
}

function buildEmptyReviewRequestConfiguration() {
  return {
    review_link: "",
    trigger_event: "",
    message_template: "",
    channel: "",
    send_delay_minutes: null,
    fallback_internal_feedback_enabled: false,
  };
}

function buildEmptyServiceConfigByKey(serviceKey) {
  if (serviceKey === "nurture_sequence_14d") {
    return buildEmptyNurtureSequenceConfiguration();
  }
  if (serviceKey === "ai_booking_agent") {
    return buildEmptyBookingAgentConfiguration();
  }
  if (serviceKey === "lead_reactivation") {
    return buildEmptyLeadReactivationConfiguration();
  }
  if (serviceKey === "review_request") {
    return buildEmptyReviewRequestConfiguration();
  }

  return buildEmptyServiceInstallConfiguration();
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeSequenceChannel(value) {
  return ["sms", "email"].includes(value) ? value : "";
}

function normalizeBookingIntakeFields(fields = []) {
  if (!Array.isArray(fields)) {
    return [];
  }

  return [...new Set(
    fields
      .map((field) => cleanString(field))
      .filter((field) => ALLOWED_BOOKING_INTAKE_FIELDS.includes(field))
  )];
}

function normalizeBatchSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 25;
  }

  return Math.min(Math.max(Math.floor(numericValue), 1), 250);
}

function normalizeSendDelayMinutes(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return Math.min(Math.floor(numericValue), 60 * 24 * 30);
}

function getRequiredSharedConfiguration(serviceKey) {
  if (["ai_booking_agent", "lead_reactivation", "review_request"].includes(serviceKey)) {
    return [];
  }

  return REQUIRED_SHARED_CONFIGURATION;
}

function isValidUrl(value) {
  const normalized = cleanString(value);
  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function normalizeNurtureSequenceSteps(steps = []) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
    .map((step) => ({
      day: Number.isFinite(Number(step?.day)) ? Number(step.day) : 0,
      channel: normalizeSequenceChannel(step?.channel),
      message_template: cleanString(step?.message_template),
    }))
    .filter((step) => step.day > 0 || step.channel || step.message_template)
    .sort((a, b) => a.day - b.day);
}

function getSupportedServiceKeys() {
  return Object.keys(TRACKED_INSTALL_SERVICES_BY_KEY);
}

function getConfiguredServiceKeys(config = {}) {
  return Object.keys(config.services || {}).filter((serviceKey) => getSupportedServiceKeys().includes(serviceKey));
}

function getTrackedServiceKeys(items = []) {
  return getTrackedInstallItems(items).map((item) => item.service_key);
}

function detectPackageActivationDefinition(serviceKeys = []) {
  const selected = new Set(serviceKeys.map(cleanString).filter(Boolean));

  if (PACKAGE_ACTIVATION_DEFINITIONS.pro.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return PACKAGE_ACTIVATION_DEFINITIONS.pro;
  }

  if (PACKAGE_ACTIVATION_DEFINITIONS.growth.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return PACKAGE_ACTIVATION_DEFINITIONS.growth;
  }

  if (PACKAGE_ACTIVATION_DEFINITIONS.basic.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return PACKAGE_ACTIVATION_DEFINITIONS.basic;
  }

  return null;
}

function getPackageActivationDefinitionForOrder(orderLike = {}) {
  return detectPackageActivationDefinition(getTrackedServiceKeys(orderLike.items || []));
}

function getPackagePlanForOrder(orderLike = {}) {
  return getPackageActivationDefinitionForOrder(orderLike)?.plan || "Starter System";
}

function getTrackedItemStatus(item, defaultStatus) {
  if (!item.tracking_enabled || !item.service_key) {
    return item.install_status;
  }

  return item.install_status || defaultStatus;
}

function normalizeInstallStatus(status, fallbackStatus) {
  if (PIPELINE_STATUSES.includes(status)) {
    return status;
  }

  return fallbackStatus;
}

function buildBlockedTransitionReason({ currentStatus, nextStatus, validation }) {
  if (validation && !validation.valid) {
    return `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`;
  }

  return `Cannot move from ${currentStatus} to ${nextStatus}`;
}

function isInProgressStatus(status) {
  return ["Configuring", "Testing", "Live"].includes(status);
}

function hasReachedTesting(status) {
  return ["Testing", "Live"].includes(status);
}

function getAllowedNextStatuses(currentStatus) {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}

function validateServiceConfigurationFromSnapshot(snapshot, serviceKey) {
  if (!TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey]) {
    return {
      valid: false,
      missing_fields: [`services.${serviceKey}`],
      missing_labels: [`Unsupported service: ${serviceKey}`],
      service_key: serviceKey,
    };
  }

  const shared = snapshot.installConfiguration.shared || buildEmptySharedInstallConfiguration();
  const serviceConfig =
    snapshot.installConfiguration.services?.[serviceKey] || buildEmptyServiceConfigByKey(serviceKey);

  const missing = [];

  for (const requirement of getRequiredSharedConfiguration(serviceKey)) {
    const value = shared[requirement.field];
    if (!cleanString(value)) {
      missing.push({
        field: `shared.${requirement.field}`,
        label: requirement.label,
      });
    }
  }

  for (const requirement of REQUIRED_SERVICE_CONFIGURATION[serviceKey] || []) {
    const value = serviceConfig[requirement.field];
    if (!cleanString(value)) {
      missing.push({
        field: `services.${serviceKey}.${requirement.field}`,
        label: requirement.label,
      });
    }
  }

  if (serviceKey === "nurture_sequence_14d") {
    const enabledChannels = [
      ...(serviceConfig.sms_enabled ? ["sms"] : []),
      ...(serviceConfig.email_enabled ? ["email"] : []),
    ];

    if (enabledChannels.length === 0) {
      missing.push({
        field: `services.${serviceKey}.channels`,
        label: "Enable SMS or Email",
      });
    }

    if (!Array.isArray(serviceConfig.steps) || serviceConfig.steps.length < 3) {
      missing.push({
        field: `services.${serviceKey}.steps`,
        label: "Add sequence steps",
      });
    }

    const invalidTemplateStep = (serviceConfig.steps || []).find(
      (step) =>
        !Number.isFinite(Number(step?.day)) ||
        Number(step.day) <= 0 ||
        !enabledChannels.includes(step?.channel) ||
        !cleanString(step?.message_template)
    );

    if (invalidTemplateStep) {
      missing.push({
        field: `services.${serviceKey}.steps_templates`,
        label: "Save templates",
      });
    }
  }

  if (serviceKey === "ai_booking_agent") {
    if (!isValidUrl(serviceConfig.booking_link)) {
      missing.push({
        field: `services.${serviceKey}.booking_link`,
        label: "Add booking link",
      });
    }

    if (!BOOKING_MODES.includes(serviceConfig.booking_mode)) {
      missing.push({
        field: `services.${serviceKey}.booking_mode`,
        label: "Choose booking mode",
      });
    }

    if (!cleanString(serviceConfig.confirmation_template)) {
      missing.push({
        field: `services.${serviceKey}.confirmation_template`,
        label: "Set confirmation message",
      });
    }

    if (serviceConfig.reminder_enabled && !cleanString(serviceConfig.reminder_template)) {
      missing.push({
        field: `services.${serviceKey}.reminder_template`,
        label: "Save reminder template",
      });
    }

    if (!Array.isArray(serviceConfig.intake_fields) || serviceConfig.intake_fields.length === 0) {
      missing.push({
        field: `services.${serviceKey}.intake_fields`,
        label: "Configure intake fields",
      });
    }
  }

  if (serviceKey === "lead_reactivation") {
    if (!LEAD_REACTIVATION_SEGMENTS.includes(serviceConfig.target_segment)) {
      missing.push({
        field: `services.${serviceKey}.target_segment`,
        label: "Define segment",
      });
    }

    if (!cleanString(serviceConfig.message_template)) {
      missing.push({
        field: `services.${serviceKey}.message_template`,
        label: "Set message template",
      });
    }
  }

  if (serviceKey === "review_request") {
    if (!isValidUrl(serviceConfig.review_link)) {
      missing.push({
        field: `services.${serviceKey}.review_link`,
        label: "Add review link",
      });
    }

    if (!REVIEW_REQUEST_TRIGGER_EVENTS.includes(serviceConfig.trigger_event)) {
      missing.push({
        field: `services.${serviceKey}.trigger_event`,
        label: "Choose trigger event",
      });
    }

    if (!cleanString(serviceConfig.message_template)) {
      missing.push({
        field: `services.${serviceKey}.message_template`,
        label: "Set message template",
      });
    }

    if (!REVIEW_REQUEST_CHANNELS.includes(serviceConfig.channel)) {
      missing.push({
        field: `services.${serviceKey}.channel`,
        label: "Choose delivery channel",
      });
    }
  }

  return {
    valid: missing.length === 0,
    missing_fields: missing.map((entry) => entry.field),
    missing_labels: missing.map((entry) => entry.label),
    service_key: serviceKey,
  };
}

async function createCommunicationEvent(base44, event) {
  return base44.asServiceRole.entities.CommunicationEvent.create(event);
}

function createTransitionValidation(serviceKey, entries = []) {
  const filteredEntries = entries.filter((entry) => entry?.field && entry?.label);

  return {
    valid: filteredEntries.length === 0,
    missing_fields: filteredEntries.map((entry) => entry.field),
    missing_labels: filteredEntries.map((entry) => entry.label),
    service_key: serviceKey,
  };
}

function withAdditionalValidationEntries(validation, entries = []) {
  const filteredEntries = entries.filter((entry) => entry?.field && entry?.label);

  return {
    valid: validation.valid && filteredEntries.length === 0,
    missing_fields: [...validation.missing_fields, ...filteredEntries.map((entry) => entry.field)],
    missing_labels: [...validation.missing_labels, ...filteredEntries.map((entry) => entry.label)],
    service_key: validation.service_key,
  };
}

async function hasSuccessfulRuntimeTest({ base44, orderId, serviceKey }) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      order_id: orderId,
      service_key: serviceKey,
    },
    "-created_date",
    100
  );

  return (events || []).some(
    (event) => event.event_type === "provider_send_succeeded" && event.status !== "failed"
  );
}

export class InstallTransitionError extends Error {
  constructor(message, { code = "install_transition_blocked", details = {} } = {}) {
    super(message);
    this.name = "InstallTransitionError";
    this.code = code;
    this.details = details;
  }
}

export class InstallLinkingError extends Error {
  constructor(message, { code = "install_linking_ambiguous", details = {}, status = 409 } = {}) {
    super(message);
    this.name = "InstallLinkingError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export function getTrackedServiceConfig(productId) {
  return TRACKED_INSTALL_SERVICES[productId] || null;
}

export function getTrackedServiceByKey(serviceKey) {
  return TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey] || null;
}

export function normalizeOrderItems(items = [], defaultStatus = "Ready for Install") {
  return items.map((item) => {
    const config = getTrackedServiceConfig(item.product_id);
    const serviceKey = item.service_key || config?.service_key;
    const knownTrackedService = Boolean(config || getTrackedServiceByKey(serviceKey));
    const trackingEnabled = knownTrackedService || item.tracking_enabled === true;
    const resolvedInstallStatus = trackingEnabled
      ? normalizeInstallStatus(item.install_status, defaultStatus)
      : item.install_status;

    return {
      ...item,
      service_key: serviceKey,
      tracking_enabled: trackingEnabled,
      service_access_status: item.service_access_status || "active",
      install_status: resolvedInstallStatus,
      status:
        resolvedInstallStatus && STATUS_TO_LEGACY_ITEM_STATUS[resolvedInstallStatus]
          ? STATUS_TO_LEGACY_ITEM_STATUS[resolvedInstallStatus]
          : item.status,
    };
  });
}

export function getTrackedInstallItems(items = []) {
  return items.filter((item) => item.tracking_enabled && item.service_key);
}

export function normalizeInstallConfiguration(config = {}, items = []) {
  const sourceConfig = config && typeof config === "object" ? config : {};
  const trackedServiceKeys = new Set([
    ...getTrackedServiceKeys(normalizeOrderItems(items)),
    ...getConfiguredServiceKeys(sourceConfig),
  ]);

  const shared = {
    ...buildEmptySharedInstallConfiguration(),
    twilio_business_phone: cleanString(sourceConfig.shared?.twilio_business_phone),
    business_hours: cleanString(sourceConfig.shared?.business_hours),
    after_hours_behavior: ensureEnumValue(sourceConfig.shared?.after_hours_behavior, AFTER_HOURS_BEHAVIORS),
    consent_behavior: ensureEnumValue(sourceConfig.shared?.consent_behavior, CONSENT_BEHAVIORS),
    opt_out_message: cleanString(sourceConfig.shared?.opt_out_message),
  };

  const services = {};
  for (const serviceKey of trackedServiceKeys) {
    if (!TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey]) {
      continue;
    }

    if (serviceKey === "nurture_sequence_14d") {
      services[serviceKey] = {
        ...buildEmptyNurtureSequenceConfiguration(),
        sms_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.sms_enabled),
        email_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.email_enabled),
        steps: normalizeNurtureSequenceSteps(sourceConfig.services?.[serviceKey]?.steps),
      };
      continue;
    }

    if (serviceKey === "ai_booking_agent") {
      services[serviceKey] = {
        ...buildEmptyBookingAgentConfiguration(),
        booking_link: cleanString(sourceConfig.services?.[serviceKey]?.booking_link),
        booking_mode: ensureEnumValue(sourceConfig.services?.[serviceKey]?.booking_mode, BOOKING_MODES),
        business_hours: cleanString(sourceConfig.services?.[serviceKey]?.business_hours),
        confirmation_template: cleanString(sourceConfig.services?.[serviceKey]?.confirmation_template),
        reminder_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.reminder_enabled),
        reminder_template: cleanString(sourceConfig.services?.[serviceKey]?.reminder_template),
        intake_fields: normalizeBookingIntakeFields(sourceConfig.services?.[serviceKey]?.intake_fields),
      };
      continue;
    }

    if (serviceKey === "lead_reactivation") {
      services[serviceKey] = {
        ...buildEmptyLeadReactivationConfiguration(),
        target_segment: ensureEnumValue(sourceConfig.services?.[serviceKey]?.target_segment, LEAD_REACTIVATION_SEGMENTS),
        message_template: cleanString(sourceConfig.services?.[serviceKey]?.message_template),
        max_batch_size: normalizeBatchSize(sourceConfig.services?.[serviceKey]?.max_batch_size),
      };
      continue;
    }

    if (serviceKey === "review_request") {
      services[serviceKey] = {
        ...buildEmptyReviewRequestConfiguration(),
        review_link: cleanString(sourceConfig.services?.[serviceKey]?.review_link),
        trigger_event: ensureEnumValue(sourceConfig.services?.[serviceKey]?.trigger_event, REVIEW_REQUEST_TRIGGER_EVENTS),
        message_template: cleanString(sourceConfig.services?.[serviceKey]?.message_template),
        channel: ensureEnumValue(sourceConfig.services?.[serviceKey]?.channel, REVIEW_REQUEST_CHANNELS),
        send_delay_minutes: normalizeSendDelayMinutes(sourceConfig.services?.[serviceKey]?.send_delay_minutes),
        fallback_internal_feedback_enabled: normalizeBoolean(sourceConfig.services?.[serviceKey]?.fallback_internal_feedback_enabled),
      };
      continue;
    }

    services[serviceKey] = {
      ...buildEmptyServiceInstallConfiguration(),
      sms_template: cleanString(sourceConfig.services?.[serviceKey]?.sms_template),
    };
  }

  return {
    shared,
    services,
  };
}

export function mergeInstallConfiguration(currentConfig = {}, patch = {}, items = []) {
  const normalizedCurrent = normalizeInstallConfiguration(currentConfig, items);
  const mergedServiceConfig = {};

  for (const serviceKey of new Set([
    ...Object.keys(normalizedCurrent.services || {}),
    ...Object.keys(patch.services || {}),
  ])) {
    if (!TRACKED_INSTALL_SERVICES_BY_KEY[serviceKey]) {
      continue;
    }

    if (serviceKey === "nurture_sequence_14d") {
      mergedServiceConfig[serviceKey] = {
        ...(normalizedCurrent.services?.[serviceKey] || buildEmptyNurtureSequenceConfiguration()),
        ...(patch.services?.[serviceKey] || {}),
      };
      continue;
    }

    if (serviceKey === "ai_booking_agent") {
      mergedServiceConfig[serviceKey] = {
        ...(normalizedCurrent.services?.[serviceKey] || buildEmptyBookingAgentConfiguration()),
        ...(patch.services?.[serviceKey] || {}),
      };
      continue;
    }

    if (serviceKey === "lead_reactivation") {
      mergedServiceConfig[serviceKey] = {
        ...(normalizedCurrent.services?.[serviceKey] || buildEmptyLeadReactivationConfiguration()),
        ...(patch.services?.[serviceKey] || {}),
      };
      continue;
    }

    if (serviceKey === "review_request") {
      mergedServiceConfig[serviceKey] = {
        ...(normalizedCurrent.services?.[serviceKey] || buildEmptyReviewRequestConfiguration()),
        ...(patch.services?.[serviceKey] || {}),
      };
      continue;
    }

    mergedServiceConfig[serviceKey] = {
      ...(normalizedCurrent.services?.[serviceKey] || buildEmptyServiceInstallConfiguration()),
      ...(patch.services?.[serviceKey] || {}),
    };
  }

  return normalizeInstallConfiguration(
    {
      shared: {
        ...normalizedCurrent.shared,
        ...(patch.shared || {}),
      },
      services: mergedServiceConfig,
    },
    items
  );
}

export function derivePipelineStatus(orderLike) {
  const defaultStatus = defaultInstallStatusForOrder(orderLike);
  const trackedItems = getTrackedInstallItems(normalizeOrderItems(orderLike.items || [], defaultStatus));
  const statuses = trackedItems.map((item) => getTrackedItemStatus(item, defaultStatus));

  if (trackedItems.length === 0) {
    return orderLike.install_initialized_at ? "Ready for Install" : "Paid";
  }

  if (statuses.some((status) => status === "Error")) {
    return "Error";
  }

  if (statuses.every((status) => status === "Live")) {
    return "Live";
  }

  if (statuses.some((status) => status === "Testing")) {
    return "Testing";
  }

  if (statuses.some((status) => status === "Configuring")) {
    return "Configuring";
  }

  if (statuses.some((status) => status === "Live")) {
    return "Configuring";
  }

  if (statuses.some((status) => status === "Ready for Install")) {
    return "Ready for Install";
  }

  return "Paid";
}

export function mapPipelineStatusToOrderStatus({
  pipelineStatus,
  trackedItems = [],
  paymentStatus = "pending",
}) {
  if (trackedItems.length > 0 && trackedItems.every((item) => item.install_status === "Live")) {
    return "fully_live";
  }

  if (trackedItems.some((item) => item.install_status === "Live")) {
    return "partially_live";
  }

  return paymentStatus === "paid" ? "paid_setup_in_progress" : "pending_payment";
}

export function buildCommunicationEvent({
  order,
  channel = "internal",
  direction = "system",
  event_type,
  status = "processed",
  provider = "internal",
  subject,
  message_body,
  metadata,
  service_key,
  provider_message_id,
  error_message,
}) {
  return {
    channel,
    direction,
    event_type,
    provider,
    status,
    subject,
    message_body,
    provider_message_id,
    error_message,
    metadata_json: metadata ? JSON.stringify(metadata) : undefined,
    order_id: order.id,
    client_id: order.client_id,
    client_project_id: order.client_project_id,
    onboarding_client_id: order.onboarding_client_id,
    service_key,
    context_type: service_key ? "order_service_install" : "order_install",
    context_id: service_key ? `${order.id}:${service_key}` : order.id,
  };
}

function eventNoteSuffix(note) {
  return note ? ` Note: ${note}` : "";
}

export function buildOrderStatusEvent({ order, previousStatus, nextStatus, note, provider = "internal" }) {
  return buildCommunicationEvent({
    order,
    provider,
    event_type:
      previousStatus === "Paid" && nextStatus === "Ready for Install" ? "install_initialized" : "status_update",
    subject: `Order install status: ${nextStatus}`,
    message_body: `Order ${order.id} moved from ${previousStatus || "Unknown"} to ${nextStatus}.${eventNoteSuffix(note)}`,
    metadata: {
      order_id: order.id,
      previous_status: previousStatus,
      next_status: nextStatus,
      note,
    },
  });
}

export function buildInstallStateChangedEvent({ order, previousState, nextState, note, metadata = {} }) {
  return buildCommunicationEvent({
    order,
    event_type: "install_state_changed",
    subject: `Canonical install state: ${nextState}`,
    message_body: `Order ${order.id} canonical install state moved from ${previousState || "none"} to ${nextState}.${eventNoteSuffix(note)}`,
    metadata: {
      order_id: order.id,
      previous_state: previousState || null,
      next_state: nextState,
      note,
      ...metadata,
    },
  });
}

export function buildServiceStatusEvent({ order, serviceKey, previousStatus, nextStatus, note }) {
  return buildCommunicationEvent({
    order,
    event_type: "service_status_changed",
    subject: `${serviceKey} install status: ${nextStatus}`,
    message_body: `${serviceKey} moved from ${previousStatus || "Unknown"} to ${nextStatus}.${eventNoteSuffix(note)}`,
    service_key: serviceKey,
    metadata: {
      order_id: order.id,
      service_key: serviceKey,
      previous_status: previousStatus,
      next_status: nextStatus,
      note,
    },
  });
}

export function buildServiceConfigurationUpdatedEvent({ order, updatedServices, note }) {
  return buildCommunicationEvent({
    order,
    event_type: "service_configuration_updated",
    subject: "Install configuration updated",
    message_body: `Install configuration updated for order ${order.id}.${eventNoteSuffix(note)}`,
    metadata: {
      order_id: order.id,
      updated_services: updatedServices,
      note,
    },
  });
}

export function buildServiceTransitionBlockedEvent({
  order,
  serviceKey,
  currentStatus,
  requestedStatus,
  reason,
  validation,
  note,
}) {
  return buildCommunicationEvent({
    order,
    event_type: "service_transition_blocked",
    status: "failed",
    subject: `${serviceKey} transition blocked`,
    message_body: `${serviceKey} could not move from ${currentStatus} to ${requestedStatus}. ${reason}.${eventNoteSuffix(note)}`,
    service_key: serviceKey,
    metadata: {
      order_id: order.id,
      service_key: serviceKey,
      current_status: currentStatus,
      requested_status: requestedStatus,
      reason,
      validation,
      note,
    },
  });
}

function findMatchingRecord(records, fields) {
  return [...records].sort(sortByCreatedDateDesc).find((record) =>
    Object.entries(fields).every(([key, value]) => {
      if (!value) return true;
      return normalizeComparable(record[key]) === normalizeComparable(value);
    })
  ) || null;
}

function getExactMatches(records, fields) {
  return [...records]
    .filter((record) =>
      Object.entries(fields).every(([key, value]) => {
        if (!value) return true;
        return normalizeComparable(record[key]) === normalizeComparable(value);
      })
    )
    .sort(sortByCreatedDateDesc);
}

function getSingleResolvedMatch({
  entityType,
  records,
  fields,
  code,
  order,
}) {
  const matches = getExactMatches(records, fields);

  if (matches.length > 1) {
    throw new InstallLinkingError(
      `Multiple ${entityType} records match paid order ${order.id}. Manual repair is required before install linking can continue.`,
      {
        code,
        details: {
          entity_type: entityType,
          order_id: order.id,
          match_fields: fields,
          matching_record_ids: matches.map((record) => record.id),
        },
      }
    );
  }

  return matches[0] || null;
}

function buildInstallLinkingBlockedEvent({ order, error }) {
  return buildCommunicationEvent({
    order,
    event_type: "workflow_triggered",
    status: "failed",
    subject: "Install linking blocked",
    message_body: error.message,
    metadata: {
      order_id: order.id,
      code: error.code,
      details: error.details,
    },
  });
}

function buildActivationIntakeSnapshot({ order = {}, onboardingClient = {} } = {}) {
  return {
    business_name: order.business_name || onboardingClient.business_name || "",
    business_phone:
      order.install_configuration?.shared?.twilio_business_phone ||
      onboardingClient.twilio_number ||
      onboardingClient.phone ||
      order.customer_phone ||
      "",
    business_hours: order.install_configuration?.shared?.business_hours || onboardingClient.business_hours || "",
    booking_link:
      order.install_configuration?.services?.ai_booking_agent?.booking_link ||
      onboardingClient.booking_link ||
      "",
    brand_voice: onboardingClient.brand_voice || onboardingClient.tone_of_voice || "",
    services: onboardingClient.services || "",
    lead_sources: onboardingClient.lead_sources || "",
    booking_process: onboardingClient.booking_platform || onboardingClient.booking_process || "",
    common_customer_questions: onboardingClient.customer_questions || "",
    reactivation_target_segment:
      order.install_configuration?.services?.lead_reactivation?.target_segment ||
      onboardingClient.reactivation_target_segment ||
      "",
    review_link:
      order.install_configuration?.services?.review_request?.review_link ||
      onboardingClient.review_link ||
      "",
    review_trigger_event:
      order.install_configuration?.services?.review_request?.trigger_event ||
      onboardingClient.review_trigger_event ||
      "",
  };
}

function getNextOnboardingQuestion(field, packageLabel) {
  const questionByField = {
    business_name: "What is the client's public business name?",
    business_phone: "What business phone number should the automations use?",
    business_hours: "What are the client's normal business hours?",
    booking_link: "What booking link should we use for leads who are ready to schedule?",
    brand_voice: "How should the automation sound: professional, friendly, luxury, direct, or something else?",
    services: "Which services should the automation mention when responding to leads?",
    lead_sources: "Where do this client's leads usually come from?",
    booking_process: "How does this client currently book appointments or consultations?",
    common_customer_questions: "What common customer questions should the automation understand?",
    reactivation_target_segment: "Which old leads should be reactivated first: contacted_no_reply, qualified_unbooked, or all_dormant?",
    review_link: "What Google or preferred review link should review requests send customers to?",
    review_trigger_event: "When should review requests trigger: manual_trigger, appointment_completed, or order_completed?",
  };

  return field
    ? questionByField[field] || `Please provide ${field.replaceAll("_", " ")}.`
    : `${packageLabel} intake is complete. Apply the generated configuration and run provider tests.`;
}

export function buildPurchaseOnboardingHandoff({ order = {}, onboardingClient = null } = {}) {
  const definition = getPackageActivationDefinitionForOrder(order);
  const serviceKeys = getTrackedServiceKeys(order.items || []);

  if (!definition) {
    return {
      package_tier: "custom",
      package_key: "custom_or_unsupported_package",
      package_name: "Custom or unsupported package",
      service_keys: serviceKeys,
      required_intake_fields: [],
      missing_intake_fields: ["supported_package_services"],
      next_missing_field: "supported_package_services",
      next_question: "Which ClientSurge package did this client purchase: Basic, Growth, or Pro?",
      readiness_score: 0,
      next_best_action: "Match this order to a canonical package before automated activation.",
    };
  }

  const intake = buildActivationIntakeSnapshot({ order, onboardingClient: onboardingClient || {} });
  const missing = definition.required_intake_fields.filter((field) => !cleanString(intake[field]));
  const nextMissingField = missing[0] || null;
  const packageLabel = definition.package_tier === "pro"
    ? "Pro"
    : definition.package_tier === "growth"
    ? "Growth"
    : "Basic";

  return {
    package_tier: definition.package_tier,
    package_key: definition.package_key,
    package_name: definition.package_name,
    service_keys: definition.service_keys,
    required_intake_fields: definition.required_intake_fields,
    missing_intake_fields: missing,
    next_missing_field: nextMissingField,
    next_question: getNextOnboardingQuestion(nextMissingField, packageLabel),
    readiness_score: missing.length === 0 ? 35 : 20,
    next_best_action: missing.length === 0
      ? "Apply and save the generated install configuration."
      : "Have Sam/onboarding ask the next missing intake question.",
  };
}

async function resolveClientRecord(base44, order) {
  if (order.client_id) {
    try {
      return await base44.asServiceRole.entities.Client.get(order.client_id);
    } catch {
      // Fall through to lookup/create.
    }
  }

  const matches = await base44.asServiceRole.entities.Client.filter({ email: order.customer_email }, "-created_date", 25);
  const existing = getSingleResolvedMatch({
    entityType: "client",
    records: matches,
    fields: {
      email: order.customer_email,
      business_name: order.business_name,
    },
    code: "install_linking_client_ambiguous",
    order,
  }) || findMatchingRecord(matches, {
    email: order.customer_email,
    business_name: order.business_name,
  });

  if (existing) {
    return existing;
  }

  return base44.asServiceRole.entities.Client.create({
    full_name: order.customer_name,
    business_name: order.business_name,
    email: order.customer_email,
    phone: order.customer_phone || "",
    status: "Onboarding",
  });
}

async function resolveClientProjectRecord(base44, order, client, pipelineStatus) {
  if (order.client_project_id) {
    try {
      return await base44.asServiceRole.entities.ClientProject.get(order.client_project_id);
    } catch {
      // Fall through to lookup/create.
    }
  }

  const matches = await base44.asServiceRole.entities.ClientProject.filter(
    { client_email: order.customer_email },
    "-created_date",
    25
  );
  const linkedProjectMatches = await base44.asServiceRole.entities.ClientProject.filter(
    { client_id: client.id },
    "-created_date",
    25
  );
  const existing =
    getSingleResolvedMatch({
      entityType: "client_project",
      records: linkedProjectMatches,
      fields: {
        client_id: client.id,
        business_name: order.business_name,
      },
      code: "install_linking_client_project_ambiguous",
      order,
    }) ||
    getSingleResolvedMatch({
      entityType: "client_project",
      records: matches,
      fields: {
        client_email: order.customer_email,
        business_name: order.business_name,
      },
      code: "install_linking_client_project_ambiguous",
      order,
    }) ||
    findMatchingRecord(linkedProjectMatches, {
      client_id: client.id,
      business_name: order.business_name,
    }) ||
    findMatchingRecord(matches, {
      client_email: order.customer_email,
      business_name: order.business_name,
    });

  const planName =
    order.pricing_summary?.package_name ||
    order.plan_type ||
    getPackagePlanForOrder(order);
  const projectPatch = buildClientProjectPatch({
    pipelineStatus,
    trackedItems: getTrackedInstallItems(order.items || []),
  });

  if (existing) {
    await base44.asServiceRole.entities.ClientProject.update(existing.id, {
      client_id: existing.client_id || client.id,
      client_email: existing.client_email || order.customer_email,
      contact_email: existing.contact_email || order.customer_email,
      client_name: existing.client_name || order.customer_name,
      business_name: existing.business_name || order.business_name,
      plan: existing.plan || planName,
      ...projectPatch,
    });
    return base44.asServiceRole.entities.ClientProject.get(existing.id);
  }

  return base44.asServiceRole.entities.ClientProject.create({
    client_id: client.id,
    client_email: order.customer_email,
    contact_email: order.customer_email,
    client_name: order.customer_name,
    business_name: order.business_name,
    plan: planName,
    ...projectPatch,
  });
}

async function resolveOnboardingClientRecord(base44, order, client, clientProject, pipelineStatus) {
  if (order.onboarding_client_id) {
    try {
      return await base44.asServiceRole.entities.OnboardingClient.get(order.onboarding_client_id);
    } catch {
      // Fall through to lookup/create.
    }
  }

  const matches = await base44.asServiceRole.entities.OnboardingClient.filter({ email: order.customer_email }, "-created_date", 25);
  const linkedByOrderMatches = await base44.asServiceRole.entities.OnboardingClient.filter(
    { order_id: order.id },
    "-created_date",
    25
  );
  const linkedByProjectMatches = await base44.asServiceRole.entities.OnboardingClient.filter(
    { client_project_id: clientProject.id },
    "-created_date",
    25
  );
  const existing =
    getSingleResolvedMatch({
      entityType: "onboarding_client",
      records: linkedByOrderMatches,
      fields: {
        order_id: order.id,
      },
      code: "install_linking_onboarding_client_ambiguous",
      order,
    }) ||
    getSingleResolvedMatch({
      entityType: "onboarding_client",
      records: linkedByProjectMatches,
      fields: {
        client_project_id: clientProject.id,
        business_name: order.business_name,
      },
      code: "install_linking_onboarding_client_ambiguous",
      order,
    }) ||
    getSingleResolvedMatch({
      entityType: "onboarding_client",
      records: matches,
      fields: {
        email: order.customer_email,
        business_name: order.business_name,
      },
      code: "install_linking_onboarding_client_ambiguous",
      order,
    }) ||
    findMatchingRecord(linkedByOrderMatches, {
      order_id: order.id,
    }) ||
    findMatchingRecord(linkedByProjectMatches, {
      client_project_id: clientProject.id,
      business_name: order.business_name,
    }) ||
    findMatchingRecord(matches, {
      email: order.customer_email,
      business_name: order.business_name,
    });

  const onboardingPatch = buildOnboardingClientPatch({ order, pipelineStatus });

  if (existing) {
    await base44.asServiceRole.entities.OnboardingClient.update(existing.id, {
      client_id: existing.client_id || client.id,
      client_project_id: existing.client_project_id || clientProject.id,
      order_id: existing.order_id || order.id,
      ...onboardingPatch,
    });
    return base44.asServiceRole.entities.OnboardingClient.get(existing.id);
  }

  return base44.asServiceRole.entities.OnboardingClient.create({
    business_name: order.business_name,
    owner_name: order.customer_name,
    phone: order.customer_phone || "",
    email: order.customer_email,
    monthly_rate: order.total_monthly || 0,
    setup_fee: order.total_setup || 0,
    client_id: client.id,
    client_project_id: clientProject.id,
    order_id: order.id,
    ...onboardingPatch,
  });
}

export function buildInstallSnapshot(orderLike) {
  const defaultStatus = defaultInstallStatusForOrder(orderLike);
  const normalizedItems = normalizeOrderItems(orderLike.items || [], defaultStatus);
  const trackedItems = getTrackedInstallItems(normalizedItems);
  const installConfiguration = normalizeInstallConfiguration(orderLike.install_configuration, normalizedItems);
  const pipelineStatus = derivePipelineStatus({
    ...orderLike,
    items: normalizedItems,
  });

  const serviceStates = trackedItems.map((item) => {
    const validation = validateServiceConfigurationFromSnapshot(
      {
        trackedItems,
        installConfiguration,
      },
      item.service_key
    );

    return {
      ...item,
      display_name: getTrackedServiceByKey(item.service_key)?.display_name || item.product_name || item.service_key,
      install_status: getTrackedItemStatus(item, defaultStatus),
      configuration: installConfiguration.services?.[item.service_key] || buildEmptyServiceConfigByKey(item.service_key),
      configuration_complete: validation.valid,
      missing_configuration_fields: validation.missing_fields,
      missing_configuration_labels: validation.missing_labels,
      allowed_next_statuses: getAllowedNextStatuses(getTrackedItemStatus(item, defaultStatus)),
    };
  });

  return {
    normalizedItems,
    trackedItems,
    installConfiguration,
    pipelineStatus,
    serviceStates,
  };
}

export function getOrderConfigurationSummary(orderLike) {
  const snapshot = buildInstallSnapshot(orderLike);

  return {
    shared: snapshot.installConfiguration.shared,
    services: Object.fromEntries(
      snapshot.serviceStates.map((serviceState) => [
        serviceState.service_key,
        {
          configuration: serviceState.configuration,
          configuration_complete: serviceState.configuration_complete,
          missing_configuration_fields: serviceState.missing_configuration_fields,
          missing_configuration_labels: serviceState.missing_configuration_labels,
        },
      ])
    ),
  };
}

export function validateServiceConfiguration({ orderLike, serviceKey }) {
  const snapshot = buildInstallSnapshot(orderLike);
  return validateServiceConfigurationFromSnapshot(snapshot, serviceKey);
}

export function buildClientProjectPatch({ pipelineStatus, trackedItems, completedAt }) {
  const statuses = trackedItems.map((item) => item.install_status);
  const anyStarted = statuses.some((status) => isInProgressStatus(status));
  const anyTesting = statuses.some((status) => hasReachedTesting(status));
  const allLive = trackedItems.length > 0 && statuses.every((status) => status === "Live");

  return {
    step_payment: "complete",
    step_system_setup: allLive ? "complete" : anyStarted ? "in_progress" : "pending",
    step_sms: allLive ? "complete" : anyStarted ? "in_progress" : "pending",
    step_live: pipelineStatus === "Live" ? "complete" : anyTesting ? "in_progress" : "pending",
    go_live_date: pipelineStatus === "Live" ? completedAt : undefined,
  };
}

export function buildOnboardingClientPatch({ order, pipelineStatus }) {
  const snapshot = buildInstallSnapshot(order);
  const trackedItems = snapshot.trackedItems;
  const trackedStatusByService = Object.fromEntries(trackedItems.map((item) => [item.service_key, item.install_status]));
  const handoff = buildPurchaseOnboardingHandoff({ order });
  const allTemplatesConfigured =
    trackedItems.length > 0 &&
    trackedItems.every((item) => {
      if (item.service_key === "nurture_sequence_14d") {
        return (snapshot.installConfiguration.services?.[item.service_key]?.steps || []).every(
          (step) => cleanString(step?.message_template)
        );
      }

       if (item.service_key === "ai_booking_agent") {
        const bookingConfig = snapshot.installConfiguration.services?.[item.service_key] || {};
        return cleanString(bookingConfig.confirmation_template) &&
          (!bookingConfig.reminder_enabled || cleanString(bookingConfig.reminder_template));
      }

      if (item.service_key === "lead_reactivation") {
        const reactivationConfig = snapshot.installConfiguration.services?.[item.service_key] || {};
        return cleanString(reactivationConfig.message_template);
      }

      if (item.service_key === "review_request") {
        const reviewRequestConfig = snapshot.installConfiguration.services?.[item.service_key] || {};
        return cleanString(reviewRequestConfig.message_template);
      }

      return cleanString(snapshot.installConfiguration.services?.[item.service_key]?.sms_template);
    });
  const allTestingComplete =
    trackedItems.length > 0 && trackedItems.every((item) => hasReachedTesting(item.install_status));

  return {
    status: pipelineStatus === "Live" ? "Live" : "In Setup",
    pipeline_status: pipelineStatus,
    monthly_rate: order.total_monthly || 0,
    setup_fee: order.total_setup || 0,
    twilio_number: snapshot.installConfiguration.shared.twilio_business_phone || undefined,
    step_twilio: Boolean(snapshot.installConfiguration.shared.twilio_business_phone),
    step_instant_response: trackedStatusByService.instant_lead_response === "Live",
    step_missed_call: trackedStatusByService.missed_call_text_back === "Live",
    step_messages_customized: allTemplatesConfigured,
    step_tested: allTestingComplete,
    step_live: pipelineStatus === "Live",
    activation_package_tier: handoff.package_tier,
    activation_package_key: handoff.package_key,
    package_service_keys: handoff.service_keys,
    onboarding_required_fields: handoff.required_intake_fields,
    onboarding_missing_fields: handoff.missing_intake_fields,
    next_onboarding_question: handoff.next_question,
    package_activation_context: handoff,
  };
}

export async function syncInstallMirrorsFromOrder({
  base44,
  order,
  now = new Date().toISOString(),
}) {
  const snapshot = buildInstallSnapshot(order);

  if (order.client_project_id) {
    const projectPatch = buildClientProjectPatch({
      pipelineStatus: snapshot.pipelineStatus,
      trackedItems: snapshot.trackedItems,
      completedAt: snapshot.pipelineStatus === "Live" ? now : undefined,
    });
    await base44.asServiceRole.entities.ClientProject.update(order.client_project_id, projectPatch);
  }

  if (order.onboarding_client_id) {
    const onboardingPatch = buildOnboardingClientPatch({
      order: {
        ...order,
        items: snapshot.normalizedItems,
        install_configuration: snapshot.installConfiguration,
      },
      pipelineStatus: snapshot.pipelineStatus,
    });
    await base44.asServiceRole.entities.OnboardingClient.update(order.onboarding_client_id, onboardingPatch);
  }

  return snapshot;
}

export async function initializePaidOrderInstallPipeline({
  base44,
  order,
  stripeCustomerId,
  eventSource = "stripe.checkout.session.completed",
  now = new Date().toISOString(),
}) {
  const hadPaidStatus = order.payment_status === "paid";
  const alreadyInitialized = Boolean(order.install_initialized_at);
  const initializedItems = normalizeOrderItems(order.items || [], "Ready for Install");
  const trackedItems = getTrackedInstallItems(initializedItems);
  const installConfiguration = normalizeInstallConfiguration(order.install_configuration, initializedItems);

  if (trackedItems.length === 0) {
    const failedOrderDraft = {
      ...order,
      payment_status: "paid",
      items: initializedItems,
      install_configuration: installConfiguration,
      pipeline_status: "Error",
      pipeline_error: "Paid order has no tracked install services. Manual repair required before install can begin.",
    };
    const canonicalPatch = buildCanonicalInstallStatePatch({
      order: failedOrderDraft,
      snapshot: buildInstallSnapshot(failedOrderDraft),
      requestedState: "RECOVERY_REQUIRED",
      eventType: "install_initialize_blocked",
      now,
    });
    const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "paid",
      stripe_customer_id: stripeCustomerId || order.stripe_customer_id,
      items: initializedItems,
      install_configuration: installConfiguration,
      pipeline_status: "Error",
      order_status: mapPipelineStatusToOrderStatus({
        pipelineStatus: "Error",
        trackedItems,
        paymentStatus: "paid",
      }),
      pipeline_error: "Paid order has no tracked install services. Manual repair required before install can begin.",
      install_lock_key: `install:${order.id}:initialize`,
      install_lock_status: "failed",
      install_lock_owner: eventSource,
      install_lock_acquired_at: order.install_lock_acquired_at || now,
      install_lock_released_at: now,
      install_orchestration_attempts: Number(order.install_orchestration_attempts || 0) + 1,
      last_install_event_at: now,
      ...canonicalPatch,
    });

    await createCommunicationEvent(
      base44,
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "workflow_triggered",
        status: "failed",
        provider: "internal",
        subject: "Install initialization blocked",
        message_body: `Paid order ${order.id} has no tracked install services and cannot enter the install pipeline.`,
        metadata: {
          order_id: order.id,
          event_source: eventSource,
          failure_code: "missing_tracked_items",
        },
      })
    );

    return {
      order: {
        ...updatedOrder,
        items: initializedItems,
        install_configuration: installConfiguration,
        pipeline_status: "Error",
      },
      client: null,
      clientProject: null,
      onboardingClient: null,
      createdEvents: [],
    };
  }

  const provisionalOrder = {
    ...order,
    items: initializedItems,
    payment_status: "paid",
    install_initialized_at: alreadyInitialized ? order.install_initialized_at : now,
    install_configuration: installConfiguration,
  };
  const purchaseOnboardingHandoff = buildPurchaseOnboardingHandoff({ order: provisionalOrder });
  const pipelineStatus = derivePipelineStatus(provisionalOrder);
  let client;
  let clientProject;
  let onboardingClient;

  try {
    client = await resolveClientRecord(base44, provisionalOrder);
    clientProject = await resolveClientProjectRecord(base44, provisionalOrder, client, pipelineStatus);
    onboardingClient = await resolveOnboardingClientRecord(
      base44,
      provisionalOrder,
      client,
      clientProject,
      pipelineStatus
    );
  } catch (error) {
    if (error instanceof InstallLinkingError) {
      const trackedItems = getTrackedInstallItems(initializedItems);
      const failedOrderDraft = {
        ...order,
        payment_status: "paid",
        items: initializedItems,
        install_configuration: installConfiguration,
        pipeline_status: order.pipeline_status || "Paid",
        pipeline_error: error.message,
      };
      const canonicalPatch = buildCanonicalInstallStatePatch({
        order: failedOrderDraft,
        snapshot: buildInstallSnapshot(failedOrderDraft),
        requestedState: "RECOVERY_REQUIRED",
        eventType: "install_linking_blocked",
        note: error.message,
        now,
      });
      const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: "paid",
        stripe_customer_id: stripeCustomerId || order.stripe_customer_id,
        items: initializedItems,
        install_configuration: installConfiguration,
        pipeline_status: order.pipeline_status || "Paid",
        order_status: mapPipelineStatusToOrderStatus({
          pipelineStatus: order.pipeline_status || "Paid",
          trackedItems,
          paymentStatus: "paid",
        }),
        pipeline_error: error.message,
        install_lock_key: `install:${order.id}:initialize`,
        install_lock_status: "failed",
        install_lock_owner: eventSource,
        install_lock_acquired_at: order.install_lock_acquired_at || now,
        install_lock_released_at: now,
        install_orchestration_attempts: Number(order.install_orchestration_attempts || 0) + 1,
        last_install_event_at: now,
        ...canonicalPatch,
      });

      if (order.pipeline_error !== error.message) {
        await createCommunicationEvent(
          base44,
          buildInstallLinkingBlockedEvent({
            order: {
              ...updatedOrder,
              items: initializedItems,
              install_configuration: installConfiguration,
            },
            error,
          })
        );
      }

      throw error;
    }

    throw error;
  }

  const installLockKey = `install:${order.id}:initialize`;
  const orderDraftForState = {
    ...order,
    payment_status: "paid",
    stripe_customer_id: stripeCustomerId || order.stripe_customer_id,
    client_id: client.id,
    client_project_id: clientProject.id,
    onboarding_client_id: onboardingClient.id,
    items: initializedItems,
    install_initialized_at: alreadyInitialized ? order.install_initialized_at : now,
    install_configuration: installConfiguration,
    pipeline_status: pipelineStatus,
    pipeline_error: undefined,
  };
  const canonicalPatch = buildCanonicalInstallStatePatch({
    order: orderDraftForState,
    snapshot: buildInstallSnapshot(orderDraftForState),
    eventType: alreadyInitialized ? "install_initialize_idempotent" : "install_initialized",
    now,
  });

  const orderUpdate = {
    payment_status: "paid",
    stripe_customer_id: stripeCustomerId || order.stripe_customer_id,
    client_id: client.id,
    client_project_id: clientProject.id,
    onboarding_client_id: onboardingClient.id,
    items: initializedItems,
    install_initialized_at: alreadyInitialized ? order.install_initialized_at : now,
    activation_started_at: order.activation_started_at || (alreadyInitialized ? order.install_initialized_at : now),
    install_configuration: installConfiguration,
    activation_package_tier: purchaseOnboardingHandoff.package_tier,
    activation_package_key: purchaseOnboardingHandoff.package_key,
    activation_package_name: purchaseOnboardingHandoff.package_name,
    purchase_onboarding_handoff: purchaseOnboardingHandoff,
    pipeline_status: pipelineStatus,
    order_status: mapPipelineStatusToOrderStatus({
      pipelineStatus,
      trackedItems,
      paymentStatus: "paid",
    }),
    pipeline_error: undefined,
    install_lock_key: installLockKey,
    install_lock_status: "released",
    install_lock_owner: eventSource,
    install_lock_acquired_at: order.install_lock_acquired_at || now,
    install_lock_released_at: now,
    install_orchestration_attempts:
      Number(order.install_orchestration_attempts || 0) + (alreadyInitialized ? 0 : 1),
    last_install_event_at: now,
    ...canonicalPatch,
  };

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, orderUpdate);
  await syncInstallMirrorsFromOrder({
    base44,
    order: {
      ...updatedOrder,
      items: initializedItems,
      install_configuration: installConfiguration,
    },
    now,
  });

  const events = [];

  if (!hadPaidStatus) {
    events.push(
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "order_paid",
        provider: "stripe",
        subject: "Order marked paid",
        message_body: `Order ${order.id} was marked paid from ${eventSource}.`,
        metadata: {
          order_id: order.id,
          event_source: eventSource,
          stripe_customer_id: stripeCustomerId || null,
        },
      })
    );
  }

  if (!alreadyInitialized) {
    events.push(
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "install_initialized",
        subject: "Install pipeline initialized",
        message_body: `Install pipeline initialized for ${order.business_name}.`,
        metadata: {
          order_id: order.id,
          tracked_services: trackedItems.map((item) => item.service_key),
          package_tier: purchaseOnboardingHandoff.package_tier,
          next_onboarding_question: purchaseOnboardingHandoff.next_question,
        },
      })
    );
  }

  if (!alreadyInitialized) {
    events.push(
      buildCommunicationEvent({
        order: updatedOrder,
        event_type: "onboarding_handoff_initialized",
        subject: "Purchase-to-onboarding handoff initialized",
        message_body: `Sam/onboarding initialized for ${purchaseOnboardingHandoff.package_name}. Next question: ${purchaseOnboardingHandoff.next_question}`,
        metadata: {
          order_id: order.id,
          package_tier: purchaseOnboardingHandoff.package_tier,
          service_keys: purchaseOnboardingHandoff.service_keys,
          missing_intake_fields: purchaseOnboardingHandoff.missing_intake_fields,
          next_missing_field: purchaseOnboardingHandoff.next_missing_field,
          next_question: purchaseOnboardingHandoff.next_question,
        },
      })
    );
  }

  if (!alreadyInitialized || order.pipeline_status !== pipelineStatus) {
    events.push(
      buildOrderStatusEvent({
        order: updatedOrder,
        previousStatus: order.pipeline_status || "Paid",
        nextStatus: pipelineStatus,
      })
    );
  }

  if (order.canonical_install_state !== updatedOrder.canonical_install_state) {
    events.push(
      buildInstallStateChangedEvent({
        order: updatedOrder,
        previousState: order.canonical_install_state || null,
        nextState: updatedOrder.canonical_install_state,
        metadata: {
          event_source: eventSource,
          lock_key: installLockKey,
        },
      })
    );
  }

  for (const event of events) {
    await createCommunicationEvent(base44, event);
  }

  return {
    order: {
      ...updatedOrder,
      items: initializedItems,
      install_configuration: installConfiguration,
      purchase_onboarding_handoff: purchaseOnboardingHandoff,
      pipeline_status: pipelineStatus,
    },
    client,
    clientProject,
    onboardingClient,
    createdEvents: events,
  };
}

export async function listInstallQueueOrders(base44, { includeLive = false } = {}) {
  const orders = await base44.asServiceRole.entities.Order.list("-created_date", 100);

  return orders
    .filter((order) => order.payment_status === "paid")
    .map((order) => {
      const snapshot = buildInstallSnapshot(order);

      return {
        ...order,
        items: snapshot.normalizedItems,
        trackedItems: snapshot.serviceStates,
        install_configuration: snapshot.installConfiguration,
        pipeline_status: snapshot.pipelineStatus,
        canonical_install_state:
          order.canonical_install_state ||
          deriveCanonicalInstallState({ order, snapshot }),
        configuration_summary: getOrderConfigurationSummary({
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        }),
      };
    })
    .filter((order) => order.trackedItems.length > 0)
    .filter((order) => includeLive || order.pipeline_status !== "Live");
}

export async function updateOrderInstallConfiguration({
  base44,
  order,
  patch,
  note,
  now = new Date().toISOString(),
}) {
  const snapshot = buildInstallSnapshot(order);
  const nextInstallConfiguration = mergeInstallConfiguration(
    snapshot.installConfiguration,
    patch,
    snapshot.normalizedItems
  );
  const updatedServices = Object.keys(nextInstallConfiguration.services || {});
  const orderDraftForState = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: nextInstallConfiguration,
  };
  const nextSnapshot = buildInstallSnapshot(orderDraftForState);
  const canonicalPatch = buildCanonicalInstallStatePatch({
    order: orderDraftForState,
    snapshot: nextSnapshot,
    eventType: "install_configuration_updated",
    note,
    now,
  });

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    install_configuration: nextInstallConfiguration,
    install_configuration_updated_at: now,
    last_install_event_at: now,
    ...canonicalPatch,
  });

  await syncInstallMirrorsFromOrder({
    base44,
    order: {
      ...updatedOrder,
      items: snapshot.normalizedItems,
      install_configuration: nextInstallConfiguration,
    },
    now,
  });

  await createCommunicationEvent(
    base44,
    buildServiceConfigurationUpdatedEvent({
      order: {
        ...updatedOrder,
        items: snapshot.normalizedItems,
        install_configuration: nextInstallConfiguration,
      },
      updatedServices,
      note,
    })
  );

  const updatedSnapshot = buildInstallSnapshot({
    ...updatedOrder,
    items: snapshot.normalizedItems,
    install_configuration: nextInstallConfiguration,
  });

  if (order.canonical_install_state !== updatedOrder.canonical_install_state) {
    await createCommunicationEvent(
      base44,
      buildInstallStateChangedEvent({
        order: updatedOrder,
        previousState: order.canonical_install_state || null,
        nextState: updatedOrder.canonical_install_state,
        note,
        metadata: {
          updated_services: updatedServices,
        },
      })
    );
  }

  return {
    ...updatedOrder,
    items: updatedSnapshot.normalizedItems,
    install_configuration: updatedSnapshot.installConfiguration,
    pipeline_status: updatedSnapshot.pipelineStatus,
    trackedItems: updatedSnapshot.serviceStates,
    configuration_summary: getOrderConfigurationSummary({
      ...updatedOrder,
      items: updatedSnapshot.normalizedItems,
      install_configuration: updatedSnapshot.installConfiguration,
    }),
  };
}

export async function updateTrackedServiceInstallStatus({
  base44,
  order,
  serviceKey,
  nextStatus,
  note,
  now = new Date().toISOString(),
}) {
  if (!PIPELINE_STATUSES.includes(nextStatus)) {
    throw new Error("Invalid install status");
  }

  const snapshot = buildInstallSnapshot(order);
  const targetItem = snapshot.serviceStates.find((item) => item.service_key === serviceKey);

  if (!targetItem) {
    throw new Error("Tracked service not found on order");
  }

  const previousServiceStatus = targetItem.install_status || "Ready for Install";

  if (previousServiceStatus === nextStatus) {
    return {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
      pipeline_status: snapshot.pipelineStatus,
    };
  }

  const allowedNextStatuses = getAllowedNextStatuses(previousServiceStatus);
  let validation = null;

  if (["Testing", "Live"].includes(nextStatus)) {
    validation = validateServiceConfigurationFromSnapshot(snapshot, serviceKey);
  }

  if (nextStatus === "Live") {
    const hasSuccessfulTest = await hasSuccessfulRuntimeTest({
      base44,
      orderId: order.id,
      serviceKey,
    });

    if (!hasSuccessfulTest) {
      validation = withAdditionalValidationEntries(validation || {
        valid: true,
        missing_fields: [],
        missing_labels: [],
        service_key: serviceKey,
      }, [
        {
          field: "service_test.successful_runtime",
          label: "Successful remote test",
        },
      ]);
    }
  }

  if (!allowedNextStatuses.includes(nextStatus) || (validation && !validation.valid)) {
    const reason = buildBlockedTransitionReason({
      currentStatus: previousServiceStatus,
      nextStatus,
      validation,
    });

    const blockedEvent = await createCommunicationEvent(
      base44,
      buildServiceTransitionBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey,
        currentStatus: previousServiceStatus,
        requestedStatus: nextStatus,
        reason,
        validation,
        note,
      })
    );

    throw new InstallTransitionError(reason, {
      code: !allowedNextStatuses.includes(nextStatus)
        ? "install_transition_not_allowed"
        : "install_transition_blocked",
      details: {
        service_key: serviceKey,
        current_status: previousServiceStatus,
        requested_status: nextStatus,
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const updatedItems = snapshot.normalizedItems.map((item) => {
    if (item.service_key !== serviceKey || !item.tracking_enabled) {
      return item;
    }

    return {
      ...item,
      install_status: nextStatus,
      status: STATUS_TO_LEGACY_ITEM_STATUS[nextStatus] || item.status,
      install_started_at:
        nextStatus === "Configuring" && !item.install_started_at ? now : item.install_started_at,
      install_completed_at: nextStatus === "Live" ? now : undefined,
      install_error: nextStatus === "Error" ? note || "Install error" : undefined,
    };
  });

  const nextPipelineStatus = derivePipelineStatus({
    ...order,
    items: updatedItems,
    install_initialized_at: order.install_initialized_at || now,
  });
  const trackedItems = getTrackedInstallItems(updatedItems);
  const orderDraftForState = {
    ...order,
    items: updatedItems,
    install_configuration: snapshot.installConfiguration,
    install_initialized_at: order.install_initialized_at || now,
    activation_started_at: order.activation_started_at || order.install_initialized_at || now,
    pipeline_status: nextPipelineStatus,
    pipeline_error: nextPipelineStatus === "Error" ? note || "Service install error" : undefined,
    payment_status: order.payment_status || "paid",
  };
  const canonicalPatch = buildCanonicalInstallStatePatch({
    order: orderDraftForState,
    snapshot: buildInstallSnapshot(orderDraftForState),
    eventType: "service_status_changed",
    note,
    now,
  });

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    items: updatedItems,
    install_initialized_at: order.install_initialized_at || now,
    activation_started_at: order.activation_started_at || order.install_initialized_at || now,
    pipeline_status: nextPipelineStatus,
    pipeline_error: nextPipelineStatus === "Error" ? note || "Service install error" : undefined,
    order_status: mapPipelineStatusToOrderStatus({
      pipelineStatus: nextPipelineStatus,
      trackedItems,
      paymentStatus: order.payment_status || "paid",
    }),
    ...(nextPipelineStatus === "Live" && !order.activation_completed_at ? { activation_completed_at: now } : {}),
    last_install_event_at: now,
    ...canonicalPatch,
  });

  await syncInstallMirrorsFromOrder({
    base44,
    order: {
      ...updatedOrder,
      items: updatedItems,
      install_configuration: snapshot.installConfiguration,
    },
    now,
  });

  await createCommunicationEvent(
    base44,
    buildServiceStatusEvent({
      order: updatedOrder,
      serviceKey,
      previousStatus: previousServiceStatus,
      nextStatus,
      note,
    })
  );

  const previousPipelineStatus = order.pipeline_status || snapshot.pipelineStatus;
  if (previousPipelineStatus !== nextPipelineStatus) {
    await createCommunicationEvent(
      base44,
      buildOrderStatusEvent({
        order: updatedOrder,
        previousStatus: previousPipelineStatus,
        nextStatus: nextPipelineStatus,
        note,
      })
    );
  }

  if (order.canonical_install_state !== updatedOrder.canonical_install_state) {
    await createCommunicationEvent(
      base44,
      buildInstallStateChangedEvent({
        order: updatedOrder,
        previousState: order.canonical_install_state || null,
        nextState: updatedOrder.canonical_install_state,
        note,
        metadata: {
          service_key: serviceKey,
          service_previous_status: previousServiceStatus,
          service_next_status: nextStatus,
        },
      })
    );
  }

  return {
    ...updatedOrder,
    items: updatedItems,
    install_configuration: snapshot.installConfiguration,
    pipeline_status: nextPipelineStatus,
  };
}
