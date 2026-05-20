export const PACKAGE_CAPABILITY_MATRIX = {
  basic: {
    package_key: "basic_website_plus_two_automations",
    package_name: "Website Redesign + Instant Lead Response + Missed Call Text-Back",
    service_keys: ["instant_lead_response", "missed_call_text_back"],
    required_intake_fields: [
      "business_name",
      "business_phone",
      "business_hours",
      "booking_link",
      "brand_voice",
      "services",
    ],
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
    package_key: "growth_website_plus_four_automations",
    package_name: "Website Redesign + Instant Response + Missed Call + 14-Day Nurture + AI Booking Agent",
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
    package_key: "pro_website_plus_six_automations",
    package_name: "Website Redesign + Full Six-Automation Stack",
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
  return PACKAGE_CAPABILITY_MATRIX[packageTier] || PACKAGE_CAPABILITY_MATRIX.basic;
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
