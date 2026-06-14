/**
 * Automation Event Logging
 * Logs validation errors, webhook processing, and system status to AutomationEventLog
 */

/**
 * Log a webhook validation error
 */
export async function logValidationError(base44, { provider, webhook_path, error_code, error_message, payload_preview }) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "webhook",
      direction: "inbound",
      event_type: "webhook_validation_failed",
      provider: provider,
      status: "failed",
      subject: `[${provider.toUpperCase()}] Webhook Validation Failed`,
      message_body: `Error: ${error_message}\nCode: ${error_code}\nEndpoint: ${webhook_path}`,
      error_message: error_message,
      metadata_json: JSON.stringify({
        error_code,
        webhook_path,
        payload_preview,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (logError) {
    console.error("[automationLogger] Failed to log validation error:", logError.message);
  }
}

/**
 * Log successful webhook processing
 */
export async function logWebhookProcessed(base44, { provider, event_type, lead_id, status, metadata }) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      channel: "webhook",
      direction: "inbound",
      event_type: event_type,
      provider: provider,
      status: status,
      subject: `[${provider.toUpperCase()}] ${event_type}`,
      metadata_json: JSON.stringify({
        ...metadata,
        processed_at: new Date().toISOString(),
      }),
    });
  } catch (logError) {
    console.error("[automationLogger] Failed to log webhook processed:", logError.message);
  }
}

/**
 * Log webhook processing error (catch-all for runtime errors)
 */
export async function logWebhookError(base44, { provider, webhook_path, error, lead_id, stage }) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      channel: "webhook",
      direction: "inbound",
      event_type: "webhook_processing_error",
      provider: provider,
      status: "failed",
      subject: `[${provider.toUpperCase()}] Processing Error at ${stage}`,
      message_body: `${error.message}`,
      error_message: error.message,
      metadata_json: JSON.stringify({
        stage,
        webhook_path,
        error_stack: error.stack?.split("\n").slice(0, 3).join("\n") || "",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (logError) {
    console.error("[automationLogger] Failed to log webhook error:", logError.message);
  }
}