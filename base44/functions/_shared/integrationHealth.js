import {
  PROVIDER_DEPLOYMENT_STATUS,
  PROVIDER_PROOF_MODE,
  PROVIDER_PROOF_WINDOW_MS,
} from "./providerProof.js";

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
  return (
    metadata?.context_type === "provider_test" &&
    (metadata?.integration_id === definition.id ||
      (definition.id === "resend" && metadata?.integration_id === "email"))
  );
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
  const latestProviderTest = providerEvents.find((event) => {
    const metadata = parseMetadataJson(event.metadata_json);
    return (
      metadata?.context_type === "provider_test" &&
      (metadata?.integration_id === definition.id ||
        (definition.id === "resend" && metadata?.integration_id === "email"))
    );
  }) || null;
  const latestLiveProof = providerEvents.find((event) => {
    const metadata = parseMetadataJson(event.metadata_json);
    const withinWindow = event.created_date
      ? Date.now() - new Date(event.created_date).getTime() <= PROVIDER_PROOF_WINDOW_MS
      : false;
    if (!withinWindow) {
      return false;
    }

    if (metadata?.context_type === "provider_callback" && metadata?.callback_provider === definition.id) {
      return true;
    }

    if (metadata?.context_type === "provider_proof" && metadata?.proof_mode === PROVIDER_PROOF_MODE.LIVE) {
      if (definition.id === "webhook" && metadata?.proof_kind === "lead_ingestion_webhook") {
        return true;
      }
      return definition.providers.includes(event.provider);
    }

    const runtimeType = typeof metadata?.runtime_type === "string" ? metadata.runtime_type : "";
    return definition.providers.includes(event.provider) && runtimeType.startsWith("live_provider_proof");
  }) || null;
  const latestCallback = providerEvents.find((event) => {
    const metadata = parseMetadataJson(event.metadata_json);
    return metadata?.context_type === "provider_callback" && metadata?.callback_provider === definition.id;
  }) || null;
  const configured = definition.isConfigured(settings);

  let derivedStatus = PROVIDER_DEPLOYMENT_STATUS.UNAVAILABLE;
  let statusLabel = "Unavailable";
  let statusReason = "No trustworthy health signal is currently available.";

  if (!configured) {
    derivedStatus = PROVIDER_DEPLOYMENT_STATUS.NOT_CONFIGURED;
    statusLabel = "Not Configured";
    statusReason = definition.missingConfiguration(settings).join(". ");
  } else if (latestFailure && (!latestLiveProof || toIsoOrNull(latestFailure.created_date) >= toIsoOrNull(latestLiveProof.created_date))) {
    derivedStatus = PROVIDER_DEPLOYMENT_STATUS.FAILED;
    statusLabel = "Failed";
    statusReason = latestFailure.error_message || "Most recent tracked proof activity failed.";
  } else if (latestLiveProof) {
    derivedStatus = PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED;
    statusLabel = "Live Provider Proofed";
    statusReason = latestCallback
      ? "A recent real provider proof and callback activity were recorded."
      : "A recent real provider proof event was recorded.";
  } else if (latestProviderTest && isSuccessStatus(latestProviderTest.status)) {
    derivedStatus = PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED;
    statusLabel = "Test Wired";
    statusReason = "A provider wiring test exists, but no recent live provider proof is recorded.";
  } else {
    derivedStatus = PROVIDER_DEPLOYMENT_STATUS.CONFIGURED;
    statusLabel = "Configured";
    statusReason = "Configured with no recent live provider proof.";
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
    latest_test_wired_at: toIsoOrNull(latestProviderTest?.created_date),
    latest_live_proof_at: toIsoOrNull(latestLiveProof?.created_date),
    latest_callback_at: toIsoOrNull(latestCallback?.created_date),
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
