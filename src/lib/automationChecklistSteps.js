// Automation checklist step definitions for each service
//
// IMPORTANT: This file is the frontend source of truth for checklist step templates.
// A mirror of CHECKLIST_STEPS_BY_SERVICE is inlined in functions/initializeInstallOS
// because Base44 Deno functions cannot import frontend lib files.
// When editing steps here, update the inlined copy in initializeInstallOS too.
//
// Bump this version constant (and the copy in functions/initializeInstallOS)
// whenever step content changes so any drift is immediately visible in backend logs.
export const CHECKLIST_TEMPLATE_VERSION = "2026-04-29-v1";

export const CHECKLIST_STEPS_BY_SERVICE = {
  instant_lead_response: [
    { id: "lead_form_connected", label: "Lead form connected", order: 1 },
    { id: "phone_field_validated", label: "Phone field validated", order: 2 },
    { id: "twilio_number_assigned", label: "Twilio number assigned", order: 3 },
    { id: "sms_template_configured", label: "SMS template configured", order: 4 },
    { id: "function_active", label: "sendInstantLeadResponseSms active", order: 5 },
    { id: "test_lead_submitted", label: "Test lead submitted", order: 6 },
    { id: "sms_received", label: "SMS received", order: 7 },
    { id: "email_received", label: "Email received", order: 8 },
    { id: "event_logged", label: "CommunicationEvent logged", order: 9 },
    { id: "duplicate_prevention", label: "Duplicate prevention verified", order: 10 },
  ],
  missed_call_text_back: [
    { id: "twilio_configured", label: "Twilio configured for inbound", order: 1 },
    { id: "missed_call_webhook", label: "Missed call webhook registered", order: 2 },
    { id: "sms_template_configured", label: "SMS template configured", order: 3 },
    { id: "initial_sms_sent", label: "Initial SMS sent within 2 min", order: 4 },
    { id: "followup_2min_sent", label: "Follow-up SMS #2 sent (2 min)", order: 5 },
    { id: "followup_1hr_sent", label: "Follow-up SMS #3 sent (1 hr)", order: 6 },
    { id: "followup_24hr_sent", label: "Follow-up SMS #4 sent (24 hr)", order: 7 },
    { id: "event_logging_verified", label: "Event logging verified", order: 8 },
  ],
  nurture_sequence_14d: [
    { id: "resend_configured", label: "Resend configured", order: 1 },
    { id: "email_templates_created", label: "Email templates created (8 steps)", order: 2 },
    { id: "sequence_timing_set", label: "Sequence timing set", order: 3 },
    { id: "test_lead_enrolled", label: "Test lead enrolled", order: 4 },
    { id: "day0_sent", label: "Day 0 welcome email sent", order: 5 },
    { id: "day3_sent", label: "Day 3 email sent", order: 6 },
    { id: "day7_sent", label: "Day 7 email sent", order: 7 },
    { id: "day14_final_sent", label: "Day 14 final email sent", order: 8 },
    { id: "event_logging_verified", label: "Event logging verified", order: 9 },
  ],
  ai_booking_agent: [
    { id: "booking_link_set", label: "Booking link provided", order: 1 },
    { id: "booking_mode_configured", label: "Booking mode configured", order: 2 },
    { id: "confirmation_template_set", label: "Confirmation template configured", order: 3 },
    { id: "test_booking_created", label: "Test booking created", order: 4 },
    { id: "booking_confirmation_sent", label: "Booking confirmation sent", order: 5 },
    { id: "reminder_enabled", label: "Reminder enabled (if applicable)", order: 6 },
    { id: "intake_fields_configured", label: "Intake fields configured", order: 7 },
    { id: "event_logging_verified", label: "Event logging verified", order: 8 },
  ],
  lead_reactivation: [
    { id: "old_lead_list_provided", label: "Old lead list provided", order: 1 },
    { id: "target_segment_defined", label: "Target segment defined", order: 2 },
    { id: "reactivation_template_set", label: "Reactivation message template set", order: 3 },
    { id: "batch_size_configured", label: "Batch size configured", order: 4 },
    { id: "test_batch_sent", label: "Test batch sent", order: 5 },
    { id: "responses_monitored", label: "Responses monitored", order: 6 },
    { id: "event_logging_verified", label: "Event logging verified", order: 7 },
  ],
  review_request: [
    { id: "review_link_provided", label: "Review link provided", order: 1 },
    { id: "trigger_event_defined", label: "Trigger event defined", order: 2 },
    { id: "review_template_set", label: "Review request template set", order: 3 },
    { id: "channel_selected", label: "Channel selected (SMS/Email)", order: 4 },
    { id: "send_delay_configured", label: "Send delay configured", order: 5 },
    { id: "test_review_request_sent", label: "Test review request sent", order: 6 },
    { id: "event_logging_verified", label: "Event logging verified", order: 7 },
  ],
};

export const getStepsForService = (serviceKey) => {
  return CHECKLIST_STEPS_BY_SERVICE[serviceKey] || [];
};

export const getStepLabel = (serviceKey, stepId) => {
  const steps = getStepsForService(serviceKey);
  const step = steps.find((s) => s.id === stepId);
  return step ? step.label : stepId;
};