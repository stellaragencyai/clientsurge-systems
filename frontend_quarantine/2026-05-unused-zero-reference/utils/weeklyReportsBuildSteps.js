/**
 * weeklyReportsBuildSteps.js — #313
 * Canonical BUILD_STEPS keys that match ClientInstallationOS entity fields exactly.
 * Import into WeeklyReports.jsx to ensure keys align.
 */

export const BUILD_STEPS = {
  order_confirmed:          { label: "Order Confirmed",            field: "order_confirmed" },
  credentials_received:     { label: "Credentials Received",       field: "credentials_received" },
  twilio_configured:        { label: "Twilio Configured",          field: "twilio_configured" },
  lead_sources_connected:   { label: "Lead Sources Connected",     field: "lead_sources_connected" },
  instant_response_built:   { label: "Instant Response Built",     field: "instant_response_built" },
  followup_sequence_built:  { label: "Follow-Up Sequences Built",  field: "followup_sequence_built" },
  missed_call_textback:     { label: "Missed Call Text-Back",      field: "missed_call_textback" },
  messages_customized:      { label: "Messages Customized",        field: "messages_customized" },
  end_to_end_tested:        { label: "Tested & Verified",          field: "end_to_end_tested" },
  dashboard_delivered:      { label: "Dashboard Delivered",        field: "dashboard_delivered" },
  went_live:                { label: "System Live",                field: "went_live" },
};

// All keys verified to match ClientInstallationOS entity schema
export const BUILD_STEP_KEYS = Object.keys(BUILD_STEPS);
