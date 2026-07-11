import { getPackageOffer } from "./salesCatalog.js";

// Runtime install requirements remain here; package names and service inclusions
// are always read from the canonical sales catalog.

const starterOffer = getPackageOffer("starter_system");
const growthOffer = getPackageOffer("growth_system");
const proOffer = getPackageOffer("pro_system");

const BASIC_REQUIRED_INTAKE_FIELDS = [
  "business_name",
  "business_phone",
  "business_hours",
  "booking_link",
  "brand_voice",
  "services",
];

const GROWTH_REQUIRED_INTAKE_FIELDS = [
  ...BASIC_REQUIRED_INTAKE_FIELDS,
  "lead_sources",
  "booking_process",
  "common_customer_questions",
];

const PRO_REQUIRED_INTAKE_FIELDS = [
  ...GROWTH_REQUIRED_INTAKE_FIELDS,
  "reactivation_target_segment",
  "review_link",
  "review_trigger_event",
];

export const PACKAGE_CAPABILITY_MATRIX = {
  // `basic` is retained as a runtime compatibility alias for Starter.
  basic: {
    package_key: starterOffer.package_key,
    package_name: starterOffer.name,
    service_keys: [...starterOffer.included_service_keys],
    required_intake_fields: BASIC_REQUIRED_INTAKE_FIELDS,
    runtime_gates: [
      "website_lead_form_connected",
      "twilio_sms_webhook_verified",
      "twilio_voice_webhook_verified",
      "matched_sms_reply_stops_follow_up",
      "missed_call_text_back_sent",
      "duplicate_callsid_skipped",
      "sms_delivery_callback_verified",
      "resend_sender_verified",
    ],
  },
  growth: {
    package_key: growthOffer.package_key,
    package_name: growthOffer.name,
    service_keys: [...growthOffer.included_service_keys],
    required_intake_fields: GROWTH_REQUIRED_INTAKE_FIELDS,
    runtime_gates: [
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
  },
  pro: {
    package_key: proOffer.package_key,
    package_name: proOffer.name,
    service_keys: [...proOffer.included_service_keys],
    required_intake_fields: PRO_REQUIRED_INTAKE_FIELDS,
    runtime_gates: [
      "growth_package_gates_passed",
      "reactivation_target_segment_saved",
      "reactivation_message_template_saved",
      "reactivation_batch_simulated",
      "review_link_verified",
      "review_trigger_event_saved",
      "review_request_simulated",
      "provider_events_logged",
    ],
  },
};

export function getPackageCapabilities(packageTier = "basic") {
  const normalized = String(packageTier || "").trim().toLowerCase();
  if (["starter", "starter_system", "basic_website_plus_two_automations"].includes(normalized)) {
    return PACKAGE_CAPABILITY_MATRIX.basic;
  }
  if (["growth_system", "growth_website_plus_four_automations"].includes(normalized)) {
    return PACKAGE_CAPABILITY_MATRIX.growth;
  }
  if (["pro_system", "elite_system", "pro_website_plus_six_automations"].includes(normalized)) {
    return PACKAGE_CAPABILITY_MATRIX.pro;
  }
  return PACKAGE_CAPABILITY_MATRIX[normalized] || PACKAGE_CAPABILITY_MATRIX.basic;
}

export function getPackageTierForServiceKeys(serviceKeys = []) {
  const selected = new Set(serviceKeys);
  if (PACKAGE_CAPABILITY_MATRIX.pro.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return "pro";
  }
  if (PACKAGE_CAPABILITY_MATRIX.growth.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return "growth";
  }
  if (PACKAGE_CAPABILITY_MATRIX.basic.service_keys.every((serviceKey) => selected.has(serviceKey))) {
    return "basic";
  }
  return null;
}
