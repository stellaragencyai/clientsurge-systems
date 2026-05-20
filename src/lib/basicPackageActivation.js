import { PACKAGE_CAPABILITY_MATRIX, getPackageTierForServiceKeys } from "./packageCapabilities.js";

export const BASIC_PACKAGE_SERVICE_KEYS = PACKAGE_CAPABILITY_MATRIX.basic.service_keys;
export const GROWTH_PACKAGE_SERVICE_KEYS = PACKAGE_CAPABILITY_MATRIX.growth.service_keys;
export const PRO_PACKAGE_SERVICE_KEYS = PACKAGE_CAPABILITY_MATRIX.pro.service_keys;

export const BASIC_PACKAGE_REQUIRED_INTAKE_FIELDS = PACKAGE_CAPABILITY_MATRIX.basic.required_intake_fields;
export const GROWTH_PACKAGE_REQUIRED_INTAKE_FIELDS = PACKAGE_CAPABILITY_MATRIX.growth.required_intake_fields;
export const PRO_PACKAGE_REQUIRED_INTAKE_FIELDS = PACKAGE_CAPABILITY_MATRIX.pro.required_intake_fields;

export const PACKAGE_ACTIVATION_DEFINITIONS = PACKAGE_CAPABILITY_MATRIX;

const DEFAULT_AFTER_HOURS_BEHAVIOR = "send_after_hours_sms";
const DEFAULT_CONSENT_BEHAVIOR = "include_opt_out_language";
const DEFAULT_OPT_OUT_MESSAGE = "Reply STOP to opt out.";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean);
  }

  const normalized = cleanString(value);
  return normalized ? [normalized] : [];
}

function sentenceJoin(values) {
  const cleaned = cleanList(values);
  if (cleaned.length === 0) return "your services";
  if (cleaned.length === 1) return cleaned[0];
  return `${cleaned.slice(0, -1).join(", ")} and ${cleaned.at(-1)}`;
}

function normalizeBusinessPhone(intake = {}) {
  return cleanString(intake.twilio_business_phone) || cleanString(intake.business_phone);
}

function normalizeBrandVoice(intake = {}) {
  return cleanString(intake.brand_voice) || "professional, warm, and helpful";
}

function normalizeBookingLink(intake = {}) {
  return cleanString(intake.booking_link) || cleanString(intake.calendar_link);
}

function normalizeBusinessName(intake = {}) {
  return cleanString(intake.business_name) || "our team";
}

function buildInstantLeadTemplate(intake = {}) {
  const businessName = normalizeBusinessName(intake);
  const bookingLink = normalizeBookingLink(intake);
  const services = sentenceJoin(intake.services);

  return cleanString(intake.instant_lead_response_sms_template) ||
    `Hi {{lead_name}}, this is ${businessName}. Thanks for reaching out about ${services}. We received your request and will help you shortly. You can book here: ${bookingLink}. ${DEFAULT_OPT_OUT_MESSAGE}`;
}

function buildMissedCallTemplate(intake = {}) {
  const businessName = normalizeBusinessName(intake);
  const bookingLink = normalizeBookingLink(intake);

  return cleanString(intake.missed_call_text_back_sms_template) ||
    `Hi, this is ${businessName}. Sorry we missed your call. Reply here and we can help, or book a time here: ${bookingLink}. ${DEFAULT_OPT_OUT_MESSAGE}`;
}

function buildNurtureSequenceConfig(intake = {}) {
  const businessName = normalizeBusinessName(intake);
  const bookingLink = normalizeBookingLink(intake);
  const services = sentenceJoin(intake.services);

  return {
    sms_enabled: intake.nurture_sms_enabled !== false,
    email_enabled: intake.nurture_email_enabled !== false,
    steps: Array.isArray(intake.nurture_sequence_steps) && intake.nurture_sequence_steps.length > 0
      ? intake.nurture_sequence_steps
      : [
          {
            day: 1,
            channel: "sms",
            message_template: `Hi {{first_name}}, this is ${businessName}. Just checking in about ${services}. You can book here: ${bookingLink}. {{opt_out_message}}`,
          },
          {
            day: 3,
            channel: "email",
            message_template: `Hi {{first_name}}, wanted to follow up from ${businessName}. If you are still interested in ${services}, here is the easiest booking link: ${bookingLink}`,
          },
          {
            day: 7,
            channel: "sms",
            message_template: `Hi {{first_name}}, should we close this out or would you still like help from ${businessName}? Booking link: ${bookingLink}. {{opt_out_message}}`,
          },
        ],
  };
}

function buildBookingAgentConfig(intake = {}) {
  const bookingLink = normalizeBookingLink(intake);
  const businessName = normalizeBusinessName(intake);

  return {
    booking_link: bookingLink,
    booking_mode: cleanString(intake.booking_mode) || "external_link",
    business_hours: cleanString(intake.business_hours),
    confirmation_template:
      cleanString(intake.booking_confirmation_template) ||
      `Thanks {{first_name}}. You can book with ${businessName} here: {{booking_link}}`,
    reminder_enabled: intake.booking_reminder_enabled === true,
    reminder_template:
      cleanString(intake.booking_reminder_template) ||
      `Reminder: your booking with ${businessName} is reserved for {{scheduled_at}}. Details: {{booking_link}}`,
    intake_fields: Array.isArray(intake.booking_intake_fields) && intake.booking_intake_fields.length > 0
      ? intake.booking_intake_fields
      : ["lead_name", "lead_email", "lead_phone", "preferred_time", "notes"],
  };
}

function buildLeadReactivationConfig(intake = {}) {
  const businessName = normalizeBusinessName(intake);
  const services = sentenceJoin(intake.services);

  return {
    target_segment: cleanString(intake.reactivation_target_segment) || "contacted_no_reply",
    message_template:
      cleanString(intake.reactivation_message_template) ||
      `Hi {{first_name}}, this is ${businessName}. We are checking back in about ${services}. Reply here if you would still like help.`,
    max_batch_size: Number(intake.reactivation_max_batch_size) > 0
      ? Number(intake.reactivation_max_batch_size)
      : 25,
  };
}

function buildReviewRequestConfig(intake = {}) {
  const businessName = normalizeBusinessName(intake);

  return {
    review_link: cleanString(intake.review_link),
    trigger_event: cleanString(intake.review_trigger_event) || "manual_trigger",
    message_template:
      cleanString(intake.review_request_message_template) ||
      `Hi {{first_name}}, thanks for choosing ${businessName}. Would you leave us a quick review here? {{review_link}}`,
    channel: cleanString(intake.review_request_channel) || "email",
    send_delay_minutes: Number.isFinite(Number(intake.review_send_delay_minutes))
      ? Number(intake.review_send_delay_minutes)
      : 15,
    fallback_internal_feedback_enabled: intake.review_fallback_internal_feedback_enabled !== false,
  };
}

function normalizeServiceKeys(value = []) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanString).filter(Boolean))];
}

function getOrderServiceKeys(order = {}) {
  return normalizeServiceKeys([
    ...(order.pricing_summary?.selected_service_keys || []),
    ...(order.pricing_summary?.package_service_keys || []),
    ...(order.items || []).map((item) => item.service_key),
    ...(order.services || []).map((service) => service.service_key),
  ]);
}

export function detectPackageActivationDefinition({ order = null, serviceKeys = [] } = {}) {
  const selected = normalizeServiceKeys(serviceKeys.length ? serviceKeys : getOrderServiceKeys(order || {}));
  const packageTier = getPackageTierForServiceKeys(selected);
  if (packageTier) {
    return { package_tier: packageTier, ...PACKAGE_ACTIVATION_DEFINITIONS[packageTier] };
  }

  return null;
}

export function buildBasicPackageInstallConfiguration(
  intake = {},
  { includeGrowthServices = false, includeProServices = false } = {}
) {
  const afterHoursBehavior = cleanString(intake.after_hours_behavior) || DEFAULT_AFTER_HOURS_BEHAVIOR;
  const consentBehavior = cleanString(intake.consent_behavior) || DEFAULT_CONSENT_BEHAVIOR;
  const optOutMessage = cleanString(intake.opt_out_message) || DEFAULT_OPT_OUT_MESSAGE;

  return {
    shared: {
      twilio_business_phone: normalizeBusinessPhone(intake),
      business_hours: cleanString(intake.business_hours),
      after_hours_behavior: afterHoursBehavior,
      consent_behavior: consentBehavior,
      opt_out_message: optOutMessage,
    },
    services: {
      instant_lead_response: {
        sms_template: buildInstantLeadTemplate(intake),
      },
      missed_call_text_back: {
        sms_template: buildMissedCallTemplate(intake),
      },
      ...(includeGrowthServices ? {
        nurture_sequence_14d: buildNurtureSequenceConfig(intake),
        ai_booking_agent: buildBookingAgentConfig(intake),
      } : {}),
      ...(includeProServices ? {
        lead_reactivation: buildLeadReactivationConfig(intake),
        review_request: buildReviewRequestConfig(intake),
      } : {}),
    },
  };
}

export function validateBasicPackageIntake(intake = {}) {
  const normalized = {
    business_name: normalizeBusinessName(intake) === "our team" ? "" : normalizeBusinessName(intake),
    business_phone: normalizeBusinessPhone(intake),
    business_hours: cleanString(intake.business_hours),
    booking_link: normalizeBookingLink(intake),
    brand_voice: normalizeBrandVoice(intake) === "professional, warm, and helpful" ? "" : normalizeBrandVoice(intake),
    services: cleanList(intake.services).join(", "),
  };

  const missing_fields = BASIC_PACKAGE_REQUIRED_INTAKE_FIELDS.filter((field) => !normalized[field]);

  return {
    valid: missing_fields.length === 0,
    missing_fields,
    ready_for_install_configuration: missing_fields.length === 0,
  };
}

export function validateGrowthPackageIntake(intake = {}) {
  const basicValidation = validateBasicPackageIntake(intake);
  const normalized = {
    lead_sources: cleanList(intake.lead_sources).join(", "),
    booking_process: cleanString(intake.booking_process),
    common_customer_questions: cleanList(intake.common_customer_questions).join(", "),
  };
  const growthMissing = GROWTH_PACKAGE_REQUIRED_INTAKE_FIELDS
    .filter((field) => !BASIC_PACKAGE_REQUIRED_INTAKE_FIELDS.includes(field))
    .filter((field) => !normalized[field]);
  const missing_fields = [...basicValidation.missing_fields, ...growthMissing];

  return {
    valid: missing_fields.length === 0,
    missing_fields,
    ready_for_install_configuration: missing_fields.length === 0,
  };
}

export function validateProPackageIntake(intake = {}) {
  const growthValidation = validateGrowthPackageIntake(intake);
  const normalized = {
    reactivation_target_segment: cleanString(intake.reactivation_target_segment),
    review_link: cleanString(intake.review_link),
    review_trigger_event: cleanString(intake.review_trigger_event),
  };
  const proMissing = PRO_PACKAGE_REQUIRED_INTAKE_FIELDS
    .filter((field) => !GROWTH_PACKAGE_REQUIRED_INTAKE_FIELDS.includes(field))
    .filter((field) => !normalized[field]);
  const missing_fields = [...growthValidation.missing_fields, ...proMissing];

  return {
    valid: missing_fields.length === 0,
    missing_fields,
    ready_for_install_configuration: missing_fields.length === 0,
  };
}

export function buildBasicPackageActivationBrief(intake = {}) {
  const validation = validateBasicPackageIntake(intake);
  const install_configuration = buildBasicPackageInstallConfiguration(intake);

  return {
    package_key: "basic_website_plus_two_automations",
    package_name: "Website Redesign + Instant Lead Response + Missed Call Text-Back",
    service_keys: BASIC_PACKAGE_SERVICE_KEYS,
    validation,
    install_configuration,
    activation_gates: [
      "website_lead_form_connected",
      "twilio_sms_webhook_verified",
      "twilio_voice_webhook_verified",
      "matched_sms_reply_stops_follow_up",
      "missed_call_text_back_sent",
      "duplicate_callsid_skipped",
      "sms_delivery_callback_verified",
      "resend_sender_verified",
    ],
    operator_note:
      "Apply install_configuration to Order.install_configuration, then run the basic package readiness check and live provider gates before marking services Live.",
  };
}

export function buildGrowthPackageActivationBrief(intake = {}) {
  const validation = validateGrowthPackageIntake(intake);
  const install_configuration = buildBasicPackageInstallConfiguration(intake, {
    includeGrowthServices: true,
  });

  return {
    package_key: "growth_website_plus_four_automations",
    package_name: "Website Redesign + Instant Response + Missed Call + 14-Day Nurture + AI Booking Agent",
    service_keys: GROWTH_PACKAGE_SERVICE_KEYS,
    validation,
    install_configuration,
    activation_gates: [
      "basic_package_gates_passed",
      "nurture_sequence_templates_saved",
      "nurture_sms_step_tested",
      "nurture_email_step_tested",
      "booking_link_verified",
      "booking_intake_fields_saved",
      "booking_confirmation_simulated",
      "booking_reminder_simulated_if_enabled",
      "provider_events_logged",
    ],
    operator_note:
      "Apply install_configuration to Order.install_configuration, then run nurture and booking runtime tests before marking services Live.",
  };
}

export function buildProPackageActivationBrief(intake = {}) {
  const validation = validateProPackageIntake(intake);
  const install_configuration = buildBasicPackageInstallConfiguration(intake, {
    includeGrowthServices: true,
    includeProServices: true,
  });

  return {
    package_key: "pro_website_plus_six_automations",
    package_name: "Website Redesign + Full Six-Automation Stack",
    service_keys: PRO_PACKAGE_SERVICE_KEYS,
    validation,
    install_configuration,
    activation_gates: [
      "growth_package_gates_passed",
      "reactivation_target_segment_saved",
      "reactivation_template_saved",
      "reactivation_batch_simulated",
      "review_link_verified",
      "review_trigger_saved",
      "review_request_simulated",
      "provider_events_logged",
    ],
    operator_note:
      "Apply install_configuration to Order.install_configuration, then run reactivation and review-request runtime tests before marking services Live.",
  };
}

export function buildPackageActivationBrief({ intake = {}, order = null, serviceKeys = [] } = {}) {
  const definition = detectPackageActivationDefinition({ order, serviceKeys });

  if (!definition) {
    return {
      package_key: "custom_or_unsupported_package",
      package_name: "Custom or unsupported package",
      package_tier: "custom",
      service_keys: normalizeServiceKeys(serviceKeys.length ? serviceKeys : getOrderServiceKeys(order || {})),
      validation: {
        valid: false,
        missing_fields: ["supported_package_services"],
        ready_for_install_configuration: false,
      },
      install_configuration: buildBasicPackageInstallConfiguration(intake),
      activation_gates: [],
      operator_note: "This order does not match the canonical Basic, Growth, or Pro package service sets.",
      intake_gap_resolution: {
        complete: false,
        next_missing_field: "supported_package_services",
        next_question: "Which ClientSurge package did this client purchase: Basic, Growth, or Pro?",
        missing_fields: ["supported_package_services"],
      },
      readiness: {
        score: 0,
        label: "Needs package match",
        next_best_action: "Match this order to a canonical package before automated activation.",
      },
    };
  }

  const brief =
    definition.package_tier === "pro"
      ? buildProPackageActivationBrief(intake)
      : definition.package_tier === "growth"
      ? buildGrowthPackageActivationBrief(intake)
      : buildBasicPackageActivationBrief(intake);

  return {
    ...brief,
    package_tier: definition.package_tier,
    intake_gap_resolution: buildIntakeGapResolution({
      packageTier: definition.package_tier,
      validation: brief.validation,
    }),
    readiness: scorePackageActivationReadiness({
      brief,
      order,
    }),
  };
}

export function buildIntakeGapResolution({ packageTier = "basic", validation } = {}) {
  const missingFields = validation?.missing_fields || [];
  const nextField = missingFields[0] || null;
  const packageLabel =
    packageTier === "pro" ? "Pro" :
    packageTier === "growth" ? "Growth" :
    "Basic";

  const questionByField = {
    business_name: "What is the client’s public business name?",
    business_phone: "What business phone number should the automations use?",
    business_hours: "What are the client’s normal business hours?",
    booking_link: "What booking link should we use for leads who are ready to schedule?",
    brand_voice: "How should the automation sound: professional, friendly, luxury, direct, or something else?",
    services: "Which services should the automation mention when responding to leads?",
    lead_sources: "Where do this client’s leads usually come from?",
    booking_process: "How does this client currently book appointments or consultations?",
    common_customer_questions: "What are the most common customer questions the automation should understand?",
    reactivation_target_segment: "Which old leads should be reactivated first: contacted_no_reply, qualified_unbooked, or all_dormant?",
    review_link: "What Google or preferred review link should review requests send customers to?",
    review_trigger_event: "When should review requests trigger: manual_trigger, appointment_completed, or order_completed?",
  };

  return {
    complete: missingFields.length === 0,
    package_tier: packageTier,
    package_label: packageLabel,
    missing_fields: missingFields,
    next_missing_field: nextField,
    next_question: nextField
      ? questionByField[nextField] || `Please provide ${nextField.replaceAll("_", " ")}.`
      : `${packageLabel} package intake is complete. The operator can apply config and run runtime tests.`,
  };
}

export function scorePackageActivationReadiness({ brief, order = null } = {}) {
  const services = order?.services || [];
  const packageServices = (brief?.service_keys || [])
    .map((serviceKey) => services.find((service) => service.service_key === serviceKey))
    .filter(Boolean);

  const intakeComplete = Boolean(brief?.validation?.valid);
  const hasGeneratedConfig = Boolean(brief?.install_configuration?.shared) && Object.keys(brief?.install_configuration?.services || {}).length > 0;
  const savedConfig = Boolean(order?.install_configuration_updated_at || order?.install_configuration);
  const testingOrLiveCount = packageServices.filter((service) => ["Testing", "Live"].includes(service.install_status)).length;
  const successfulTestCount = packageServices.filter((service) => service.test_summary?.latest_success_at).length;
  const liveCount = packageServices.filter((service) => service.install_status === "Live").length;

  const steps = [
    { key: "intake_complete", complete: intakeComplete, weight: 20 },
    { key: "generated_config", complete: hasGeneratedConfig, weight: 15 },
    { key: "saved_config", complete: savedConfig, weight: 15 },
    {
      key: "services_testing",
      complete: packageServices.length > 0 && testingOrLiveCount === packageServices.length,
      weight: 20,
    },
    {
      key: "runtime_tests",
      complete: packageServices.length > 0 && successfulTestCount === packageServices.length,
      weight: 20,
    },
    {
      key: "services_live",
      complete: packageServices.length > 0 && liveCount === packageServices.length,
      weight: 10,
    },
  ];
  const score = steps.reduce((total, step) => total + (step.complete ? step.weight : 0), 0);
  const nextIncomplete = steps.find((step) => !step.complete);
  const nextActionByStep = {
    intake_complete: brief?.intake_gap_resolution?.next_question || "Collect missing client intake fields.",
    generated_config: "Generate the package install configuration.",
    saved_config: "Apply and save the generated install configuration.",
    services_testing: "Move all package services to Testing.",
    runtime_tests: "Run the runtime tests for every package service.",
    services_live: "Move tested services to Live after provider gates pass.",
  };

  return {
    score,
    label:
      score >= 100 ? "Live-ready" :
      score >= 70 ? "Testing-ready" :
      score >= 40 ? "Config-ready" :
      "Needs intake",
    steps,
    next_best_action: nextIncomplete
      ? nextActionByStep[nextIncomplete.key]
      : "Package activation is complete.",
    counts: {
      package_services: packageServices.length || (brief?.service_keys || []).length,
      services_testing_or_live: testingOrLiveCount,
      successful_runtime_tests: successfulTestCount,
      services_live: liveCount,
    },
  };
}
