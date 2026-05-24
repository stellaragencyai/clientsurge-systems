/**
 * OrderTrackerStages — #199
 * Correct install stage definitions for all service types.
 * Used by OrderTracker component in ClientPortal.
 */

export const INSTALL_STAGES = {
  starter: [
    { key: "order_confirmed",        label: "Order Confirmed",          icon: "✅" },
    { key: "credentials_received",   label: "Credentials Received",     icon: "🔑" },
    { key: "twilio_configured",      label: "Twilio SMS Configured",    icon: "📱" },
    { key: "instant_response_built", label: "Instant Response Built",   icon: "⚡" },
    { key: "missed_call_textback",   label: "Missed Call Text-Back",    icon: "📞" },
    { key: "end_to_end_tested",      label: "Tested & Verified",        icon: "🧪" },
    { key: "went_live",              label: "System Live",              icon: "🚀" },
  ],
  growth: [
    { key: "order_confirmed",         label: "Order Confirmed",          icon: "✅" },
    { key: "credentials_received",    label: "Credentials Received",     icon: "🔑" },
    { key: "twilio_configured",       label: "Twilio SMS Configured",    icon: "📱" },
    { key: "instant_response_built",  label: "Instant Response Built",   icon: "⚡" },
    { key: "missed_call_textback",    label: "Missed Call Text-Back",    icon: "📞" },
    { key: "followup_sequence_built", label: "Follow-Up Sequences Built", icon: "🔁" },
    { key: "appointment_booking_ai",  label: "Booking AI Configured",    icon: "📅" },
    { key: "end_to_end_tested",       label: "Tested & Verified",        icon: "🧪" },
    { key: "went_live",               label: "System Live",              icon: "🚀" },
  ],
  elite: [
    { key: "order_confirmed",         label: "Order Confirmed",          icon: "✅" },
    { key: "credentials_received",    label: "Credentials Received",     icon: "🔑" },
    { key: "twilio_configured",       label: "Twilio SMS Configured",    icon: "📱" },
    { key: "instant_response_built",  label: "Instant Response Built",   icon: "⚡" },
    { key: "missed_call_textback",    label: "Missed Call Text-Back",    icon: "📞" },
    { key: "followup_sequence_built", label: "Follow-Up Sequences Built", icon: "🔁" },
    { key: "appointment_booking_ai",  label: "Booking AI Configured",    icon: "📅" },
    { key: "review_request_ai",       label: "Review Request AI",        icon: "⭐" },
    { key: "reactivation_campaign",   label: "Reactivation Campaign",    icon: "🚀" },
    { key: "messages_customized",     label: "Messages Customized",      icon: "✍️" },
    { key: "end_to_end_tested",       label: "Tested & Verified",        icon: "🧪" },
    { key: "went_live",               label: "System Live",              icon: "🚀" },
  ],
};

export function getStagesForPackage(package_key) {
  return INSTALL_STAGES[package_key] || INSTALL_STAGES.starter;
}
