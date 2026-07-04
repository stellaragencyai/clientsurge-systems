/**
 * TWILIO INBOUND SMS WEBHOOK HANDLER — REPAIRED
 *
 * Sprint 1 fixes:
 *   1. Signature validation repaired: uses TWILIO_AUTH_TOKEN with proper HMAC-SHA1 (was broken SHA1)
 *   2. GET health probe returns 200 so route health checks succeed (was 405)
 *   3. WebhookRegistration tracking for route health visibility
 *   4. Signature failures logged clearly, not silently broken
 *
 * Architecture: Worker → CommunicationEvent → Leads
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import crypto from "node:crypto";

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  return phone;
}

/**
 * Proper Twilio signature validation.
 * Twilio computes HMAC-SHA1 of (url + sorted_params) using TWILIO_AUTH_TOKEN as key.
 * Also supports TWILIO_WEBHOOK_KEY query-param bypass for internal testing.
 */
async function validateTwilioSignature(req, rawBody) {
  // Fallback: shared webhook key via query param
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const providedKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && providedKey && webhookKey === providedKey) {
    return { valid: true, method: "webhook_key" };
  }

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) {
    console.error("[InboundSms] TWILIO_AUTH_TOKEN not set — cannot validate signature");
    return { valid: false, reason: "missing_auth_token" };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    console.warn("[InboundSms] X-Twilio-Signature header missing");
    return { valid: false, reason: "missing_signature" };
  }

  // Reconstruct the URL Twilio signed (handle proxy headers)
  const originalUrl = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const detectedHost = forwardedHost || req.headers.get("host") || originalUrl.host;
  const host = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(detectedHost)
    ? "client-surge-systems-copy-a9653cae.base44.app"
    : detectedHost;
  const protocol = forwardedProto || originalUrl.protocol.replace(":", "");
  const url = `${protocol}://${host}${originalUrl.pathname}${originalUrl.search}`;

  // Build the string to sign: url + sorted params concatenated
  const params = new URLSearchParams(rawBody);
  const toSign = url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

  const computed = crypto.createHmac("sha1", authToken).update(toSign).digest("base64");

  if (computed !== signature) {
    console.warn("[InboundSms] Signature mismatch — request rejected", {
      computed_prefix: computed.substring(0, 8),
      provided_prefix: signature.substring(0, 8),
    });
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true, method: "hmac" };
}

async function updateWebhookRegistration(base44, sourceName, status, error) {
  try {
    const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { source_name: sourceName },
      "-created_date",
      1
    );
    const now = new Date().toISOString();
    if (regs?.length > 0) {
      await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, {
        last_triggered_at: now,
        last_error: error || null,
        status,
      });
    }
  } catch (err) {
    console.warn(`[InboundSms] WebhookRegistration update failed for ${sourceName}:`, err?.message);
  }
}

Deno.serve(async (req) => {
  try {
    // GET health probe — allows route health checks without processing messages
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.get("_health") === "true" || !url.searchParams.get("Body")) {
        return Response.json(
          { status: "ok", route: "receiveTwilioInboundSms", method: "GET_probe" },
          { status: 200 }
        );
      }
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    // Validate Twilio signature before processing
    const sigResult = await validateTwilioSignature(req, rawBody);
    if (sigResult.missing_auth_token) {
      await updateWebhookRegistration(base44, "twilio_sms", "error", "TWILIO_AUTH_TOKEN not set");
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }
    if (!sigResult.valid) {
      console.warn("[InboundSms] Request rejected:", sigResult.reason);
      await updateWebhookRegistration(base44, "twilio_sms", "error", `Signature validation failed: ${sigResult.reason}`);
      return Response.json(
        { error: "Forbidden", reason: sigResult.missing_signature ? "missing_signature" : "invalid_signature" },
        { status: 403 }
      );
    }

    // Parse body
    const params = new URLSearchParams(rawBody);
    const from = normalizePhone(params.get("From"));
    const to = params.get("To");
    const message = params.get("Body");
    const messageId = params.get("MessageSid");

    if (!from || !message || !messageId) {
      await updateWebhookRegistration(base44, "twilio_sms", "error", "Missing required fields");
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Idempotency guard: check if this MessageSid was already processed
    const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageId, event_type: "sms_received" },
      "-created_date",
      1
    );
    if (existingEvents && existingEvents.length > 0) {
      console.log(`[InboundSms] Duplicate MessageSid ${messageId} — already processed`);
      await updateWebhookRegistration(base44, "twilio_sms", "active", null);
      return Response.json({ received: true, matched: true, duplicate: true });
    }

    // Find lead by normalized phone number
    const allLeads = await base44.asServiceRole.entities.WebsiteLead.list("-created_date", 1000);
    const lead = allLeads.find((l) => {
      const normalizedLeadPhone = normalizePhone(l.phone_number);
      return normalizedLeadPhone === from;
    });

    if (!lead) {
      // Log unmatched inbound SMS as a CommunicationEvent for visibility
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_type: "inbound_sms_unmatched",
        channel: "sms",
        direction: "inbound",
        event_type: "sms_received",
        provider: "twilio",
        status: "unmatched",
        subject: `[TWILIO SMS] Unmatched inbound from ${from}`,
        message_body: message,
        provider_message_id: messageId,
        metadata_json: JSON.stringify({
          from,
          to,
          message_sid: messageId,
          timestamp: new Date().toISOString(),
          trigger: "inbound_sms_webhook",
          matched_website_lead_id: null,
        }),
      });
      await updateWebhookRegistration(base44, "twilio_sms", "active", null);
      return Response.json({ received: true, matched: false });
    }

    // Log the SMS
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      context_type: "website_lead",
      context_id: lead.id,
      channel: "sms",
      direction: "inbound",
      event_type: "sms_received",
      provider: "twilio",
      status: "received",
      subject: `[TWILIO SMS] Reply from ${from}`,
      message_body: message,
      provider_message_id: messageId,
      metadata_json: JSON.stringify({
        from,
        to,
        message_sid: messageId,
        timestamp: new Date().toISOString(),
        trigger: "inbound_sms_webhook",
        matched_website_lead_id: lead.id,
        automation_stopped: true,
      }),
    });

    // Update lead status
    await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
      reply_status: "responded",
      lead_status: "responded",
      last_engagement_type: "sms",
      last_engagement_at: new Date().toISOString(),
      last_message_sent: new Date().toISOString(),
      automation_enabled: false,
    });

    await updateWebhookRegistration(base44, "twilio_sms", "active", null);
    console.log(`[InboundSms] SMS received from ${from} (lead: ${lead.id})`);

    return Response.json({ received: true, matched: true, lead_id: lead.id });
  } catch (error) {
    console.error("[InboundSms] Handler error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return Response.json({ error: "An error occurred processing your request." }, { status: 500 });
  }
});