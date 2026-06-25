/**
 * Twilio SMS Delivery Status Callback
 * 
 * Handles delivery status updates from Twilio for outbound SMS.
 * Accepts form-encoded, JSON, and query-string payloads.
 * 
 * KEY DESIGN: Always returns 200. Never triggers fallback SMS alerts.
 * Malformed/probe requests are logged silently, not escalated.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import crypto from "node:crypto";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── FIELD NORMALIZATION ────────────────────────────────────────────

/**
 * Extract MessageSid from any of the field names Twilio or probes may use.
 * Priority: MessageSid > SmsSid > SmsMessageSid
 * Searches: body (form or JSON), then URL query params.
 */
function normalizeMessageSid(body, query) {
  const bodyFields = typeof body === "object" && body !== null ? body : {};
  const candidates = [
    bodyFields.MessageSid, bodyFields.SmsSid, bodyFields.SmsMessageSid,
    query?.MessageSid, query?.SmsSid, query?.SmsMessageSid,
  ];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return null;
}

function normalizeMessageStatus(body, query) {
  const bodyFields = typeof body === "object" && body !== null ? body : {};
  const candidates = [
    bodyFields.MessageStatus, bodyFields.SmsStatus,
    query?.MessageStatus, query?.SmsStatus,
  ];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return null;
}

function normalizeField(body, query, key) {
  const bodyFields = typeof body === "object" && body !== null ? body : {};
  return (bodyFields[key] || query?.[key] || "").toString().trim() || null;
}

// ─── BODY PARSING — accepts all Twilio formats ──────────────────────

async function parseRequestBody(req, rawBody) {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());

  // 1. JSON body
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody);
      return { body: parsed, query };
    } catch (_) {
      return { body: {}, query };
    }
  }

  // 2. Form-encoded body (standard Twilio webhook)
  if (contentType.includes("application/x-www-form-urlencoded") || !contentType) {
    const params = new URLSearchParams(rawBody);
    const body = {};
    for (const [k, v] of params.entries()) {
      body[k] = v;
    }
    return { body, query };
  }

  // 3. Try URLSearchParams anyway as fallback for unknown content types
  try {
    const params = new URLSearchParams(rawBody);
    if (Array.from(params.entries()).length > 0) {
      const body = {};
      for (const [k, v] of params.entries()) body[k] = v;
      return { body, query };
    }
  } catch (_) {}

  // 4. If all else fails, treat query params as the only data
  return { body: {}, query };
}

// ─── SIGNATURE VALIDATION ───────────────────────────────────────────

async function validateTwilioSignature(req, rawBody) {
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const providedKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && providedKey && webhookKey === providedKey) {
    return { valid: true };
  }

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) {
    return { valid: false, reason: "missing_auth_token" };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    return { valid: false, reason: "missing_signature" };
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
  const toSign = url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => k + v)
      .join("");

  const computed = crypto.createHmac("sha1", authToken).update(toSign).digest("base64");

  if (computed !== signature) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true };
}

// ─── STATUS MAPPING ─────────────────────────────────────────────────

function mapTwilioStatus(twilioStatus) {
  switch (twilioStatus) {
    case "delivered":   return "delivered";
    case "failed":
    case "undelivered": return "failed";
    case "sent":        return "sent";
    case "queued":
    case "accepted":
    case "sending":     return "queued";
    default:            return null;
  }
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Read raw body before anything else
  const rawBody = await req.text();

  // Parse body in all supported formats
  const { body, query } = await parseRequestBody(req, rawBody);

  // Normalize key fields
  const messageSid = normalizeMessageSid(body, query);
  const messageStatus = normalizeMessageStatus(body, query);
  const errorCode = normalizeField(body, query, "ErrorCode");
  const errorMessage = normalizeField(body, query, "ErrorMessage");
  const to = normalizeField(body, query, "To");
  const from = normalizeField(body, query, "From");

  // ── NO MessageSid: classify as probe, return 200 silently ─────────
  if (!messageSid) {
    console.log("[SmsStatusCallback] Malformed/probe — no MessageSid found.", {
      hasSignature: !!req.headers.get("X-Twilio-Signature"),
      contentType: req.headers.get("content-type") || "none",
      bodyKeys: typeof body === "object" ? Object.keys(body).join(",") : "non-object",
    });
    // Always return 200 so probes/retries stop. Never trigger a fallback alert.
    return json({ ok: true, ignored: true, reason: "missing_message_sid" });
  }

  // ── Validate Twilio signature before acting on real callback ─────
  const sigResult = await validateTwilioSignature(req, rawBody);
  if (!sigResult.valid) {
    // Real callback with a MessageSid but invalid signature — could be spoofed.
    // Log, return 200 (don't trigger retries/alerts), but don't process.
    console.warn("[SmsStatusCallback] Invalid signature for SID", messageSid, sigResult.reason);
    return json({ ok: true, ignored: true, reason: "invalid_signature" });
  }

  const mappedStatus = mapTwilioStatus(messageStatus);
  if (!mappedStatus) {
    console.log(`[SmsStatusCallback] Unrecognised status "${messageStatus}" for SID ${messageSid} — no update`);
    return json({ status: "ok_noop" });
  }

  // ── Update CommunicationEvent ────────────────────────────────────
  try {
    const base44 = createClientFromRequest(req);

    const matches = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageSid },
      "-created_date",
      1
    );

    if (!matches || matches.length === 0) {
      console.warn(`[SmsStatusCallback] No CommunicationEvent found for SID ${messageSid}`);
      return json({ status: "ok_no_match" });
    }

    const event = matches[0];

    // FIX #9: Out-of-order protection — never downgrade a terminal status
    // delivered > sent > queued; failed is always terminal
    const STATUS_RANK = { delivered: 4, failed: 4, sent: 3, queued: 2, unknown: 1 };
    const currentRank = STATUS_RANK[event.status] ?? 0;
    const incomingRank = STATUS_RANK[mappedStatus] ?? 0;
    
    if (currentRank >= incomingRank && event.status === mappedStatus) {
      console.log(`[SmsStatusCallback] Idempotent — already "${event.status}" for SID ${messageSid}`);
      return json({ status: "ok_idempotent" });
    }
    
    if (currentRank > incomingRank) {
      console.log(`[SmsStatusCallback] Out-of-order — ignoring "${mappedStatus}" for SID ${messageSid} (already at "${event.status}")`);
      return json({ status: "ok_out_of_order_ignored" });
    }

    let existingMeta = {};
    try { existingMeta = JSON.parse(event.metadata_json || "{}"); } catch (_) {}

    const updatedMeta = {
      ...existingMeta,
      twilio_delivery: {
        message_status: messageStatus,
        error_code: errorCode,
        error_message: errorMessage,
        to, from,
        updated_at: new Date().toISOString(),
      },
    };

    await base44.asServiceRole.entities.CommunicationEvent.update(event.id, {
      status: mappedStatus,
      error_message: errorCode
        ? `Twilio ${messageStatus} (code ${errorCode}): ${errorMessage || ""}`
        : (mappedStatus === "delivered" ? null : event.error_message),
      metadata_json: JSON.stringify(updatedMeta),
    });

    // ── Also update CommunicationLog records by provider_message_id ──
    const nowIso = new Date().toISOString();
    const logUpdate = {
      provider_status: messageStatus,
      delivery_status: mappedStatus,
    };
    if (mappedStatus === "delivered") {
      logUpdate.delivered_at = nowIso;
    } else if (mappedStatus === "failed") {
      logUpdate.failed_at = nowIso;
    }
    if (errorCode) {
      logUpdate.error_code = errorCode;
      logUpdate.error_message = `Twilio ${messageStatus} (code ${errorCode}): ${errorMessage || ""}`;
    }

    try {
      const logMatches = await base44.asServiceRole.entities.CommunicationLog.filter(
        { provider_message_id: messageSid },
        "-created_date",
        10
      );
      if (logMatches && logMatches.length > 0) {
        for (const logRec of logMatches) {
          await base44.asServiceRole.entities.CommunicationLog.update(logRec.id, logUpdate).catch(() => {});
        }
        console.log(`[SmsStatusCallback] Updated ${logMatches.length} CommunicationLog record(s) for SID ${messageSid} → delivery_status=${mappedStatus}`);
      }
    } catch (logErr) {
      console.warn(`[SmsStatusCallback] CommunicationLog update failed: ${logErr.message}`);
    }

    console.log(`[SmsStatusCallback] Updated CommunicationEvent ${event.id} → status=${mappedStatus} (SID=${messageSid})`);
    return json({ status: "ok_updated", event_id: event.id, mapped_status: mappedStatus });
  } catch (error) {
    console.error(`[SmsStatusCallback] Error processing SID ${messageSid}: ${error.message}`);
    return json({ error: error.message }, { status: 500 });
  }
});