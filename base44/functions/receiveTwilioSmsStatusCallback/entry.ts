import { secureJson } from "../_shared/response.ts";
/**
 * Twilio SMS Delivery Status Callback
 * POST /api/receiveTwilioSmsStatusCallback
 *
 * Twilio calls this URL with delivery status updates for outbound SMS.
 * Updates the matching CommunicationEvent record with the final delivery status.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";

async function validateTwilioSignature(req, rawBody) {
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const providedWebhookKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && providedWebhookKey && webhookKey === providedWebhookKey) {
    console.log("[SmsStatusCallback] Twilio webhook key valid");
    return { valid: true, key_validated: true };
  }

  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!token) {
    console.error("[SmsStatusCallback] TWILIO_AUTH_TOKEN is not set — cannot validate signature");
    return { valid: false, missing_token: true };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    console.warn("[SmsStatusCallback] X-Twilio-Signature header missing");
    return { valid: false, missing_signature: true };
  }

  const originalUrl = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const detectedHost = forwardedHost || req.headers.get("host") || originalUrl.host;
  const host = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(detectedHost)
    ? "client-surge-systems-copy-a9653cae.base44.app"
    : detectedHost;
  const protocol = forwardedProto || originalUrl.protocol.replace(":", "");
  const url = `${protocol}://${host}${originalUrl.pathname}${originalUrl.search}`;
  const params = new URLSearchParams(rawBody);
  const toSign =
    url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

  const computed = crypto.createHmac("sha1", token).update(toSign).digest("base64");

  if (computed !== signature) {
    console.warn("[SmsStatusCallback] Signature mismatch — request rejected");
    return { valid: false };
  }

  return { valid: true };
}

// Map Twilio MessageStatus to our CommunicationEvent status
function mapTwilioStatus(twilioStatus) {
  switch (twilioStatus) {
    case "delivered":    return "delivered";
    case "failed":       return "failed";
    case "undelivered":  return "failed";
    case "sent":         return "sent";
    case "queued":
    case "accepted":
    case "sending":      return "pending";
    default:             return null; // unknown — skip update
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return secureJson({ error: "Method not allowed" }, { status: 405 });
  }

  // Read raw body before any parsing (required for signature validation)
  const rawBody = await req.text();

  // Validate Twilio signature
  const sigResult = await validateTwilioSignature(req, rawBody);
  if (sigResult.missing_token) {
    return secureJson({ error: "Server configuration error" }, { status: 500 });
  }
  if (!sigResult.valid) {
    return secureJson({ error: "Forbidden" }, { status: 403 });
  }

  const params = new URLSearchParams(rawBody);
  const messageSid    = params.get("MessageSid") || "";
  const messageStatus = params.get("MessageStatus") || "";
  const errorCode     = params.get("ErrorCode") || null;
  const errorMessage  = params.get("ErrorMessage") || null;
  const to            = params.get("To") || "";
  const from          = params.get("From") || "";

  console.log(`[SmsStatusCallback] SID=${messageSid} status=${messageStatus} errorCode=${errorCode || "none"}`);

  if (!messageSid) {
    return secureJson({ error: "Missing MessageSid" }, { status: 400 });
  }

  const mappedStatus = mapTwilioStatus(messageStatus);
  if (!mappedStatus) {
    // Unknown/transitional status — acknowledge but take no action
    console.log(`[SmsStatusCallback] Unrecognised status "${messageStatus}" for SID ${messageSid} — no update`);
    return secureJson({ status: "ok_noop" });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Find matching CommunicationEvent by provider_message_id
    const matches = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageSid },
      "-created_date",
      1
    );

    if (!matches || matches.length === 0) {
      console.warn(`[SmsStatusCallback] No CommunicationEvent found for SID ${messageSid}`);
      // Return 200 so Twilio does not keep retrying — we simply have no record to update
      return secureJson({ status: "ok_no_match" });
    }

    const event = matches[0];

    // Idempotency: skip if already at a terminal status
    const terminalStatuses = new Set(["delivered", "failed"]);
    if (terminalStatuses.has(event.status) && event.status === mappedStatus) {
      console.log(`[SmsStatusCallback] Already at terminal status "${event.status}" for SID ${messageSid} — skipping`);
      return secureJson({ status: "ok_idempotent" });
    }

    // Merge existing metadata with new status details
    let existingMeta = {};
    try { existingMeta = JSON.parse(event.metadata_json || "{}"); } catch (_) {}

    const updatedMeta = {
      ...existingMeta,
      twilio_delivery: {
        message_status: messageStatus,
        error_code: errorCode,
        error_message: errorMessage,
        to,
        from,
        updated_at: new Date().toISOString(),
      },
    };

    await base44.asServiceRole.entities.CommunicationEvent.update(event.id, {
      status: mappedStatus,
      error_message: errorCode ? `Twilio ${messageStatus} (code ${errorCode}): ${errorMessage || ""}` : (mappedStatus === "delivered" ? null : event.error_message),
      metadata_json: JSON.stringify(updatedMeta),
    });

    console.log(`[SmsStatusCallback] Updated CommunicationEvent ${event.id} → status=${mappedStatus} (SID=${messageSid})`);
    return secureJson({ status: "ok_updated", event_id: event.id, mapped_status: mappedStatus });

  } catch (error) {
    console.error(`[SmsStatusCallback] Error processing SID ${messageSid}: ${error.message}`);
    // Return 500 so Twilio knows to retry (genuine processing failure)
    return secureJson({ error: error.message }, { status: 500 });
  }
});
