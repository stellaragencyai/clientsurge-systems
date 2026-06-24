import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function redactSecrets(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, "$1[REDACTED]")
    .replace(/(Basic\s+)[A-Za-z0-9+/=]+/gi, "$1[REDACTED]")
    .replace(/re_[A-Za-z0-9]{8,}/gi, "[REDACTED]")
    .replace(/SK[A-Za-z0-9]{20,}/g, "[REDACTED]")
    .replace(/AC[a-f0-9]{32}/gi, "[REDACTED]")
    .replace(/"(api[_-]?key|token|secret|auth|password)"\s*:\s*"[^"]*"/gi, '"$1":"[REDACTED]"')
    .slice(0, 2000);
}

function detectEnvironment(req) {
  try {
    const url = new URL(req.url);
    if (url.hostname.includes("preview") || url.hostname.includes("sandbox")) return "preview";
  } catch (_) {}
  return "production";
}

/**
 * Reject synthetic / placeholder provider message IDs.
 * Real Twilio SIDs start with "SM" followed by ~32 hex chars.
 * Real Resend IDs are UUID-like strings.
 */
const SYNTHETIC_ID_PATTERNS = [
  /^SM_TEST/i,
  /^TEST_/i,
  /^demo_/i,
  /^mock_/i,
  /^placeholder_/i,
  /^fake_/i,
  /^test-lead-id$/i,
  /^TEST_EMAIL_ID$/i,
];

function isSyntheticId(id) {
  if (!id || typeof id !== "string") return false;
  return SYNTHETIC_ID_PATTERNS.some((pattern) => pattern.test(id.trim()));
}

/**
 * Standalone communication logging function.
 * Called by other backend functions via base44.functions.invoke('logCommunication', {...}).
 *
 * Creates a CommunicationLog record and optionally updates WebsiteLead tracking fields.
 * Non-blocking: always returns success even if logging fails.
 *
 * Rejects synthetic provider_message_id values to prevent fake "sent" logs.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const now = new Date().toISOString();
    const ds = payload.delivery_status || "unknown";

    // ── Reject synthetic provider IDs for "sent" status ──
    // If the caller passes a fake ID with delivery_status=sent/queued, downgrade to "failed"
    let effectiveStatus = ds;
    let effectiveError = payload.error_message || null;
    if (
      isSyntheticId(payload.provider_message_id) &&
      (ds === "sent" || ds === "queued" || ds === "delivered")
    ) {
      effectiveStatus = "failed";
      effectiveError = `Synthetic provider_message_id rejected: "${payload.provider_message_id}". Real provider calls must capture actual IDs.`;
    }

    // Create CommunicationLog record
    const created = await base44.asServiceRole.entities.CommunicationLog.create({
      related_entity_type: payload.related_entity_type || null,
      related_entity_id: payload.related_entity_id || null,
      lead_email: payload.lead_email || null,
      lead_phone: payload.lead_phone || null,
      canonical_to_address: payload.canonical_to_address || payload.to_address || null,
      lead_name: payload.lead_name || null,
      channel: payload.channel || "system",
      provider: payload.provider || "internal",
      direction: payload.direction || "outbound",
      trigger_name: payload.trigger_name || "unknown",
      template_name: payload.template_name || null,
      to_address: payload.to_address || null,
      from_address: payload.from_address || null,
      subject: payload.subject || null,
      body_preview: (payload.body_preview || "").slice(0, 500),
      provider_message_id: isSyntheticId(payload.provider_message_id) ? null : (payload.provider_message_id || null),
      provider_status: payload.provider_status || null,
      delivery_status: effectiveStatus,
      error_code: payload.error_code || null,
      error_message: effectiveError,
      request_payload_redacted: redactSecrets(payload.request_payload || ""),
      response_payload_redacted: redactSecrets(payload.response_payload || ""),
      sent_at: effectiveStatus === "sent" || effectiveStatus === "queued" ? now : null,
      delivered_at: effectiveStatus === "delivered" ? now : null,
      failed_at: effectiveStatus === "failed" ? now : null,
      environment: payload.environment || detectEnvironment(req),
    });

    // Update WebsiteLead tracking only when provider accepted the message
    if (
      !payload.skip_lead_update &&
      payload.related_entity_type === "WebsiteLead" &&
      payload.related_entity_id &&
      (effectiveStatus === "sent" || effectiveStatus === "queued")
    ) {
      const updateData = {
        last_message_sent: now,
        last_engagement_at: now,
      };

      if (payload.channel === "sms") {
        updateData.sms_attempt_count = (payload.current_sms_count || 0) + 1;
        updateData.last_engagement_type = "sms";
      } else if (payload.channel === "email") {
        updateData.email_attempt_count = (payload.current_email_count || 0) + 1;
        updateData.last_engagement_type = "email";
      }

      if (!payload.initial_response_already_sent) {
        updateData.initial_response_sent_at = now;
      }

      await base44.asServiceRole.entities.WebsiteLead.update(
        payload.related_entity_id,
        updateData
      ).catch((e) => {
        console.warn("[logCommunication] WebsiteLead update failed:", e.message);
      });
    }

    return json({ success: true, log_id: created?.id || null });
  } catch (error) {
    console.warn("[logCommunication] Error:", error.message);
    return json({ success: false, error: error.message }, 200); // Return 200 so callers don't break
  }
});