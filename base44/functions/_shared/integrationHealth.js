const SUCCESS_STATUSES = new Set(["sent", "delivered", "processed", "opened", "received"]);

export const PROVIDER_DEFINITIONS = [
  {
    id: "twilio",
    name: "Twilio SMS",
    providers: ["twilio"],
    isConfigured: (settings) => Boolean(settings?.twilio_enabled && settings?.twilio_from_number),
    missingConfiguration: (settings) => {
      const missing = [];
      if (!settings?.twilio_enabled) {
        missing.push("Twilio is disabled");
      }
      if (!settings?.twilio_from_number) {
        missing.push("Twilio from number missing");
      }
      return missing;
    },
  },
  {
    id: "resend",
    name: "Resend Email",
    providers: ["resend", "gmail"],
    isConfigured: (settings) =>
      Boolean(
        (settings?.resend_enabled && settings?.resend_from_email) ||
          (settings?.gmail_enabled && settings?.gmail_from_email)
      ),
    missingConfiguration: (settings) => {
      const missing = [];
      if (!settings?.resend_enabled && !settings?.gmail_enabled) {
        missing.push("No email provider enabled");
      }
      if (settings?.resend_enabled && !settings?.resend_from_email) {
        missing.push("Resend from email missing");
      }
      if (settings?.gmail_enabled && !settings?.gmail_from_email) {
        missing.push("Gmail from email missing");
      }
      return missing;
    },
  },
  {
    id: "webhook",
    name: "Webhook Delivery",
    providers: ["zapier", "n8n"],
    isConfigured: (settings) => Boolean(settings?.webhook_enabled && settings?.webhook_url),
    missingConfiguration: (settings) => {
      const missing = [];
      if (!settings?.webhook_enabled) {
        missing.push("Webhook delivery is disabled");
      }
      if (!settings?.webhook_url) {
        missing.push("Webhook URL missing");
      }
      return missing;
    },
  },
];

export function isSuccessStatus(status) {
  return SUCCESS_STATUSES.has(status);
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

function eventMatchesDefinition(event, definition) {
  if (definition.providers.includes(event.provider)) {
    return true;
  }

  const metadata = parseMetadataJson(event.metadata_json);
  return metadata?.context_type === "provider_test" && metadata?.integration_id === definition.id;
}

function isHealthRelevantEvent(event) {
  if (PROVIDER_DEFINITIONS.some((definition) => definition.providers.includes(event.provider))) {
    return true;
  }

  const metadata = parseMetadataJson(event.metadata_json);
  return metadata?.context_type === "provider_test";
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function summarizeProvider(definition, settings, events) {
  const providerEvents = events.filter((event) => eventMatchesDefinition(event, definition));
  const latestEvent = providerEvents[0] || null;
  const latestSuccess = providerEvents.find((event) => isSuccessStatus(event.status)) || null;
  const latestFailure = providerEvents.find((event) => event.status === "failed") || null;
  const configured = definition.isConfigured(settings);

  let derivedStatus = "unavailable";
  let statusLabel = "Unavailable";
  let statusReason = "No trustworthy health signal is currently available.";

  if (!configured) {
    derivedStatus = "disabled";
    statusLabel = "Disabled";
    statusReason = definition.missingConfiguration(settings).join(". ");
  } else if (latestEvent?.status === "failed") {
    derivedStatus = "error";
    statusLabel = "Error";
    statusReason = latestEvent.error_message || "Most recent tracked activity failed.";
  } else if (latestEvent) {
    derivedStatus = "healthy";
    statusLabel = "Healthy";
    statusReason = "Most recent tracked activity succeeded.";
  } else {
    derivedStatus = "configured";
    statusLabel = "Configured";
    statusReason = "Configured with no recent tracked delivery activity.";
  }

  return {
    id: definition.id,
    name: definition.name,
    derived_status: derivedStatus,
    status_label: statusLabel,
    status_reason: statusReason,
    configured,
    missing_configuration: definition.missingConfiguration(settings),
    latest_activity_at: toIsoOrNull(latestEvent?.created_date),
    latest_success_at: toIsoOrNull(latestSuccess?.created_date),
    latest_failure_at: toIsoOrNull(latestFailure?.created_date),
    recent_activity_count: providerEvents.length,
    recent_failure_count: providerEvents.filter((event) => event.status === "failed").length,
  };
}

export function deriveIntegrationHealth({ settings, events }) {
  const normalizedEvents = Array.isArray(events) ? [...events] : [];
  normalizedEvents.sort(
    (a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
  );

  const relevantEvents = normalizedEvents.filter((event) => isHealthRelevantEvent(event));
  const trackedCount = relevantEvents.length;
  const successfulCount = relevantEvents.filter((event) => isSuccessStatus(event.status)).length;
  const failedCount = relevantEvents.filter((event) => event.status === "failed").length;

  return {
    integrations: PROVIDER_DEFINITIONS.map((definition) =>
      summarizeProvider(definition, settings, normalizedEvents)
    ),
    recent_activity: relevantEvents.map((event) => ({
      id: event.id,
      created_date: event.created_date,
      event_type: event.event_type,
      provider: event.provider,
      status: event.status,
      subject: event.subject,
      error_message: event.error_message,
      message_body: event.message_body,
    })),
    system: {
      uptime: {
        available: false,
        label: "Unavailable",
        reason: "System uptime is not yet derived from a canonical backend source.",
      },
      messages_tracked: trackedCount,
      successful_activity_count: successfulCount,
      failed_activity_count: failedCount,
      success_rate_percent: trackedCount > 0 ? Math.round((successfulCount / trackedCount) * 100) : null,
    },
  };
}
