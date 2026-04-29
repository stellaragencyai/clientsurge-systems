/**
 * Derives integration health status from admin settings and communication events
 */
export function deriveIntegrationHealth({ settings = {}, events = [] }) {
  const integrations = [];

  // Twilio SMS
  integrations.push({
    id: "twilio",
    name: "Twilio SMS",
    derived_status: settings.twilio_enabled ? "healthy" : "unavailable",
    status_label: settings.twilio_enabled ? "Connected" : "Not Configured",
    status_reason: settings.twilio_enabled
      ? "Twilio is configured and ready"
      : "Twilio credentials not set up",
    missing_configuration: !settings.twilio_account_sid_present || !settings.twilio_auth_token_present
      ? ["Account SID", "Auth Token"]
      : [],
    latest_activity_at: getLatestActivityFor(events, "twilio"),
    recent_failure_count: countRecentFailures(events, "twilio"),
  });

  // Resend Email
  integrations.push({
    id: "resend",
    name: "Resend Email",
    derived_status: settings.resend_enabled ? "healthy" : "unavailable",
    status_label: settings.resend_enabled ? "Connected" : "Not Configured",
    status_reason: settings.resend_enabled
      ? "Resend is configured and ready"
      : "Resend API key not set up",
    missing_configuration: !settings.resend_enabled ? ["API Key"] : [],
    latest_activity_at: getLatestActivityFor(events, "resend"),
    recent_failure_count: countRecentFailures(events, "resend"),
  });

  // Stripe
  integrations.push({
    id: "stripe",
    name: "Stripe Payments",
    derived_status: settings.stripe_enabled ? "healthy" : "unavailable",
    status_label: settings.stripe_enabled ? "Connected" : "Not Configured",
    status_reason: settings.stripe_enabled
      ? "Stripe is configured and ready"
      : "Stripe keys not set up",
    missing_configuration: !settings.stripe_enabled ? ["Secret Key", "Publishable Key"] : [],
    latest_activity_at: getLatestActivityFor(events, "stripe"),
    recent_failure_count: countRecentFailures(events, "stripe"),
  });

  // Aggregate system stats
  const recentEvents = events.slice(0, 50);
  const successCount = recentEvents.filter(
    (e) => e.status === "sent" || e.status === "delivered" || e.status === "processed"
  ).length;
  const failureCount = recentEvents.filter((e) => e.status === "failed").length;
  const totalCount = successCount + failureCount;

  return {
    integrations,
    recent_activity: recentEvents,
    system: {
      uptime: {
        available: true,
        label: "Operational",
        reason: "All core services operational",
      },
      messages_tracked: recentEvents.length,
      successful_activity_count: successCount,
      failed_activity_count: failureCount,
      success_rate_percent: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : null,
    },
  };
}

function getLatestActivityFor(events, provider) {
  const event = events.find((e) => e.provider === provider);
  return event?.created_date || null;
}

function countRecentFailures(events, provider) {
  return events
    .filter((e) => e.provider === provider && e.status === "failed")
    .slice(0, 10).length;
}